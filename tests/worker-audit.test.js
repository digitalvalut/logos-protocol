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
    /* ⚠️ RISCRITTO IL 1 SET 2026. Fissava il numero 300 a mano, e quando il
       Worker è passato a contare il COSTO invece delle CHIAMATE quel numero
       non voleva più dire niente: una lettura della casella ne spende due (la
       get più la delete), quindi lo stesso budget lascia passare metà delle
       richieste. Il test è diventato rosso pur essendo il Worker più severo di
       prima — un test legato al meccanismo, non alla promessa.
       La promessa è: un diluvio viene fermato, e non passa più di quanto il
       bilancio dichiarato consenta. Il numero se lo legge dal Worker. */
    const w = W.caricaWorker();
    /* letto dalla sorgente e non dalla sandbox: un `const` in cima a un
       modulo non diventa una proprietà dell'oggetto globale, quindi
       `sandbox.RL_MAX_READS` è undefined — provato, ed è il motivo per cui
       questa riga è com'è */
    const sorgente = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'turn-worker', 'worker.js'), 'utf8');
    const budget = Number((sorgente.match(/RL_MAX_READS\s*=\s*(\d+)/) || [])[1]);
    assert.ok(budget > 0, 'il bilancio delle letture deve essere leggibile');
    const massimo = Math.ceil(budget / 2) + 20;   /* ogni lettura costa 2 */
    const slot = '1'.repeat(64);
    let ok = 0, respinte = 0;
    for (let i = 0; i < budget + 200; i++){
      const r = await w.chiama('GET', '/mailbox/' + slot, { ip: '198.51.100.9' });
      if (r.status === 429) respinte++; else ok++;
    }
    assert.ok(respinte > 0, 'nessuna richiesta respinta: il limite non morde');
    assert.ok(ok <= massimo,
      `passate ${ok} richieste: più larghe del bilancio dichiarato di ${budget} unità di costo`);
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

/* ============================================================================
   SPEGNERE LOGOS A TUTTI, DA SOLI, GRATIS — 1 settembre 2026.

   Nato da una domanda dell'utente che questo file non sapeva reggere: "se uno
   continua a scrivere codici a sei cifre e premere invio, satura Logos e lo
   butta giu?". La risposta era si, e per quattro strade diverse, tutte piu
   economiche che indovinare un codice.

   ⚠️ LA RADICE ERA UN PRESUPPOSTO SCRITTO NEL WORKER: "lookups are free".
   Non lo sono. Il piano gratuito da 100.000 letture e SOLO 1.000 SCRITTURE al
   giorno per tutto l'account. Su quella frase erano tarati tutti i tetti.

   ⚠️ PERCHE NESSUNO DEI 17 TEST PRECEDENTI POTEVA VEDERLO, ed e la lezione
   che vale piu del codice: contavano RICHIESTE RESPINTE. Nessuno contava
   OPERAZIONI KV SPESE. Una rotta che accetta poche richieste ma ne spende
   quaranta ciascuna passava tutti i controlli esistenti a pieni voti.
   Questi test contano il log del KV finto, cioe la cosa che si esaurisce
   davvero, e non si lasciano piu ingannare da quanti 429 tornano.
   ========================================================================== */
test.describe('worker: nessuno puo svuotare la quota del giorno da solo', () => {

  /* Quante operazioni KV sono finite sul magazzino, che e cio che Cloudflare
     conta e che l'email di avviso misura. */
  function operazioniSpese(w){ return w.env.MAILBOX._log.length; }

  test('BUCO 1 — /wake in scrittura non era metrato affatto', async () => {
    /* Mille scritture sono la quota di UN GIORNO INTERO per tutto l'account.
       Prima della correzione questo ciclo ne spendeva 600 su 600 senza che
       niente lo fermasse: pochi secondi di script e Logos era spento per
       tutti fino a mezzanotte. */
    const w = W.caricaWorker();
    const slot = 'a'.repeat(64);
    for (let i = 0; i < 600; i++){
      await w.chiama('PUT', '/wake/' + slot, { body: 'x', ip: '198.51.100.20' });
    }
    const spese = operazioniSpese(w);
    assert.ok(spese <= 70,
      `un solo indirizzo ha speso ${spese} scritture su una quota giornaliera di 1000: ` +
      'la rotta /wake deve essere metrata come ogni altra scrittura');
  });

  test('BUCO 2 — /letter in scrittura non era metrato affatto', async () => {
    const w = W.caricaWorker();
    const slot = 'b'.repeat(64);
    for (let i = 0; i < 400; i++){
      await w.chiama('PUT', '/letter/' + slot + '/' + String(i).padStart(16, '0'),
                     { body: 'x', ip: '198.51.100.21' });
    }
    const spese = operazioniSpese(w);
    assert.ok(spese <= 100,
      `un solo indirizzo ha speso ${spese} operazioni depositando lettere: deve essere metrato`);
  });

  test('BUCO 3 — raccogliere lettere costava 41 operazioni contate come UNA', async () => {
    /* Il piu grave, e invisibile leggendo la rotta: una list, poi una get e
       una delete per ogni lettera. Il vecchio tetto di 300 richieste al
       minuto dava a un solo indirizzo fino a 12.300 operazioni al minuto.

       ⚠️ LA PRIMA STESURA DI QUESTO TEST NON PROVAVA NIENTE, ed e' la lezione
       piu importante di tutta la correzione. Batteva su UNA SOLA buca: la
       prima raccolta la svuota, e da li in poi ogni richiesta costa una list
       e basta — l'amplificazione mordeva una volta e spariva. Col difetto
       RIMESSO il test restava VERDE, e la soglia che avevo scelto cadeva per
       caso esattamente sul valore sabotato. Scoperto sabotando, non
       rileggendo. L'attacco vero e' spazzare TANTE buche piene, non frugare
       duecento volte nella stessa.

       ⚠️ E LA SECONDA STESURA SBAGLIAVA ANCORA, in modo piu sottile: dieci
       buche si svuotano comunque, quindi il totale era quasi lo stesso con e
       senza correzione (294 contro 360) e la soglia non separava niente.
       Misurava "quanto costa svuotare quello che c'e'", che dipende da quante
       lettere esistono — non dal difetto.
       LA GARANZIA VERA, che non dipende da quanto c'e' in magazzino, e'
       questa: IL WORKER NON DEVE MAI SPENDERE PIU OPERAZIONI DI QUANTE NE HA
       ADDEBITATE. Con scorta abbondante il tetto per indirizzo e' 600 unita,
       quindi la spesa deve restare li' intorno — non a migliaia. */
    const w = W.caricaWorker();
    const buche = [];
    for (let b = 0; b < 60; b++){
      const slot = (b.toString(16).padStart(2, '0')).repeat(32);
      buche.push(slot);
      /* si riempie usando il KV direttamente, per non far pagare il
         riempimento allo stesso contatore che stiamo misurando */
      for (let i = 0; i < 20; i++){
        await w.env.MAILBOX.put('l:' + slot + ':' + String(i).padStart(16, '0'), 'busta');
      }
    }
    w.env.MAILBOX._log.length = 0;
    for (let i = 0; i < 400; i++){
      await w.chiama('GET', '/letter/' + buche[i % buche.length], { ip: '198.51.100.22' });
    }
    /* Misurato davvero, invece che scelto a occhio: con la correzione la
       spesa e' 891 (il tetto addebitato, 900, rispettato), col difetto
       rimesso e' 2800. La soglia sta in mezzo — abbastanza sopra il valore
       buono da non diventare rossa per un'oscillazione, abbastanza sotto
       quello rotto da coglierlo. Una soglia posata sul valore sabotato, come
       nella prima stesura, non separa niente. */
    const spese = operazioniSpese(w);
    assert.ok(spese <= 1500,
      `un solo indirizzo ha speso ${spese} operazioni contro un tetto addebitato di 900: ` +
      'una richiesta che ne vale quaranta non puo essere contata come una');
  });

  test('BUCO 4 — le scritture pagavano dal bilancio delle letture', async () => {
    /* Le due risorse stanno in rapporto cento a uno (100.000 letture contro
       1.000 scritture). Un contatore solo, tarato sull'abbondante, lasciava
       la scarsa senza difesa. */
    const w = W.caricaWorker();
    const slot = 'd'.repeat(64);
    for (let i = 0; i < 300; i++){
      await w.chiama('PUT', '/mailbox/' + slot, { body: 'x', ip: '198.51.100.23' });
    }
    const scritture = w.env.MAILBOX._log.filter(v => v.op === 'put').length;
    assert.ok(scritture <= 70,
      `${scritture} scritture da un solo indirizzo in un minuto, su 1000 al giorno: ` +
      'le scritture devono avere un bilancio proprio, piu stretto di quello delle letture');
  });

  test('IL FONDO DEL SECCHIO: tanti indirizzi diversi trovano comunque un muro', async () => {
    /* I limiti per indirizzo fermano una persona, non cento — e non serve una
       botnet: basta una rete mobile, dove l'indirizzo cambia da solo.
       ⚠️ Questa difesa vede un solo isolate: NON e un tetto globale esatto,
       e il commento nel Worker lo dice invece di lasciarlo credere. */
    const w = W.caricaWorker();
    const slot = 'e'.repeat(64);
    for (let i = 0; i < 500; i++){
      await w.chiama('PUT', '/wake/' + slot, { body: 'x', ip: '198.51.' + (i % 250) + '.' + (i % 200) });
    }
    const scritture = w.env.MAILBOX._log.filter(v => v.op === 'put').length;
    assert.ok(scritture <= 70,
      `${scritture} scritture da 500 indirizzi diversi: senza un tetto che ignori l'indirizzo, ` +
      'cambiare IP aggira ogni limite');
  });

  test('E IL LATO DA NON ROMPERE: il PC e il telefono di casa devono passare', async () => {
    /* ⚠️ IL PERICOLO VERO DI QUESTA CORREZIONE, piu dell'attacco che ferma:
       stringere tanto da spegnere l'app a chi la usa bene. Il caso da
       proteggere e' esattamente quello su cui si collauda ogni versione — il
       PC e il telefono di casa, DIETRO LO STESSO INDIRIZZO perche' sulla
       stessa rete — che si collegano fra loro.
       Misurato col client di oggi: due dispositivi che si collegano spendono
       476 unita al minuto, di cui ~240 di interrogazioni alla casella. Se
       questo test diventa rosso, il tetto e' stato stretto troppo e va
       allargato, non aggirato. */
    const w = W.caricaWorker();
    let passate = 0;
    for (let i = 0; i < 120; i++){
      const slot = (i % 2 === 0 ? 'f' : 'e').repeat(64);
      const r = await w.chiama('GET', '/mailbox/' + slot, { ip: '198.51.100.30' });
      if (r.status !== 429) passate++;
    }
    assert.strictEqual(passate, 120,
      'due dispositivi sulla stessa rete che si collegano non devono MAI essere respinti: ' +
      'se lo sono, la correzione ha spento l app invece di difenderla');
  });
});

/* ------------------------------------------------------------------------
   UN GUASTO DELLO STORAGE NON DEVE MAI USCIRE COME 500.

   Trovato misurando il relay VIVO, non leggendo il codice: martellando
   /wake sulla stessa casella tornavano dei 500. KV consente circa una
   scrittura al secondo per chiave, e quel rifiuto arrivava come eccezione
   da una `env.MAILBOX.put` senza try/catch attorno.

   ⚠️ Il difetto non era di /wake. Contate a mano, delle 13 operazioni sullo
   storage del Worker solo 2 erano protette. Correggere la sola /wake avrebbe
   lasciato il difetto in altri dieci punti.

   Perché non è cosmetico: un 500 dice "il server è rotto", e un client che
   crede il server rotto RIPROVA — moltiplicando il carico proprio quando la
   causa è che stiamo già andando troppo forte. Un 429 dice "rallenta".
   ------------------------------------------------------------------------ */
test.describe('worker: lo storage che si rifiuta non diventa un 500', () => {

  /* un magazzino che rifiuta come fa KV quando si scrive troppo in fretta */
  function kvCheRifiuta(messaggio){
    const vero = W.kvVuoto();
    return {
      ...vero,
      async put(){ throw new Error(messaggio); },
      async delete(){ throw new Error(messaggio); },
    };
  }

  test('scrivere troppo in fretta risponde 429 (rallenta), non 500 (sono rotto)', async () => {
    const w = W.caricaWorker({ env: { MAILBOX: kvCheRifiuta('KV PUT failed: 429 Too Many Requests') } });
    const r = await w.chiama('PUT', '/wake/' + 'a'.repeat(64), { body: 'x' });
    assert.strictEqual(r.status, 429,
      'un rifiuto per eccesso di frequenza deve dire "rallenta": un 500 fa riprovare, e la tempesta si moltiplica');
  });

  test('un guasto vero dello storage risponde 503, non 500', async () => {
    const w = W.caricaWorker({ env: { MAILBOX: kvCheRifiuta('connection reset') } });
    const r = await w.chiama('PUT', '/wake/' + 'b'.repeat(64), { body: 'x' });
    assert.strictEqual(r.status, 503,
      '"riprova più tardi" e "rallenta" sono istruzioni diverse per chi le riceve');
  });

  test('la protezione copre TUTTE le rotte, non solo quella dove è stato trovato', async () => {
    /* La regola del progetto: un difetto sistemico richiede una correzione
       sistemica. Se un domani qualcuno aggiunge una rotta nuova, questa
       guardia la copre senza che debba ricordarsene. */
    const rotte = [
      ['PUT', '/wake/'    + 'c'.repeat(64)],
      ['PUT', '/mailbox/' + 'c'.repeat(64)],
      ['GET', '/mailbox/' + 'c'.repeat(64)],
      ['PUT', '/letter/'  + 'c'.repeat(64) + '/' + 'd'.repeat(16)],
      ['GET', '/letter/'  + 'c'.repeat(64)],
    ];
    for (const [metodo, percorso] of rotte){
      const w = W.caricaWorker({ env: { MAILBOX: {
        async get(){ throw new Error('KV read failed: 429'); },
        async put(){ throw new Error('KV write failed: 429'); },
        async delete(){ throw new Error('KV delete failed: 429'); },
        async list(){ throw new Error('KV list failed: 429'); },
      } } });
      /* una GET non può portare un corpo: Request lo rifiuta prima ancora di
         arrivare al Worker — preso dal test, non dalla lettura */
      const r = await w.chiama(metodo, percorso, metodo === 'GET' ? {} : { body: 'x' });
      assert.notStrictEqual(r.status, 500,
        `${metodo} ${percorso.slice(0, 20)}… risponde 500: questa rotta è scoperta`);
      assert.strictEqual(r.status, 429, `${metodo} ${percorso.slice(0, 20)}… dovrebbe dire "rallenta"`);
    }
  });

  test('il messaggio interno dell errore non trapela a chi chiama', async () => {
    /* Un errore dello storage può nominare chiavi, host interni o versioni.
       A chi ha causato il guasto non serve, e a un attaccante sì. */
    const w = W.caricaWorker({ env: { MAILBOX: kvCheRifiuta('namespace a3c45b02 host internal-kv-7.cfdata.org fallito') } });
    const r = await w.chiama('PUT', '/wake/' + 'e'.repeat(64), { body: 'x' });
    const testo = JSON.stringify(r.corpo);
    assert.ok(!/a3c45b02|cfdata|internal-kv/.test(testo),
      'la risposta contiene dettagli interni: ' + testo);
  });
});
