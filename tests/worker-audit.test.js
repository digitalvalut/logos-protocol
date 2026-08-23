/* ============================================================================
   IL WORKER SOTTO ATTACCO — Fase E.

   Le cinque proprietà che il brief chiede, più quelle che l'attacco ha
   suggerito strada facendo. Tutte contro la replica locale: nessuna richiesta
   lascia questa macchina, e il Worker di produzione non viene sfiorato.

   Il limite dell'ambiente è scritto in testa a worker-harness.js e ripetuto
   nel report: qui gira la LOGICA del Worker, non l'ambiente Cloudflare.
   ========================================================================= */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const W = require('./worker-harness.js');

const ORIGINE_BUONA = 'https://digitalvalut.github.io';

test.describe('worker: chi può bussare', () => {

  test('un\'origine sconosciuta viene respinta', async () => {
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/turn', { origin: 'https://attaccante.example' });
    assert.strictEqual(r.status, 403, 'un\'origine non in elenco deve prendere 403');
    assert.strictEqual(r.corpo.error, 'Forbidden');
  });

  test('l\'origine legittima passa', async () => {
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/mailbox/' + 'a'.repeat(64), { origin: ORIGINE_BUONA });
    assert.notStrictEqual(r.status, 403, 'l\'origine ufficiale non deve mai essere respinta');
  });

  test('una richiesta SENZA origine passa — e questo è deliberato, non una svista', async () => {
    /* `curl` non manda Origin, e nemmeno la copia dell'app aperta da file://
       o servita da una chiavetta, che è un caso che questo progetto sostiene
       apposta. Il commento nel Worker dice che il controllo non è vero
       controllo d'accesso: questo test lo fissa come comportamento voluto,
       così nessuno lo "corregge" un giorno rompendo il file unico. */
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/mailbox/' + 'a'.repeat(64));
    assert.notStrictEqual(r.status, 403);
  });
});

test.describe('worker: lo slot appartiene alla chiave', () => {

  test('una chiave pubblicata nel proprio slot viene accettata', async () => {
    const w = W.caricaWorker();
    const k = await W.chiaveVera();
    const slot = await W.slotLegittimo(w, k.p, 0);
    const r = await w.chiama('PUT', '/key/' + slot, { body: JSON.stringify({ p: k.p, n: 0 }) });
    assert.strictEqual(r.status, 200, 'una chiave legittima deve poter pubblicare: ' + JSON.stringify(r.corpo));
  });

  test('LA PROVA CHE CONTA: una chiave non può calpestare lo slot di un\'altra', async () => {
    /* Se questo controllo cedesse, chiunque potrebbe sostituire la propria
       chiave all'indirizzo di un altro e dirottarne le chiamate. È il
       controllo più importante dell'intero Worker. */
    const w = W.caricaWorker();
    const vittima = await W.chiaveVera();
    const attaccante = await W.chiaveVera();
    const slotVittima = await W.slotLegittimo(w, vittima.p, 0);

    const r = await w.chiama('PUT', '/key/' + slotVittima, { body: JSON.stringify({ p: attaccante.p, n: 0 }) });
    assert.strictEqual(r.status, 403,
      'una chiave che non hasha a questo slot deve essere respinta, non accettata: ' + JSON.stringify(r.corpo));
    assert.match(String(r.corpo.error), /does not own/);

    const dopo = await w.chiama('GET', '/key/' + slotVittima);
    assert.strictEqual(dopo.status, 404, 'e non deve aver lasciato niente dietro di sé');
  });

  test('nemmeno cambiando il numero di slot dichiarato', async () => {
    /* La stessa chiave, lo slot giusto per n=0, ma dichiarando n=1: se il
       Worker si fidasse di `n` invece di ricalcolarlo, la coppia
       (chiave, slot) non sarebbe più legata. */
    const w = W.caricaWorker();
    const k = await W.chiaveVera();
    const slot0 = await W.slotLegittimo(w, k.p, 0);
    const r = await w.chiama('PUT', '/key/' + slot0, { body: JSON.stringify({ p: k.p, n: 1 }) });
    assert.strictEqual(r.status, 403, 'il numero di slot deve entrare nel calcolo, non essere preso sulla parola');
  });

  test('materiale che non è una chiave P-256 viene rifiutato prima di toccare KV', async () => {
    const w = W.caricaWorker();
    const slot = 'b'.repeat(64);
    for (const cattivo of [
      { p: 'troppo-corta', n: 0 },
      { p: 'A'.repeat(200), n: 0 },
      { p: 123, n: 0 },
      { n: 0 },
      { p: 'A'.repeat(87) + '=', n: 300 },
    ]){
      const r = await w.chiama('PUT', '/key/' + slot, { body: JSON.stringify(cattivo) });
      assert.ok(r.status === 400 || r.status === 403,
        'accettato materiale non valido ' + JSON.stringify(cattivo) + ' -> ' + r.status);
    }
    assert.strictEqual(w.env.MAILBOX._m.size, 0, 'niente deve essere finito in KV');
  });
});

test.describe('worker: la cassetta si legge una volta sola', () => {

  test('quello che entra esce una volta e poi non c\'è più', async () => {
    const w = W.caricaWorker();
    const slot = 'c'.repeat(64);
    await w.chiama('PUT', '/mailbox/' + slot, { body: JSON.stringify({ i: 'iv', c: 'busta' }) });
    const primo = await w.chiama('GET', '/mailbox/' + slot);
    assert.strictEqual(primo.status, 200, 'la prima lettura deve trovare la busta');
    const secondo = await w.chiama('GET', '/mailbox/' + slot);
    assert.notStrictEqual(secondo.status, 200,
      'una cassetta che si rilegge non è a lettura unica, e la promessa "cancellata alla lettura" sarebbe falsa');
  });

  test('la busta viene messa con una scadenza breve, non per sempre', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + 'd'.repeat(64), { body: JSON.stringify({ i: 'iv', c: 'x' }) });
    const put = w.env.MAILBOX._log.find(x => x.op === 'put');
    assert.ok(put && put.ttl > 0, 'nessuna scadenza chiesta a KV');
    assert.ok(put.ttl <= 300, `scadenza di ${put.ttl}s: la cassetta doveva tenere per minuti, non per ore`);
  });

  test('uno slot scritto male non viene nemmeno instradato', async () => {
    const w = W.caricaWorker();
    for (const brutto of ['corto', 'A'.repeat(64), 'g'.repeat(64), '../etc/passwd', 'a'.repeat(63), 'a'.repeat(65)]){
      const r = await w.chiama('GET', '/mailbox/' + brutto);
      assert.strictEqual(r.status, 404, 'slot malformato instradato: ' + brutto);
    }
  });
});

test.describe('worker: la buca delle lettere', () => {

  test('oltre il tetto, una lettera in più non entra', async () => {
    const w = W.caricaWorker();
    const box = 'e'.repeat(64);
    let accettate = 0;
    for (let i = 0; i < 30; i++){
      const nome = i.toString(16).padStart(16, '0');
      const r = await w.chiama('PUT', `/letter/${box}/${nome}`, { body: JSON.stringify({ i: 'iv', c: 'l' + i }) });
      if (r.status === 200) accettate++;
    }
    assert.ok(accettate <= 20, `accettate ${accettate} lettere: il tetto dichiarato è 20`);
    assert.ok(accettate >= 15, `accettate solo ${accettate}: il tetto morde troppo presto`);
  });

  test('ritirare la posta la porta via davvero', async () => {
    const w = W.caricaWorker();
    const box = 'f'.repeat(64);
    await w.chiama('PUT', `/letter/${box}/${'1'.repeat(16)}`, { body: JSON.stringify({ i: 'iv', c: 'ciao' }) });
    const primo = await w.chiama('GET', '/letter/' + box);
    assert.strictEqual(primo.status, 200);
    const secondo = await w.chiama('GET', '/letter/' + box);
    const vuoto = secondo.status !== 200 ||
                  (Array.isArray(secondo.corpo) ? secondo.corpo.length === 0 :
                   Array.isArray(secondo.corpo && secondo.corpo.letters) ? secondo.corpo.letters.length === 0 : false);
    assert.ok(vuoto, 'la buca deve restare vuota dopo il ritiro: ' + JSON.stringify(secondo.corpo).slice(0, 120));
  });
});

test.describe('worker: i limiti di frequenza', () => {

  test('un diluvio di letture viene respinto con 429', async () => {
    const w = W.caricaWorker();
    const slot = '1'.repeat(64);
    let ok = 0, respinte = 0;
    for (let i = 0; i < 400; i++){
      const r = await w.chiama('GET', '/mailbox/' + slot, { ip: '198.51.100.9' });
      if (r.status === 429) respinte++; else ok++;
    }
    assert.ok(respinte > 0, 'nessuna richiesta respinta su 400: il limite non morde');
    assert.ok(ok <= 320, `passate ${ok} richieste: più larghe del budget dichiarato di 300`);
  });

  test('le credenziali del relay sono metrate più strette delle letture', async () => {
    /* È l'unica rotta che spende denaro vero. */
    const w = W.caricaWorker();
    let ok = 0;
    for (let i = 0; i < 200; i++){
      const r = await w.chiama('GET', '/turn', { ip: '198.51.100.10' });
      if (r.status !== 429) ok++;
    }
    assert.ok(ok <= 130, `passate ${ok} richieste di credenziali: il budget dichiarato è 120`);
  });

  test('il limite è per indirizzo, non globale', async () => {
    /* Se fosse globale, un solo abusante spegnerebbe il servizio per tutti. */
    const w = W.caricaWorker();
    const slot = '2'.repeat(64);
    for (let i = 0; i < 400; i++) await w.chiama('GET', '/mailbox/' + slot, { ip: '198.51.100.11' });
    const altro = await w.chiama('GET', '/mailbox/' + slot, { ip: '198.51.100.12' });
    assert.notStrictEqual(altro.status, 429,
      'un secondo indirizzo non deve pagare per il primo, o un abusante spegne il servizio a tutti');
  });

  test('una richiesta senza indirizzo non viene punita — e va detto cosa costa', async () => {
    /* Il Worker scrive: "nothing to attribute it to: do not punish the
       request". È una scelta difendibile e ha un prezzo: chi riesce a
       presentarsi senza CF-Connecting-IP non è metrato affatto. Su
       Cloudflare quell'header lo mette il bordo, quindi il prezzo è basso —
       ma il test lo fissa per iscritto invece di lasciarlo implicito. */
    const w = W.caricaWorker();
    const slot = '3'.repeat(64);
    let respinte = 0;
    for (let i = 0; i < 400; i++){
      const req = new Request('https://worker.example/mailbox/' + slot, { method: 'GET' });
      const res = await w.sandbox.__worker.fetch(req, w.env);
      if (res.status === 429) respinte++;
    }
    assert.strictEqual(respinte, 0, 'comportamento dichiarato: senza IP non si mette limite');
  });
});

test.describe('worker: il colpetto non è un relay aperto', () => {

  test('solo POST, e solo verso servizi push riconosciuti', async () => {
    const w = W.caricaWorker();
    assert.strictEqual((await w.chiama('GET', '/knock')).status, 405, 'GET su /knock deve essere rifiutato');
    const r = await w.chiama('POST', '/knock', {
      body: JSON.stringify({ endpoint: 'https://server-dell-attaccante.example/qualsiasi' }),
    });
    assert.notStrictEqual(r.status, 200,
      'un endpoint arbitrario non deve poter essere raggiunto attraverso questo Worker');
  });
});
