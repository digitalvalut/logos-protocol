/* DigitalValut Logos — small Cloudflare Worker backing two things for the
   chat, both deliberately minimal:

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
      Needs a KV namespace bound as MAILBOX — see README.md. */

const ALLOWED_ORIGIN = 'https://digitalvalut.github.io';
const TURN_TTL_SECONDS = 86400; // 24h — long enough for the longest realistic call
const MAILBOX_TTL_SECONDS = 120; // long enough to open the app and be found, no longer
const MAX_BODY_BYTES = 8192; // an encrypted offer/answer is ~1.5KB once sealed and base64'd; this is generous headroom
const KEY_RE = /^[0-9a-f]{64}$/; // a hex SHA-256, nothing else is a valid mailbox key

function corsHeaders(origin){
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
   makes each guess expensive to prepare (600k rounds of PBKDF2 before a slot
   address can even be computed) and encrypts everything it stores, so a
   guessed address on its own reveals nothing. This closes the remaining door:
   sweeping the code space needs an enormous number of lookups, and lookups are
   something this Worker can simply refuse.

   The budget is deliberately generous, because a legitimate connection polls
   quite a lot while two phones are finding each other — roughly a hundred and
   fifty lookups in the busiest minute. Anything far above that is not a person
   trying to talk to a friend.

   KV is eventually consistent, so this count is approximate and a determined
   attacker can overshoot it somewhat. That is understood and accepted: the aim
   is to make a sweep cost orders of magnitude more than it otherwise would,
   not to be an exact meter. */
const RL_WINDOW_SECONDS = 60;
const RL_MAX_LOOKUPS = 240;

async function overRateLimit(request, env){
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return false; /* no address to attribute it to: do not punish the request */
  const bucket = Math.floor(Date.now() / 1000 / RL_WINDOW_SECONDS);
  const key = 'rl:' + ip + ':' + bucket;
  const current = parseInt((await env.MAILBOX.get(key)) || '0', 10) || 0;
  if (current >= RL_MAX_LOOKUPS) return true;
  await env.MAILBOX.put(key, String(current + 1), { expirationTtl: RL_WINDOW_SECONDS * 2 });
  return false;
}

async function handleMailbox(request, env, cors, key){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);

  /* only reads are metered: a read is what a code-guesser needs, and a write
     only ever puts something into a slot nobody else can find or decrypt */
  if (request.method === 'GET' && await overRateLimit(request, env)){
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

    return json({ error: 'not found' }, 404, cors);
  },
};
