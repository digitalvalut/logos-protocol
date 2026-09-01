/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
      README.md.

   4. A wake slot (PUT/GET /wake/:key) — lets an invite survive being closed, so
      two people no longer have to be looking at their screens in the same
      minute. Holds one sealed blob saying how to buzz whoever made the invite,
      readable only by someone who already has the invite code. Same KV
      namespace, longer life, and reading does not consume it. See the comment
      above handleWake for the trade-off this makes and why. */

/* More than one origin is allowed so the app can move to its own domain without
   a moment where connections stop working: both answer for as long as the move
   takes, and the old one can be dropped afterwards. */
const ALLOWED_ORIGINS = [
  'https://digitalvalut.github.io',
  'https://logos.digitalvalut.it',
  /* The Android app carries the whole application inside itself and serves it
     from here — the fixed address Android reserves for an app's own bundled
     files. It is not a site anybody can register or reach from outside: only
     the app's own WebView ever answers on it. Served over https on purpose
     rather than from a file:// path, because a file:// page is not a secure
     context and the browser switches off Web Crypto and WebRTC there, which is
     the whole of this app. */
  'https://appassets.androidplatform.net',
];
const ALLOWED_ORIGIN = ALLOWED_ORIGINS[0]; // what an unknown origin is answered with
/* Dieci minuti, non piu' ventiquattro ore.

   Un lasciapassare per il ponte veniva dato a chiunque lo chiedesse, senza
   domande, e valeva un giorno intero: chi ne raccoglieva a sufficienza poteva
   far passare traffico proprio a spese di chi ospita il servizio, o esaurirne
   la capacita' finche' le chiamate vere non passavano piu'. Accorciarlo non
   chiude la porta — resta senza autenticazione — ma riduce di centoquaranta
   volte quanto vale ogni singolo pezzo di carta portato via.

   ⚠️ LEGATO A ICE_REUSE_MS NEL CLIENT, che dice per quanto l'app li tiene
   prima di richiederli: quello deve restare comodamente piu' corto di questo,
   o si finirebbe a usare credenziali gia' scadute. Cambiando uno, cambiare
   l'altro. */
const TURN_TTL_SECONDS = 600;
const MAILBOX_TTL_SECONDS = 120; // long enough to open the app and be found, no longer
const WAKE_TTL_SECONDS = 24 * 3600; // an invite is opened when the other person next picks up their phone
const MAX_BODY_BYTES = 8192; // an encrypted offer/answer is ~1.5KB once sealed and base64'd; this is generous headroom
const MAX_WAKE_BYTES = 1024; // a sealed push subscription and nothing else
const KEY_RE = /^[0-9a-f]{64}$/; // a hex SHA-256, nothing else is a valid mailbox key
/* A published address key has to outlive everything else here: an address is
   handed out once and dialled months later, so a key that expired would turn a
   printed address into a dead one. A year, matched to how long the device's own
   key material lasts, and rewritten every time the app opens. */
const PUBKEY_TTL_SECONDS = 365 * 24 * 3600;
const MAX_PUBKEY_BYTES = 512; // a raw P-256 point is 65 bytes, 88 once base64'd

function corsHeaders(origin){
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.indexOf(origin) >= 0 ? origin : ALLOWED_ORIGIN,
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
   someone trying to reach a friend.

   ⚠️ CORRETTO IL 1 SET 2026, DOPO UN'EMAIL DI CLOUDFLARE E UNA DOMANDA
   DELL'UTENTE CHE QUESTO FILE NON SAPEVA REGGERE. Il commento qui sopra
   diceva, testualmente, che le letture della cassetta "sono gratis". NON LO
   SONO: il piano gratuito dà 100.000 letture E SOLO 1.000 SCRITTURE al
   giorno, per tutto l'account. Su quel presupposto sbagliato era stato
   costruito tutto il resto di questa sezione, e da lì sono nati quattro buchi
   che insieme permettevano a UNA SOLA PERSONA di spegnere il servizio A
   TUTTI, per l'intera giornata, senza spendere niente e senza indovinare
   nessun codice:

     1. /wake in scrittura non era metrato AFFATTO. Mille richieste — pochi
        secondi — e la quota di scritture del giorno era finita per tutti.
     2. /letter in scrittura non era metrato affatto, e ogni richiesta costa
        DUE operazioni (una list più una put), non una.
     3. /letter in lettura era metrato UNA VOLTA ma spende fino a 41
        operazioni (1 list + 20 get + 20 delete). Al vecchio tetto di 300
        richieste al minuto significava fino a 12.300 operazioni al minuto da
        un solo indirizzo: la quota giornaliera di letture bruciata in otto
        minuti.
     4. Il contatore contava RICHIESTE, non COSTO. È l'errore che rende
        inutile qualunque tetto: una richiesta che ne vale quaranta passava
        come una che ne vale una.

   La regola nuova, ed è la lezione generale: SI METRA IL COSTO, NON LA
   CHIAMATA. Ogni rotta dichiara quante operazioni KV sta per spendere e paga
   quel numero. Chi trova un modo per far costare di più una richiesta paga di
   più, automaticamente, senza che nessuno debba ricordarsi di aggiornare un
   tetto.

   E le scritture hanno un bilancio SEPARATO e molto più stretto delle
   letture, perché sono cento volte più scarse (1.000 contro 100.000). Prima
   condividevano lo stesso contatore, il che voleva dire che il tetto era
   tarato sulla risorsa abbondante e lasciava scoperta quella scarsa. */
const RL_WINDOW_MS = 60000;
/* ⚠️ QUESTI DUE NUMERI SONO STATI MISURATI, NON SCELTI. Il conto vero, col
   client di oggi: un dispositivo fermo con l'app aperta spende 88 unita al
   minuto, uno che si sta collegando 238, e DUE dietro lo stesso indirizzo —
   il PC e il telefono di casa sulla stessa rete, cioe' il caso piu comune di
   tutti e quello su cui si collauda — ne spendono 476.
   Un tetto sotto quella cifra non difende: SPEGNE L'APP alle persone che la
   usano bene, che e' il modo piu sicuro di far fallire una correzione di
   sicurezza. 600 copre una famiglia di tre dispositivi con margine.

   Sembra piu largo dei 300 di prima e in realta' e' molte volte piu stretto:
   300 RICHIESTE potevano valere 12.300 operazioni vere, 900 UNITA' DI COSTO
   ne valgono al massimo 900. E' tutta la differenza fra contare le chiamate e
   contare quello che si esaurisce davvero.

   ⚠️ PERCHE 900 E NON 600, che basterebbe al client di oggi: CHI HA LA
   VERSIONE VECCHIA NON SPARISCE. Un APK installato resta quello finche' la
   persona non lo riscarica a mano, e il client precedente a v31 interroga
   molto piu spesso — 828 unita al minuto per due dispositivi sulla stessa
   rete. Un tetto a 600 non fermerebbe un attacco in piu, respingerebbe solo
   le persone che non hanno ancora aggiornato. Si potra' scendere a 600
   quando la v31 sara' diffusa, non prima.
   Il tetto che ferma davvero l'attacco e' quello delle SCRITTURE qui sotto,
   ed e' stretto: le letture sul piano gratuito sono cento volte piu
   abbondanti, quindi essere generosi li' costa poco e salva gli aggiornamenti
   mancati. */
const RL_MAX_READS = 900;
/* Scritture: una connessione onesta ne fa una ogni 80 secondi mentre aspetta.
   30 al minuto coprono parecchi tentativi insieme e tolgono a un abusante il
   99% di quello che aveva prima, che era: tutto. */
const RL_MAX_WRITES = 30;

/* The credentials route is metered separately, and far more tightly.
   A mailbox poll is something one honest connection does around a hundred and
   fifty times while two phones are finding each other, so that budget has to
   be generous. Credentials are the opposite shape: the app asks once per page
   load and keeps the answer for the whole visit, because what comes back is
   valid for a day. Anything past a couple a second from one address is not
   somebody opening the app.
   Worth separating because the two abuses cost differently. Hammering the
   mailbox spends the account's daily KV allowance — see the correction above,
   it is NOT free. Harvesting credentials hands somebody a day of real relay
   capacity billed to this account — the only thing here that costs actual
   money, and until v3.72 the only route with no limit on it at all.
   Still generous on purpose: a school or an office behind one address can
   have many people open the app at once, and a refused credential is not a
   dead end — the app falls back to a direct connection on its own, which
   works on most networks. */
const RL_TURN_MAX = 120;
const rlHits = new Map();

/* ---------------- il fondo del secchio: un tetto che non guarda l'indirizzo ----------------
   I limiti per indirizzo, da soli, fermano una persona. Non fermano cento
   indirizzi diversi che chiedono poco ciascuno — e non serve una botnet vera:
   basta una rete mobile, dove gli indirizzi cambiano da soli.

   Questo è il fondo del secchio: quanto TUTTO INSIEME questo isolate accetta
   di spendere in un minuto, chiunque stia chiedendo. Il traffico onesto
   misurato oggi è di pochi KB al giorno; il tetto giornaliero delle scritture
   (1.000) diviso per i minuti di una giornata fa 0,7 al minuto di media. 60 al
   minuto lascia ottanta volte quel margine per le raffiche legittime e toglie
   comunque la possibilità di svuotare la giornata in pochi secondi.

   ⚠️ IL LIMITE ONESTO DI QUESTA DIFESA, scritto invece che lasciato credere:
   Cloudflare fa girare più isolate, e questo contatore ne vede uno solo. Non
   è un tetto globale esatto — quello richiederebbe Durable Objects o il piano
   a pagamento. È un limite al danno che un singolo isolate può fare, che è
   molto meglio di niente e onestamente meno di un tetto vero.

   ⚠️⚠️ E LA VERITÀ PIÙ GRANDE, che nessuna di queste righe risolve: SUL PIANO
   GRATUITO IL PROBLEMA NON È L'ATTACCANTE, È IL SUCCESSO. Mille persone con
   l'app aperta, tutte oneste, nessuna che chiama nessuno, spendono la quota
   giornaliera di letture in circa un minuto — e le 1.000 scritture al giorno
   sono il tetto vero: bastano per ottanta conversazioni al giorno IN TUTTO IL
   MONDO. Queste difese impediscono a UNA persona di spegnere il servizio a
   tutti, ed era una falla vera e grave. Non fanno, e non possono fare, di
   Logos un servizio che regge la crescita.
   Le due strade sono architetturali, non di taratura: portare l'attesa sulle
   notifiche push (che arrivano da sole, invece di far chiedere al telefono
   "c'è niente per me?" per sempre), oppure il piano a 5 dollari al mese, che
   porta le letture a 10 milioni e le scritture a 1 milione al giorno. */
const GLOBAL_MAX_READS = 3000;
const GLOBAL_MAX_WRITES = 40;
let globalBucket = { reads: 0, writes: 0, resetAt: 0 };

function overGlobal(kind, cost){
  const now = Date.now();
  if (now >= globalBucket.resetAt){
    globalBucket = { reads: 0, writes: 0, resetAt: now + RL_WINDOW_MS };
  }
  if (kind === 'w'){
    globalBucket.writes += cost;
    return globalBucket.writes > GLOBAL_MAX_WRITES;
  }
  globalBucket.reads += cost;
  return globalBucket.reads > GLOBAL_MAX_READS;
}

/* One counter, kept per purpose as well as per address, so a busy
   conversation cannot spend the credentials budget and vice versa.
   `cost` è quante operazioni KV la richiesta sta per spendere: chiamare
   questa funzione con 1 quando poi se ne spendono 41 è esattamente il difetto
   che il commento in cima descrive. */
function overLimit(request, bucket, max, cost){
  const c = cost === undefined ? 1 : cost;
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return false; /* nothing to attribute it to: do not punish the request */
  const now = Date.now();
  const key = bucket + ':' + ip;
  let rec = rlHits.get(key);
  if (!rec || now >= rec.resetAt){ rec = { n: 0, resetAt: now + RL_WINDOW_MS }; rlHits.set(key, rec); }
  rec.n += c;
  /* keep the map from growing without bound on a long-lived isolate */
  if (rlHits.size > 4000) for (const [k, v] of rlHits) if (now >= v.resetAt) rlHits.delete(k);
  return rec.n > max;
}
/* Le due porte da cui passa tutto. `cost` va dichiarato dalla rotta che sa
   quanto sta per spendere; chi non lo dichiara paga 1, che è il minimo vero.
   Il fondo del secchio viene consultato SEMPRE, anche per una richiesta senza
   indirizzo: è l'unica difesa che regge quando l'indirizzo manca o cambia. */
function overReadLimit(request, cost){
  if (overGlobal('r', cost === undefined ? 1 : cost)) return true;
  return overLimit(request, 'mail', RL_MAX_READS, cost);
}
function overWriteLimit(request, cost){
  if (overGlobal('w', cost === undefined ? 1 : cost)) return true;
  return overLimit(request, 'write', RL_MAX_WRITES, cost);
}
/* Nome storico, tenuto perché lo usano rotte che leggono soltanto. */
function overRateLimit(request){ return overReadLimit(request, 1); }
function overTurnLimit(request){ return overLimit(request, 'turn', RL_TURN_MAX, 1); }

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

/* The push services the browsers this app runs on actually use. Matched on
   the exact host or on a dot-suffix, never with a bare `includes` — that
   would have let `fcm.googleapis.com.attacker.example` straight through. */
const PUSH_HOSTS = [
  'fcm.googleapis.com',                 /* Chrome, Edge, most Android */
  'android.googleapis.com',             /* older Chrome */
  'updates.push.services.mozilla.com',  /* Firefox */
  'web.push.apple.com',                 /* Safari, iOS */
];
const PUSH_SUFFIXES = [
  '.notify.windows.com',                /* Edge / Windows, sharded hostnames */
  '.push.apple.com',                    /* Apple, sharded hostnames */
];
function isKnownPushHost(host){
  host = String(host).toLowerCase();
  if (PUSH_HOSTS.indexOf(host) >= 0) return true;
  return PUSH_SUFFIXES.some(s => host.endsWith(s));
}

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
  /* And only to somewhere that is actually a push service. Without this the
     route would send a POST to any https address on earth on request: it
     carries no data and returns nothing but ok/not-ok, so there is little to
     steal — but it still means this Worker could be pointed at a stranger's
     server, and requests arriving from Cloudflare rather than from whoever
     asked for them. The browsers that exist publish to these four families
     and no others. */
  if (!isKnownPushHost(url.hostname)) return json({ error: 'bad subscription' }, 400, cors);

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

/* ---------------- the wake slot: an invite that survives being closed ----------------
   The mailbox above lives two minutes, which is right for a handshake and wrong
   for real life: an invite sent over WhatsApp is not opened in the next ninety
   seconds, it is opened when the other person next picks up their phone. Before
   this, that meant the invite was simply dead by then, and the two people had to
   be looking at their screens at the same moment for anything to happen at all.

   This slot holds one thing and nothing else: how to buzz the person who made
   the invite, so that whoever opens it later can say "come back, I'm here". It
   is sealed with the key derived from the invite code, exactly like everything
   in the mailbox, so this Worker cannot read it either — what it stores is an
   opaque blob it has no way to interpret.

   Two deliberate differences from the mailbox. It lives 24 hours, because that
   is the honest span of "I'll look at my phone later". And reading does not
   delete, because the person opening an invite may well have to try twice, and
   an invite that stopped working after one look would be the same problem in a
   different costume.

   The trade-off, stated plainly: someone who guessed an invite code could read
   this slot and cause the phone that made the invite to buzz. They would learn
   nothing — no name, no message, no contacts, and the notification itself
   carries no content — and the knock limiter caps it at six in five minutes per
   person. A stranger being able to make a phone buzz six times is a real cost;
   being unable to reach anyone who isn't staring at their screen was a larger
   one. */
async function handleWake(request, env, cors, key){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);

  if (request.method === 'PUT'){
    /* ⚠️ BUCO 1, chiuso il 1 set 2026: questa scrittura NON ERA METRATA
       AFFATTO. Lo slot è calcolabile da chiunque abbia un invito, e la quota
       gratuita è di mille scritture AL GIORNO PER TUTTO L'ACCOUNT: mille
       richieste da una sola persona — pochi secondi — e nessuno al mondo
       riusciva più a collegarsi fino a mezzanotte. Era il modo più economico
       che esistesse per spegnere Logos. */
    if (overWriteLimit(request, 1)) return json({ error: 'too many attempts' }, 429, cors);
    const body = await request.text();
    if (!body || body.length > MAX_WAKE_BYTES) return json({ error: 'bad body' }, 400, cors);
    await env.MAILBOX.put('w:' + key, body, { expirationTtl: WAKE_TTL_SECONDS });
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET'){
    if (overRateLimit(request)) return json({ error: 'too many attempts' }, 429, cors);
    const val = await env.MAILBOX.get('w:' + key);
    if (val === null) return json({ empty: true }, 404, cors);
    /* left in place on purpose — see above */
    return new Response(val, { status: 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return json({ error: 'method not allowed' }, 405, cors);
}

/* ---------------- where an address publishes the key it is made of ----------------
   An address is the hash of a public key, and this is where that public key
   lives so whoever dials the address can fetch it and encrypt to it. Nothing
   secret is stored — a public key is public — but two properties have to hold,
   and only one of them is obvious.

   The obvious one: whoever calls must be sure the key really belongs to the
   address they dialled. That is theirs to check, not ours: they hash the key
   they were handed and see whether it comes out as the address they already
   have. A substituted key hashes to a different address and is rejected.

   The one that needs work is here. Without a check on the way in, anybody could
   PUT over anybody else's slot — the slot name is derived from the address,
   which is public, so it is trivially computable. They could not impersonate
   the owner (the hash check above defeats that), but they could overwrite the
   key with junk and leave a printed address permanently undiallable. So the
   write is verified instead: recompute the address from the key being
   published, recompute which slot that address owns, and refuse unless it is
   the slot being written to. The only person who can write here is somebody
   holding a key that genuinely hashes to this address. One SHA-256, and the
   slot becomes unforgeable rather than merely obscure.

   Kept deliberately in step with `addressFromPub` in modifica.js; a test holds
   the two implementations to the same answers, because a silent drift between
   them would make every address on the far side unreachable. */
const ADDR_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ADDR_LEN = 12;

async function sha256Hex(str){
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)));
  return [...d].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function addressFromPub(pubB64, slot){
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode('logos-address-v2:' + pubB64 + '/' + (slot | 0))));
  let bin = '';
  for (let i = 0; i < 8; i++) bin += d[i].toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < ADDR_LEN; i++) out += ADDR_ALPHABET[parseInt(bin.slice(i * 5, i * 5 + 5), 2)];
  return out;
}

async function handleKey(request, env, cors, key){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);

  if (request.method === 'PUT'){
    /* metered like every other write: the slot is computable from a public
       address, so this is reachable by anyone who has one.
       Dal 1 set 2026 paga dal bilancio delle SCRITTURE, non da quello delle
       letture: era metrata, ma sul contatore sbagliato — quello tarato sulla
       risorsa abbondante invece che su quella scarsa. */
    if (overWriteLimit(request, 1)) return json({ error: 'too many attempts' }, 429, cors);
    const body = await request.text();
    if (!body || body.length > MAX_PUBKEY_BYTES) return json({ error: 'bad body' }, 400, cors);
    let rec;
    try{ rec = JSON.parse(body); }catch(e){ return json({ error: 'bad body' }, 400, cors); }
    /* A raw P-256 point is 65 bytes, which is 88 base64 characters ending in
       exactly ONE '=' — 65 mod 3 is 2, so there is a single byte of padding.
       Written as '==' first time round, which rejected every legitimate key;
       caught by generating real keys and feeding them in rather than reasoning
       about the length. */
    if (!rec || typeof rec.p !== 'string' || !/^[A-Za-z0-9+/]{87}=$/.test(rec.p)){
      return json({ error: 'bad key material' }, 400, cors);
    }
    const n = rec.n | 0;
    if (n < 0 || n > 255) return json({ error: 'bad slot' }, 400, cors);
    const owns = await sha256Hex('logos-pubkey-v2:' + await addressFromPub(rec.p, n));
    if (owns !== key) return json({ error: 'key does not own this slot' }, 403, cors);
    await env.MAILBOX.put('k:' + key, JSON.stringify({ p: rec.p, n }), { expirationTtl: PUBKEY_TTL_SECONDS });
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET'){
    if (overRateLimit(request)) return json({ error: 'too many attempts' }, 429, cors);
    const val = await env.MAILBOX.get('k:' + key);
    if (val === null) return json({ empty: true }, 404, cors);
    /* left in place: unlike a handshake message this is not consumed by being
       read, and every future caller needs it */
    return new Response(val, { status: 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return json({ error: 'method not allowed' }, 405, cors);
}

/* ---------------- the letterbox: a message for someone who is not there ----------------
   Everything else here assumes both people are awake at the same time. A shop
   at eleven at night is not, and neither is anyone else with a life, so until
   now a call to an address that nobody answered simply evaporated — the caller
   was told to try later, and whatever they wanted to say was lost.

   This is the one place where something is kept for longer than a handshake,
   and it is worth being exact about what that means. What is stored is a
   sealed blob, encrypted with a key derived from the address, which this
   Worker does not have and cannot derive. It sits under a name that is a hash,
   for at most a week, and is deleted the moment it is collected. What the
   Worker can see is that something arrived for some hash at some time — no
   name, no text, no idea who sent it or who will read it.

   That is a real change to the promise, and it is deliberately opt-in on the
   client. "No server keeps anything" becomes "a server holds an envelope it
   cannot open, for a few days, and only if you use this".

   Each letter gets its own random name so two arriving at once cannot
   overwrite each other, and a listing by prefix is what gathers them up. The
   cap stops one address being filled up forever by somebody with nothing
   better to do. */
const LETTER_TTL_SECONDS = 7 * 24 * 3600;
const MAX_LETTER_BYTES = 4096;
const MAX_LETTERS = 20;
/* Quante se ne raccolgono in un colpo solo. Separato da MAX_LETTERS apposta:
   quello è quante ne può TENERE la buca, questo è quante ne può COSTARE una
   singola richiesta — ed è la seconda che un abusante controlla. */
const LETTERS_PER_COLLECT = 5;
const RAND_RE = /^[0-9a-f]{16,32}$/;

async function handleLetter(request, env, cors, key, rand){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);
  const prefix = 'l:' + key + ':';

  if (request.method === 'PUT'){
    /* ⚠️ BUCO 2, chiuso il 1 set 2026: anche questa scrittura non era metrata,
       e costa DUE operazioni (la list qui sotto più la put), non una. */
    if (overWriteLimit(request, 2)) return json({ error: 'too many attempts' }, 429, cors);
    if (!RAND_RE.test(rand || '')) return json({ error: 'bad key' }, 400, cors);
    const body = await request.text();
    if (!body || body.length > MAX_LETTER_BYTES) return json({ error: 'bad body' }, 400, cors);
    const held = await env.MAILBOX.list({ prefix, limit: MAX_LETTERS + 1 });
    if (held.keys.length >= MAX_LETTERS) return json({ error: 'letterbox full' }, 429, cors);
    await env.MAILBOX.put(prefix + rand, body, { expirationTtl: LETTER_TTL_SECONDS });
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET'){
    /* ⚠️ BUCO 3, chiuso il 1 set 2026: LA PEGGIORE DELLE QUATTRO, perché non
       si vede leggendo la rotta ma solo contando cosa spende. Una sola
       richiesta qui costa fino a 41 operazioni: 1 list, poi una get e una
       delete per ognuna delle 20 lettere. Contata come UNA, al vecchio tetto
       di 300 al minuto, dava a un singolo indirizzo fino a 12.300 operazioni
       al minuto — la quota giornaliera di letture finita in otto minuti.
       Ora la richiesta paga in anticipo quello che può spendere davvero, e
       raccoglie al massimo LETTERS_PER_COLLECT per volta: chi ne ha di più le
       prende al giro dopo, che è esattamente come funzionava già la casella. */
    if (overReadLimit(request, 1 + LETTERS_PER_COLLECT * 2)) return json({ error: 'too many attempts' }, 429, cors);
    const held = await env.MAILBOX.list({ prefix, limit: LETTERS_PER_COLLECT });
    const out = [];
    for (const k of held.keys){
      const v = await env.MAILBOX.get(k.name);
      if (v === null) continue;
      out.push(v);
      /* collected means gone, exactly like the mailbox */
      await env.MAILBOX.delete(k.name);
    }
    return new Response(JSON.stringify(out), { status: 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return json({ error: 'method not allowed' }, 405, cors);
}

async function handleMailbox(request, env, cors, key){
  if (!env.MAILBOX) return json({ error: 'mailbox not configured' }, 500, cors);
  if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, cors);

  /* Both reads and writes are metered now. The original reasoning — that a
     write "only ever puts something into a slot nobody else can find or
     decrypt" — holds for the six-digit codes, whose slot nobody can compute
     without the code. It does not hold for the permanent and throwaway
     addresses: those are meant to be handed out, and anyone holding one can
     work out the slot it maps to. An unmetered write was therefore a way for
     somebody with your address to bury your incoming calls under their own,
     as fast as they liked, for free.

     ⚠️ BUCO 4, chiuso il 1 set 2026: erano metrate entrambe, ma DALLO STESSO
     CONTATORE — quello delle letture, tarato sulla risorsa che ce n'è cento
     volte tanta. Una scrittura passava se c'era budget di LETTURE, cioè
     quasi sempre, mentre la quota che si stava consumando era quella delle
     scritture. Ora ognuna paga dal proprio bilancio. */
  if (request.method === 'PUT'){
    if (overWriteLimit(request, 1)) return json({ error: 'too many attempts' }, 429, cors);
    const body = await request.text();
    if (!body || body.length > MAX_BODY_BYTES) return json({ error: 'bad body' }, 400, cors);
    /* last write wins — if two things land in the same inbox at once, only
       one was ever going to be answered anyway */
    await env.MAILBOX.put(key, body, { expirationTtl: MAILBOX_TTL_SECONDS });
    return json({ ok: true }, 200, cors);
  }

  if (request.method === 'GET'){
    /* A look that does not empty the box. It exists for one job: the Android
       app can keep watching for calls with its screen off and its window
       closed, and to ring it only has to know that something is waiting — not
       what. An ordinary read would swallow the very message it is ringing
       about, and the app would open to an empty box.

       This gives nothing away that the key did not already give. Whoever can
       compute this key can also empty the box, which is strictly more than
       being told whether it is occupied; and the answer here is one bit, with
       no envelope attached. It is metered exactly like every other read. */
    if (new URL(request.url).searchParams.get('peek') === '1'){
      if (overReadLimit(request, 1)) return json({ error: 'too many attempts' }, 429, cors);
      const there = await env.MAILBOX.get(key);
      return there === null
        ? json({ empty: true }, 404, cors)
        : json({ waiting: true }, 200, cors);
    }

    /* Due operazioni, non una: la get qui sotto e la delete che la segue.
       È la stessa disattenzione del buco 3, in piccolo — e va contata
       comunque, o il conto torna sbagliato del doppio proprio sulla rotta
       più battuta di tutte. */
    if (overReadLimit(request, 2)) return json({ error: 'too many attempts' }, 429, cors);

    const val = await env.MAILBOX.get(key);
    if (val === null) return json({ empty: true }, 404, cors);
    /* read-once: delete on the way out, so a message can't be replayed or
       picked up by more than one poll */
    await env.MAILBOX.delete(key);
    return new Response(val, { status: 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }

  return json({ error: 'method not allowed' }, 405, cors);
}

/* ---------------- nessun guasto dello storage esce come 500 ----------------
   Trovato misurando, non leggendo: martellando /wake sulla stessa casella, il
   relay rispondeva **500**, non 429. KV consente circa una scrittura al secondo
   PER CHIAVE, e quel rifiuto arrivava qui come eccezione — e nessuna delle
   funzioni che scrivono aveva un try/catch attorno.

   ⚠️ Il difetto NON era di /wake: era di TUTTE. Contate una per una, delle 13
   operazioni sullo storage solo 2 (in handleKey) erano protette. Correggere la
   sola /wake avrebbe lasciato in piedi lo stesso difetto in altri dieci punti —
   ed e' precisamente il modo in cui questo progetto si e' gia' fatto male.

   Un 500 non e' cosmetico. Dice al client "il server e' rotto", e un client che
   crede il server rotto **riprova**, che e' il contrario di cio che serve quando
   la causa e' che stiamo gia' andando troppo forte: e' cosi che nasce una
   tempesta di ritentativi. Un 429 dice "rallenta", ed e' la verita'.

   Una guardia sola, qui, invece di undici sparse: un punto solo da leggere, da
   provare e da non dimenticare — e nessuna funzione futura potra' nascere
   scoperta. La distinzione fra 429 e 503 e' deliberata: "rallenta" e "riprova
   piu' tardi" sono due istruzioni diverse per chi le riceve. */
function isKvThrottle(e){
  const m = String((e && (e.message || e.name)) || e || '').toLowerCase();
  return m.includes('429') || m.includes('rate limit') || m.includes('too many')
      || m.includes('exceeded') || m.includes('limit exceeded');
}

export default {
  async fetch(request, env){
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    try{
      return await instrada(request, env, cors);
    }catch(e){
      /* mai il testo dell'errore al chiamante: direbbe cose sull'interno che
         non gli servono e a un attaccante servono */
      if (isKvThrottle(e)) return json({ error: 'too many attempts' }, 429, cors);
      return json({ error: 'storage unavailable' }, 503, cors);
    }
  },
};

async function instrada(request, env, cors){
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    /* Not real access control — a header is easy to fake — but it stops the
       casual, accidental kind of abuse (someone finding the URL and hammering
       it) without adding a login this app was built specifically not to
       have. */
    if (origin && ALLOWED_ORIGINS.indexOf(origin) < 0) return json({ error: 'Forbidden' }, 403, cors);

    if (url.pathname === '/' || url.pathname === '/turn'){
      if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, cors);
      /* The one route that was never metered, and the only one that spends
         money when it is. Credentials handed out here are usable for a day by
         whoever holds them. */
      if (overTurnLimit(request)) return json({ error: 'too many attempts' }, 429, cors);
      return handleTurn(env, cors);
    }

    const m = url.pathname.match(/^\/mailbox\/([0-9a-f]{64})$/);
    if (m) return handleMailbox(request, env, cors, m[1]);

    const w = url.pathname.match(/^\/wake\/([0-9a-f]{64})$/);
    if (w) return handleWake(request, env, cors, w[1]);

    const k = url.pathname.match(/^\/key\/([0-9a-f]{64})$/);
    if (k) return handleKey(request, env, cors, k[1]);

    /* PUT names the letter, GET collects everything waiting */
    const lp = url.pathname.match(/^\/letter\/([0-9a-f]{64})\/([0-9a-f]{16,32})$/);
    if (lp) return handleLetter(request, env, cors, lp[1], lp[2]);
    const lg = url.pathname.match(/^\/letter\/([0-9a-f]{64})$/);
    if (lg) return handleLetter(request, env, cors, lg[1], null);

    if (url.pathname === '/knock'){
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);
      return handleKnock(request, env, cors);
    }

    return json({ error: 'not found' }, 404, cors);
}
