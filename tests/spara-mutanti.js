/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 * Licensed under the Apache License, Version 2.0.
 */

/* ======================= IL GRILLETTO DEI MUTANTI =======================
 *
 *     node tests/spara-mutanti.js            tutti
 *     node tests/spara-mutanti.js M03 W02    solo questi
 *
 * `tests/mutanti.js` contiene 17 difetti STORICI di questo progetto — bug
 * veri, avuti, corretti e pubblicati — pronti da rimettere dentro.
 *
 * ⚠️ MA NON C'ERA NIENTE CHE LI ESEGUISSE. Diciassette difetti pronti e
 * nessun modo di spararli: un'arma carica senza grilletto, per mesi. E' la
 * seconda volta che succede qui — a settembre fuzz, mutanti e races erano
 * tutte librerie che nessuno chiamava; tre sono state collegate, questa e'
 * rimasta indietro. Questo file e' il grilletto.
 *
 * LA DOMANDA A CUI RISPONDE, ed e' l'unica che distingue una rete di
 * sicurezza da una che fa compagnia:
 *     «riprendiamo ancora i difetti che abbiamo gia' pagato una volta?»
 * 365 test verdi e un arnese rotto producono lo stesso identico silenzio.
 *
 * COME FUNZIONA
 * Il difetto viene rimesso in una COPIA, la copia viene messa in una cartella
 * temporanea insieme a tutta la suite, e li' si lancia il collaudo VERO — non
 * una campagna inventata per l'occasione. Se la suite diventa rossa, il
 * mutante e' morto: qualcuno se n'e' accorto.
 *
 * ⚠️ IL CODICE SU DISCO NON VIENE MAI TOCCATO. Si lavora su copie in una
 * cartella temporanea, cancellata alla fine. E' il vincolo 3 del progetto e
 * non si negozia: un arnese che tocca l'originale, il giorno che sbaglia,
 * corrompe la cosa che doveva proteggere.
 *
 * ⚠️ DUE VELOCITA', di proposito. Prima i controlli strutturali (2 secondi):
 * molti difetti muoiono li'. Solo chi sopravvive paga il collaudo lungo (~2,6
 * minuti). Senza questo, un giro completo sarebbe di 45 minuti e nessuno lo
 * lancerebbe piu' — e un arnese che non si lancia e' come non averlo.
 *
 * COME SI LEGGE
 *   ☠️  UCCISO       il difetto e' tornato dentro e QUALCUNO se n'e' accorto
 *   🔴 SOPRAVVISSUTO e' tornato dentro e nessuno ha detto niente
 *                    -> buco vero nella rete, non una curiosita'
 *   ⚠️  SCADUTO       il pezzo di codice non esiste piu': mutante da riscrivere
 *                    -> conta come guasto: un controllo che non morde piu' e'
 *                       indistinguibile da uno che non c'e'
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const M = require('./mutanti.js');
const ROOT = path.resolve(__dirname, '..');
const NODE = process.execPath;

/* Tutto cio' che serve alla suite per girare. Se un domani ne nasce uno e ci
   si dimentica qui, il giro fallisce in modo RUMOROSO (file mancante) invece
   di dire «nessun problema» avendo provato meta' app. */
const DA_COPIARE = [
  'modifica.js', 'modifica.html', 'modifica.css', 'modifica-sw.js',
  'modifica-manifest.webmanifest', 'index.html', 'index.js', 'index.css',
  /* le icone: la suite controlla che la cache offline citi solo file che
     esistono davvero, e senza queste quel controllo e' rosso comunque */
  'modifica-icon-192.png', 'modifica-icon-512.png', 'modifica-apple-touch-icon.png',
];
const CARTELLE = ['tests', 'turn-worker', 'tools'];

const SOLO = process.argv.slice(2).map(s => s.toUpperCase());

/* ---------------------------------------------------------- la cartella --- */
function preparaBanco(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mutanti-'));
  for (const f of DA_COPIARE){
    const da = path.join(ROOT, f);
    if (!fs.existsSync(da)) throw new Error('manca un file del progetto: ' + f);
    fs.copyFileSync(da, path.join(dir, f));
  }
  for (const c of CARTELLE){
    fs.cpSync(path.join(ROOT, c), path.join(dir, c), { recursive: true });
  }
  /* il grilletto non deve sparare a se stesso dentro il banco */
  try{ fs.unlinkSync(path.join(dir, 'tests', 'spara-mutanti.js')); }catch(_){}
  return dir;
}

/* Lancia un file di collaudo nel banco. Torna true se e' diventato ROSSO,
   cioe' se qualcuno si e' accorto del difetto. */
function diventaRosso(dir, file){
  try{
    execFileSync(NODE, ['--test', '--test-force-exit', 'tests/' + file],
      { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
    return false;
  }catch(e){
    /* ⚠️ Un'eccezione qui puo' voler dire due cose: la suite e' fallita
       (bene, il mutante e' morto) oppure il processo e' esploso — che va
       benissimo lo stesso, perche' anche quello e' accorgersene. Un difetto
       che fa saltare in aria il collaudo non passa inosservato. */
    return true;
  }
}

/* ------------------------------------------------------------- il giro --- */
function spara(m, sorgenteOriginale, dovePoggiarlo, dir){
  let guasta;
  try{ guasta = M.applica(sorgenteOriginale, m); }
  catch(e){ return { esito: 'scaduto', perche: e.message }; }

  fs.writeFileSync(path.join(dir, dovePoggiarlo), guasta);

  /* ⚠️ Dal piu' economico al piu' caro, misurato: 2 s, 2 s, 1 s, 156 s. Chi
     muore presto costa un secondo; solo chi sopravvive a tutto il resto paga
     il collaudo lungo. Senza quest'ordine un giro completo sarebbe di
     quarantacinque minuti, e un arnese che non si lancia e' come non averlo. */
  if (diventaRosso(dir, 'checks.test.js')) return { esito: 'ucciso', da: 'i controlli strutturali' };
  if (diventaRosso(dir, 'worker-audit.test.js')) return { esito: 'ucciso', da: 'il collaudo del relay' };
  if (diventaRosso(dir, 'audit.test.js')) return { esito: 'ucciso', da: 'le campagne ostili' };
  if (diventaRosso(dir, 'logic.test.js')) return { esito: 'ucciso', da: 'il collaudo delle decisioni' };
  return { esito: 'sopravvissuto' };
}

/* ⚠️⚠️ LA CONTROPROVA, e non e' facoltativa.
   Il primo giro di questo arnese ha «ucciso» 16 mutanti su 17 — tutti dallo
   stesso controllo, tutti in un secondo. Sembrava un trionfo. Non lo era: nel
   banco mancavano `tools/` e le icone, quindi i controlli strutturali erano
   ROSSI COMUNQUE, difetto o non difetto. Un arnese che trova tutto e' rotto
   esattamente quanto uno che non trova niente, e i due si distinguono solo
   cosi': prima di sparare, si chiede al banco SENZA nessun difetto dentro se
   e' verde. Se non lo e', il giro non parte e non produce numeri falsi. */
function controprova(dir){
  const rossi = ['checks.test.js', 'logic.test.js', 'worker-audit.test.js', 'audit.test.js']
    .filter(f => diventaRosso(dir, f));
  if (rossi.length){
    console.error('\n🔴 IL BANCO E\' ROTTO: senza nessun difetto dentro, questi sono gia\' rossi:');
    for (const f of rossi) console.error('   ' + f);
    console.error('\n   Ogni mutante risulterebbe «ucciso» per il motivo sbagliato.');
    console.error('   Manca qualcosa in DA_COPIARE o in CARTELLE, qui sopra. Giro annullato.\n');
    return false;
  }
  return true;
}

(function main(){
  const t0 = Date.now();
  const dir = preparaBanco();
  const originaleApp = fs.readFileSync(path.join(ROOT, 'modifica.js'), 'utf8');
  const originaleWorker = fs.readFileSync(path.join(ROOT, 'turn-worker', 'worker.js'), 'utf8');

  process.stdout.write('controprova del banco (dev\'essere tutto verde senza difetti)... ');
  if (!controprova(dir)){
    try{ fs.rmSync(dir, { recursive: true, force: true }); }catch(_){}
    process.exit(2);
  }
  console.log('verde.');

  const tutti = M.MUTANTI.map(m => ({ m, dove: 'modifica.js', src: originaleApp }))
    .concat(M.MUTANTI_WORKER.map(m => ({ m, dove: path.join('turn-worker', 'worker.js'), src: originaleWorker })))
    .filter(x => !SOLO.length || SOLO.includes(x.m.id));

  console.log('\n=== I MUTANTI — rimetto dentro i difetti gia\' pagati ===');
  console.log('    ' + tutti.length + ' da sparare, banco in ' + dir + '\n');

  const righe = [];
  try{
    for (const { m, dove, src } of tutti){
      /* si riparte sempre dall'originale, o il mutante precedente resta dentro */
      fs.writeFileSync(path.join(dir, dove), src);
      const t = Date.now();
      const r = spara(m, src, dove, dir);
      fs.writeFileSync(path.join(dir, dove), src);

      righe.push(Object.assign({ id: m.id, cosa: m.cosa, origine: m.origine }, r));
      const segno = r.esito === 'ucciso' ? '☠️ ' : r.esito === 'sopravvissuto' ? '🔴' : '⚠️ ';
      console.log('  ' + segno + ' ' + m.id + '  ' + m.cosa.slice(0, 74) +
                  '   [' + Math.round((Date.now() - t) / 1000) + 's]');
      if (r.esito === 'ucciso') console.log('        preso da: ' + r.da);
      if (r.esito === 'scaduto') console.log('        ' + r.perche);
    }
  } finally {
    try{ fs.rmSync(dir, { recursive: true, force: true }); }catch(_){}
  }

  const uccisi = righe.filter(r => r.esito === 'ucciso').length;
  const vivi = righe.filter(r => r.esito === 'sopravvissuto');
  const scaduti = righe.filter(r => r.esito === 'scaduto');

  console.log('\n--------------------------------------------------------------');
  console.log('  uccisi        ' + uccisi + '/' + righe.length);
  console.log('  sopravvissuti ' + vivi.length + (vivi.length ? '   <- buchi veri nella rete' : ''));
  console.log('  scaduti       ' + scaduti.length + (scaduti.length ? '   <- mutanti da riscrivere' : ''));
  console.log('  durata        ' + Math.round((Date.now() - t0) / 1000) + ' s');

  if (vivi.length){
    console.log('\n🔴 SOPRAVVISSUTI — tornati dentro senza che nessuno dicesse niente:');
    for (const v of vivi) console.log('   ' + v.id + ' (' + v.origine + ')  ' + v.cosa);
  }
  if (scaduti.length){
    console.log('\n⚠️  SCADUTI — il codice e\' cambiato sotto: vanno riscritti, non ignorati:');
    for (const s of scaduti) console.log('   ' + s.id + '  ' + s.perche);
  }
  if (!vivi.length && !scaduti.length) console.log('\n✅ tutti e ' + righe.length + ' ripresi: la rete tiene.');

  process.exit(vivi.length || scaduti.length ? 1 : 0);
})();
