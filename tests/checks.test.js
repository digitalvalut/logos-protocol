/* ============================================================================
   The safety net.

   Every fault this app has shipped was found by a person using it, usually
   days later, and usually because somebody else said "non ti trovo". That is
   the most expensive way to find a bug and the worst way to hear about one.

   These checks run before anything is published. They deliberately need
   NOTHING installed: no npm, no node_modules, no test framework beyond the one
   built into Node itself. That is not laziness — this app's single strongest
   security property is that it loads no code written by anybody else, and a
   test suite that dragged in three hundred packages to check it would be a
   strange way to protect that.

   Run them with:   node --test tests/
   ========================================================================= */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');

const JS = read('modifica.js');
const HTML = read('modifica.html');
const CSS = read('modifica.css');
const SW = read('modifica-sw.js');
const WORKER = read('turn-worker/worker.js');

/* ---------------------------------------------------------------- syntax -- */

test('every script actually parses', () => {
  for (const file of ['modifica.js', 'modifica-sw.js', 'turn-worker/worker.js']){
    execFileSync(process.execPath, ['--check', path.join(ROOT, file)]);
  }
});

/* ------------------------------------------------- the page and the code -- */
/* A renamed or deleted element does not fail loudly: $('...') simply returns
   null, and the line that touches it throws in the middle of something else,
   often somewhere that swallows it. This is the cheapest check in the file and
   it covers 169 separate ways to break the app silently. */

const idsInHtml = new Set([...HTML.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]));

test('every element the code reaches for exists in the page', () => {
  const asked = new Set([...JS.matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]));
  const missing = [...asked].filter(id => !idsInHtml.has(id)).sort();
  assert.deepStrictEqual(missing, [], `the code asks for elements the page does not have: ${missing.join(', ')}`);
});

test('every icon is placed on an element that exists', () => {
  const asked = [...JS.matchAll(/setIcon\('([A-Za-z0-9_-]+)'/g)].map(m => m[1]);
  const missing = asked.filter(id => !idsInHtml.has(id)).sort();
  assert.deepStrictEqual(missing, [], `setIcon points at elements that do not exist: ${missing.join(', ')}`);
});

test('no element is declared twice', () => {
  const all = [...HTML.matchAll(/id="([A-Za-z0-9_-]+)"/g)].map(m => m[1]);
  const seen = new Set(), twice = new Set();
  for (const id of all){ if (seen.has(id)) twice.add(id); seen.add(id); }
  assert.deepStrictEqual([...twice].sort(), [], `duplicate ids: ${[...twice].join(', ')}`);
});

/* Scoprire un elemento che sta dentro un contenitore ancora nascosto non
   mostra niente, e non fallisce: la riga gira, la classe viene tolta davvero,
   e la persona guarda uno spazio vuoto.

   E' successo. Toccando un contatto, showContactReconnectLayout nasconde
   `manualInviteCard` — giusto, li' non si sta creando un invito. Ma se quel
   contatto non risponde si finisce a offrire il codice da mandare a mano, e
   revealInviteCode scopriva `offerBlock` senza riaprire il padre: il codice
   veniva scritto e restava invisibile, sotto la frase che diceva "Ecco il
   codice da mandare a mano". Trovato dall'operatore sul telefono.

   ⚠️ Nessun test di comportamento poteva prenderlo: nel finto browser
   nascondere un padre non nasconde il figlio. Solo la struttura vera della
   pagina lo dice, ed e' per questo che il controllo sta qui e non fra i test
   che eseguono il codice. */
function ancestorsOf(id){
  /* risale la catena dei contenitori leggendo l'HTML come testo: apre e chiude
     i tag contando l'annidamento, e tiene gli id dei blocchi ancora aperti nel
     punto in cui `id` compare */
  const target = HTML.indexOf(`id="${id}"`);
  if (target < 0) return [];
  const open = [], out = [];
  const tag = /<(\/?)([a-zA-Z]+)\b([^>]*)>/g;
  let m;
  while ((m = tag.exec(HTML)) && m.index < target){
    const [, slash, name, attrs] = m;
    if (/\/\s*$/.test(attrs) || /^(br|img|input|meta|link|hr|source|path|circle|rect|line|polyline|polygon|use|stop|ellipse)$/i.test(name)) continue;
    if (slash) open.pop();
    else open.push((attrs.match(/id="([A-Za-z0-9_-]+)"/) || [])[1] || null);
  }
  for (const a of open) if (a && a !== id) out.push(a);
  return out;
}

function corpoDi(nome){
  const da = JS.indexOf(`function ${nome}(`);
  assert.ok(da >= 0, `${nome} non trovata`);
  return JS.slice(da, JS.indexOf('\n}', da) + 2);
}
const nascondeIn = nome => new Set([...corpoDi(nome).matchAll(/\$\('([A-Za-z0-9_-]+)'\)\.classList\.add\('hide'\)/g)].map(m => m[1]));
const scopreIn   = nome => new Set([...corpoDi(nome).matchAll(/\$\('([A-Za-z0-9_-]+)'\)\.classList\.remove\('hide'\)/g)].map(m => m[1]));
const toccaIn    = nome => new Set([...corpoDi(nome).matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map(m => m[1]));

/* Le due funzioni girano una dopo l'altra sullo stesso schermo: si tocca un
   contatto -> showContactReconnectLayout prepara la schermata, e se quel
   contatto non risponde -> revealInviteCode offre il codice da mandare a mano.
   Quindi cio' che la prima chiude, la seconda deve riaprirlo, o mostra il nulla. */
test('il codice da mandare a mano non resta chiuso dentro un contenitore che il ricollegamento ha nascosto', () => {
  const chiusiPrima = nascondeIn('showContactReconnectLayout');
  const riaperti    = scopreIn('revealInviteCode');
  const daMostrare  = toccaIn('revealInviteCode');
  assert.ok(daMostrare.size > 0 && chiusiPrima.size > 0, 'funzioni non lette');

  const guai = [];
  for (const id of daMostrare){
    for (const contenitore of [id, ...ancestorsOf(id)]){
      if (chiusiPrima.has(contenitore) && !riaperti.has(contenitore))
        guai.push(`${id}: showContactReconnectLayout chiude ${contenitore} e revealInviteCode non lo riapre`);
    }
  }
  assert.deepStrictEqual(guai.sort(), [], guai.join(' | '));
});

/* ---------------------------------------------------- cosa sta in prima pagina -- */
/* ⚠️ Questo controllo esiste per una ragione sola, ed e' successa tre volte in
   un giorno: la prima pagina si riempie da sola. Ogni cosa aggiunta li' aveva
   un buon motivo — la rubrica per chiamare in fretta, il riquadro «ha
   funzionato, passalo a qualcuno» — e messe insieme erano sei cose, di cui una
   sola era quella per cui uno l'app l'aveva aperta. L'operatore l'ha detto
   guardandola: «troppa carne al fuoco».
   La prima pagina risponde a tre domande — ho l'indirizzo di qualcuno? voglio
   invitare qualcuno? mi hanno mandato un codice? — piu' un'uscita di servizio,
   «fai conoscere l'app», che l'operatore ha voluto li' («e' un tasto
   importante») e che infatti non e' una quarta domanda: e' orizzontale e
   piccola, sotto le tre.
   Quello che resta fuori resta fuori. Se una cosa nuova deve entrare, si
   modifica questo controllo APPOSTA, sapendo cosa si sta facendo. */
const SEZIONI = Object.fromEntries(
  [...HTML.matchAll(/<section id="(screen[A-Za-z]+)"[^>]*>([\s\S]*?)<\/section>/g)]
    .map(m => [m[1], m[2]]));

test('la prima pagina non si riprende la rubrica lunga', () => {
  assert.ok(SEZIONI.screenHome && SEZIONI.screenSettings, 'le due schermate non sono state lette');
  /* id -> perche' non deve stare in prima pagina */
  const SFRATTATI = {
    contactsCard: 'la rubrica lunga: avatar, date e una × che cancella, letta prima di tutto e utile per ultima',
    contactsList: 'idem — l\'elenco vero e proprio',
  };
  const guai = [];
  for (const [id, perche] of Object.entries(SFRATTATI)){
    if (new RegExp(`id="${id}"`).test(SEZIONI.screenHome))
      guai.push(`#${id} e' tornato in prima pagina — ${perche}`);
    if (!new RegExp(`id="${id}"`).test(SEZIONI.screenSettings))
      guai.push(`#${id} non e' nelle impostazioni: spostato o cancellato?`);
  }
  assert.deepStrictEqual(guai, [], guai.join(' | '));
});

test('«fai conoscere l\'app» sta in prima pagina, ma NON come terzo pulsantone', () => {
  /* ⚠️ Rimesso in home il 6 set 2026 su richiesta esplicita dell'operatore
     («è un tasto importante») dopo che la 4.22 l'aveva spostato dietro la
     rotellina. La parte che questo controllo protegge non e' che ci sia — e'
     che non torni a essere un pulsantone: `.sharebtn` e' orizzontale e basso,
     `.bigchoice` e' il blocco alto e pieno. Rimetterlo in quella classe
     significherebbe tre blocchi pieni in fila e nessuna gerarchia. */
  assert.match(SEZIONI.screenHome, /id="btnShareApp"/,
    'il pulsante per far conoscere l\'app deve stare in prima pagina');
  assert.doesNotMatch(SEZIONI.screenSettings, /id="btnShareApp"/,
    'e in un posto solo: due copie dello stesso id romperebbero il controllo sui duplicati');
  const riga = SEZIONI.screenHome.match(/<button[^>]*id="btnShareApp"[^>]*>/)[0];
  assert.match(riga, /class="sharebtn"/,
    'deve restare il pulsante orizzontale basso');
  assert.doesNotMatch(riga, /bigchoice/,
    'non deve tornare un terzo pulsantone: sotto i due grandi, non accanto a loro');
});

/* ------------------------------------------- la copia di prova -- */
/* ⚠️ La copia di prova vive nello STESSO sito dell'app vera — deve, o il relay
   la rifiuterebbe come rifiuta localhost. Ma stesso sito vuol dire stessa
   memoria del browser: senza separazione, provare qualcosa li' dentro
   userebbe l'identita' e i contatti VERI dell'operatore, e una prova
   sbagliata potrebbe cancellargli la cronologia vera.
   La separazione la fa `PFX_PROVA`, e regge solo se NESSUNO scavalca il punto
   di passaggio. Questi controlli esistono per quello. */

test('nessuno tocca la memoria del browser scavalcando il punto di passaggio', () => {
  /* ⚠️ IL CONTROLLO PIU IMPORTANTE DELLA COPIA DI PROVA. Bastava UNA sola
     chiamata dimenticata a `localStorage` per rimettere in comunicazione le
     due memorie, in silenzio, e una separazione che dipende dal ricordarsi
     non e' una separazione. */
  const dentroMem = JS.slice(JS.indexOf('const MEM = {'), JS.indexOf('};', JS.indexOf('const MEM = {')) + 2);
  const fuori = JS.replace(dentroMem, '');
  const colpevoli = fuori.split('\n')
    .map((r, i) => [i + 1, r])
    .filter(([, r]) => r.includes('localStorage.'));
  assert.deepStrictEqual(colpevoli.map(([n, r]) => n + ': ' + r.trim()), [],
    'queste righe parlano con la memoria senza passare da MEM: nella copia di prova ' +
    'leggerebbero e scriverebbero i dati VERI');
  /* e il punto di passaggio deve davvero mettere il prefisso */
  assert.match(dentroMem, /localStorage\.getItem\(PFX_PROVA \+ k\)/, 'MEM legge senza prefisso');
  assert.match(dentroMem, /localStorage\.setItem\(PFX_PROVA \+ k, v\)/, 'MEM scrive senza prefisso');
  assert.match(dentroMem, /localStorage\.removeItem\(PFX_PROVA \+ k\)/, 'MEM cancella senza prefisso');
});

test('anche i due depositi grandi e la cache dei file condivisi sono separati', () => {
  /* localStorage non e' l'unico posto dove l'app tiene roba: la CHIAVE
     D'IDENTITA' sta in un database, e i file ricevuti in un altro. Quelli
     mescolati sarebbero il danno peggiore di tutti. */
  assert.match(JS, /const ID_DB = PFX_PROVA \+ 'dvlogos-id';/,
    'il deposito dell\'identita\' non e\' separato: la copia di prova userebbe la tua chiave vera');
  assert.match(JS, /const MEDIA_DB = PFX_PROVA \+ 'dvlogos-media'/,
    'il deposito di foto e file non e\' separato');
  assert.match(JS, /caches\.open\(PFX_PROVA \+ 'logos-modifica-share-temp'\)/,
    'la cache dei file condivisi non e\' separata');
});

test('la copia di prova si annuncia, e non si puo\' chiudere', () => {
  /* Una copia che non si annuncia e' peggio di non averla: qualcuno ci parla
     dentro credendo sia l'app vera, e siccome le memorie sono separate i suoi
     contatti li' non esistono da nessun'altra parte. */
  assert.match(HTML, /id="provaBar"/, 'la fascia che avverte non c\'e\' piu\'');
  const fascia = HTML.match(/<div class="provabar hide" id="provaBar">[\s\S]*?<\/div>/);
  assert.ok(fascia, 'la fascia non ha piu\' la forma attesa');
  assert.doesNotMatch(fascia[0], /class="x"|aria-label="close"/,
    'la fascia non deve avere una x: chi la chiudesse continuerebbe a parlare in una copia');
  assert.match(JS, /if \(IN_PROVA\)\{ try\{ \$\('provaBar'\)\.classList\.remove\('hide'\)/,
    'niente accende la fascia quando si gira dalla copia di prova');
  /* e nell'app vera resta spenta */
  assert.match(HTML, /<div class="provabar hide"/, 'la fascia deve partire nascosta');
});

test('lo strumento che genera la copia le da\' un deposito offline suo', () => {
  /* Due copie che condividono il nome della cache si servono i file a
     vicenda: la prova mostrerebbe pezzi dell'app vera e viceversa. */
  const tool = read('tools/prova.js');
  assert.match(tool, /const CACHE = 'prova--logos-modifica-\$1';/,
    'la copia di prova userebbe lo stesso deposito offline dell\'app vera');
  assert.match(tool, /noindex/,
    'una copia di prova che finisce sui motori di ricerca ci manda dentro estranei');
});

test('quando arriva una versione nuova, l\'app lo DICE', () => {
  /* ⚠️ Il difetto che ha fatto perdere piu' tempo a tutti: l'operatore
     pubblicava, apriva computer e telefono, e non vedeva niente di nuovo —
     «la web app non è stata aggiornata? perché non vedo la versione nuova?».
     L'app si aggiornava per davvero, ma AL CARICAMENTO DOPO e in silenzio: chi
     guardava lo schermo continuava a eseguire il codice vecchio gia' in
     memoria, e l'unico posto dove accorgersene era «Come sta l'app», dentro
     la rotellina.
     Tre cose devono restare vere, e questo controllo le fissa. */
  assert.match(HTML, /id="updateBar"/,
    'la striscia che annuncia la versione nuova non c\'e\' piu\'');
  assert.match(HTML, /id="btnUpdateNow"/,
    'e senza il pulsante l\'avviso sarebbe solo una frase');

  /* 1 — fuori da ogni schermata: un aggiornamento arriva mentre stai facendo
     qualsiasi cosa, non solo mentre guardi la prima pagina */
  const dentroUnaSchermata = Object.values(SEZIONI).some(s => /id="updateBar"/.test(s));
  assert.strictEqual(dentroUnaSchermata, false,
    'dentro una schermata, l\'avviso resterebbe invisibile a chi sta altrove');

  /* 2 — si aggancia al momento in cui il codice nuovo prende il posto del
     vecchio, che e' l'unico in cui lo si puo' sapere */
  assert.match(JS, /addEventListener\('controllerchange'/,
    'senza controllerchange nessuno sa dire quando e\' cambiata la versione');

  /* 3 — ⚠️ e NON lo dice alla primissima visita: li' controllerchange scatta
     lo stesso (da nessun service worker a uno), e «c'e' una versione nuova»
     sarebbe falso, detto proprio a chi capisce di meno */
  assert.match(JS, /const cEraGiaUnaCopia = !!navigator\.serviceWorker\.controller;/,
    'senza questa guardia, chi apre l\'app per la prima volta legge di un aggiornamento che non c\'e\'');
  assert.match(JS, /if \(!cEraGiaUnaCopia\) return;/,
    'la guardia c\'e\' ma non viene usata');
});

test('chiudere una conversazione non e\' sepolto dentro un menu', () => {
  /* ⚠️ Il difetto segnalato dall'operatore il 7 set 2026: per terminare una
     chat bisognava aprire i tre pallini e poi scegliere «Termina chat».
     `btnEndChat` deve stare nella BARRA della chat — visibile senza aprire
     niente — e non dentro `#menuPanel`. Il controllo guarda dov'e', perche'
     e' esattamente la cosa che si perde riordinando la pagina. */
  const chat = SEZIONI.screenChat;
  assert.ok(chat, 'la schermata della chat non e\' stata letta');
  const barra = chat.match(/<div class="chatheader">([\s\S]*?)<\/div>\s*\n\s*<div id="callBox"/);
  assert.ok(barra, 'la barra della chat non e\' stata trovata');
  assert.match(barra[1], /id="btnEndChat"/,
    'il tasto per terminare deve stare nella barra, non dietro i tre pallini');
  const menu = chat.slice(chat.indexOf('id="menuPanel"'));
  assert.doesNotMatch(menu.slice(0, menu.indexOf('</div>\n  </section>')), /id="btnEndChat"/,
    'e non deve essere finito dentro il pannello degli strumenti');
  /* «Termina chat» resta ANCHE nel menu, per chi ha preso quell'abitudine:
     toglierlo sarebbe stato spostare il problema, non risolverlo */
  assert.match(chat, /id="btnNewSession"/,
    'la voce nel menu non va tolta: chi la usa da sempre non deve perderla');
});

test('i nomi e la riga di stato stanno FUORI dal blocco dell\'indirizzo che si richiude', () => {
  /* ⚠️ Il blocco `#addrDial` parte chiuso per tutti (vedi refreshAddrDial).
     Se `#addrPeople` o `#addrDialStatus` finissero dentro, si chiuderebbero
     con lui: i nomi sono il modo NORMALE di richiamare qualcuno, e in quella
     riga di stato compaiono «Ha rifiutato la chiamata» e «Non ha risposto» —
     cioe' la risposta a una chiamata appena tentata diventerebbe invisibile.
     E' il difetto piu' facile da reintrodurre riordinando questa pagina. */
  const blocco = SEZIONI.screenHome.match(/<div class="addrdial hide" id="addrDial">([\s\S]*?)<\/div>\s*\n\s*<!--/);
  assert.ok(blocco, 'il blocco #addrDial non e\' stato trovato');
  for (const id of ['addrPeople', 'addrDialStatus']){
    assert.doesNotMatch(blocco[1], new RegExp(`id="${id}"`),
      `#${id} e' finito dentro il blocco che si richiude: si chiuderebbe insieme a lui`);
  }
  /* e il campo che DEVE starci dentro, per non dire il contrario per sbaglio */
  assert.match(blocco[1], /id="addrDialIn"/,
    'il campo per scrivere l\'indirizzo deve invece stare dentro: e\' quello che si apre');
});

test('quello che serve per raggiungere qualcuno sta in prima pagina, e nell\'ordine giusto', () => {
  /* L'ordine nel documento E' l'ordine sullo schermo: le nove regole `order:`
     che rimescolavano questa pagina sono state tolte apposta, perche' chi legge
     il codice e chi usa l'app devono vedere la stessa pagina. */
  const ATTESI = ['lettersCard', 'addrPeople', 'addrDialStatus', 'showAddrDial', 'addrDialIn',
                  'goStart', 'goJoin', 'btnShareApp'];
  const dove = ATTESI.map(id => [id, SEZIONI.screenHome.indexOf(`id="${id}"`)]);
  for (const [id, pos] of dove) assert.notStrictEqual(pos, -1, `#${id} non e' piu' in prima pagina`);
  const fuoriPosto = dove.filter(([, pos], i) => i > 0 && pos < dove[i - 1][1]);
  assert.deepStrictEqual(fuoriPosto.map(([id]) => id), [],
    'l\'ordine atteso e\': messaggi lasciati, i NOMI, la riga di stato, la domanda «ti hanno dato ' +
    'un indirizzo?», il campo che apre, i due pulsantoni, poi «fai conoscere l\'app». ' +
    'I nomi PRIMA di tutto il resto perche\' toccarne uno e\' il modo normale di richiamare ' +
    'qualcuno; il campo dell\'indirizzo DOPO perche\' scriverlo a mano e\' il caso raro; e la ' +
    'condivisione ULTIMA perche\' non e\' il motivo per cui uno ha aperto l\'app');
});

/* ------------------------------------------------------------ the languages -- */
/* Thirteen languages is a promise to thirteen groups of people, and a missing
   key does not crash — it quietly shows Italian to somebody who does not read
   Italian, which is the kind of failure nobody reports. */

const LANGS = ['it','en','ar','bn','de','es','fr','hi','id','pt','ru','ur','zh'];

function loadDictionaries(){
  const start = JS.indexOf('const I18N');
  const lastAssign = JS.lastIndexOf('Object.assign(I18N.');
  const end = JS.indexOf('});', lastAssign) + 3;
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(JS.slice(start, end) + '\nthis.OUT = I18N;', sandbox);
  return sandbox.OUT;
}

test('all thirteen languages are present', () => {
  const I18N = loadDictionaries();
  assert.deepStrictEqual(Object.keys(I18N).sort(), [...LANGS].sort());
});

test('no language is missing a line, and none has one nobody asked for', () => {
  const I18N = loadDictionaries();
  const base = new Set(Object.keys(I18N.it));
  for (const lg of LANGS){
    const keys = new Set(Object.keys(I18N[lg]));
    const missing = [...base].filter(k => !keys.has(k)).sort();
    const extra = [...keys].filter(k => !base.has(k)).sort();
    assert.deepStrictEqual(missing, [], `${lg} is missing: ${missing.join(', ')}`);
    assert.deepStrictEqual(extra, [], `${lg} has lines nothing uses: ${extra.join(', ')}`);
  }
});

test('no translation is left empty', () => {
  const I18N = loadDictionaries();
  const empty = [];
  for (const lg of LANGS)
    for (const [k, v] of Object.entries(I18N[lg]))
      if (typeof v !== 'string' || !v.trim()) empty.push(`${lg}/${k}`);
  assert.deepStrictEqual(empty, [], `empty translations: ${empty.join(', ')}`);
});

test('every line the code or the page asks for has been written', () => {
  const I18N = loadDictionaries();
  const base = new Set(Object.keys(I18N.it));
  const asked = new Set();
  for (const m of JS.matchAll(/\bt\(\s*'([^']+)'/g)) asked.add(m[1]);
  for (const m of HTML.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)) asked.add(m[1]);
  for (const m of JS.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)) asked.add(m[1]);
  const unknown = [...asked].filter(k => !base.has(k)).sort();
  assert.deepStrictEqual(unknown, [], `asked for but never written: ${unknown.join(', ')}`);
});

/* ------------------------------------ il CONTENUTO delle traduzioni -- */
/* ⚠️ I controlli qui sopra guardano che tutte e 13 le lingue abbiano le stesse
   VOCI. Nessuno guardava che il testo fosse nella lingua giusta — e il 7 set
   2026 e' uscita in produzione una pagina italiana con dentro una frase in
   inglese, con la suite tutta verde. La riga sbagliata era IDENTICA, carattere
   per carattere, a quella inglese: bastava chiederselo.
   Due regole, tarate misurando i falsi allarmi sul codice sano prima di
   scriverle. Un controllo che grida al lupo viene ignorato entro due
   settimane, ed e' il modo piu' comune in cui muore un collaudo. */

/* Sotto la soglia le coincidenze sono vere e normali: «Video», «OK», e fra
   spagnolo e portoghese frasi corte davvero identiche («Código copiado»).
   Misurato: a >=20 caratteri e >=3 parole i falsi allarmi sono ZERO in
   entrambi i dizionari. La frase che sfuggi' era lunga 83 caratteri. */
const GEMELLE_CARATTERI = 20, GEMELLE_PAROLE = 3;

function frasiGemelle(diz){
  const lingue = Object.keys(diz);
  const chiavi = new Set();
  for (const l of lingue) for (const k of Object.keys(diz[l] || {})) chiavi.add(k);
  const guai = [];
  for (const k of chiavi){
    const visto = new Map();
    for (const l of lingue){
      const v = diz[l] && diz[l][k];
      if (typeof v !== 'string' || v.length < GEMELLE_CARATTERI) continue;
      if (v.trim().split(/\s+/).length < GEMELLE_PAROLE) continue;
      if (visto.has(v)) guai.push(`${k}: ${visto.get(v)} e ${l} hanno la stessa identica frase — «${v.slice(0, 70)}»`);
      else visto.set(v, l);
    }
  }
  return guai.sort();
}

test('nessuna lingua porta la frase esatta di un\'altra', () => {
  assert.deepStrictEqual(frasiGemelle(loadDictionaries()), [],
    'due lingue con la stessa frase lunga: quasi sempre vuol dire che una porta il testo dell\'altra');
});

/* La seconda regola prende anche il caso che la prima non vede: una frase
   latina finita in arabo senza essere copiata da nessuno. Vale solo dove
   l'alfabeto e' inequivocabile — fra italiano, spagnolo e portoghese nessun
   alfabeto le distingue, e fingere il contrario sarebbe un controllo che
   mente. */
const ALFABETI = {
  ru: /[Ѐ-ӿ]/, zh: /[一-鿿]/, ar: /[؀-ۿ]/,
  ur: /[؀-ۿ]/, hi: /[ऀ-ॿ]/, bn: /[ঀ-৿]/,
};

function alfabetoSbagliato(diz){
  /* tolti i segnaposto e tutto cio' che non e' lettera: «DV-XXXX-XXXX-XXXX» e
     «{sent} / {total}» sono uguali in tutte le lingue di proposito, e senza
     questo sarebbero sei falsi allarmi fissi. Misurato: cosi' sono zero. */
  const nudo = v => v.replace(/\{[^}]*\}/g, '').replace(/[^\p{L}]/gu, '');
  const guai = [];
  for (const [lg, alfabeto] of Object.entries(ALFABETI)){
    for (const [k, v] of Object.entries(diz[lg] || {})){
      if (typeof v !== 'string' || !/\s/.test(v) || nudo(v).length < 8) continue;
      if (!alfabeto.test(v)) guai.push(`${lg} / ${k}: frase senza una sola lettera di quell'alfabeto — «${v.slice(0, 70)}»`);
    }
  }
  return guai.sort();
}

test('una lingua che si scrive con un altro alfabeto lo usa davvero', () => {
  assert.deepStrictEqual(alfabetoSbagliato(loadDictionaries()), [],
    'una frase in caratteri latini dentro il dizionario arabo, russo o cinese non e\' una traduzione');
});

test('a placeholder in one language is a placeholder in all of them', () => {
  /* {name} written in Italian and forgotten in Urdu shows a reader the raw
     word "{name}" — or worse, drops the only useful part of the sentence. */
  const I18N = loadDictionaries();
  const wrong = [];
  for (const key of Object.keys(I18N.it)){
    const want = (I18N.it[key].match(/\{\w+\}/g) || []).sort().join(',');
    for (const lg of LANGS){
      const got = (I18N[lg][key].match(/\{\w+\}/g) || []).sort().join(',');
      if (got !== want) wrong.push(`${key} — it has [${want}], ${lg} has [${got}]`);
    }
  }
  assert.deepStrictEqual(wrong, [], `placeholders do not match:\n${wrong.join('\n')}`);
});

/* ------------------------------------------------------------- the version -- */
/* The oldest trap in this project: publish a change, see the old app, conclude
   the change did not work, and go looking for a bug that is not there. */

test('the app and its service worker claim the same version', () => {
  const inJs = JS.match(/APP_VERSION\s*=\s*'([^']+)'/);
  const inSw = SW.match(/CACHE\s*=\s*'([^']+)'/);
  assert.ok(inJs, 'APP_VERSION not found in modifica.js');
  assert.ok(inSw, 'CACHE not found in modifica-sw.js');
  assert.strictEqual(inJs[1], inSw[1],
    `modifica.js says ${inJs[1]}, modifica-sw.js says ${inSw[1]} — bump both`);
});

/* -------------------------------------------------------------- the origins -- */
/* The app tells people "this copy is at an address the service refuses". It can
   only tell the truth about that while its own list matches the Worker's. */

/* A comment sitting between the brackets is normal and welcome — these lists are
   exactly the place that deserves explaining. An apostrophe inside one would
   otherwise read as the start of an origin, so comments come out first. */
function originsIn(source, name){
  const body = (source.match(new RegExp(name + '\\s*=\\s*\\[([^\\]]*)\\]')) || [, ''])[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    /* Only at the start of a line, or the two slashes of https:// would take
       the origin they belong to away with them. */
    .replace(/(^|\n)[ \t]*\/\/[^\n]*/g, '$1');
  return [...body.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

test('the app knows exactly which origins the Worker answers for', () => {
  const inApp = originsIn(JS, 'SERVICE_ORIGINS');
  const inWorker = originsIn(WORKER, 'ALLOWED_ORIGINS');
  assert.ok(inApp.length, 'SERVICE_ORIGINS not found in modifica.js');
  assert.deepStrictEqual(inApp.sort(), inWorker.sort(),
    'the app and the Worker disagree about which origins work');
});

/* ------------------------------------------------------------ the peek -- */
/* The Android app rings by asking the relay whether a call is waiting. If that
   look emptied the box, the app would open to nothing and the call would be
   lost — the feature would destroy exactly what it exists to announce. It is
   one `await` away from being wrong and nothing on a screen would ever show
   it, so it is held here instead. */

test('looking into a mailbox without emptying it really does not empty it', () => {
  const get = WORKER.slice(WORKER.indexOf('async function handleMailbox'));
  const body = get.slice(0, get.indexOf('\n}'));
  const peekAt = body.indexOf("peek");
  assert.ok(peekAt > 0, 'the peek branch is gone from the Worker');

  /* everything the peek branch does, from the test on ?peek= to its closing
     brace: no delete may appear anywhere inside it.

     ⚠️ I COMMENTI VANNO TOLTI PRIMA DI GUARDARE, e il motivo e' una lezione
     sui test che leggono il testo del codice invece di eseguirlo: il 1 set
     2026 questo test e' diventato rosso perche' un commento NUOVO, aggiunto
     poco sopra, conteneva la parola "delete" spiegando che la lettura
     ordinaria ne fa una. Il codice era giusto, la garanzia intatta: a mentire
     era il modo di misurare. Un test cosi' e' utile — coglie cose che nessuna
     esecuzione mostrerebbe — ma deve guardare il CODICE, e un commento non
     cancella niente. */
  const senzaCommenti = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const branch = senzaCommenti(
    body.slice(peekAt, body.indexOf('const val = await env.MAILBOX.get(key)', peekAt)));
  assert.ok(branch.length > 40, 'could not read the peek branch');
  assert.ok(!/delete/.test(branch),
    'a peek that deletes swallows the very call it is ringing about');

  /* and the ordinary read must still delete, or a message could be replayed */
  const ordinary = body.slice(body.indexOf('const val = await env.MAILBOX.get(key)'));
  assert.match(ordinary, /MAILBOX\.delete\(key\)/,
    'the ordinary read must stay read-once');
});

/* --------------------------------------------------- nothing from outside -- */
/* Loading no code written by anybody else is this app's strongest security
   property. It is worth a test rather than a good intention. */

/* A <link rel="canonical"> names a page, it does not fetch one — only the rels
   below actually pull something down, and those are the ones that matter. */
const FETCHING_RELS = /\b(stylesheet|preload|prefetch|modulepreload|prerender|icon|apple-touch-icon|manifest)\b/i;

function loadsFromElsewhere(html){
  const offenders = [];
  for (const m of html.matchAll(/<(script|link)\b[^>]*>/gi)){
    const tag = m[0];
    const url = (tag.match(/(?:src|href)="([^"]+)"/i) || [])[1];
    if (!url) continue;
    if (!(/^https?:\/\//i.test(url) || url.startsWith('//'))) continue;
    const isScript = /^<script/i.test(tag);
    const rel = (tag.match(/\brel="([^"]*)"/i) || [, ''])[1];
    if (isScript || FETCHING_RELS.test(rel)) offenders.push(tag.trim());
  }
  return offenders;
}

test('the page loads no script, style or font from anywhere else', () => {
  const offenders = loadsFromElsewhere(HTML);
  assert.deepStrictEqual(offenders, [], `loaded from elsewhere:\n${offenders.join('\n')}`);
});

test('the security policy still forbids outside code', () => {
  const csp = (HTML.match(/Content-Security-Policy"\s*content="([\s\S]*?)"/) || [,''])[1];
  assert.match(csp, /default-src 'self'/, 'default-src is no longer self');
  assert.match(csp, /script-src 'self'/, 'script-src is no longer self');
  assert.ok(!/unsafe-inline|unsafe-eval/.test(csp),
    `the policy has been loosened: ${csp.replace(/\s+/g, ' ').trim()}`);
});

test('nothing in the page uses an inline style the policy would block', () => {
  const found = [...HTML.matchAll(/\sstyle="[^"]*"/g)].map(m => m[0].trim());
  assert.deepStrictEqual(found, [], `style attributes are blocked by the CSP:\n${found.join('\n')}`);
});

/* ------------------------------------------------------- what is cached -- */

test('the service worker caches every file the app is made of', () => {
  const cached = [...(SW.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/) || [,''])[1]
    .matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
  for (const needed of ['modifica.html', 'modifica.css', 'modifica.js']){
    assert.ok(cached.includes(needed), `${needed} is not in the offline cache`);
  }
  const missingOnDisk = cached.filter(f => !fs.existsSync(path.join(ROOT, f)));
  assert.deepStrictEqual(missingOnDisk, [],
    `the service worker caches files that do not exist: ${missingOnDisk.join(', ')}`);
});

/* ------------------------------------------------------- the front door -- */
/* The page somebody is sent before they have decided to care. It is held to
   the same standard as the app: thirteen languages, nothing loaded from
   anywhere else, and no promise the app cannot keep. */

const HOME_HTML = read('index.html');
const HOME_JS = read('index.js');

function homeDictionaries(){
  const out = {};
  for (const m of HOME_JS.matchAll(/^T\.(\w+) = \{([\s\S]*?)^\};/gm)){
    const keys = [...m[2].matchAll(/^\s*'([^']+)':/gm)].map(k => k[1]);
    out[m[1]] = keys;
  }
  return out;
}

/* ⚠️ Le stesse voci, ma col TESTO. Serve alle due regole sul contenuto qui
   sotto — e serve proprio qui: la frase inglese finita su una pagina italiana,
   il 7 set 2026, era in QUESTO file. ⚠️ E l'ordine delle lingue in index.js
   (`it, en, fr, …`) NON e' lo stesso di modifica.js (`en, it, fr, …`): e'
   esattamente la trappola in cui sono caduto. */
function homeTesti(){
  const out = {};
  for (const m of HOME_JS.matchAll(/^T\.(\w+) = \{([\s\S]*?)^\};/gm)){
    const d = {};
    for (const k of m[2].matchAll(/^\s*'([^']+)':\s*"((?:[^"\\]|\\.)*)"/gm)) d[k[1]] = k[2];
    out[m[1]] = d;
  }
  return out;
}

test('sulla pagina d\'ingresso nessuna lingua porta la frase di un\'altra', () => {
  /* ⚠️ E' QUI che e' successo davvero: `hero.apkNote` in italiano conteneva
     la frase inglese, identica carattere per carattere, ed e' andata online.
     Questo controllo l'avrebbe fermata. */
  assert.deepStrictEqual(frasiGemelle(homeTesti()), [],
    'la pagina d\'ingresso ha due lingue con la stessa identica frase');
});

test('e usa davvero l\'alfabeto di ogni lingua', () => {
  assert.deepStrictEqual(alfabetoSbagliato(homeTesti()), [],
    'la pagina d\'ingresso ha una frase in caratteri latini dentro un dizionario che non li usa');
});

test('the front door speaks the same thirteen languages as the app', () => {
  const dicts = homeDictionaries();
  assert.deepStrictEqual(Object.keys(dicts).sort(), [...LANGS].sort());
});

test('no language is missing a line on the front door', () => {
  const dicts = homeDictionaries();
  const base = new Set(dicts.it);
  for (const lg of LANGS){
    const missing = [...base].filter(k => !dicts[lg].includes(k)).sort();
    const extra = dicts[lg].filter(k => !base.has(k)).sort();
    assert.deepStrictEqual(missing, [], `the front door in ${lg} is missing: ${missing.join(', ')}`);
    assert.deepStrictEqual(extra, [], `the front door in ${lg} has spare lines: ${extra.join(', ')}`);
  }
});

test('every line the front door shows has been written', () => {
  const base = new Set(homeDictionaries().it);
  const asked = new Set([...HOME_HTML.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]));
  const unknown = [...asked].filter(k => !base.has(k)).sort();
  assert.deepStrictEqual(unknown, [], `the front door asks for lines nobody wrote: ${unknown.join(', ')}`);
});

test('the front door loads nothing from anywhere else either', () => {
  const offenders = loadsFromElsewhere(HOME_HTML);
  assert.deepStrictEqual(offenders, [], `the front door loads from elsewhere:\n${offenders.join('\n')}`);
});

test('the front door has no inline style or script the policy would block', () => {
  assert.deepStrictEqual([...HOME_HTML.matchAll(/\sstyle="[^"]*"/g)].map(m => m[0].trim()), []);
  assert.ok(!/<style[\s>]/i.test(HOME_HTML), 'an inline <style> block would be blocked by its own policy');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/i.test(HOME_HTML),
    'an inline <script> would be blocked by its own policy');
});

test('no page claims protection a <meta> policy cannot give', () => {
  /* frame-ancestors is silently ignored when the policy comes from a meta tag.
     Leaving it in looks like a defence and is only a console warning. */
  for (const [name, html] of [['index.html', HOME_HTML], ['modifica.html', HTML]]){
    const csp = (html.match(/Content-Security-Policy"\s*content="([\s\S]*?)"/) || [, ''])[1];
    assert.ok(!/frame-ancestors/.test(csp),
      `${name} declares frame-ancestors in a meta tag, where browsers ignore it`);
  }
});

test('the front door actually leads into the app', () => {
  assert.match(HOME_HTML, /href="modifica\.html"/, 'nothing on the front door opens the app');
});

/* --------------------------------------------------------- the stylesheet -- */

test('every class the stylesheet styles for the health card is really used', () => {
  for (const cls of ['healthrow', 'healthdot']){
    assert.ok(CSS.includes('.' + cls), `.${cls} has no styling`);
    assert.ok(JS.includes(cls), `.${cls} is styled but never used`);
  }
});

/* ⚠️ Trovato su un telefono vero l'8 set 2026: l'app era in inglese e la riga
   sotto l'indirizzo permanente era in italiano. Non era una traduzione
   mancante — tutte e 13 le lingue avevano quella frase, e infatti ogni
   controllo sui dizionari era verde. Il difetto stava altrove: applyLang()
   ridipinge solo cio' che ORIGINALS conosce, e ORIGINALS al lancio contiene
   gli elementi che portano data-i18n NELLA PAGINA. Un testo scritto dopo dal
   codice non e' li dentro, quindi si congela nella lingua in cui e' stato
   disegnato la prima volta e non cambia piu'. Erano tredici.
   La regola e' invertita apposta: non un elenco dei casi rotti (che invecchia
   il giorno dopo), ma il divieto della scorciatoia. Chi scrive una riga nuova
   deve passare da setT() — oppure dichiarare qui che e' un messaggio di
   passaggio, e in quel momento e' costretto a chiedersi se lo e' davvero. */
const PASSAGGIO = [
  'wipe.done',            /* «fatto»: sostituito dalla schermata che si chiude */
  'health.checking',      /* «controllo...»: sovrascritto appena arriva l'esito */
  'destruct.countdown',   /* si riscrive ogni secondo da solo */
];

test('un testo che resta a schermo passa da setT, cosi il cambio lingua lo ritrova', () => {
  const colpevoli = [];
  JS.split('\n').forEach((riga, i) => {
    const m = riga.match(/\.(textContent|innerHTML)\s*=\s*t\(\s*'([^']+)'/);
    if (!m) return;
    if (PASSAGGIO.includes(m[2])) return;
    colpevoli.push(`riga ${i + 1}: ${m[2]}`);
  });
  assert.deepStrictEqual(colpevoli, [],
    'scritto a mano invece che con setT(): al cambio lingua questa frase resta nella lingua vecchia. ' +
    'Se e\' davvero un messaggio di passaggio, aggiungi la chiave a PASSAGGIO con il motivo.');
});

test('setT registra la chiave, altrimenti non ridipinge niente', () => {
  const corpo = (JS.match(/function setT\([\s\S]*?\n\}/) || [''])[0];
  assert.ok(corpo, 'setT() non esiste piu\': senza, ogni testo scritto dal codice si congela');
  assert.ok(/ORIGINALS\.set\(/.test(corpo),
    'setT() scrive il testo ma non lo registra in ORIGINALS: applyLang() non sapra\' che esiste');
  assert.ok(/prev\.key\s*=\s*key/.test(corpo),
    'setT() non memorizza la chiave: al cambio lingua non c\'e\' niente da cui ridipingere');
});
