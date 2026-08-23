/* ============================================================================
   L'ARNESE — peer ostile, mailbox finta, verificatori degli invarianti.

   Fase B dell'audit ostile. Questo file non protegge il codice: lo attacca.
   Sta apposta fuori da logic.test.js e da fake-browser.js, che difendono la
   produzione e devono restare leggibili come sono. Qui dentro si costruisce
   solo l'attrezzatura; le fasi C–F la usano.

   Zero dipendenze, come tutto il resto: node:vm, node:fs, e il banco DOM già
   esistente, che viene avvolto e mai modificato.

   Il principio che governa ogni riga: un crash non è un incidente da
   ignorare, è la violazione di I3 e va registrato come tale. Nessuna
   asserzione qui solleva: i verificatori RESTITUISCONO le violazioni, così
   una sessione di fuzzing da 50.000 messaggi non si ferma al primo problema
   e li trova tutti in un colpo solo.
   ========================================================================= */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildSandbox } = require('./fake-browser.js');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'modifica.js'), 'utf8');

/* ---------------------------------------------------------------- PRNG ---
   mulberry32: trentadue righe di aritmetica, nessuna dipendenza, e
   soprattutto deterministico — un crash trovato al messaggio 43.712 della
   sessione col seed 12345 si riproduce esattamente rilanciando quel seed.
   Un fuzzer non riproducibile non è un fuzzer, è un aneddoto. */
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* comodità sopra il PRNG, tutte deterministiche */
function rngKit(seed){
  const r = mulberry32(seed);
  const int = n => Math.floor(r() * n);
  return {
    seed, next: r, int,
    pick: arr => arr[int(arr.length)],
    bool: (p = 0.5) => r() < p,
    /* stringa di lunghezza voluta senza costruirla carattere per carattere:
       una da 10 MB fatta in un ciclo è mezzo secondo di test buttato */
    str: (len, ch = 'x') => ch.repeat(len),
  };
}

/* ------------------------------------------------------- unicode ostile ---
   I8. Non decorazione: ognuna di queste rende due nick diversi
   indistinguibili sullo schermo, che è esattamente ciò contro cui la difesa
   per impronta di M5 non fa nulla — perché è corretta a livello di dato e
   il problema è nella percezione. */
const HOMOGLYPHS = {
  'a': 'а',   /* CYRILLIC SMALL LETTER A */
  'e': 'е',   /* CYRILLIC SMALL LETTER IE */
  'o': 'о',   /* CYRILLIC SMALL LETTER O */
  'p': 'р',   /* CYRILLIC SMALL LETTER ER */
  'c': 'с',   /* CYRILLIC SMALL LETTER ES */
  'i': 'і',   /* CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I */
  'M': 'М',   /* CYRILLIC CAPITAL LETTER EM */
};
const ZERO_WIDTH = ['​', '‌', '‍', '﻿'];
const BIDI_CONTROLS = ['‪', '‫', '‬', '‭', '‮', '⁦', '⁧', '⁨', '⁩'];

/* "Mamma" scritto in modo che la rubrica lo veda diverso e l'occhio no */
function homoglyphOf(s){
  return [...s].map(c => HOMOGLYPHS[c] || c).join('');
}
function withZeroWidth(s, rng){
  const i = rng ? rng.int(s.length + 1) : 1;
  const z = rng ? rng.pick(ZERO_WIDTH) : ZERO_WIDTH[0];
  return s.slice(0, i) + z + s.slice(i);
}
function withBidi(s, rng){
  const c = rng ? rng.pick(BIDI_CONTROLS) : '‮';
  return c + s;
}

/* ------------------------------------------------------------- il tarlo ---
   I7 si prova per contaminazione, non per ispezione: ogni stringa che il
   peer manda porta dentro una sequenza che `esc()` DEVE trasformare. Se
   quella sequenza ricompare intatta dentro un innerHTML, esc non è passata
   di lì. Nessuna analisi statica, nessun falso positivo: o il marcatore
   grezzo è sullo schermo o non c'è. */
const TAINT = '<taint onerror="1">';
const TAINT_MARKS = ['<taint', 'onerror="1"'];
function taint(s){ return String(s) + TAINT; }

/* ---------------------------------------------------------- mailbox finta ---
   Sostituisce fetch. Conta, data e risponde. Serve a due invarianti:
   I4 (quante letture al minuto, con orologio controllato) e I6 (quale
   descrizione finisce in quale slot). */
function makeMailbox(clock){
  const calls = [];              /* { t, method, route, key, body } */
  const store = new Map();
  const state = {
    status: 200,                 /* forzabile a 429 per provare il backoff */
    failNext: 0,                 /* quante prossime chiamate devono fallire */
  };
  function routeOf(url){
    const u = String(url);
    if (u.indexOf('/mailbox/') !== -1) return 'mailbox';
    if (u.indexOf('/wake/') !== -1) return 'wake';
    if (u.indexOf('/key/') !== -1) return 'key';
    if (u.indexOf('/letter/') !== -1) return 'letter';
    if (u.indexOf('/turn') !== -1) return 'turn';
    if (u.indexOf('/knock') !== -1) return 'knock';
    return 'altro';
  }
  function keyOf(url){
    const u = String(url);
    const i = u.lastIndexOf('/');
    return i === -1 ? '' : u.slice(i + 1);
  }
  const fetch = (url, opts) => {
    const method = (opts && opts.method) || 'GET';
    const route = routeOf(url);
    const key = keyOf(url);
    calls.push({ t: clock.now(), method, route, key, body: opts && opts.body });
    if (state.failNext > 0){ state.failNext--; return Promise.reject(new TypeError('rete giù (finta)')); }
    if (state.status === 429){
      return Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve(null), text: () => Promise.resolve('') });
    }
    if (method === 'PUT'){
      store.set(route + ':' + key, opts && opts.body);
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    }
    const held = store.get(route + ':' + key);
    if (held === undefined){
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null), text: () => Promise.resolve('') });
    }
    /* la mailbox vera è a lettura unica: se questa finta non lo fosse,
       nasconderebbe proprio i bug di rilettura che I6 cerca */
    if (route === 'mailbox') store.delete(route + ':' + key);
    let parsed = null;
    try{ parsed = JSON.parse(held); }catch(e){}
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(parsed), text: () => Promise.resolve(String(held)) });
  };
  return {
    fetch, calls, store, state,
    /* I4: letture in una finestra scorrevole, misurate sull'orologio finto */
    readsInWindow(ms){
      const now = clock.now();
      return calls.filter(c => c.method === 'GET' && c.route === 'mailbox' && now - c.t <= ms).length;
    },
    countBy(route, method){
      return calls.filter(c => c.route === route && (!method || c.method === method)).length;
    },
    reset(){ calls.length = 0; store.clear(); state.status = 200; state.failNext = 0; },
  };
}

/* ------------------------------------------------------ orologio finto ---
   Il tempo deve avanzare quando lo dico io, o I4 non è misurabile: un test
   che gira in venti millisecondi vedrebbe sempre zero richieste al minuto.
   Date viene sostituita per intero dentro la sandbox. */
function makeClock(start){
  const c = { t: start || 1_700_000_000_000 };
  return {
    now: () => c.t,
    advance(ms){ c.t += ms; },
    set(t){ c.t = t; },
    install(sandbox){
      const RealDate = Date;
      class FakeDate extends RealDate {
        constructor(...args){ if (args.length === 0) super(c.t); else super(...args); }
        static now(){ return c.t; }
      }
      sandbox.Date = FakeDate;
    },
  };
}

/* ============================== IL CARICATORE ============================== */

function loadHostile(options){
  const clock = makeClock();
  const sandbox = buildSandbox(options);
  const mailbox = makeMailbox(clock);
  /* `sorgente` esiste per i mutanti della Fase F: la copia guasta arriva come
     stringa e modifica.js su disco non viene mai toccato — vincolo 3. */
  const sorgente = (options && options.sorgente) || SOURCE;

  clock.install(sandbox);
  sandbox.fetch = mailbox.fetch;

  /* ---- localStorage con quota, come quello vero ----
     Il banco di produzione ne usa uno senza limiti, ed è giusto così: quei
     test misurano decisioni, non capienza. Qui no. Senza quota la cronologia
     è cresciuta finché V8 non è morto a due gigabyte dentro JSON.stringify —
     un OOM che sembrava un finding e non lo era: un browser vero avrebbe
     rifiutato la scrittura molto prima, lasciando la lista ferma all'ultima
     che ci stava. Modellare il limite è ciò che separa "l'app va in
     crash" da "l'arnese va in crash". Cinque megabyte è la taglia tipica.
     Sostituito PRIMA di caricare l'app, così il codice non vede altro. */
  const QUOTA = (options && options.quotaBytes) || 5 * 1024 * 1024;
  const vero = sandbox.localStorage;
  const conQuota = {
    peso: 0,
    getItem: k => vero.getItem(k),
    key: i => vero.key(i),
    get length(){ return vero.length; },
    removeItem(k){ vero.removeItem(k); },
    clear(){ vero.clear(); },
    setItem(k, v){
      const s = String(v);
      /* somma grossolana ma della forma giusta: la quota è sul totale
         dell'origine, non sulla singola chiave */
      let totale = s.length;
      for (let i = 0; i < vero.length; i++){
        const kk = vero.key(i);
        if (kk === String(k)) continue;
        totale += String(vero.getItem(kk) || '').length;
      }
      if (totale > QUOTA){
        const e = new Error('QuotaExceededError: superata la quota di ' + QUOTA + ' byte');
        e.name = 'QuotaExceededError';
        throw e;
      }
      vero.setItem(k, s);
    },
  };
  sandbox.localStorage = conQuota;

  vm.createContext(sandbox);
  vm.runInContext(sorgente, sandbox, { filename: 'modifica.js' });
  const run = expr => vm.runInContext(expr, sandbox);

  run('stopAddrPolling(); stopInboxPolling();');
  sandbox.__stopAllTimers();

  /* ---- spie sulle funzioni che gli invarianti sorvegliano ----
     Sostituite, non ispezionate: il punto di I1 è cosa VIENE CHIAMATO, non
     cosa è scritto nel sorgente. Il sorgente lo ha già letto una revisione;
     questa fase guarda l'esecuzione. */
  const spies = {
    writeSafetyRec: [],     /* I1  */
    humanConfirm: [],       /* I1  */
    escCalls: [],           /* I7  */
    mediaPut: [],           /* I11 I12 */
    mediaDeleteByConv: [],  /* I11 */
    mediaDeleteOlderThan: [],
    throws: [],             /* I3  */
  };
  sandbox.__spies = spies;
  run(`
    (function(){
      const _wsr = writeSafetyRec;
      writeSafetyRec = function(k, c){ __spies.writeSafetyRec.push({ k, c, armed: destructArmed }); return _wsr(k, c); };

      const _esc = esc;
      esc = function(s){ const out = _esc(s); __spies.escCalls.push(String(s)); return out; };

      const _acc = acceptNewSafety;
      acceptNewSafety = function(){ __spies.humanConfirm.push({ at: Date.now() }); return _acc.apply(this, arguments); };

      if (typeof mediaPut === 'function'){
        const _mp = mediaPut;
        mediaPut = function(convKey, id, blob, t){
          __spies.mediaPut.push({ convKey, id, armed: destructArmed, len: (id||'').length });
          return _mp.apply(this, arguments);
        };
      }
      if (typeof mediaDeleteByConv === 'function'){
        const _md = mediaDeleteByConv;
        mediaDeleteByConv = function(convKey){ __spies.mediaDeleteByConv.push({ convKey }); return _md.apply(this, arguments); };
      }
      if (typeof mediaDeleteOlderThan === 'function'){
        const _mo = mediaDeleteOlderThan;
        mediaDeleteOlderThan = function(cutoff){ __spies.mediaDeleteOlderThan.push({ cutoff }); return _mo.apply(this, arguments); };
      }
    })();
  `);

  /* ---- via veloce di consegna ----
     Centocinquantamila messaggi passati uno per uno da vm.runInContext sono
     minuti di attesa e nessuna informazione in più: ogni chiamata ricompila
     una sorgente. Queste due funzioni vengono definite UNA volta dentro la
     sandbox, e da qui in poi si chiamano per riferimento diretto — una
     chiamata di funzione fra realm, non una compilazione. Il carico binario
     lo costruisce la sandbox stessa, così l'ArrayBuffer nasce nel realm che
     poi lo legge. */
  run(`
    window.__fastText = function(s){
      try{ onDcMessage({ data: s }); return null; }
      catch(e){ return String((e && e.message) || e); }
    };
    window.__fastBin = function(idStr, n, headerLen){
      try{
        const total = (headerLen === undefined ? 16 : headerLen) + n;
        const b = new Uint8Array(total);
        if (headerLen === undefined || headerLen >= 16){
          const h = new TextEncoder().encode(String(idStr).padEnd(16,' ').slice(0,16));
          b.set(h, 0);
        }
        onDcMessage({ data: b.buffer });
        return null;
      }catch(e){ return String((e && e.message) || e); }
    };
  `);

  const app = {
    sandbox, run, clock, mailbox, spies,
    fastText: sandbox.__fastText,
    fastBin: sandbox.__fastBin,
    stop(){ sandbox.__stopAllTimers(); },
    /* lo stato globale che deve tornare com'era dopo una sessione (I10) */
    snapshot(){
      return run(`JSON.stringify({
        incoming: Object.keys(incoming).length,
        quickPump: quickPump === null,
        quickPumpOwner: (typeof quickPumpOwner === 'undefined') || quickPumpOwner === null,
        addrPending: addrPending === null,
        dialedAddress: dialedAddress === null,
        dialedAddrProven: dialedAddrProven === false,
        dialedAddrUnvouched: (typeof dialedAddrUnvouched === 'undefined') || dialedAddrUnvouched === false,
        destructArmed: destructArmed === false,
        dialing: dialing === false,
        autoAccepting: autoAccepting === false,
        peerNick: peerNick === '',
        scannedFp: scannedFp === null,
        screenSharing: (typeof screenSharing === 'undefined') || screenSharing === false,
        callState: callState,
        callTimerInterval: callTimerInterval === null,
        mailboxThrottled: (typeof mailboxThrottled === 'undefined') || mailboxThrottled === false,
        historyBroken: historyBroken === false,
        outgoingIntro: outgoingIntro === '',
        knockUnvouched: (typeof knockUnvouched === 'undefined') || knockUnvouched === false,
        busy: busyWithSomeone(),
        btnCreate: $('btnCreate').disabled === false,
        btnQuickConnect: $('btnQuickConnect').disabled === false
      })`);
    },
  };
  return app;
}

/* ============================== IL PEER OSTILE ============================== */

/* Ogni tipo sbagliato che un campo può assumere. Non "qualche" valore strano:
   la lista completa di ciò che JSON può trasportare più le forme che rompono
   i metodi che il codice chiama sui campi (.trim, .startsWith, .slice). */
function wrongTypes(rng){
  const list = [
    {}, [], 0, -1, 1.5, NaN, true, false, null,
    '', ' ', ' ', '\\', '"', "'", '</script>',
    { toString(){ throw new Error('toString ostile'); } },
    { length: 1e9 },
    [[[[[[[[[['annidato']]]]]]]]]],
  ];
  return rng ? rng.pick(list) : list;
}

function hostilePeer(app){
  const { run, sandbox } = app;

  /* Ogni consegna passa da qui, e ogni eccezione diventa un dato invece di
     interrompere la sessione: è la definizione operativa di I3. */
  function deliver(payloadExpr, label){
    try{
      run(`(function(){ onDcMessage(${payloadExpr}); })()`);
      return null;
    }catch(e){
      const rec = { label, error: String(e && e.message || e), stack: String(e && e.stack || '').split('\n').slice(0, 4).join(' | ') };
      app.spies.throws.push(rec);
      return rec;
    }
  }

  return {
    /* JSON arbitrario sul canale dati */
    json(obj, label){
      return deliver(`{ data: ${JSON.stringify(JSON.stringify(obj))} }`, label || ('json:' + (obj && obj.type)));
    },
    /* stringa grezza, anche non-JSON */
    raw(s, label){
      return deliver(`{ data: ${JSON.stringify(String(s))} }`, label || 'raw');
    },
    /* frame binario: header dell'id + carico. len<16 produce un header
       troncato, che è uno dei casi che il codice non ha mai visto. */
    binary(id, bytes, label){
      const idStr = String(id === undefined ? '' : id);
      return deliver(
        `(function(){
           const id = ${JSON.stringify(idStr)};
           const n = ${Number(bytes) || 0};
           const b = new Uint8Array(16 + n);
           const h = new TextEncoder().encode(id.padEnd(16,' ').slice(0,16));
           b.set(h, 0);
           return { data: b.buffer };
         })()`,
        label || ('bin:' + idStr));
    },
    /* header più corto di 16 byte: il decoder assume sempre di averlo intero */
    truncatedBinary(n, label){
      return deliver(`{ data: new Uint8Array(${Number(n) || 0}).buffer }`, label || ('bin-troncato:' + n));
    },
    /* un hello con qualunque nick, incluso unicode ostile */
    hello(nick, extra){
      return this.json(Object.assign({ type: 'hello', nick, fp: 'fp-ostile' }, extra || {}), 'hello');
    },
    /* le sequenze illegali di I9, ognuna un nome che finisce nel report */
    sequences(rng){
      const id = 'seq' + (rng ? rng.int(1e6) : 1);
      return {
        'risposta-prima-offerta': () => this.json({ type: 'call-answer-sdp', sdp: 'garbage' }),
        'offerta-garbage':        () => this.json({ type: 'call-offer-sdp', sdp: 'garbage' }),
        'accept-senza-chiamata':  () => this.json({ type: 'call-accept' }),
        'fine-senza-inizio':      () => this.json({ type: 'file-end', id }),
        'inizio-duplicato':       () => { this.json({ type: 'file-start', id, name: 'a', mime: '', size: 10 });
                                          this.json({ type: 'file-start', id, name: 'b', mime: '', size: 99 }); },
        'chunk-id-ignoto':        () => this.binary('mai-visto', 32),
        'secondo-hello':          () => { this.hello('Primo'); this.hello('Secondo'); },
        'wipe-a-meta':            () => { this.json({ type: 'file-start', id, name: 'a', mime: '', size: 1000 });
                                          this.json({ type: 'wipe' }); },
        'hello-dopo-file':        () => { this.json({ type: 'file-start', id, name: 'a', mime: '', size: 10 });
                                          this.hello('Cambio'); },
      };
    },
    /* I8 in forma di attacco: lo stesso nome per l'occhio, diverso per il dato */
    impersonate(realNick, rng){
      const forms = [
        { how: 'omoglifi',   nick: homoglyphOf(realNick) },
        { how: 'zero-width', nick: withZeroWidth(realNick, rng) },
        { how: 'bidi',       nick: withBidi(realNick, rng) },
        { how: 'spazio-coda', nick: realNick + ' ' },
      ];
      return forms;
    },
    deliver,
  };
}

/* ============================== I VERIFICATORI ==============================
   Restituiscono violazioni, non sollevano: una sessione da 50.000 messaggi
   deve trovarle tutte, non fermarsi alla prima. */

function checkInvariants(app, ctx){
  const v = [];
  const push = (id, dettaglio, extra) => v.push(Object.assign({ id, dettaglio }, extra || {}));
  const S = app.spies;
  const ctxo = ctx || {};

  /* Tutto lo stato in UNA sola traversata del confine fra realm.
     Otto chiamate separate costavano 23 ms l'una — a cinquantamila messaggi
     sono diciannove minuti a sessione, e un verificatore troppo caro per
     essere chiamato spesso finisce per non essere chiamato affatto.
     La camminata di I7 è limitata agli ultimi MAX_SCAN figli di ogni
     contenitore: il DOM cresce a ogni messaggio, e una scansione integrale
     rende il costo quadratico nella lunghezza della sessione. Un marcatore
     iniettato compare in ciò che è stato reso di recente, quindi il limite
     non riduce ciò che si può trovare — solo quanto si paga per trovarlo. */
  const raw = app.run(`(function(){
    const MAX_SCAN = 60;
    let got = 0, pledged = 0, n = 0;
    for (const k in incoming){ got += incoming[k].got; pledged += incoming[k].cap; n++; }
    const contenitori = ['msgs','contactsList','lettersList','healthList','installText','emojiPop'];
    const MARKS = ['<taint', 'onerror="1"'];
    const sporchi = [];
    /* Cercato nodo per nodo, mai concatenando. La prima stesura accumulava
       ogni innerHTML in una stringa sola: con messaggi da dieci megabyte
       diventavano centinaia di megabyte di concatenazione a OGNI verifica, e
       la sessione DIMENSIONI si piantava prima di finire trecento messaggi.
       indexOf su una stringa grande è nativo e istantaneo; costruire quella
       stringa non lo è. */
    for (const idc of contenitori){
      const root = $(idc);
      if (!root) continue;
      let colpito = null;
      const prova = txt => {
        if (colpito || !txt) return;
        const s = String(txt);
        for (const mk of MARKS) if (s.indexOf(mk) !== -1){ colpito = mk; return; }
      };
      prova(root.innerHTML);
      const kids = root.children || [];
      const from = Math.max(0, kids.length - MAX_SCAN);
      const walk = x => { if (colpito) return; prova(x.innerHTML); (x.children || []).forEach(walk); };
      for (let i = from; i < kids.length && !colpito; i++) walk(kids[i]);
      if (colpito) sporchi.push([idc, colpito]);
    }
    return JSON.stringify({
      mem: { got, pledged, n, tot: MAX_INCOMING_TOTAL, max: MAX_OPEN_TRANSFERS },
      vit: {
        busy: busyWithSomeone(),
        inChat: !$('screenChat').classList.contains('hide'),
        dcOpen: !!(dc && dc.readyState === 'open'),
        pcLive: !!(pc && pc.connectionState !== 'closed' && pc.connectionState !== 'failed'),
        btnCreateDisabled: $('btnCreate').disabled,
        btnQuickDisabled: $('btnQuickConnect').disabled,
        dialing: dialing, autoAccepting: autoAccepting, addrPending: addrPending !== null
      },
      sporchi: sporchi
    });
  })()`);
  const st = JSON.parse(raw);

  /* I1 — nessuna fiducia scritta senza conferma umana */
  if (S.writeSafetyRec.length > S.humanConfirm.length){
    push('I1', `writeSafetyRec chiamata ${S.writeSafetyRec.length} volte con ${S.humanConfirm.length} conferme umane`,
         { chiamate: S.writeSafetyRec.slice(-3) });
  }

  /* I2 — memoria trattenuta sotto il tetto aggregato */
  const m = st.mem;
  if (m.got > m.tot) push('I2', `RAM trattenuta ${m.got} oltre il tetto ${m.tot}`);
  if (m.n > m.max) push('I2', `${m.n} trasferimenti aperti, tetto ${m.max}`);

  /* I3 — nessun throw da onDcMessage */
  if (S.throws.length > (ctxo.throwsAttesi || 0)){
    push('I3', `${S.throws.length} eccezioni non gestite`, { ultima: S.throws[S.throws.length - 1] });
  }

  /* I4 — budget letture mailbox */
  if (ctxo.budgetPerMinuto){
    const letture = app.mailbox.readsInWindow(60000);
    if (letture > ctxo.budgetPerMinuto){
      push('I4', `${letture} letture mailbox in 60s, budget ${ctxo.budgetPerMinuto}`);
    }
  }

  /* I5 — vitalità.

     `pcLive` è nell'elenco perché senza di lui questo verificatore grida a
     ogni connessione in costruzione: una pc in stato 'new' o 'connecting'
     rende busyWithSomeone() vero ed è esattamente ciò che deve fare. La
     sordità vera è un'altra cosa — occupato SENZA nulla dietro — e un
     verificatore che non sa distinguerle avrebbe sepolto il report sotto
     cinquantamila falsi positivi. Trovato collaudando l'arnese, non
     ragionandoci sopra. */
  const vit = st.vit;
  if (vit.busy && !vit.inChat && !vit.dcOpen && !vit.pcLive
      && !vit.dialing && !vit.autoAccepting && !vit.addrPending){
    push('I5', 'busyWithSomeone() vero senza alcuna conversazione né tentativo in corso', vit);
  }
  if (vit.btnCreateDisabled && !vit.busy) push('I5', 'btnCreate disabilitato senza nulla in corso', vit);
  if (vit.btnQuickDisabled && !vit.busy) push('I5', 'btnQuickConnect disabilitato senza nulla in corso', vit);

  /* I7 — nessun marcatore grezzo dentro innerHTML */
  for (const [idc, mark] of st.sporchi){
    push('I7', `marcatore non filtrato "${mark}" dentro #${idc}`);
  }

  /* I13 — identificatori dal peer usati come chiavi senza limite */
  if (ctxo.maxIdLen){
    const troppo = S.mediaPut.filter(p => p.len > ctxo.maxIdLen);
    if (troppo.length) push('I13', `id da ${troppo[troppo.length-1].len} caratteri usato come chiave di storage`);
  }

  /* I12 — con l'autodistruzione armata, niente tocca il disco */
  const scrittureArmate = S.mediaPut.filter(p => p.armed);
  if (scrittureArmate.length){
    push('I12', `${scrittureArmate.length} scritture media su disco con destructArmed vero`,
         { esempio: scrittureArmate[0] });
  }

  return v;
}

/* I10 — confronto fra due istantanee: cosa è sopravvissuto a una sessione */
function residui(prima, dopo){
  const a = JSON.parse(prima), b = JSON.parse(dopo);
  const out = [];
  for (const k of Object.keys(a)){
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push({ campo: k, prima: a[k], dopo: b[k] });
  }
  return out;
}

module.exports = {
  SOURCE,
  mulberry32, rngKit,
  loadHostile, hostilePeer, checkInvariants, residui,
  makeMailbox, makeClock,
  HOMOGLYPHS, ZERO_WIDTH, BIDI_CONTROLS,
  homoglyphOf, withZeroWidth, withBidi,
  TAINT, TAINT_MARKS, taint, wrongTypes,
};
