/* DigitalValut Logos — small Cloudflare Worker backing three things for the
   chat, all deliberately minimal:

   1. TURN credentials (GET /turn) — hands out short-lived (24h) relay
      credentials so two phones on different mobile carriers can find each
      other. Holds the Cloudflare TURN secret so it never sits in the public
      page. See README.md for setup.

   2. A one-time mailbox (PUT/GET /mailbox/:key) — lets two people who have
      already met once reconnect without pasting a code again, but only if
      both have the app open at the same time. A message is addressed to the
      SHA-256 hash of the recipient's own persistent identity (something only
      someone they already connected to would know), held for at most two
      minutes, and deleted the moment it's read. There is no account, no
      list of contacts, no message content here — only "someone is trying to
      reach this hash right now", gone as soon as it's picked up or expired.
      Needs a KV namespace bound as MAILBOX — see README.md.

   3. A knock (POST /knock) — wakes up someone's phone via a Web Push
      notification when they are not on the mailbox-polling screen. This
      Worker never learns who anyone's contacts are: the caller must already
      hold the other side's push subscription, handed over directly between
      the two of them the same way the safety fingerprint is — over the
      encrypted data channel, the first time they connected. Nothing about a
      subscription is ever written to storage here; this route only signs a
      Web Push request with the account's VAPID key and forwards it. The push
      itself carries no content — no name, no message — only "someone you
      have met before wants to talk", which is exactly what a stranger with a
      guessed or leaked endpoint could not produce, since they would not have
      a subscription to send to in the first place.
      Needs VAPID_PUBLIC_KEY (plain text) and VAPID_PRIVATE_JWK (secret) — see
      README.md. */

const ALLOWED_ORIGIN = 'https://digitalvalut.github.io';
const TURN_TTL_SECONDS = 86400; // 24h — long enough for the longest realistic call
const MAILBOX_TTL_SECONDS = 120; // long enough to open the app and be found, no longer
const MAX_BODY_BYTES = 8192; // an encrypted offer/answer is ~1.5KB once sealed and base64'd; this is generous headroom
const KEY_RE = /^[0-9a-f]{64}$/; // a hex SHA-256, nothing else is a valid mailbox key

function corsHeaders(origin){
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
function json(body, status, cors){
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

async function handleTurn(env, cors){
  if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) return json({ error: 'TURN not configured' }, 500, cors);
  try{
    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: TURN_TTL_SECONDS }),
      }
    );
    if (!res.ok) return json({ error: 'TURN provider error', status: res.status }, 502, cors);
    return json(await res.json(), 200, cors);
  }catch(e){
    return json({ error: 'Worker error' }, 500, cors);
  }
}

/* ---------------- attempt limiting ----------------
   A six-digit connection code is a million possibilities. The client already
   makes each guess expensive to prepare and encrypts everything it stores, so
   a guessed slot address on its own reveals nothing. This closes the remaining
   door: sweeping the code space needs an enormous number of lookups, and
   lookups are something this Worker can refuse.

   Counted in the isolate's own memory, deliberately. The first version of this
   kept the counter in KV, which was a straightforward mistake: the free plan
   allows a thousand KV writes a day and one honest connection polls about a
   hundred and fifty times, so the quota would have been gone after roughly
   seven conversations and the app would have stopped working for everyone
   else. A defence that takes the service down is not a defence.

   Memory costs nothing and has no quota. The honest limit is that Cloudflare
   runs many isolates, so no single counter sees every request — this does not
   meter traffic exactly. It does not need to. Sweeping a million codes inside
   a two-minute window means firing an enormous burst, and a burst is precisely
   what any one isolate does see and cut off. Combined with the encrypted
   mailbox and the spoken word check, that is enough; a precise global meter
   would cost real money for very little more safety.

   The budget is generous on purpose, because a legitimate connection polls a
   lot while two phones are finding each other. Anything far above it is not
   someone trying to reach a friend. */
const RL_WINDOW_MS = 60000;
const RL_MAX_LOOKUPS = 300;
const rlHits = new Map();

function overRateLimit(request){
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return false; /* nothing to attribute it to: do not punish the request */
  const now = Date.now();
  let rec = rlHits.get(ip);
  if (!rec || now >= rec.resetAt){ rec = { n: 0, resetAt: now + RL_WINDOW_MS }; rlHits.set(ip, rec); }
  rec.n++;
  /* keep the map from growing without bound on a long-lived isolate */
  if (rlHits.size > 4000) for (const [k, v] of rlHits) if (now >= v.resetAt) rlHits.delete(k);
  return rec.n > RL_MAX_LOOKUPS;
}

/* ---------------- the knock: signed here, never stored here ----------------
   Web Push authentication (RFC 8292): a JWT signed with the account's VAPID
   private key, naming the push service as audience. The push itself carries
   no payload, so none of RFC 8291's message encryption is needed — an empty
   POST is a complete, valid push in the Web Push protocol (RFC 8030), and the
   service worker's own generic text is what the person actually sees. */
async function signVapidJwt(privateJwk, audience){
  const key = await crypto.subtle.importKey(
    'jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: 'mailto:info@digitalvalut.it' };
  const signingInput = b64url(new TextEncoder().encode(JSON.stringify(header))) + '.' +
                        b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput)
  );
  /* Web Crypto's ECDSA output is already raw r||s (IEEE P1363) — exactly the
     form JWS ES256 requires, no DER conversion needed. Verified independently
     against a reference implementation before this shipped. */
  return signingInput + '.' + b64url(sig);
}

/* A knock reaches one specific person, so it is metered per target as well as
   per sender — six in five minutes is generous for "trying to reach a friend"
   and a hard stop on using this as a way to harass someone with notifications. */
const KNOCK_WINDOW_MS = 5 * 60000;
const KNOCK_MAX_PER_TARGET = 6;
const knockHits = new Map();

async function overKnockLimit(endpoint){
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  const key = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
  const now = Date.now();
  let rec = knockHits.get(key);
  if (!rec || now >= rec.resetAt){ rec = { n: 0, resetAt: now + KNOCK_WINDOW_MS }; knockHits.set(key, rec); }
  rec.n++;
  if (knockHits.size > 4000) for (const [k, v] of knockHits) if (now >= v.resetAt) knockHits.delete(k);
  return rec.n > KNOCK_MAX_PER_TARGET;
}

async function handleKnock(request, env, cors){
  if (!env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY) return json({ error: 'push not configured' }, 500, cors);
  if (overRateLimit(request)) return json({ error: 'too many attempts' }, 429, cors);

  let body;
  try{ body = await request.json(); }catch(e){ return json({ error: 'bad body' }, 400, cors); }
  const endpoint = body && body.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length > 1024) return json({ error: 'bad subscription' }, 400, cors);

  let url;
  try{ url = new URL(endpoint); }catch(e){ return json({ error: 'bad subscription' }, 400, cors); }
  /* https only — this Worker is about to make a signed request to whatever
     URL it is handed, so the scheme is worth pinning down even though the
     request carries nothing sensitive */
  if (url.protocol !== 'https:') return json({ error: 'bad subscription' }, 400, cors);

  if (await overKnockLimit(endpoint)) return json({ error: 'too many attempts' }, 429, cors);

  try{
    const privateJwk = JSON.parse(env.VAPID_PRIVATE_JWK);
    const jwt = await signVapidJwt(privateJwk, url.origin);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
        TTL: '60',
        'Content-Length': '0',
      },
    });
    /* the push service's own status is not this Worker's business to
       interpret beyond ok/not-ok — a stale or revoked subscription on the
       other end looks the same to us as any other failure */
    return json({ ok: res.ok }, 200, cors);
  }catch(e){
    return json({ error: 'Worker error' }, 500, cors);
  }
}

async function handleMailbox(request, env, cors, key){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);

  /* only reads are metered: a read is what a code-guesser needs, and a write
     only ever puts something into a slot nobody else can find or decrypt */
  if (request.method === 'GET' && overRateLimit(request)){
    return json({ error: 'too many attempts' }, 429, cors);
  }

  if (request.method === 'PUT'){
    const body = await request.text();
    if (!body || body.length > MAX_BODY_BYTES) return json({ error: 'bad body' }, 400, cors);
    /* last write wins — if two things land in the same inbox at once, only
       one was ever going to be answered anyway */
    await env.MAILBOX.put(key, body, { expirationTtl: MAILBOX_TTL_SECONDS });
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET'){
    const val = await env.MAILBOX.get(key);
    if (val === null) return json({ empty: true }, 404, cors);
    /* read-once: delete on the way out, so a message can't be replayed or
       picked up by more than one poll */
    await env.MAILBOX.delete(key);
    return new Response(val, { status: 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return json({ error: 'method not allowed' }, 405, cors);
}

export default {
  async fetch(request, env){
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    /* Not real access control — a header is easy to fake — but it stops the
       casual, accidental kind of abuse (someone finding the URL and hammering
       it) without adding a login this app was built specifically not to
       have. */
    if (origin && origin !== ALLOWED_ORIGIN) return json({ error: 'Forbidden' }, 403, cors);

    if (url.pathname === '/' || url.pathname === '/turn'){
      if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, cors);
      return handleTurn(env, cors);
    }

    const m = url.pathname.match(/^\/mailbox\/([0-9a-f]{64})$/);
    if (m) return handleMailbox(request, env, cors, m[1]);

    if (url.pathname === '/knock'){
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);
      return handleKnock(request, env, cors);
    }

    return json({ error: 'not found' }, 404, cors);
  },
};
