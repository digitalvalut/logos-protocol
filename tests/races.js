/* ============================================================================
   CORSE DETERMINISTICHE — Fase D.

   Il fuzzing trova ciò che capita; questo trova ciò che è raro per costruzione.
   Ogni funzione che apre una connessione attraversa una decina di attese, e
   fra un'attesa e l'altra l'utente può fare qualunque cosa. Le guardie
   `pc !== myPc` sparse nel codice difendono i punti che qualcuno ha pensato;
   qui si prova OGNI punto, uno per uno, senza sceglierli.

   Due modi di rompere, alla N-esima attesa di una funzione:
     'solleva'   — un'eccezione. Domanda: l'uscita lascia l'app usabile?
     'soppianta' — un'altra connessione prende il posto della globale.
                   Domanda: la risposta pubblicata appartiene a chi ha
                   pubblicato l'offerta? (I6)

   Nessuna crittografia vera: `addrDialSecrets` e compagne sono stubbate. Qui
   si misura il FLUSSO DI CONTROLLO, e dirlo fa parte del risultato.
   ========================================================================= */

'use strict';

const H = require('./hostile.js');

/* Le giunture: ogni funzione asincrona che le sei procedure attendono.
   Prese leggendo i loro corpi, non indovinate — una giuntura mancante è un
   punto di rottura che questo strumento non saprebbe mai provare. */
const GIUNTURE = [
  'newPeerConnection', 'myFingerprintHex', 'myAddress', 'myKeyPair',
  'pairKey', 'pairSecrets', 'slotId',
  'mailboxGet', 'mailboxPut', 'mailboxGetSealed', 'mailboxPutSealed',
  'wakeGet', 'wakeGetSealed', 'wakePut',
  'sealWith', 'sealFor', 'openFrom',
  'addrDialSecrets', 'addrWakeSecrets', 'addrSlotSeed',
  'sealOrEncodeOffer', 'quickSecrets', 'fetchIceServers',
];

/* Prepara un'app con le dipendenze pesanti stubbate e le giunture contate.
   `window.__tw` è il tripwire: quando il contatore arriva a `at`, scatta. */
function armaApp(opts){
  const o = opts || {};
  const app = H.loadHostile();

  app.sandbox.__twState = { n: 0, at: o.at || 0, mode: o.mode || 'solleva', scattato: false, log: [] };

  app.run(`
    /* ---- stub delle dipendenze crittografiche ----
       Restituiscono la FORMA giusta senza fare il lavoro: qui si misura dove
       va il controllo, non se AES funziona. Dichiarato nel report. */
    addrDialSecrets = function(addr){ return Promise.resolve({ key: {}, seed: 'seed-' + addr, slot: 0 }); };
    addrWakeSecrets = function(addr){ return Promise.resolve({ key: {}, seed: 'wake-' + addr }); };
    addrSlotSeed    = function(addr){ return Promise.resolve('slot-' + addr); };
    pairSecrets     = function(s){ return Promise.resolve({ key: {}, seed: 'pair-' + s }); };
    quickSecrets    = function(){ return Promise.resolve({ key: {}, seed: 'quick' }); };
    sealWith        = function(sec, obj){ return Promise.resolve({ i: 'iv', c: JSON.stringify(obj) }); };
    sealFor         = function(key, obj){ return Promise.resolve({ i: 'iv', c: JSON.stringify(obj) }); };
    openFrom        = function(key, env){ try{ return Promise.resolve(JSON.parse(env.c)); }catch(e){ return Promise.resolve(null); } };
    myFingerprintHex= function(){ return Promise.resolve('aabbccdd'); };
    myAddress       = function(){ return Promise.resolve('AAAABBBBCCCC'); };
    fetchIceServers = function(){ return Promise.resolve([]); };

    /* ---- ogni connessione riconoscibile ----
       La pc finta produce sempre lo stesso sdp: con descrizioni identiche
       non si può dire QUALE connessione è stata pubblicata, che è tutta la
       domanda di I6. Ognuna riceve un numero e se lo porta nell'sdp. */
    window.__pcSeq = 0;
    const _npc = newPeerConnection;
    newPeerConnection = async function(){
      const p = await _npc.apply(this, arguments);
      p.__id = ++window.__pcSeq;
      const _sld = p.setLocalDescription.bind(p);
      p.setLocalDescription = function(d){
        const r = _sld(d);
        p.localDescription = { sdp: 'v=0 CONN' + p.__id + '\\r\\n' };
        return r;
      };
      return p;
    };

    /* ---- il tripwire ----
       Avvolge ogni giuntura: conta, e alla N-esima o solleva o soppianta.
       'soppianta' costruisce una connessione nuova e la mette nella globale,
       che è esattamente ciò che fa l'utente toccando un contatto mentre un
       invito è a metà strada. */
    window.__wrapSeam = function(nome){
      const orig = window[nome];
      if (typeof orig !== 'function') return false;
      window[nome] = function(){
        const st = window.__twState;
        st.n++;
        st.log.push(nome);
        if (st.at && st.n === st.at && !st.scattato){
          st.scattato = true;
          st.giuntura = nome;
          if (st.mode === 'solleva'){
            throw new Error('tripwire: rottura alla giuntura ' + nome + ' (#' + st.n + ')');
          }
          if (st.mode === 'soppianta'){
            const rimpiazzo = { __id: 9000, connectionState: 'new', signalingState: 'stable',
                                localDescription: { sdp: 'v=0 INTRUSA\\r\\n' },
                                createDataChannel(){ return { readyState:'connecting', send(){}, close(){}, addEventListener(){} }; },
                                createOffer(){ return Promise.resolve({ type:'offer', sdp:'v=0 INTRUSA\\r\\n' }); },
                                createAnswer(){ return Promise.resolve({ type:'answer', sdp:'v=0 INTRUSA\\r\\n' }); },
                                setLocalDescription(){ return Promise.resolve(); },
                                setRemoteDescription(){ return Promise.resolve(); },
                                addIceCandidate(){ return Promise.resolve(); },
                                getStats(){ return Promise.resolve(new Map()); },
                                addEventListener(){}, close(){ this.connectionState='closed'; } };
            pc = rimpiazzo;
          }
        }
        return orig.apply(this, arguments);
      };
      return true;
    };
    window.__avvolte = ${JSON.stringify(GIUNTURE)}.filter(window.__wrapSeam);
  `);

  return app;
}

/* Le sei procedure che aprono una connessione, con il minimo indispensabile
   perché partano davvero. Se una parte e torna subito, non sta misurando
   niente: il campo `giunture` nel risultato lo rende visibile. */
const PROCEDURE = {
  dialAddress: {
    prepara: `myAddress = function(){ return Promise.resolve('ZZZZZZZZZZZZ'); };`,
    invoca:  `dialAddress('AAAABBBBCCCC');`,
  },
  acceptAddrCall: {
    prepara: `addrPending = { msg: { sdp: 'v=0 REMOTA', rid: 'r1', nick: 'X' }, sec: { key:{}, seed:'s' }, slot: 0 };`,
    invoca:  `acceptAddrCall();`,
  },
  acceptIncomingAutoOffer: {
    prepara: `window.__c = { nick:'Marco', fp:'fp-marco' };`,
    invoca:  `acceptIncomingAutoOffer(window.__c, { sdp: 'v=0 REMOTA' }, { key:{}, seed:'s' });`,
  },
  tryAutoReconnectInner: {
    prepara: `window.__c = { nick:'Marco', fp:'fp-marco' };`,
    invoca:  `tryAutoReconnect(window.__c);`,
  },
  tryQuickConnect: {
    prepara: `$('quickCodeIn').value = '123456';`,
    invoca:  `tryQuickConnect();`,
  },
  startQuickShare: {
    prepara: ``,
    invoca:  `startQuickShare();`,
  },
};

/* ---- le eccezioni che nessuno aspetta ----
   Il tripwire scatta anche dentro percorsi che la procedura in prova ha solo
   AVVIATO senza attendere — `showScreen` riaccende il polling della cassetta
   e non ne aspetta l'esito, quindi un errore là dentro non ha nessuno che lo
   raccolga e in Node uccide il processo. Ucciderlo sarebbe perdere il dato:
   quella è una eccezione non gestita, cioè esattamente ciò che l'audit deve
   contare. Raccolte qui e attribuite alla prova in corso. */
const globali = [];
process.on('uncaughtException', e => globali.push({ tipo: 'uncaught', msg: String(e && e.message || e) }));
process.on('unhandledRejection', e => globali.push({ tipo: 'unhandled', msg: String(e && e.message || e) }));

/* Una singola prova: rompi alla giuntura N e guarda cosa resta. */
function prova(nome, at, mode){
  const p = PROCEDURE[nome];
  globali.length = 0;
  const app = armaApp({ at, mode });
  app.run(p.prepara);
  let erroreSincrono = null;
  try{
    /* `conclusa` è l'unica cosa che rende leggibile tutto il resto: una
       procedura ANCORA IN VOLO ha legittimamente il pump acceso, `dialing`
       vero e il pulsante spento — è esattamente ciò che deve avere mentre
       lavora. Solo quando la promessa si è chiusa quei residui diventano
       residui. Senza questa distinzione lo strumento segnala come difetto
       il funzionamento normale, che è il modo più rapido di rendere
       inutile un audit. */
    app.run(`
      window.__conclusa = false;
      window.__r = (function(){ try{ return ${p.invoca} }catch(e){ return Promise.reject(e); } })();
      if (window.__r && window.__r.then) window.__r.then(function(){ window.__conclusa = true; },
                                                          function(){ window.__conclusa = true; });
      else window.__conclusa = true;
    `);
  }catch(e){ erroreSincrono = String(e.message || e); }

  return new Promise(r => setTimeout(r, 30)).then(() => {
    const st = JSON.parse(app.run(`JSON.stringify({
      conclusa: window.__conclusa,
      giunture: __twState.n,
      scattato: __twState.scattato,
      giuntura: __twState.giuntura || null,
      avvolte: __avvolte.length,
      btnCreate: $('btnCreate').disabled,
      btnQuick: $('btnQuickConnect').disabled,
      pumpVivo: quickPump !== null,
      busy: busyWithSomeone(),
      dialing: dialing,
      autoAccepting: autoAccepting,
      quickConnecting: (typeof quickConnecting === 'undefined') ? false : quickConnecting,
      addrPending: addrPending !== null,
      inChat: !$('screenChat').classList.contains('hide')
    })`));
    /* Quale descrizione è finita nella cassetta: è la domanda di I6 */
    const pubblicati = app.mailbox.calls
      .filter(c => c.method === 'PUT')
      .map(c => { const b = String(c.body || ''); const m = b.match(/CONN(\d+)|INTRUSA/); return m ? m[0] : '?'; });
    app.stop();
    return { nome, at, mode, erroreSincrono, ...st, pubblicati, globali: globali.slice() };
  });
}

/* Le proprietà che devono valere a OGNI uscita, comunque si sia rotta. */
function verdetto(r){
  const problemi = [];
  /* Niente da giudicare finché la procedura non ha finito: vedi la nota
     sopra `conclusa`. Restituire l'elenco vuoto qui non è indulgenza, è
     l'unico verdetto onesto su un lavoro ancora in corso. */
  if (!r.conclusa) return problemi;
  if (r.btnCreate) problemi.push('btnCreate resta disabilitato');
  if (r.btnQuick) problemi.push('btnQuickConnect resta disabilitato');
  if (r.pumpVivo) problemi.push('pump della cassetta ancora vivo');
  if (!r.inChat && r.busy && !r.dialing && !r.autoAccepting && !r.addrPending)
    problemi.push('busyWithSomeone() vero senza nulla in corso');
  if (r.dialing) problemi.push('dialing resta vero');
  if (r.autoAccepting) problemi.push('autoAccepting resta vero');
  if (r.quickConnecting) problemi.push('quickConnecting resta vero');
  /* I6: mescolare descrizioni di connessioni diverse è la classe delle
     supersessioni. Più di una identità pubblicata nella stessa prova
     significa che due connessioni hanno scritto sulla stessa cassetta. */
  const identita = new Set(r.pubblicati.filter(x => x !== '?'));
  if (identita.size > 1) problemi.push('descrizioni di connessioni diverse pubblicate: ' + [...identita].join('+'));
  if (r.mode === 'soppianta' && identita.has('INTRUSA'))
    problemi.push('la connessione intrusa ha pubblicato la propria descrizione');
  for (const g of (r.globali || []))
    problemi.push('eccezione non raccolta (' + g.tipo + '): ' + g.msg.slice(0, 80));
  return problemi;
}

/* Sweep completo su una procedura. */
async function sweep(nome, maxN, mode){
  const out = [];
  for (let at = 1; at <= maxN; at++){
    const r = await prova(nome, at, mode);
    r.problemi = verdetto(r);
    out.push(r);
    if (r.giunture < at) break;   /* oltre l'ultima attesa: inutile continuare */
  }
  return out;
}

module.exports = { armaApp, prova, sweep, verdetto, PROCEDURE, GIUNTURE };
