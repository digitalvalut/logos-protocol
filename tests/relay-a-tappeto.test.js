/* ============================================================================
   IL RELAY A TAPPETO — 4 ottobre 2026.

   worker-audit.test.js prova le proprieta' una per una, ognuna con l'attacco
   che l'ha fatta nascere. Questo file fa l'altra cosa: un tappeto di richieste
   costruite male apposta — tutte le rotte, tutti i metodi, origini buone,
   cattive e assenti, corpi vuoti, enormi, non-JSON, binari, gettoni storti,
   parametri inventati — e per OGNUNA controlla cinque cose che devono valere
   sempre, qualunque cosa arrivi:

     1. il relay risponde, non lancia;
     2. mai un 500: un guasto dello storage e' 503, un abuso e' 4xx;
     3. la risposta non lascia uscire niente dell'interno (pile di chiamate,
        nomi di file, messaggi di errore di Node);
     4. CORS non si piega: non e' mai «*», e un'origine sconosciuta non viene
        mai rispedita indietro come se fosse ammessa;
     5. una richiesta respinta (4xx) non scrive niente nello storage, e niente
        di piu' grande del tetto entra mai in una cassetta.

   Le richieste sono generate da un seme fisso (mulberry32): chi rilancia il
   file ottiene la stessa sequenza, e un fallimento si riproduce rilanciando.

   Come il resto delle prove sul Worker: gira la LOGICA del file vero, nel vm,
   con un KV finto. Nessuna richiesta lascia questa macchina e il relay di
   produzione — e la sua quota giornaliera — non vengono toccati.
   ========================================================================= */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const W = require('./worker-harness.js');

const ORIGINE_BUONA = 'https://digitalvalut.github.io';
const MAX_BODY = Number((W.SORGENTE.match(/const MAX_BODY_BYTES\s*=\s*(\d+)/) || [])[1]);

function mulberry32(seme){
  return function(){
    seme |= 0; seme = seme + 0x6D2B79F5 | 0;
    let t = Math.imul(seme ^ seme >>> 15, 1 | seme);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function genera(seme, quante){
  const r = mulberry32(seme);
  const scegli = a => a[Math.floor(r() * a.length)];
  const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('');
  const K = () => scegli([hex(64), hex(64), hex(63), hex(65), 'G'.repeat(64), '', '..%2F..%2Fetc', 'A'.repeat(64)]);
  const percorsi = () => scegli([
    '/', '/turn', '/knock', '/filo', '/sveglia', '/nonesiste', '//mailbox/' + hex(64),
    '/mailbox/' + K(), '/wake/' + K(), '/key/' + K(), '/ascolta/' + K(),
    '/letter/' + K(), '/letter/' + K() + '/' + scegli([hex(16), hex(32), hex(15), 'zz', '']),
    '/mailbox/' + hex(64) + '/extra', '/MAILBOX/' + hex(64),
  ]);
  const query = () => scegli(['', '', '?keep=1', '?peek=1', '?keep=0&peek=1', '?' + 'x='.repeat(200), '?keep=1&keep=0']);
  const metodo = () => scegli(['GET', 'GET', 'PUT', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS']);
  const origine = () => scegli([ORIGINE_BUONA, ORIGINE_BUONA, null, 'https://evil.example', 'null', 'https://digitalvalut.github.io.evil.example', '*']);
  const corpo = () => scegli([
    undefined, '', '{}', '{"i":"iv","c":"x"}', 'non json', '[1,2,3]', '{"p":"' + 'A'.repeat(200) + '"}',
    'x'.repeat(MAX_BODY - 1), 'x'.repeat(MAX_BODY + 1), 'x'.repeat(100_000),
    '{"a":' + '['.repeat(500) + ']'.repeat(500) + '}', '\u0000\u0001ÿ￿', '{"sub":"https://evil.example/push"}',
  ]);
  const gettone = () => scegli([undefined, undefined, hex(32), hex(8), 'x'.repeat(5000), '"><script>', hex(32) + '\r\nX-Inj: 1']);
  /* Meta' del tappeto sono richieste QUASI GIUSTE: origine buona, chiave ben
     formata, corpo plausibile, e un solo dettaglio storto. Senza questa meta'
     quasi tutto si ferma alla porta (origine sbagliata, percorso inesistente)
     e il codice che sta dietro — scrittura, lettura, gettoni, lettere — non
     verrebbe mai raggiunto: misurato alla prima stesura, 7 risposte 200 su 600. */
  const quasiGiusta = () => {
    const k = hex(64);
    const base = scegli([
      { metodo: 'PUT', percorso: '/mailbox/' + k, body: '{"i":"iv","c":"' + hex(40) + '"}', headers: { 'X-Logos-Token': hex(32) } },
      { metodo: 'GET', percorso: '/mailbox/' + k + '?keep=1' },
      { metodo: 'DELETE', percorso: '/mailbox/' + k, headers: { 'X-Logos-Token': hex(32) } },
      { metodo: 'PUT', percorso: '/wake/' + k, body: '{"i":"iv","c":"' + hex(40) + '"}' },
      { metodo: 'GET', percorso: '/wake/' + k },
      { metodo: 'GET', percorso: '/key/' + k },
      { metodo: 'PUT', percorso: '/key/' + k, body: '{"p":"' + 'A'.repeat(87) + '","n":0}' },
      { metodo: 'PUT', percorso: '/letter/' + k, body: '{"i":"iv","c":"' + hex(40) + '"}', headers: { 'X-Logos-Token': hex(32) } },
      { metodo: 'GET', percorso: '/letter/' + k + '?keep=1' },
      { metodo: 'DELETE', percorso: '/letter/' + k + '/' + hex(16), headers: { 'X-Logos-Token': hex(32) } },
      { metodo: 'POST', percorso: '/knock', body: '{"endpoint":"https://fcm.googleapis.com/fcm/send/' + hex(30) + '"}' },
      { metodo: 'GET', percorso: '/turn' },
    ]);
    const q = Object.assign({ origin: ORIGINE_BUONA, body: undefined, headers: undefined }, base);
    switch (Math.floor(r() * 6)){
      case 0: q.body = corpo(); break;
      case 1: q.headers = { 'X-Logos-Token': scegli([hex(8), 'x'.repeat(5000), '"><script>', hex(31), hex(33)]) }; break;
      case 2: q.metodo = metodo(); break;
      case 3: q.percorso += query(); break;
      case 4: q.origin = scegli([null, ORIGINE_BUONA]); break;
      default: break;   /* qualcuna giusta davvero: il percorso felice va percorso anche lui */
    }
    if (q.metodo === 'GET' || q.metodo === 'OPTIONS') q.body = undefined;
    return q;
  };
  const out = [];
  for (let i = 0; i < quante; i++){
    if (r() < 0.5){ out.push(Object.assign(quasiGiusta(), { ip: '198.51.100.' + (1 + Math.floor(r() * 250)) })); continue; }
    const m = metodo();
    const g = gettone();
    out.push({
      metodo: m,
      percorso: percorsi() + query(),
      origin: origine(),
      body: (m === 'GET' || m === 'OPTIONS') ? undefined : corpo(),
      headers: g === undefined ? undefined : { 'X-Logos-Token': g },
      ip: '198.51.100.' + (1 + Math.floor(r() * 250)),
    });
  }
  return out;
}

/* Un Cloudflare che funziona. Senza, il banco non ha rete apposta e /turn e
   /knock finirebbero sempre nel ramo «servizio esterno irraggiungibile»: il
   tappeto proverebbe la rete che manca invece del NOSTRO codice. Il caso
   «Cloudflare giu'» ha le sue prove in worker-audit.test.js (l'errore non
   va in cache) ed e' annotato a parte. */
async function ambienteFunzionante(){
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pub = Buffer.from(await crypto.subtle.exportKey('raw', kp.publicKey)).toString('base64url');
  const fetch = async (url) => {
    if (String(url).includes('rtc.live.cloudflare.com'))
      return new Response(JSON.stringify({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }] }), { status: 201 });
    return new Response(null, { status: 201 });   /* il servizio push accetta */
  };
  return { env: { VAPID_PRIVATE_JWK: JSON.stringify(jwk), VAPID_PUBLIC_KEY: pub }, fetch };
}

const TRACCE_INTERNE = /\bat [\w.<>]+ \(|worker\.js|node:internal|TypeError|ReferenceError|SyntaxError|\bstack\b/;

async function una(w, q){
  let res;
  try{
    res = await w.chiama(q.metodo, q.percorso, { body: q.body, origin: q.origin, ip: q.ip, headers: q.headers });
  }catch(e){
    /* una richiesta che il costruttore di Request rifiuta (intestazione con
       un a capo, per esempio) non arriva mai al Worker: Cloudflare la
       scarterebbe prima. Non e' un difetto del relay. */
    if (/Headers|header|ByteString|invalid/i.test(String(e && e.message))) return null;
    throw e;
  }
  return res;
}

test.describe('relay a tappeto: cinque regole che valgono per qualunque richiesta', () => {

  test('600 richieste costruite male: nessun 500, niente che trapela, CORS fermo', async () => {
    const richieste = genera(20261004, 600);
    const amb = await ambienteFunzionante();
    let viste = 0;
    for (const q of richieste){
      /* un Worker nuovo ogni 50 richieste: i limiti di frequenza tengono il
         conto in memoria, e senza azzerarli il tappeto finirebbe a provare
         soltanto il 429 */
      if (viste % 50 === 0) var w = W.caricaWorker(amb);
      viste++;
      const prima = w.env.MAILBOX._log.length;
      const res = await una(w, q);
      if (!res) continue;
      const chi = `${q.metodo} ${q.percorso.slice(0, 90)} origin=${q.origin} corpo=${q.body === undefined ? '-' : String(q.body).length}`;

      assert.notStrictEqual(res.status, 500, 'un 500 su: ' + chi);
      assert.ok(res.status >= 100 && res.status < 600, 'stato impossibile ' + res.status + ' su: ' + chi);

      const testo = typeof res.corpo === 'string' ? res.corpo : JSON.stringify(res.corpo);
      assert.doesNotMatch(String(testo), TRACCE_INTERNE, 'esce qualcosa dell\'interno su: ' + chi + ' → ' + String(testo).slice(0, 160));

      const acao = res.headers.get('Access-Control-Allow-Origin');
      if (acao !== null){
        assert.notStrictEqual(acao, '*', 'CORS aperto a tutti su: ' + chi);
        if (q.origin && q.origin !== ORIGINE_BUONA)
          assert.notStrictEqual(acao, q.origin, 'un\'origine sconosciuta rimandata come ammessa su: ' + chi);
      }

      const nuove = w.env.MAILBOX._log.slice(prima);
      const scritte = nuove.filter(x => x.op === 'put');
      if (res.status >= 400)
        assert.strictEqual(scritte.length, 0, 'una richiesta respinta (' + res.status + ') ha scritto nello storage: ' + chi);
      for (const s of scritte)
        assert.ok(s.bytes <= MAX_BODY * 2, `${s.bytes} byte scritti in ${s.k.slice(0, 12)}…: oltre ogni tetto, su: ${chi}`);
    }
    assert.ok(viste === 600);
  });

  test('un\'origine sconosciuta riceve sempre un rifiuto, su ogni rotta e con ogni metodo', async () => {
    const r = mulberry32(7);
    const rotte = ['/', '/turn', '/knock', '/mailbox/' + 'a'.repeat(64), '/wake/' + 'b'.repeat(64),
                   '/key/' + 'c'.repeat(64), '/letter/' + 'd'.repeat(64), '/ascolta/' + 'e'.repeat(64)];
    for (const rotta of rotte){
      for (const m of ['GET', 'PUT', 'POST', 'DELETE']){
        const w = W.caricaWorker();
        const res = await w.chiama(m, rotta, { origin: 'https://evil.example', body: m === 'GET' ? undefined : '{"i":"iv","c":"x"}', ip: '192.0.2.' + (1 + Math.floor(r() * 200)) });
        assert.strictEqual(res.status, 403, `${m} ${rotta} da un'origine sconosciuta: ${res.status}`);
        assert.strictEqual(w.env.MAILBOX._log.filter(x => x.op !== 'get').length, 0, `${m} ${rotta}: un rifiuto ha toccato lo storage`);
      }
    }
  });

  test('il tetto della busta vale a un byte di distanza: MAX entra, MAX+1 no', async () => {
    assert.ok(MAX_BODY > 1000, 'MAX_BODY_BYTES non trovato nel Worker');
    const w = W.caricaWorker();
    const k1 = 'f'.repeat(64), k2 = 'e'.repeat(64);
    const dentro = await w.chiama('PUT', '/mailbox/' + k1, { origin: ORIGINE_BUONA, body: 'x'.repeat(MAX_BODY) });
    const fuori = await w.chiama('PUT', '/mailbox/' + k2, { origin: ORIGINE_BUONA, body: 'x'.repeat(MAX_BODY + 1) });
    assert.strictEqual(dentro.status, 200, 'una busta esattamente al tetto deve entrare');
    assert.strictEqual(fuori.status, 400, 'un byte oltre il tetto deve restare fuori');
    assert.ok(!w.env.MAILBOX._m.has(k2), 'la busta troppo grande e\' stata scritta lo stesso');
  });
});
