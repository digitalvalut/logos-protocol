/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 * Licensed under the Apache License, Version 2.0.
 */

/* ============================ LA COPIA DI PROVA ============================
 *
 * Genera `prova/`, una copia gemella dell'app da guardare PRIMA che la
 * modifica arrivi alla gente.
 *
 *     node tools/prova.js
 *
 * Perche' esiste, in una riga: il 7 set 2026 sono uscite sei versioni in un
 * giorno e sei difetti li ha trovati l'operatore usando l'app pubblicata. Era
 * lui il collaudo. Questo toglie a lui quel mestiere e lo restituisce a chi
 * scrive il codice.
 *
 * ⚠️ PERCHE' DENTRO LO STESSO SITO E NON ALTROVE. Il relay accetta solo tre
 * origini (ALLOWED_ORIGINS in turn-worker/worker.js) e rifiuta tutto il resto,
 * `localhost` compreso. Una copia su un altro indirizzo non potrebbe provare
 * NIENTE di quello che conta — inviti, indirizzi, chiamate. Restando nella
 * stessa casa, il relay la vede come l'app vera e funziona tutto.
 *
 * ⚠️ E il prezzo di quella scelta, pagato altrove: stesso sito = stessa
 * memoria del browser. La separazione la fa l'app, in `MEM`/`PFX_PROVA` dentro
 * modifica.js, non questo script. Qui si copia e basta.
 *
 * ⚠️ QUESTA CARTELLA E' OUTPUT E VA COMMESSA LO STESSO — e' l'unica eccezione
 * alla regola «l'output non si committa» di CLAUDE.md, e ha un motivo preciso:
 * GitHub Pages serve quello che sta nel repository, quindi una copia non
 * commessa non esisterebbe per nessuno. Il rischio che quella regola evita —
 * che qualcuno scarichi una copia vecchia credendola buona — qui non c'e',
 * perche' la copia si annuncia da sola con una fascia rossa a tutta pagina.
 *
 * COME SI LAVORA, da qui in avanti:
 *   1. si modifica l'app come sempre (modifica.js/html/css)
 *   2. `node tools/prova.js` + commit della SOLA cartella prova/  -> l'operatore
 *      guarda su .../logos-protocol/prova/modifica.html
 *   3. approvata: si committano i file veri  -> va a tutti
 * Fra il passo 2 e il 3 il sito vero non cambia di una virgola.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'prova');

/* Tutto cio' che serve all'app per stare in piedi da sola. Se un domani se ne
   aggiunge uno e ci si dimentica qui, la copia di prova si rompe in modo
   visibile (icona mancante, foglio di stile assente): meglio cosi' che una
   copia che sembra buona e non lo e'. */
const FILE = [
  'modifica.html', 'modifica.css', 'modifica.js', 'modifica-sw.js',
  'modifica-manifest.webmanifest',
  'modifica-icon-192.png', 'modifica-icon-512.png', 'modifica-apple-touch-icon.png',
];

fs.mkdirSync(DEST, { recursive: true });

let scritti = 0;
for (const nome of FILE){
  const da = path.join(ROOT, nome);
  if (!fs.existsSync(da)) throw new Error('manca un file dell\'app: ' + nome);
  const bin = /\.(png|jpe?g|webp|ico)$/i.test(nome);

  if (bin){
    fs.copyFileSync(da, path.join(DEST, nome));
    scritti++;
    continue;
  }

  let testo = fs.readFileSync(da, 'utf8');

  if (nome === 'modifica-sw.js'){
    /* ⚠️ Il nome della cache DEVE cambiare, o le due copie si contendono lo
       stesso deposito offline: la prova servirebbe all'app vera file suoi e
       viceversa, cioe' esattamente il contrario di due mondi separati. */
    const prima = testo;
    testo = testo.replace(/const CACHE = 'logos-modifica-([^']+)';/,
                          "const CACHE = 'prova--logos-modifica-$1';");
    if (testo === prima) throw new Error('non sono riuscito a rinominare la cache del service worker');
    testo = testo.replace(/const SHARE_CACHE = 'logos-modifica-share-temp';/,
                          "const SHARE_CACHE = 'prova--logos-modifica-share-temp';");
  }

  if (nome === 'modifica.html'){
    /* Fuori dai motori di ricerca: una copia di prova che compare su Google
       accanto all'app vera e' un modo perfetto per mandarci dentro qualcuno
       che non c'entra niente. */
    const prima = testo;
    testo = testo.replace(/(<meta name="viewport"[^>]*>)/,
      '$1\n  <!-- generato da tools/prova.js — non modificare a mano -->\n' +
      '  <meta name="robots" content="noindex, nofollow">');
    if (testo === prima) throw new Error('non trovo dove mettere il divieto ai motori di ricerca');
  }

  fs.writeFileSync(path.join(DEST, nome), testo);
  scritti++;
}

/* Una nota per chi trova questa cartella e non sa cosa sia. */
fs.writeFileSync(path.join(DEST, 'LEGGIMI.md'),
  '# Copia di prova — non e\' l\'app\n\n' +
  'Generata da `tools/prova.js`. **Non modificare niente qui dentro a mano**:\n' +
  'la prossima generazione lo cancella.\n\n' +
  'Serve a guardare una modifica prima che arrivi alla gente. Vive nello stesso\n' +
  'sito dell\'app vera perche\' il relay accetta solo tre origini e rifiuterebbe\n' +
  'una copia altrove — ma tutto quello che salva ha un nome diverso\n' +
  '(`prova--`), quindi identita\', contatti e cronologia sono separati.\n\n' +
  'L\'app vera resta a `../modifica.html`.\n');

const v = (fs.readFileSync(path.join(ROOT, 'modifica.js'), 'utf8')
  .match(/const APP_VERSION = '([^']+)'/) || [])[1] || '?';

console.log('copia di prova generata: ' + scritti + ' file, versione ' + v);
console.log('  guardala su  https://digitalvalut.github.io/logos-protocol/prova/modifica.html');
console.log('  ⚠️ committa SOLO prova/ finche\' non e\' approvata.');
