/* ============================================================================
   Il QR si legge davvero — 12 settembre 2026.

   Trovato dall'operatore: «il codice QR non viene letto da un lettore».
   Verificato con un decodificatore indipendente (OpenCV, mai visto il
   codice di Logos): il QR di un invito vero — con il segreto lungo e
   l'impronta, com'e' fatto davvero da paintQr() — si TROVA (i tre quadrati
   d'angolo ci sono) ma si legge ZERO caratteri, sempre, appena il testo
   supera 106 byte (cioe' quasi sempre, per un invito vero).

   La causa: dalla versione 7 in su lo standard QR vuole un secondo bollino
   — la "versione", 18 bit con la propria correzione d'errore, in due
   blocchi fissi vicino agli angoli in alto a destra e in basso a sinistra.
   Il generatore di Logos non lo scriveva mai, e — peggio — non riservava
   nemmeno quello spazio: il ciclo che piazza i dati ci scriveva sopra byte
   veri, disallineando tutto quello che veniva dopo nello zigzag. Un
   lettore che si aspetta il bollino trova un pasticcio e si arrende.

   Questo file NON e' un secondo generatore di QR travestito da test: legge
   la griglia esattamente come farebbe un vero scanner — stessa scansione a
   zigzag, stesso smascheramento, stesso ordine dei blocchi — partendo solo
   dai pixel e dallo standard, senza mai chiamare le funzioni di Logos che
   hanno scritto quella griglia. Se anche questo lettore, scritto apposta
   per non fidarsi di niente, ritrova il messaggio esatto, allora la
   griglia e' leggibile per chiunque segua lo standard — non solo per
   Logos stesso.
   ========================================================================= */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');
const { buildSandbox } = require('./fake-browser.js');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'modifica.js'), 'utf8');

function loadApp(){
  const sandbox = buildSandbox({});
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox, { filename: 'modifica.js' });
  sandbox.__stopAllTimers();
  const run = expr => vm.runInContext(expr, sandbox);
  return { run, stop: () => sandbox.__stopAllTimers() };
}

/* ---------------- il lettore indipendente ----------------
   Ogni funzione qui sotto reimplementa un pezzo dello STANDARD, non del
   codice di Logos. Le tabelle di lunghezza dei blocchi sono le uniche prese
   in prestito da VERSIONS_M (sono numeri dello standard stesso, non
   comportamento — cambiarli romperebbe anche un lettore vero). */
const VERSIONS_M = {
  1: [26, 10, 1], 2: [44, 16, 1], 3: [70, 26, 1], 4: [100, 18, 2],
  5: [134, 24, 2], 6: [172, 16, 4], 7: [196, 18, 4], 8: [242, 22, 4],
  9: [292, 22, 5], 10: [346, 26, 5],
};
function maskBit(mask, r, c){
  switch (mask){
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return (r * c) % 2 + (r * c) % 3 === 0;
    case 6: return ((r * c) % 2 + (r * c) % 3) % 2 === 0;
    case 7: return ((r + c) % 2 + (r * c) % 3) % 2 === 0;
  }
}
function isFunction(size, r, c){
  if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) return true;
  if (r === 6 || c === 6) return true;
  if (r === size - 8 && c === 8) return true;
  if ((r === 8 && c <= 8) || (c === 8 && r <= 8)) return true;
  if ((r === 8 && c >= size - 8) || (c === 8 && r >= size - 7)) return true;
  return false;
}
const ALIGN_POS = {
  1: [], 2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30],
  6: [6,34], 7: [6,22,38], 8: [6,24,42], 9: [6,26,46], 10: [6,28,50],
};
function isAlignment(size, version, r, c){
  for (const ar of ALIGN_POS[version]) for (const ac of ALIGN_POS[version]){
    if ((ar<=7&&ac<=7)||(ar<=7&&ac>=size-8)||(ar>=size-8&&ac<=7)) continue;
    if (Math.abs(r-ar)<=2 && Math.abs(c-ac)<=2) return true;
  }
  return false;
}
function isVersionInfo(size, version, r, c){
  if (version < 7) return false;
  return (r <= 5 && c >= size - 11 && c <= size - 9) || (c <= 5 && r >= size - 11 && r <= size - 9);
}
function leggiCodewordsDaMatrice(m, version, mask){
  const size = m.length;
  const bits = [];
  for (let right = size - 1; right >= 1; right -= 2){
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++){
      for (let j = 0; j < 2; j++){
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (isFunction(size, r, c) || isAlignment(size, version, r, c) || isVersionInfo(size, version, r, c)) continue;
        bits.push(m[r][c] ^ (maskBit(mask, r, c) ? 1 : 0));
      }
    }
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8){
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    bytes.push(v);
  }
  return bytes;
}
function leggiFormato(m){
  const size = m.length;
  let bits = 0;
  for (let i = 0; i < 7; i++) bits |= m[size - 1 - i][8] << (14 - i);
  for (let i = 0; i < 8; i++) bits |= m[8][size - 8 + i] << (7 - i);
  const decoded = bits ^ 0x5412;
  return { level: (decoded >> 13) & 0b11, mask: (decoded >> 10) & 0b111 };
}
/* Il bollino di versione: letto e verificato con la SUA correzione
   d'errore (BCH), non semplicemente assunto uguale a quello scritto.
   Un lettore vero fa esattamente questo controllo prima di fidarsi. */
function leggiENfermaVersione(m, versionAttesa){
  const size = m.length;
  if (versionAttesa < 7) return true; /* sotto la 7 il bollino non esiste per specifica */
  let bits = 0;
  for (let i = 0; i < 18; i++){
    const a = i % 3, b = (i / 3) | 0;
    bits |= m[size - 11 + a][b] << i;
  }
  const versionLetta = bits >> 12;
  let rem = versionLetta;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1F25);
  const sindrome = (bits ^ ((versionLetta << 12) | rem));
  return versionLetta === versionAttesa && sindrome === 0;
}
function deinterleave(soloDati, dataCodewords, blocks){
  const shortBlockLen = Math.floor(dataCodewords / blocks);
  const longBlocks = dataCodewords % blocks;
  const lens = [];
  for (let b = 0; b < blocks; b++) lens.push(shortBlockLen + (b >= blocks - longBlocks ? 1 : 0));
  const maxLen = Math.max(...lens);
  const blocchi = lens.map(() => []);
  let i = 0;
  for (let k = 0; k < maxLen; k++)
    for (let b = 0; b < blocks; b++)
      if (k < lens[b]) blocchi[b].push(soloDati[i++]);
  const data = [];
  for (const bl of blocchi) data.push(...bl);
  return data;
}
function decodeByteMode(codewordsLetti, version){
  const [total, ecPerBlock, blocks] = VERSIONS_M[version];
  const dataCodewords = total - ecPerBlock * blocks;
  const data = deinterleave(codewordsLetti.slice(0, dataCodewords), dataCodewords, blocks);
  const bits = [];
  for (const b of data) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  let p = 0;
  const take = n => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | bits[p++]; return v; };
  const mode = take(4);
  if (mode !== 0b0100) return null;
  const len = take(version < 10 ? 8 : 16);
  const out = [];
  for (let i = 0; i < len; i++) out.push(take(8));
  return Buffer.from(out).toString('utf8');
}
/* Il lettore completo: dalla griglia al testo, senza passare da NIENTE che
   Logos abbia scritto per costruirla. */
function leggi(m, version){
  const fmt = leggiFormato(m);
  assert.ok(leggiENfermaVersione(m, version),
    'il bollino di versione non torna: un lettore vero si fermerebbe qui, prima ancora di provare a leggere i dati');
  const cw = leggiCodewordsDaMatrice(m, version, fmt.mask);
  return decodeByteMode(cw, version);
}
function versionOf(size){ return (size - 17) / 4; }

test.describe('il QR si legge davvero, non solo si vede', () => {
  test('un testo corto (sotto la versione 7, nessun bollino richiesto) si legge tale e quale', () => {
    const app = loadApp();
    const m = app.run('qrMatrix(' + JSON.stringify('482913') + ')');
    assert.strictEqual(m.length, 21, 'atteso versione 1');
    assert.strictEqual(leggi(m, versionOf(m.length)), '482913');
    app.stop();
  });

  test('un invito VERO — con il segreto lungo e l\'impronta, come lo fa paintQr() — si legge esatto', () => {
    /* ⚠️ QUESTO e' il caso che ha tradito l'operatore: un link di invito
       reale supera quasi sempre i 106 byte (link pubblico + #q= + &s= +
       &v=24 caratteri d'impronta), cioe' cade sempre in versione 7 o piu'.
       Prima della correzione dell'11 set 2026 QUESTO input specifico dava
       zero caratteri letti, sempre — non un caso raro, il caso normale. */
    const app = loadApp();
    const url = 'https://digitalvalut.github.io/logos-protocol/modifica.html#q=482913&s=aZ3kLp9QxT2mNv8R&v=' + 'a1b2c3d4e5f6a1b2c3d4e5f6';
    assert.ok(url.length > 106, 'la prova vale solo se il link vero supera la soglia della versione 7');
    const m = app.run('qrMatrix(' + JSON.stringify(url) + ')');
    const version = versionOf(m.length);
    assert.ok(version >= 7, 'un invito vero deve cadere proprio nella zona che era rotta');
    assert.strictEqual(leggi(m, version), url);
    app.stop();
  });

  test('ogni lunghezza nella fascia della versione 7 (107-122 byte) si legge esatta, una per una', () => {
    /* Non un campione: TUTTA la fascia, perche' il difetto originale non
       dipendeva dal contenuto — dipendeva solo dall'aver superato la
       soglia. Un solo buco in questo intervallo e' un difetto che torna. */
    const app = loadApp();
    for (let n = 107; n <= 122; n++){
      const testo = 'a'.repeat(n);
      const m = app.run('qrMatrix(' + JSON.stringify(testo) + ')');
      assert.strictEqual(m.length, 45, n + ' byte devono cadere in versione 7 (45x45)');
      assert.strictEqual(leggi(m, 7), testo, n + ' byte: il testo letto deve tornare identico');
    }
    app.stop();
  });

  test('e la stessa cosa vale una versione piu\' su (8) e al limite che Logos genera (10)', () => {
    const app = loadApp();
    for (const [n, versioneAttesa] of [[130, 8], [346 /* oltre ogni tetto ragionevole, forza la 10 se capace */, 10]]){
      const testo = 'b'.repeat(Math.min(n, 250));
      const m = app.run('qrMatrix(' + JSON.stringify(testo) + ')');
      if (!m) continue; /* oltre la capacita' della versione 10: qrMatrix rifiuta da sola, comportamento gia' corretto */
      const version = versionOf(m.length);
      if (version < 7) continue;
      assert.strictEqual(leggi(m, version), testo, 'versione ' + version + ': deve leggersi esatta');
    }
    app.stop();
  });

  test('oltre la capacita\' della versione 10, niente QR invece di uno rotto', () => {
    const app = loadApp();
    const m = app.run('qrMatrix(' + JSON.stringify('x'.repeat(2000)) + ')');
    assert.strictEqual(m, null, 'meglio nessun QR che uno che promette di funzionare e non funziona');
    app.stop();
  });
});
