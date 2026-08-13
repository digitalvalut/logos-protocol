/* DigitalValut Logos — TURN credential broker.
   This is the one small piece of "server" this project now needs: not to see
   or store anything about the chat, but only to hold the Cloudflare TURN
   secret and hand out short-lived (24h) relay credentials on request. The
   chat itself still has no account, no database, nothing that remembers who
   asked. Deploy this on Cloudflare Workers with TURN_KEY_ID and
   TURN_API_TOKEN set as secrets (never as plain vars) — see README.md next
   to this file for the exact steps. */

const ALLOWED_ORIGIN = 'https://digitalvalut.github.io';
const TTL_SECONDS = 86400; // 24h — long enough for the longest realistic call

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }
    /* Not real access control — a header is easy to fake — but it stops the
       casual, accidental kind of abuse (someone finding the URL and hammering
       it) without adding a login this app was built specifically not to
       have. */
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403, headers: cors });
    }

    if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'TURN not configured' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    try {
      const res = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.TURN_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ttl: TTL_SECONDS }),
        }
      );
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'TURN provider error', status: res.status }), {
          status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Worker error' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
