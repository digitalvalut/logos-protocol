/* ============================================================================
   LA BATTERIA — Fase F.

   Le prove che vengono lanciate contro ogni mutante. Ognuna è una domanda
   secca su un comportamento, non su una riga di codice: è ciò che le rende
   capaci di uccidere un mutante che nessuno aveva previsto.

   Ogni prova restituisce `true` se ha VISTO qualcosa che non va. Contro la
   sorgente sana devono tacere tutte — quello è il controllo negativo, ed è
   la metà che di solito manca.
   ========================================================================= */

'use strict';

const H = require('./hostile.js');
const W = require('./worker-harness.js');

const attesa = ms => new Promise(r => setTimeout(r, ms));

/* Un'app costruita dalla sorgente data, con le due funzioni asincrone
   neutralizzate perché i rami interessanti si raggiungano davvero. */
function app(sorgente, extra){
  const a = H.loadHostile({ sorgente });
  a.run(`
    showConnectedFlash = function(){ return Promise.resolve(); };
    ${extra || ''}
  `);
  return a;
}

const PROVE = {

  /* ---- I1: nessuna fiducia senza conferma umana ---- */
  async 'fiducia-da-link-vouch'(sorgente){
    const a = app(sorgente, `
      showSasPanel = function(){ return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      scannedFp = 'abcdef01';
    `);
    await a.run('checkSafetyFor("Marco")');
    await attesa(10);
    const scritte = a.spies.writeSafetyRec.length;
    const conferme = a.spies.humanConfirm.length;
    a.stop();
    return scritte > conferme;
  },

  async 'fiducia-da-indirizzo-provato'(sorgente){
    const a = app(sorgente, `
      showSasPanel = function(){ return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      dialedAddress = 'AAAABBBBCCCC'; dialedAddrProven = true;
      sysLine = function(){};
    `);
    await a.run('checkSafetyFor("Marco")');
    await attesa(10);
    const scritte = a.spies.writeSafetyRec.length;
    const conferme = a.spies.humanConfirm.length;
    a.stop();
    return scritte > conferme;
  },

  /* ---- I2: memoria limitata in aggregato ---- */
  async 'memoria-aggregata'(sorgente){
    const a = app(sorgente, `checkSafetyFor = function(){ return Promise.resolve(); };`);
    a.run(`
      for (let i = 0; i < MAX_OPEN_TRANSFERS; i++)
        onDcMessage({ data: JSON.stringify({ type:'file-start', id:'g'+i, name:'f', size: MAX_INCOMING_BYTES }) });
    `);
    const promesso = a.run(`(function(){ let n=0; for (const k in incoming) n += incoming[k].cap; return n; })()`);
    const tetto = a.run('MAX_INCOMING_TOTAL');
    a.stop();
    return promesso > tetto;
  },

  /* ---- I2/I5: i trasferimenti fermi non devono intasare ---- */
  async 'trasferimenti-intasati'(sorgente){
    const a = app(sorgente, `checkSafetyFor = function(){ return Promise.resolve(); };`);
    a.run(`
      for (let i = 0; i < MAX_OPEN_TRANSFERS; i++)
        onDcMessage({ data: JSON.stringify({ type:'file-start', id:'z'+i, name:'f', size: 10 }) });
      for (const k in incoming) incoming[k].lastAt = Date.now() - (TRANSFER_IDLE_MS + 1000);
      onDcMessage({ data: JSON.stringify({ type:'file-start', id:'nuovo', name:'vero.jpg', size: 10 }) });
    `);
    const rifiutato = a.run(`!incoming['nuovo']`);
    a.stop();
    return rifiutato;
  },

  /* ---- I10: niente sopravvive alla fine della conversazione ---- */
  async 'residui-dopo-endSession'(sorgente){
    const a = app(sorgente, `checkSafetyFor = function(){ return Promise.resolve(); };`);
    a.run(`
      onDcMessage({ data: JSON.stringify({ type:'file-start', id:'meta', name:'g.mp4', size: 300000000 }) });
      endSession();
    `);
    const rimasti = a.run('Object.keys(incoming).length');
    a.stop();
    return rimasti > 0;
  },

  /* ---- I4: il pump non deve sopravvivere a un fallimento ---- */
  async 'pump-superstite'(sorgente){
    const a = app(sorgente, `
      addrDialSecrets = function(){ return Promise.resolve({ key:{}, seed:'s', slot:0 }); };
      myAddress = function(){ return Promise.resolve('ZZZZZZZZZZZZ'); };
      sealWith = function(){ throw new Error('guasto'); };
    `);
    a.run(`window.__p = Promise.resolve(dialAddress('AAAABBBBCCCC')).catch(function(){});`);
    await a.run('window.__p');
    await attesa(40);
    const vivo = a.run('quickPump !== null');
    a.stop();
    return vivo;
  },

  /* ---- I3: un nick strano non deve far sparire la verifica ---- */
  async 'nick-ostile-sopprime-verifica'(sorgente){
    const a = app(sorgente, `
      window.__ver = 0;
      checkSafetyFor = function(){ window.__ver++; return Promise.resolve(); };
      pc = new RTCPeerConnection();
    `);
    const peer = H.hostilePeer(a);
    peer.json({ type: 'hello', nick: {} });
    peer.json({ type: 'hello' });
    await attesa(10);
    const verifiche = a.run('window.__ver');
    const eccezioni = a.spies.throws.length;
    a.stop();
    return verifiche < 2 || eccezioni > 0;
  },

  /* ---- I9: un'offerta di chiamata guasta non deve lasciare una chiamata finta ---- */
  async 'offerta-chiamata-senza-guardia'(sorgente){
    const a = app(sorgente, ``);
    let noncatturata = false;
    const h = e => { noncatturata = true; };
    process.on('unhandledRejection', h);
    a.run(`
      pc = { setRemoteDescription: function(){ return Promise.reject(new Error('sdp illeggibile')); },
             createAnswer: function(){ return Promise.resolve({}); },
             setLocalDescription: function(){ return Promise.resolve(); },
             localDescription: { sdp: '' } };
      dc = { readyState:'open', send: function(){} };
      callState = 'active'; callKind = 'audio';
      onCallOfferSdp('garbage');
    `);
    await attesa(40);
    process.removeListener('unhandledRejection', h);
    const ancoraAttiva = a.run(`callState === 'active'`);
    a.stop();
    return noncatturata || ancoraAttiva;
  },

  /* ---- I5: nessun falso allarme MITM per un'azione normale ----
     La prima stesura guardava l'EFFETTO — il pannello rosso mostrato alla
     connessione successiva — e taceva, perché in sessanta millisecondi il
     ciclo d'attesa di dialAddress non arriva nemmeno a girare una volta.
     Un punto cieco dell'arnese, non del codice. Qui si guarda l'invariante
     alla fonte: uscendo per soppiantazione, `dialedAddress` deve essere
     azzerato. Se resta, il falso allarme è solo questione di tempo. */
  async 'dialed-non-azzerato'(sorgente){
    const a = app(sorgente, `
      showSasPanel = function(){ return Promise.resolve(); };
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abcdef0123456789'; };
      addrDialSecrets = function(){ return Promise.resolve({ key:{}, seed:'s', slot:0 }); };
      addrWakeSecrets = function(){ return Promise.resolve({ key:{}, seed:'w' }); };
      myAddress = function(){ return Promise.resolve('ZZZZZZZZZZZZ'); };
      sysLine = function(){};
      /* Senza questi due la cifratura vera lavora su una chiave finta,
         solleva, e dialAddress finisce nel proprio catch — che azzera
         dialedAddress e fa TACERE la prova: il percorso di soppiantazione
         non veniva mai raggiunto. Il mutante sopravviveva per questo, non
         perché il difetto fosse invisibile. */
      sealWith = function(sec, obj){ return Promise.resolve({ i:'iv', c: JSON.stringify(obj) }); };
      openFrom = function(key, env){ try{ return Promise.resolve(JSON.parse(env.c)); }catch(e){ return Promise.resolve(null); } };
      window.__p = Promise.resolve(dialAddress('AAAABBBBCCCC')).catch(function(){});
    `);
    await attesa(80);
    const partito = a.run(`dialedAddress !== null`);
    if (!partito){ a.stop(); return false; }   /* non è nemmeno decollato: niente da dire */
    /* la soppiantazione che un utente produce toccando un contatto */
    a.run(`$('screenChat').classList.remove('hide');`);
    await attesa(700);                          /* un giro del ciclo d'attesa */
    const restato = a.run(`dialedAddress !== null`);
    a.stop();
    return restato;
  },

  /* ---- I8/M5: un impostore non deve prendere il posto di un contatto ---- */
  async 'rubrica-dirottata'(sorgente){
    const a = app(sorgente, ``);
    a.run(`
      touchContact('Mamma', 'fp-vera', null, 'DV-AAAA-BBBB-CCCC');
      touchContact('Mamma', 'fp-impostore', null, 'DV-ZZZZ-ZZZZ-ZZZZ');
    `);
    const vera = JSON.parse(a.run(`JSON.stringify(loadContacts().filter(function(c){ return c.fp === 'fp-vera'; }))`));
    a.stop();
    return vera.length === 0 || vera[0].addr !== 'DV-AAAA-BBBB-CCCC';
  },

  /* ---- l'avviso di memoria piena deve potersi spegnere ---- */
  async 'avviso-memoria-bloccato'(sorgente){
    const a = app(sorgente, ``);
    a.run(`historyBroken = true; saveToHistory('Marco', 'ciao<div class="meta">10:00</div>', true);`);
    const ancora = a.run('historyBroken');
    a.stop();
    return ancora === true;
  },

  /* ---- I11: i media devono sopravvivere, e devono morire quando si cancella ---- */
  async 'media-non-conservati'(sorgente){
    const a = app(sorgente, `
      checkSafetyFor = function(){ return Promise.resolve(); };
      peerNick = 'Marco';
      window.__put = 0;
      mediaPut = function(){ window.__put++; return Promise.resolve(); };
    `);
    a.run(`
      onDcMessage({ data: JSON.stringify({ type:'file-start', id:'p1', name:'f.jpg', mime:'image/jpeg', size:3 }) });
      const b = new Uint8Array(19);
      new TextEncoder().encode('p1'.padEnd(16,' ')).forEach(function(x,i){ b[i]=x; });
      onDcMessage({ data: b.buffer });
      onDcMessage({ data: JSON.stringify({ type:'file-end', id:'p1' }) });
    `);
    const messi = a.run('window.__put');
    a.stop();
    return messi === 0;
  },

  async 'media-sopravvivono-alla-cancellazione'(sorgente){
    /* Non basta che QUALCOSA venga cancellato: deve essere cancellata la
       chiave sotto cui il media è stato davvero scritto. Contare le chiamate
       lasciava passare un mutante che ne toglieva una delle due. */
    const a = app(sorgente, `
      peerNick = 'Marco';
      window.__scritte = [];
      window.__del = [];
      mediaPut = function(k){ window.__scritte.push(k); return Promise.resolve(); };
      mediaDeleteByConv = function(k){ window.__del.push(k); return Promise.resolve(); };
      persistMedia('Marco', 'x1', {});
      forgetHistoryFor('Marco');
    `);
    const scritte = JSON.parse(a.run('JSON.stringify(window.__scritte)'));
    const cancellate = JSON.parse(a.run('JSON.stringify(window.__del)'));
    a.stop();
    if (!scritte.length) return false;            /* non ha scritto: è il mutante M12, non questo */
    return scritte.some(k => cancellate.indexOf(k) === -1);
  },
};

/* --------------------------------------------------------- prove del Worker */
const PROVE_WORKER = {
  async 'calpestio-slot'(sorgente){
    const w = W.caricaWorker({ sorgente });
    const v = await W.chiaveVera(), att = await W.chiaveVera();
    const slot = await W.slotLegittimo(w, v.p, 0);
    const r = await w.chiama('PUT', '/key/' + slot, { body: JSON.stringify({ p: att.p, n: 0 }) });
    return r.status !== 403;
  },
  async 'cassetta-rileggibile'(sorgente){
    const w = W.caricaWorker({ sorgente });
    const slot = 'c'.repeat(64);
    await w.chiama('PUT', '/mailbox/' + slot, { body: JSON.stringify({ i:'iv', c:'x' }) });
    await w.chiama('GET', '/mailbox/' + slot);
    return (await w.chiama('GET', '/mailbox/' + slot)).status === 200;
  },
  async 'origine-non-filtrata'(sorgente){
    const w = W.caricaWorker({ sorgente });
    return (await w.chiama('GET', '/turn', { origin: 'https://attaccante.example' })).status !== 403;
  },
  async 'frequenza-illimitata'(sorgente){
    const w = W.caricaWorker({ sorgente });
    let ok = 0;
    for (let i = 0; i < 400; i++){
      if ((await w.chiama('GET', '/mailbox/' + '9'.repeat(64), { ip: '198.51.100.99' })).status !== 429) ok++;
    }
    return ok > 320;
  },
};

module.exports = { PROVE, PROVE_WORKER };
