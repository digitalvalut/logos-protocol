/* ============================================================================
   AUDIT OSTILE — collaudo dell'arnese (Fase B).

   Questi non sono i test dell'audit: sono i test DELL'ARNESE. Prima di
   credere a una sessione di fuzzing che dice "nessuna violazione", bisogna
   sapere che quell'arnese sa vedere una violazione quando c'è. Un fuzzer che
   non trova mai niente e un fuzzer rotto danno lo stesso identico output.

   Ognuno qui sotto verifica un pezzo dell'attrezzatura mettendogli davanti
   qualcosa che DEVE far scattare, e qualcosa che non deve.
   ========================================================================= */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const H = require('./hostile.js');

test.describe('arnese: il generatore deterministico', () => {

  test('lo stesso seed produce la stessa sequenza, seed diversi no', () => {
    const a = H.rngKit(12345), b = H.rngKit(12345), c = H.rngKit(999);
    const seqA = [], seqB = [], seqC = [];
    for (let i = 0; i < 50; i++){ seqA.push(a.int(1000)); seqB.push(b.int(1000)); seqC.push(c.int(1000)); }
    assert.deepStrictEqual(seqA, seqB,
      'senza riproducibilità un crash trovato al messaggio 43.712 è un aneddoto, non un finding');
    assert.notDeepStrictEqual(seqA, seqC);
  });

  test('la distribuzione non è degenere', () => {
    const r = H.rngKit(7);
    const visti = new Set();
    for (let i = 0; i < 500; i++) visti.add(r.int(100));
    assert.ok(visti.size > 50, `solo ${visti.size} valori distinti su 100: il PRNG non esplora`);
  });
});

test.describe('arnese: orologio e mailbox finta', () => {

  test('il tempo avanza solo quando lo dico io', () => {
    const app = H.loadHostile();
    const t0 = app.run('Date.now()');
    app.clock.advance(60000);
    const t1 = app.run('Date.now()');
    assert.strictEqual(t1 - t0, 60000,
      'senza orologio controllato I4 non è misurabile: un test che gira in 20ms vede sempre zero richieste al minuto');
    app.stop();
  });

  test('la mailbox conta le letture e le data sull\'orologio finto', async () => {
    const app = H.loadHostile();
    await app.run("mailboxGet('chiave-a')");
    await app.run("mailboxGet('chiave-b')");
    assert.strictEqual(app.mailbox.countBy('mailbox', 'GET'), 2);
    assert.strictEqual(app.mailbox.readsInWindow(60000), 2);
    app.clock.advance(120000);
    assert.strictEqual(app.mailbox.readsInWindow(60000), 0,
      'la finestra deve scorrere col tempo finto, altrimenti misura la vita del processo');
    app.stop();
  });

  test('la mailbox finta è a lettura unica come quella vera', async () => {
    const app = H.loadHostile();
    await app.run("mailboxPut('k1', { sdp: 'x' })");
    const primo = await app.run("mailboxGet('k1')");
    const secondo = await app.run("mailboxGet('k1')");
    assert.ok(primo, 'la prima lettura deve trovare quello che è stato messo');
    assert.strictEqual(secondo, null,
      'una mailbox finta che rilegge nasconderebbe proprio i bug di rilettura che I6 cerca');
    app.stop();
  });

  test('il 429 arriva davvero al client e accende il freno', async () => {
    const app = H.loadHostile();
    app.mailbox.state.status = 429;
    await app.run("mailboxGet('k')");
    assert.strictEqual(app.run('mailboxThrottled'), true,
      'senza questo, provare I4 sotto throttling sarebbe teatro');
    app.stop();
  });
});

test.describe('arnese: il peer ostile consegna davvero', () => {

  test('un hello ostile arriva fino allo stato dell\'app', () => {
    const app = H.loadHostile();
    app.run(`checkSafetyFor = function(){ return Promise.resolve(); };
             showConnectedFlash = function(){ return Promise.resolve(); };
             pc = new RTCPeerConnection();`);
    const peer = H.hostilePeer(app);
    peer.hello('Ostile');
    assert.strictEqual(app.run('peerNick'), 'Ostile',
      'se il peer non riesce nemmeno a farsi sentire, tutto il resto dell\'audit misura il nulla');
    app.stop();
  });

  test('un frame binario con header troncato viene consegnato senza che l\'arnese si rompa', () => {
    const app = H.loadHostile();
    const peer = H.hostilePeer(app);
    const esito = peer.truncatedBinary(3);
    assert.ok(esito === null || typeof esito.error === 'string',
      'l\'arnese deve registrare l\'esito, mai propagare');
    app.stop();
  });

  test('un\'eccezione dell\'app diventa un dato, non interrompe la sessione', () => {
    const app = H.loadHostile();
    /* rottura deliberata, per vedere se la rete acchiappa: se questa non
       viene registrata, ogni futuro "zero violazioni di I3" è privo di valore */
    app.run(`onDcMessage = function(){ throw new Error('crash finto'); };`);
    const peer = H.hostilePeer(app);
    const esito = peer.json({ type: 'hello' });
    assert.ok(esito && esito.error.indexOf('crash finto') !== -1,
      'un crash non gestito deve diventare un record di I3, non fermare il fuzzing');
    assert.strictEqual(app.spies.throws.length, 1);
    app.stop();
  });

  test('le sequenze illegali di I9 sono tutte eseguibili', () => {
    const app = H.loadHostile();
    app.run(`checkSafetyFor = function(){ return Promise.resolve(); };
             showConnectedFlash = function(){ return Promise.resolve(); };
             pc = new RTCPeerConnection();`);
    const peer = H.hostilePeer(app);
    const seqs = peer.sequences(H.rngKit(1));
    const nomi = Object.keys(seqs);
    assert.ok(nomi.length >= 9, `solo ${nomi.length} sequenze illegali definite`);
    for (const nome of nomi) seqs[nome]();   /* nessuna deve propagare */
    app.stop();
  });
});

test.describe('arnese: i verificatori vedono le violazioni', () => {

  test('I1 scatta se la fiducia viene scritta senza conferma umana', () => {
    const app = H.loadHostile();
    app.run(`writeSafetyRec('dvlogos-safety-fp-abc', '11111 22222');`);
    const v = H.checkInvariants(app);
    assert.ok(v.some(x => x.id === 'I1'),
      'il verificatore di I1 non vede una scrittura di fiducia non confermata: tutto l\'audit su H1 sarebbe cieco');
    app.stop();
  });

  test('I1 tace quando la conferma umana c\'è stata', () => {
    const app = H.loadHostile();
    app.run(`
      computeSafetyCode = function(){ return Promise.resolve('11111 22222'); };
      remoteFpHex = function(){ return 'abc'; };
      acceptNewSafety();
    `);
    return new Promise(r => setTimeout(r, 10)).then(() => {
      const v = H.checkInvariants(app);
      assert.ok(!v.some(x => x.id === 'I1'),
        'un verificatore che grida sempre è rumore: deve tacere quando la regola è rispettata');
      app.stop();
    });
  });

  test('I3 scatta su un\'eccezione, tace senza', () => {
    const app = H.loadHostile();
    assert.ok(!H.checkInvariants(app).some(x => x.id === 'I3'));
    app.spies.throws.push({ label: 'finto', error: 'boom' });
    assert.ok(H.checkInvariants(app).some(x => x.id === 'I3'));
    app.stop();
  });

  test('I7 vede un marcatore che è arrivato a innerHTML senza filtro', () => {
    const app = H.loadHostile();
    app.run(`$('msgs').innerHTML = ${JSON.stringify('ciao ' + H.TAINT)};`);
    const v = H.checkInvariants(app);
    assert.ok(v.some(x => x.id === 'I7'),
      'la prova per contaminazione è tutto ciò che separa I7 da un\'ispezione a occhio');
    app.stop();
  });

  test('I7 tace quando lo stesso testo è passato da esc()', () => {
    const app = H.loadHostile();
    app.run(`$('msgs').innerHTML = esc(${JSON.stringify('ciao ' + H.TAINT)});`);
    const v = H.checkInvariants(app);
    assert.ok(!v.some(x => x.id === 'I7'),
      'esc() trasforma il marcatore: se il verificatore scattasse comunque, sarebbe inutilizzabile');
    app.stop();
  });

  test('I4 scatta quando le letture superano il budget dichiarato', async () => {
    const app = H.loadHostile();
    for (let i = 0; i < 12; i++) await app.run(`mailboxGet('k${i}')`);
    const v = H.checkInvariants(app, { budgetPerMinuto: 10 });
    assert.ok(v.some(x => x.id === 'I4'), '12 letture con budget 10 devono essere viste');
    assert.ok(!H.checkInvariants(app, { budgetPerMinuto: 100 }).some(x => x.id === 'I4'));
    app.stop();
  });

  test('I2 scatta se i trasferimenti aperti superano il tetto', () => {
    const app = H.loadHostile();
    /* forzato a mano nello stato: qui si collauda il verificatore, non il codice */
    app.run(`for (let i = 0; i < 30; i++) incoming['x'+i] = { got: 0, cap: 1, chunks: [], meta: {}, lastAt: Date.now(), xfer: { fail(){}, paint(){}, finish(){} } };`);
    const v = H.checkInvariants(app);
    assert.ok(v.some(x => x.id === 'I2'), '30 trasferimenti aperti con tetto 20 devono essere visti');
    app.stop();
  });

  test('I10 elenca i residui fra due istantanee, e non inventa differenze', () => {
    const app = H.loadHostile();
    const prima = app.snapshot();
    assert.deepStrictEqual(H.residui(prima, app.snapshot()), [],
      'due istantanee identiche non devono produrre residui');
    app.run(`peerNick = 'Marco'; dialedAddress = 'AAAABBBBCCCC';`);
    const dopo = app.snapshot();
    const r = H.residui(prima, dopo);
    assert.ok(r.some(x => x.campo === 'peerNick'), 'un residuo reale deve comparire');
    assert.ok(r.some(x => x.campo === 'dialedAddress'));
    app.stop();
  });
});

test.describe('arnese: unicode ostile', () => {

  test('un omoglifo è visivamente identico e diverso come dato', () => {
    const finto = H.homoglyphOf('Mamma');
    assert.notStrictEqual(finto, 'Mamma', 'deve essere una stringa diversa');
    assert.strictEqual(finto.length, 'Mamma'.length, 'e lunga uguale, o non ingannerebbe nessuno');
    assert.ok(/[Ѐ-ӿ]/.test(finto), 'deve contenere caratteri cirillici');
  });

  test('zero-width e bidi restano invisibili ma cambiano il dato', () => {
    const z = H.withZeroWidth('Mamma');
    assert.notStrictEqual(z, 'Mamma');
    assert.strictEqual(z.replace(/[​-‍﻿]/g, ''), 'Mamma',
      'tolti i caratteri invisibili deve restare la parola originale: è questo che lo rende un attacco');
    const b = H.withBidi('Mamma');
    assert.notStrictEqual(b, 'Mamma');
  });

  test('il peer sa produrre le quattro forme di impersonificazione', () => {
    const app = H.loadHostile();
    const peer = H.hostilePeer(app);
    const forme = peer.impersonate('Mamma', H.rngKit(3));
    assert.strictEqual(forme.length, 4);
    for (const f of forme){
      assert.notStrictEqual(f.nick, 'Mamma', `la forma "${f.how}" non è distinta dal dato originale`);
    }
    app.stop();
  });
});
