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

  test('e viene respinta anche sulle CASELLE, non solo su /turn', async () => {
    /* ⚠️ BUCO TROVATO DAL MUTANTE W03 IL 7 SET 2026, e l'avevo aperto io lo
       stesso giorno. Fino alla 4.26 il controllo dell'origine era uno solo,
       all'ingresso, e il test qui sopra lo copriva passando da `/turn`.
       Nella 4.27 ho dato a `/turn` un controllo PROPRIO, piu' stretto — e da
       quel momento il test qui sopra passava anche cancellando del tutto
       quello generale: `/turn` si difendeva da solo, e le caselle
       (`/mailbox`, `/wake`, `/key`, `/letter`) restavano scoperte senza che
       nessuno dicesse niente.
       Questo controllo passa da una rotta che NON ha difese proprie, ed e'
       l'unico modo di sorvegliare davvero quella riga. */
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/mailbox/' + 'a'.repeat(64), { origin: 'https://attaccante.example' });
    assert.strictEqual(r.status, 403,
      'la casella accetta un\'origine sconosciuta: il controllo generale non c\'e\' piu\'');
    assert.strictEqual(r.corpo.error, 'Forbidden');
  });

  test('l\'origine legittima passa', async () => {
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/mailbox/' + 'a'.repeat(64), { origin: ORIGINE_BUONA });
    assert.notStrictEqual(r.status, 403, 'l\'origine ufficiale non deve mai essere respinta');
  });

  test('una richiesta SENZA origine passa sulle CASELLE — e questo è deliberato, non una svista', async () => {
    /* `curl` non manda Origin, e nemmeno la copia dell'app aperta da file://
       o servita da una chiavetta, che è un caso che questo progetto sostiene
       apposta. Ma soprattutto: il servizio Android che squilla ad app chiusa
       interroga /mailbox da codice Java, che un header Origin non lo manda.
       Questo test fissa che le caselle restano aperte a una richiesta senza
       Origin, così nessuno lo "corregge" un giorno spegnendo lo squillo. */
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/mailbox/' + 'a'.repeat(64));
    assert.notStrictEqual(r.status, 403);
  });

  test('ma /turn SENZA origine viene respinto: regala credenziali che costano soldi veri', async () => {
    /* ⚠️ Confermato sul relay pubblicato il 6 set 2026: `curl .../turn` senza
       header Origin rispondeva 200 e consegnava le credenziali. Le credenziali
       valgono dieci minuti di banda VERA del relay, fatturata all'account, ed
       è l'unica cosa nel Worker che costa denaro. I programmi che scandagliano
       Internet in cerca di relay aperti l'avevano trovato (URL nel codice
       pubblico). Le caselle restano aperte alle richieste senza Origin per il
       servizio Android; /turn no, perché nessun pezzo nostro lo chiama senza
       browser, e un browser cross-origin manda SEMPRE l'Origin. */
    const w = W.caricaWorker();
    for (const rotta of ['/turn', '/']){
      const senza = await w.chiama('GET', rotta);
      assert.strictEqual(senza.status, 403, rotta + ' senza Origin deve prendere 403, non le credenziali');
      const finta = await w.chiama('GET', rotta, { origin: 'https://evil.example' });
      assert.strictEqual(finta.status, 403, rotta + ' con origine sbagliata deve restare 403');
    }
  });

  test('/turn con l\'origine giusta continua a funzionare', async () => {
    /* Il lato da non rompere: stringere il controllo non deve chiudere fuori
       l'app vera. `handleTurn` chiama la rete, che in questa stanza non c'è —
       quindi il segnale che è passato il controllo è "non 403 e non 405":
       arriva fino al punto in cui proverebbe a chiedere le credenziali. */
    const w = W.caricaWorker();
    const r = await w.chiama('GET', '/turn', { origin: ORIGINE_BUONA });
    assert.notStrictEqual(r.status, 403, 'l\'origine ufficiale deve passare il controllo');
    assert.notStrictEqual(r.status, 405);
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
    /* È l'unica rotta che spende denaro vero. Serve l'origine giusta: da quando
       /turn respinge le richieste senza Origin (i robot), senza di quella si
       fermerebbe a 403 prima ancora di arrivare al conteggio. */
    const w = W.caricaWorker();
    let ok = 0;
    for (let i = 0; i < 200; i++){
      const r = await w.chiama('GET', '/turn', { ip: '198.51.100.10', origin: ORIGINE_BUONA });
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
        /* dal 13 set 2026 la cassetta legge coi metadati (il gettone): un
           finto che non la conoscesse farebbe passare un TypeError per un
           guasto vero, e la rotta sembrerebbe scoperta senza esserlo */
        async getWithMetadata(){ throw new Error('KV read failed: 429'); },
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

/* ============================================================================
   Le credenziali del ponte non si rigenerano a ogni richiesta — 11 set 2026.
   Misurato: 2,7 s a richiesta, pagati da chi stava per chiamare.
   ========================================================================= */
test.describe('worker: le credenziali TURN si riusano per due minuti', () => {
  const ORIGINE = 'https://digitalvalut.github.io';
  function finto(risposte){
    const chiamate = [];
    const fetch = async (url, init) => {
      chiamate.push(url);
      const r = risposte.shift() || { ok: true, body: { iceServers: [{ urls: ['stun:x'] }] } };
      return { ok: r.ok, status: r.ok ? 200 : 500, json: async () => r.body };
    };
    return { fetch, chiamate };
  }

  test('due richieste vicine costano UN solo giro a Cloudflare, e ricevono la stessa risposta', async () => {
    const f = finto([{ ok: true, body: { iceServers: [{ urls: ['turn:primo'] }] } }, { ok: true, body: { iceServers: [{ urls: ['turn:secondo'] }] } }]);
    const w = W.caricaWorker({ fetch: f.fetch });
    const a = await w.chiama('GET', '/turn', { origin: ORIGINE });
    const b = await w.chiama('GET', '/turn', { origin: ORIGINE });
    assert.strictEqual(a.status, 200); assert.strictEqual(b.status, 200);
    assert.strictEqual(f.chiamate.length, 1, 'la seconda richiesta non deve rifare il giro: e quello che costava 2,7 secondi');
    assert.deepStrictEqual(b.corpo.iceServers[0].urls, ['turn:primo'], 'e riceve la risposta buona gia in mano');
  });

  test('dopo due minuti si rigenera: la cache non deve sopravvivere alla credenziale', async () => {
    const f = finto([{ ok: true, body: { iceServers: [{ urls: ['turn:primo'] }] } }, { ok: true, body: { iceServers: [{ urls: ['turn:secondo'] }] } }]);
    const w = W.caricaWorker({ fetch: f.fetch });
    await w.chiama('GET', '/turn', { origin: ORIGINE });
    w.orologio.t += 2 * 60 * 1000 + 1;
    const b = await w.chiama('GET', '/turn', { origin: ORIGINE });
    assert.strictEqual(f.chiamate.length, 2, 'scaduta la cache si torna a Cloudflare');
    assert.deepStrictEqual(b.corpo.iceServers[0].urls, ['turn:secondo']);
  });

  test('un errore di Cloudflare non viene messo in cache e servito agli altri', async () => {
    const f = finto([{ ok: false, body: { error: 'x' } }, { ok: true, body: { iceServers: [{ urls: ['turn:ok'] }] } }]);
    const w = W.caricaWorker({ fetch: f.fetch });
    const a = await w.chiama('GET', '/turn', { origin: ORIGINE });
    assert.strictEqual(a.status, 502);
    const b = await w.chiama('GET', '/turn', { origin: ORIGINE });
    assert.strictEqual(b.status, 200, 'la richiesta dopo deve avere una vera seconda possibilita');
    assert.strictEqual(f.chiamate.length, 2);
  });

  test('il conto che non si deve rompere: cache del Worker + riuso nell app < vita della credenziale', () => {
    const fs = require('node:fs'), path = require('node:path');
    const worker = fs.readFileSync(path.join(__dirname, '..', 'turn-worker', 'worker.js'), 'utf8');
    const app = fs.readFileSync(path.join(__dirname, '..', 'modifica.js'), 'utf8');
    const ttl = Number(worker.match(/const TURN_TTL_SECONDS = (\d+)/)[1]) * 1000;
    const cache = worker.match(/const TURN_CACHE_MS = ([0-9 *]+);/)[1].split('*').map(Number).reduce((a, b) => a * b, 1);
    const riuso = app.match(/const ICE_REUSE_MS = ([0-9 *]+);/)[1].split('*').map(Number).reduce((a, b) => a * b, 1);
    assert.ok(cache + riuso < ttl, `Worker ${cache} + app ${riuso} deve restare sotto la vita ${ttl}, o l app usa con fiducia un lasciapassare scaduto`);
  });
});

/* ============================================================================
   La cassetta che nessuno puo' svuotare — 13 settembre 2026.
   Il difetto piu' serio che il relay avesse (CONFRONTO §A): il nome della
   cassetta di un indirizzo si calcola dall'indirizzo, e leggere svuotava.
   Qui c'e' l'attacco, riprodotto: chi sa il nome ma non sa aprire la busta
   prova a farla sparire — e resta li'.
   ========================================================================= */
test.describe('worker: la cassetta che nessuno puo\' svuotare', () => {
  const ORIGINE = 'https://digitalvalut.github.io';
  const K = 'c'.repeat(64);
  const TOK = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const ALTRO = '00000000000000000000000000000000';
  const BUSTA = JSON.stringify({ i: 'iv', c: 'sigillata' });

  test('l\'ATTACCO: chi conosce la cassetta ma non il gettone non puo\' svuotarla', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA, headers: { 'X-Logos-Token': TOK } });
    /* l'attaccante legge come faceva sempre: senza keep, sperando che leggere cancelli */
    const letta = await w.chiama('GET', '/mailbox/' + K, { origin: ORIGINE, ip: '198.51.100.9' });
    assert.strictEqual(letta.status, 200, 'la busta la vede: e sigillata, non gli serve a niente');
    /* ...e prova a cancellare senza gettone, e con uno sbagliato */
    const senza = await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, ip: '198.51.100.9' });
    assert.strictEqual(senza.status, 403);
    const sbagliato = await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, ip: '198.51.100.9', headers: { 'X-Logos-Token': ALTRO } });
    assert.strictEqual(sbagliato.status, 403);
    /* il destinatario vero arriva DOPO l'attaccante, e la trova ancora li' */
    const vera = await w.chiama('GET', '/mailbox/' + K + '?keep=1', { origin: ORIGINE });
    assert.strictEqual(vera.status, 200, 'la chiamata e\' ancora nella cassetta: l\'attacco non ha strappato niente');
    assert.strictEqual(vera.corpo.c, 'sigillata');
  });

  test('chi ha aperto la busta — e quindi ha il gettone — la toglie', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA, headers: { 'X-Logos-Token': TOK } });
    const del = await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, headers: { 'X-Logos-Token': TOK } });
    assert.strictEqual(del.status, 200);
    const dopo = await w.chiama('GET', '/mailbox/' + K + '?keep=1', { origin: ORIGINE });
    assert.strictEqual(dopo.status, 404, 'tolta davvero');
    const ancora = await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, headers: { 'X-Logos-Token': TOK } });
    assert.strictEqual(ancora.status, 404, 'cancellare due volte non e\' un errore, e\' un 404');
  });

  test('il gettone NON esce mai dal relay: ne\' nel corpo, ne\' nel peek', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA, headers: { 'X-Logos-Token': TOK } });
    const letta = await w.chiama('GET', '/mailbox/' + K + '?keep=1', { origin: ORIGINE });
    assert.ok(!JSON.stringify(letta.corpo).includes(TOK), 'se il gettone tornasse con la busta, chiunque legga potrebbe cancellare');
    const peek = await w.chiama('GET', '/mailbox/' + K + '?peek=1', { origin: ORIGINE });
    assert.ok(!JSON.stringify(peek.corpo).includes(TOK));
    assert.strictEqual(peek.corpo.waiting, true, 'e il peek dell\'ascolto Android dice ancora la verita\'');
  });

  test('due tempi: una busta SENZA gettone (app vecchia) si cancella leggendola, come sempre', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA });
    const prima = await w.chiama('GET', '/mailbox/' + K, { origin: ORIGINE });
    assert.strictEqual(prima.status, 200);
    const dopo = await w.chiama('GET', '/mailbox/' + K, { origin: ORIGINE });
    assert.strictEqual(dopo.status, 404, 'l\'app vecchia deve continuare a trovare la cassetta vuota dopo aver letto: e\' cosi\' che ritira un invito');
  });

  test('due tempi: un\'app nuova che legge una busta vecchia (keep=1) la lascia li\'', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA });
    await w.chiama('GET', '/mailbox/' + K + '?keep=1', { origin: ORIGINE });
    const dopo = await w.chiama('GET', '/mailbox/' + K + '?keep=1', { origin: ORIGINE });
    assert.strictEqual(dopo.status, 200, 'senza gettone non la puo\' cancellare, e leggere con keep non deve farlo al posto suo');
  });

  test('un gettone che non ha la forma giusta e\' ignorato, non accettato', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA, headers: { 'X-Logos-Token': 'corto' } });
    /* nessun gettone valido = busta senza gettone = si comporta come vecchia */
    await w.chiama('GET', '/mailbox/' + K, { origin: ORIGINE });
    const dopo = await w.chiama('GET', '/mailbox/' + K, { origin: ORIGINE });
    assert.strictEqual(dopo.status, 404);
    const del = await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, headers: { 'X-Logos-Token': 'corto' } });
    assert.strictEqual(del.status, 403);
  });

  test('cancellare costa una scrittura, come la cancellazione-alla-lettura di prima: la quota non cambia', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/mailbox/' + K, { origin: ORIGINE, body: BUSTA, headers: { 'X-Logos-Token': TOK } });
    const prima = w.env.MAILBOX._log.filter(o => o.op === 'delete').length;
    await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, headers: { 'X-Logos-Token': TOK } });
    assert.strictEqual(w.env.MAILBOX._log.filter(o => o.op === 'delete').length, prima + 1);
    /* e' metrata come scrittura: un diluvio di DELETE finisce in 429 */
    let ultimo = 200;
    for (let i = 0; i < 400 && ultimo !== 429; i++){
      const r = await w.chiama('DELETE', '/mailbox/' + K, { origin: ORIGINE, headers: { 'X-Logos-Token': TOK } });
      ultimo = r.status;
    }
    assert.strictEqual(ultimo, 429, 'senza il tetto, cancellare sarebbe una scrittura gratis');
  });

  test('CORS: il browser deve poter mandare DELETE e l\'intestazione del gettone', async () => {
    const w = W.caricaWorker();
    const r = await w.chiama('OPTIONS', '/mailbox/' + K, { origin: ORIGINE });
    assert.match(r.headers.get('Access-Control-Allow-Methods') || '', /DELETE/);
    assert.match(r.headers.get('Access-Control-Allow-Headers') || '', /X-Logos-Token/);
  });

  test('le LETTERE: stessa regola, una per una', async () => {
    const w = W.caricaWorker();
    const R = 'deadbeefdeadbeef';
    await w.chiama('PUT', '/letter/' + K + '/' + R, { origin: ORIGINE, body: BUSTA, headers: { 'X-Logos-Token': TOK } });
    /* l'attaccante raccoglie come si faceva sempre */
    const rubata = await w.chiama('GET', '/letter/' + K, { origin: ORIGINE, ip: '198.51.100.9' });
    assert.strictEqual(rubata.status, 200);
    assert.strictEqual(rubata.corpo.length, 1, 'la vede');
    assert.strictEqual(typeof rubata.corpo[0], 'string', 'a chi legge come prima, la forma di prima: un elenco di buste');
    const ancora = await w.chiama('GET', '/letter/' + K + '?keep=1', { origin: ORIGINE });
    assert.strictEqual(ancora.corpo.length, 1, 'ma non l\'ha portata via');
    assert.strictEqual(ancora.corpo[0].r, R, 'a chi legge con keep arriva anche il nome della voce, per poterla cancellare');
    assert.ok(!JSON.stringify(ancora.corpo).includes(TOK), 'il gettone non viaggia con la lettera');
    const no = await w.chiama('DELETE', '/letter/' + K + '/' + R, { origin: ORIGINE, headers: { 'X-Logos-Token': ALTRO } });
    assert.strictEqual(no.status, 403);
    const si = await w.chiama('DELETE', '/letter/' + K + '/' + R, { origin: ORIGINE, headers: { 'X-Logos-Token': TOK } });
    assert.strictEqual(si.status, 200);
    const vuota = await w.chiama('GET', '/letter/' + K + '?keep=1', { origin: ORIGINE });
    assert.strictEqual(vuota.corpo.length, 0);
  });

  test('le LETTERE, due tempi: senza gettone si raccolgono e spariscono come sempre', async () => {
    const w = W.caricaWorker();
    await w.chiama('PUT', '/letter/' + K + '/' + 'deadbeefdeadbeef', { origin: ORIGINE, body: BUSTA });
    const prima = await w.chiama('GET', '/letter/' + K, { origin: ORIGINE });
    assert.strictEqual(prima.corpo.length, 1);
    const dopo = await w.chiama('GET', '/letter/' + K, { origin: ORIGINE });
    assert.strictEqual(dopo.corpo.length, 0, 'l\'app vecchia non deve rivedere la stessa lettera');
  });
});
