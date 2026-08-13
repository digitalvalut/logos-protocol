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
const MAX_BODY_BYTES = 4096; // an SDP offer/answer is a few hundred bytes; this is generous headroom
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

async function handleMailbox(request, env, cors, key){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);

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
