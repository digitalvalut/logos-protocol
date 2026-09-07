/* ============================================================================
   FUZZING SISTEMATICO — Fase C.

   Non caos: tre sessioni con un obiettivo ciascuna, tutte guidate da un PRNG
   seedato, tutte riproducibili al messaggio esatto.

     sessione 1 — TIPI       ogni campo di ogni messaggio, con ogni tipo sbagliato
     sessione 2 — DIMENSIONI da una stringa vuota a dieci megabyte
     sessione 3 — SEQUENZE   le violazioni di I9, intrecciate ad azioni utente

   Ogni operazione è un oggetto serializzabile, non una chiamata: è ciò che
   permette al minimizzatore di rieseguire un sottoinsieme su un'app fresca.
   Una violazione senza sequenza minima è un aneddoto; con essa è un finding.
   ========================================================================= */

'use strict';

const H = require('./hostile.js');

/* ---------------------------------------------------------------- forme ---
   Ogni tipo di messaggio che onDcMessage riconosce, con i campi che legge.
   Presi dal codice, non inventati: un fuzzer che spara campi inesistenti
   misura la propria fantasia. */
const SHAPES = {
  hello:            ['nick', 'fp', 'push', 'addr'],
  text:             ['text'],
  'file-start':     ['id', 'name', 'mime', 'size'],
  'file-end':       ['id'],
  wipe:             [],
  'call-offer':     ['kind'],
  'call-accept':    [],
  'call-decline':   [],
  'call-nomedia':   ['kind'],
  'call-offer-sdp': ['sdp'],
  'call-answer-sdp':['sdp'],
  'call-end':       [],
};
const TYPES = Object.keys(SHAPES);

/* I valori sbagliati. Non "qualcosa di strano": le forme che rompono i
   metodi che il codice chiama davvero sui campi — .trim() su un oggetto,
   .startsWith() su un numero, .slice() su null. */
function wrongValues(rng, taintEvery){
  const base = [
    {}, [], 0, -1, 1.5, -0, 1e308, NaN, true, false, null,
    '', ' ', '\u0000', '\\', '"', "'", '</b>', '{}', '[]',
    { length: 1e9 },
    { toString(){ throw new Error('toString ostile'); } },
    [[[[[[[[['annidato']]]]]]]]],
    '\ud800',                       /* surrogato spaiato */
    H.homoglyphOf('Mamma'),
    H.withZeroWidth('Mamma'),
    H.withBidi('Mamma'),
  ];
  const v = rng.pick(base);
  /* una parte dei valori porta il marcatore, così I7 ha sempre qualcosa da
     cercare senza che ogni singolo messaggio diventi una stringa lunga */
  if (taintEvery && typeof v === 'string' && rng.bool(0.25)) return H.taint(v);
  return v;
}

/* ============================== ESECUZIONE ============================== */

/* Ciò che si conserva per il report, non ciò che si è eseguito. Un carico da
   dieci megabyte è indispensabile per PROVOCARE il comportamento e inutile per
   DESCRIVERLO: tenerne quaranta per ogni violazione ha fatto esplodere V8 due
   volte di fila, e le due volte l'esplosione era dell'arnese, non dell'app.
   Oltre la soglia si conserva la forma, non la sostanza — e si dice quanto era
   grande davvero, che è l'unica cosa che serve leggendo. */
const SOGLIA_CONSERVA = 64 * 1024;
function compattaOp(op){
  if (op.op === 'json' && op.payload && op.payload.length > SOGLIA_CONSERVA){
    return { op: op.op, nota: op.nota, payloadLen: op.payload.length,
             payload: op.payload.slice(0, 200) + '…[troncato per il report]' , troncato: true };
  }
  return op;
}

/* Un'operazione è { op, ... }: dati, non chiamate. Il minimizzatore deve
   poterle riordinare, togliere e rieseguire altrove. */
function applyOp(app, peerFns, op){
  switch (op.op){
    case 'json':   return app.fastText(op.payload);
    case 'raw':    return app.fastText(op.payload);
    case 'bin':    return app.fastBin(op.id, op.n, op.headerLen);
    case 'ui': {
      /* azioni dell'utente, intrecciate ai messaggi ostili: è dove vivono
         le corse che nessun messaggio da solo produce */
      try{ app.run(op.code); return null; }
      catch(e){ return String((e && e.message) || e); }
    }
    case 'clock':  app.clock.advance(op.ms); return null;
    default: return null;
  }
}

/* Prepara un'app in uno stato dove i messaggi hanno effetto: senza una pc e
   senza le due funzioni asincrone neutralizzate, metà dei rami esce subito e
   il fuzzing gira a vuoto. */
const PRELUDIO = `
  checkSafetyFor = function(){ return Promise.resolve(); };
  showConnectedFlash = function(){ return Promise.resolve(); };
  showSasPanel = function(){ return Promise.resolve(); };
  computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
  remoteFpHex = function(){ return 'fp-fuzz'; };
  pc = new RTCPeerConnection();
  dc = { readyState: 'open', send: function(){} };
  peerNick = '';
`;

/* `sorgente` esiste per i mutanti (Fase F): la copia guasta arriva come
   stringa e modifica.js su disco non viene mai toccato. La presa era gia'
   pronta in loadHostile; qui mancava il filo che la collega alle campagne, ed
   e' il motivo per cui i 17 mutanti sono rimasti per mesi senza nessuno che
   li lanciasse. */
function freshApp(sorgente){
  const app = H.loadHostile(sorgente ? { sorgente } : undefined);
  app.run(PRELUDIO);
  return app;
}

/* Riesegue una lista di operazioni su un'app nuova e dice se la violazione
   cercata ricompare. È il cuore del minimizzatore: senza riesecuzione fedele
   non esiste "sequenza minima", esiste solo un log. */
function replay(ops, ctx){
  const app = freshApp();
  const peerFns = null;
  for (const op of ops) applyOp(app, peerFns, op);
  const v = H.checkInvariants(app, ctx);
  const throws = app.spies.throws.slice();
  app.stop();
  return { violations: v, throws };
}

function hasViolation(res, id){
  if (id === 'I3') return res.throws.length > 0;
  return res.violations.some(x => x.id === id);
}

/* --------------------------------------------------------- minimizzatore ---
   Delta-debug elementare: prova a togliere ogni operazione, una alla volta,
   e tiene la rimozione se la violazione sopravvive. Quadratico nel numero di
   operazioni, quindi si parte da una finestra corta attorno al punto in cui
   la violazione è comparsa, non dall'intera sessione. */
function minimize(ops, id, ctx, maxPassi){
  let corrente = ops.slice();
  let passi = 0;
  let cambiato = true;
  while (cambiato && passi < (maxPassi || 400)){
    cambiato = false;
    for (let i = 0; i < corrente.length && passi < (maxPassi || 400); i++){
      const prova = corrente.slice(0, i).concat(corrente.slice(i + 1));
      passi++;
      if (prova.length && hasViolation(replay(prova, ctx), id)){
        corrente = prova; cambiato = true; i--;
      }
    }
  }
  return { ops: corrente, passi };
}

/* ============================== LE TRE SESSIONI ============================== */

/* Genera l'operazione numero i della sessione data. Generare invece di
   registrare significa che il seed da solo ricostruisce tutto: il log serve
   al minimizzatore, non alla riproducibilità. */
function genTipi(rng){
  const type = rng.pick(TYPES);
  const campi = SHAPES[type];
  const msg = { type };
  for (const c of campi){
    if (rng.bool(0.15)) continue;                    /* campo mancante */
    msg[c] = wrongValues(rng, true);
  }
  if (rng.bool(0.05)) msg.type = wrongValues(rng);   /* anche il tipo sbagliato */
  let payload;
  try{ payload = JSON.stringify(msg); }catch(e){ payload = '{"type":"text"}'; }
  if (payload === undefined) payload = '{"type":"text"}';
  return { op: 'json', payload, nota: type };
}

function genDimensioni(rng){
  const scelta = rng.int(10);
  /* Pesata, non uniforme. Le taglie enormi sono il punto della sessione — un
     nick da dieci megabyte deve accendere historyBroken, non far cadere
     l'app — ma sceglierle una volta su nove significa allocare gigabyte e
     serializzarli in localStorage per l'intera corsa: la prima prova si è
     piantata prima di finire trecento messaggi. Restano nel mazzo, rare. */
  /* Il tetto della spazzata è un megabyte, non dieci. Le taglie da 5 e 10 MB
     sono state misurate a parte, in prove mirate (vedi il report): dentro una
     corsa da cinquantamila messaggi non aggiungevano copertura e facevano
     esaurire la memoria dell'ARNESE prima che l'app dicesse qualcosa. Un
     fuzzer che muore non misura niente. */
  const grandezze = [0, 0, 1, 1, 16, 16, 100, 100, 1000, 1000, 65536, 65536, 1 << 18, 1 << 19, 1 << 20];
  const n = rng.pick(grandezze);
  /* Ogni tanto la cronologia viene svuotata, e non per comodità: il costo di
     salvare un messaggio è proporzionale al PESO dell'intera cronologia,
     perché il tetto delle 300 voci conta le voci e non i byte. Misurato:
     1,9 ms per messaggio con voci da 1 KB, 137 ms con voci da 64 KB. Senza
     questo azzeramento la sessione non misurerebbe la gestione delle taglie
     — misurerebbe quel rallentamento, che è già stato misurato a parte e sta
     nel report come finding. */
  if (rng.bool(0.01)) return { op: 'ui', code: "forgetHistoryFor(peerNick); $('msgs').innerHTML = '';", nota: 'svuota' };
  if (scelta < 3){
    /* un nick enorme deve accendere historyBroken, non far cadere l'app */
    return { op: 'json', payload: JSON.stringify({ type: 'hello', nick: rng.str(n), fp: 'f' }), nota: 'nick:' + n };
  }
  if (scelta < 5){
    return { op: 'json', payload: JSON.stringify({ type: 'text', text: rng.str(n) }), nota: 'text:' + n };
  }
  if (scelta < 7){
    /* venti transfer da 512 MB dichiarati e mai riempiti: il caso H2 */
    const id = 'big' + rng.int(40);
    return { op: 'json', payload: JSON.stringify({ type: 'file-start', id, name: rng.str(Math.min(n, 1 << 16)), mime: 'image/png', size: 512 * 1024 * 1024 }), nota: 'start-enorme' };
  }
  if (scelta < 9){
    /* id lunghissimo usato come chiave di storage: I13 */
    return { op: 'json', payload: JSON.stringify({ type: 'file-start', id: rng.str(Math.min(n, 1 << 20)), name: 'x', mime: '', size: 10 }), nota: 'id:' + n };
  }
  return { op: 'bin', id: 'big' + rng.int(40), n: Math.min(n, 1 << 20), nota: 'chunk:' + n };
}

/* le azioni utente che si intrecciano ai messaggi: è qui che vivono le corse */
const AZIONI_UTENTE = [
  { nome: 'endSession',      code: 'endSession();' },
  { nome: 'destroyNow',      code: 'destroyNow(false);' },
  { nome: 'armaDistruzione', code: 'destructArmed = true;' },
  { nome: 'disarma',         code: 'destructArmed = false;' },
  { nome: 'svuotaCronologia',code: "forgetHistoryFor(peerNick);" },
  { nome: 'autoclean',       code: 'setAutocleanPref(true); setAutocleanDays(7); runAutoclean();' },
  { nome: 'apriChat',        code: "showScreen('screenChat');" },
  { nome: 'tornaHome',       code: "showScreen('screenHome');" },
  { nome: 'nuovaPc',         code: 'pc = new RTCPeerConnection();' },
  { nome: 'chiudiDc',        code: "dc = { readyState: 'closed', send: function(){} };" },
  { nome: 'riapriDc',        code: "dc = { readyState: 'open', send: function(){} };" },
];

function genSequenze(rng){
  const id = 'S' + rng.int(30);
  const illegali = [
    () => ({ op:'json', payload: JSON.stringify({ type:'call-answer-sdp', sdp:'garbage' }), nota:'risposta-prima-offerta' }),
    () => ({ op:'json', payload: JSON.stringify({ type:'call-offer-sdp', sdp:'garbage' }), nota:'offerta-garbage' }),
    () => ({ op:'json', payload: JSON.stringify({ type:'call-accept' }), nota:'accept-senza-chiamata' }),
    () => ({ op:'json', payload: JSON.stringify({ type:'file-end', id }), nota:'fine-senza-inizio' }),
    () => ({ op:'json', payload: JSON.stringify({ type:'file-start', id, name:'a', mime:'', size:1000 }), nota:'start' }),
    () => ({ op:'bin',  id, n: 512, nota:'chunk' }),
    () => ({ op:'bin',  id: 'ignoto', n: 64, nota:'chunk-id-ignoto' }),
    () => ({ op:'bin',  id, n: 8, headerLen: rng.int(16), nota:'header-troncato' }),
    () => ({ op:'json', payload: JSON.stringify({ type:'hello', nick:'Peer' + rng.int(5), fp:'fp'+rng.int(3) }), nota:'hello' }),
    () => ({ op:'json', payload: JSON.stringify({ type:'wipe' }), nota:'wipe' }),
  ];
  if (rng.bool(0.25)){
    const a = rng.pick(AZIONI_UTENTE);
    return { op: 'ui', code: a.code, nota: a.nome };
  }
  if (rng.bool(0.05)) return { op: 'clock', ms: rng.pick([1000, 5000, 60000, 3600000]), nota: 'tempo' };
  return rng.pick(illegali)();
}

const SESSIONI = {
  tipi:       { gen: genTipi,       titolo: 'TIPI' },
  dimensioni: { gen: genDimensioni, titolo: 'DIMENSIONI' },
  sequenze:   { gen: genSequenze,   titolo: 'SEQUENZE' },
};

/* ------------------------------------------------------------- il motore ---
   Verifica dopo OGNI operazione, non a campione: ottimizzando checkInvariants
   il costo è sceso da 23 ms a 0,2 ms, e a quel prezzo campionare sarebbe solo
   un modo di non vedere le violazioni che si richiudono da sole. */
function runSession(nome, seed, n, opts){
  const cfg = SESSIONI[nome];
  if (!cfg) throw new Error('sessione sconosciuta: ' + nome);
  const o = opts || {};
  const ctx = { budgetPerMinuto: o.budgetPerMinuto, maxIdLen: o.maxIdLen || 256 };
  const rng = H.rngKit(seed);
  const app = freshApp(o.sorgente);

  const trovate = new Map();     /* id invariante -> primo ritrovamento */
  const finestra = [];           /* ultime operazioni, per il minimizzatore */
  const FINESTRA = o.finestra || 40;
  /* Solo le note, mai i carichi. Trattenere ogni operazione con dentro il suo
     payload sembrava innocuo finché la sessione DIMENSIONI non ha fatto
     esplodere V8 a tre gigabyte: là dentro un singolo messaggio arriva a
     dieci megabyte, e cinquantamila di quelli non stanno in nessuna memoria.
     Il minimizzatore lavora sulla finestra scorrevole, che è lunga quaranta:
     l'elenco completo non serviva a nessuno e costava tutto. */
  const note = [];
  let throwsVisti = 0;
  const t0 = Date.now();

  for (let i = 0; i < n; i++){
    const op = cfg.gen(rng);
    note.push(op.nota);
    finestra.push(op);
    if (finestra.length > FINESTRA) finestra.shift();
    applyOp(app, null, op);

    /* I3 è gratis: l'eccezione è già stata catturata dalla via veloce */
    const err = app.spies.throws.length > throwsVisti;
    if (err){
      throwsVisti = app.spies.throws.length;
      if (!trovate.has('I3')){
        trovate.set('I3', { i, op: compattaOp(op), finestra: finestra.map(compattaOp), dettaglio: app.spies.throws[app.spies.throws.length - 1] });
      }
    }
    const v = H.checkInvariants(app, ctx);
    for (const viol of v){
      if (trovate.has(viol.id)) continue;
      trovate.set(viol.id, { i, op: compattaOp(op), finestra: finestra.map(compattaOp), dettaglio: viol });
    }
  }

  const durata = Date.now() - t0;
  const stato = app.snapshot();
  app.stop();
  return { nome, titolo: cfg.titolo, seed, n, durata, trovate, note, stato, ctx };
}

module.exports = { SHAPES, TYPES, wrongValues, AZIONI_UTENTE,
                   runSession, minimize, replay, hasViolation, freshApp, applyOp, PRELUDIO };
