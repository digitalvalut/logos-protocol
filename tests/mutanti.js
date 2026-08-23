/* ============================================================================
   I MUTANTI — Fase F, il sigillo scientifico.

   Un arnese che non trova niente e un arnese rotto producono lo stesso
   silenzio. L'unico modo di distinguerli è rimettere dentro i guasti che
   c'erano davvero e guardare quali muoiono.

   Ogni mutante qui reintroduce un difetto STORICO — uno che questo progetto
   ha avuto, corretto e pubblicato — e ogni trasformazione è verificata:
   se il pattern non si trova, il mutante fallisce rumorosamente invece di
   passare come "nessuna violazione". Un mutante che non muta è il modo più
   silenzioso di mentire a sé stessi.

   Il codice su disco non viene mai toccato: le copie guaste vivono come
   stringhe, e vengono anche scritte in mutanti/ perché siano leggibili.
   ========================================================================= */

'use strict';

const H = require('./hostile.js');
const W = require('./worker-harness.js');

/* Ogni voce: da dove viene il difetto, e la trasformazione che lo rimette.
   `da` e `a` sono testo esatto: se `da` non compare, il mutante è invalido. */
const MUTANTI = [
  {
    id: 'M01', origine: 'H1-vouch (v3.62)',
    cosa: 'un `v=` che combacia torna a valere come "verificato di persona"',
    /* La prima stesura sostituiva la condizione con `false`, che disattiva
       l'ALLARME senza ripristinare l'auto-fiducia: un mutante che non
       reintroduce il difetto sopravvive per definizione, e la sopravvivenza
       veniva letta come punto cieco dell'arnese. Il difetto storico era
       scrivere fiducia quando l'impronta COMBACIA. */
    da: `    if (fpHex.slice(0, expected.length) !== expected){
      /* Not who the link promised. Nothing here is trusted, and this is said
         as plainly as it deserves. */
      paintVerifyBadge('changed');
      await showSasPanel('mismatch');
      return;
    }`,
    a:  `    if (fpHex.slice(0, expected.length) === expected){
      writeSafetyRec(key, code);
      paintVerifyBadge('inperson');
      return;
    }
    paintVerifyBadge('changed');
    await showSasPanel('mismatch');
    return;`,
  },
  {
    id: 'M02', origine: 'H1-proven-write (v3.64)',
    cosa: 'la prova dell\'indirizzo torna a SCRIVERSI come fiducia, senza conferma umana',
    da: `      /* deliberately no return: falls through to the same first-contact`,
    a:  `      writeSafetyRec(key, code); paintVerifyBadge('ok'); return;
      /* deliberately no return: falls through to the same first-contact`,
  },
  {
    id: 'M03', origine: 'H2-aggregato (v3.62)',
    cosa: 'il tetto complessivo sulla memoria sparisce: torna solo quello per trasferimento',
    da: `      if (pledgedIncomingBytes() + Math.min(declared, MAX_INCOMING_BYTES) > MAX_INCOMING_TOTAL) return;`,
    a:  ``,
  },
  {
    id: 'M04', origine: 'H2-inattivi (v3.62)',
    cosa: 'i trasferimenti fermi non vengono più lasciati andare: la tabella si intasa per sempre',
    da: `      dropStaleTransfers();\n`,
    a:  ``,
  },
  {
    id: 'M05', origine: 'H2-residui (v3.62)',
    cosa: 'un file a metà sopravvive alla fine della conversazione',
    da: `  forgetIncoming();   /* a half-arrived file would otherwise sit in memory for the rest of the visit */\n`,
    a:  ``,
  },
  {
    id: 'M06', origine: 'M1-pump (v3.62)',
    cosa: 'il pump della cassetta non viene fermato quando dialAddress fallisce',
    da: `    dialedAddress = null; dialedSlot = 0; dialedAddrProven = false;
    stopStrayPump(myPc);`,
    a:  `    dialedAddress = null; dialedSlot = 0; dialedAddrProven = false;`,
  },
  {
    id: 'M07', origine: 'M2-nick (v3.62)',
    cosa: 'il nick torna non tipizzato e la verifica torna dentro il ramo: un nick strano la fa sparire',
    da: `      peerNick = (typeof msg.nick === 'string' ? msg.nick : '').trim().slice(0, 60);`,
    a:  `      peerNick = (msg.nick || '').trim();`,
  },
  {
    id: 'M08', origine: 'M3-offer-sdp (v3.62)',
    cosa: 'l\'offerta di chiamata torna senza guardia: cronometro che scorre su audio morto',
    /* Sostituire `try{` con `if (true){` lascia il `catch` orfano: errore di
       sintassi, l'app non carica, e OGNI prova fallisce — il mutante risulta
       "ucciso da tutte", che è il modo più vistoso in cui una matrice di
       mutazione può mentire. Qui il blocco viene tolto per intero. */
    da: `  try{
    await pc.setRemoteDescription({ type: 'offer', sdp });
    const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
    sig({ type: 'call-answer-sdp', sdp: pc.localDescription.sdp });
  }catch(e){
    endCall(true);
    sysLine(t('call.connectFailed','La chiamata non si è collegata. Riprova.'));
  }`,
    a:  `  await pc.setRemoteDescription({ type: 'offer', sdp });
  const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
  sig({ type: 'call-answer-sdp', sdp: pc.localDescription.sdp });`,
  },
  {
    id: 'M09', origine: 'M4-dialed (v3.62)',
    cosa: 'dialedAddress non viene azzerato uscendo: falso allarme MITM sulla connessione successiva',
    da: `    const giveUpDial = () => { dialedAddress = null; dialedSlot = 0; dialedAddrProven = false; pump.stop(); };`,
    a:  `    const giveUpDial = () => { pump.stop(); };`,
  },
  {
    id: 'M10', origine: 'M5-rubrica (v3.62)',
    cosa: 'chi si dichiara "Mamma" torna a sovrascrivere la Mamma vera',
    da: `  if (prev && prev.fp && fp && prev.fp !== fp){`,
    a:  `  if (false){`,
  },
  {
    id: 'M11', origine: 'v3.63-a',
    cosa: 'l\'avviso "memoria piena" non si spegne più una volta acceso',
    da: `    historyBroken = false;\n`,
    a:  ``,
  },
  {
    id: 'M12', origine: 'v3.65-a',
    cosa: 'i media non vengono più conservati: le foto tornano a sparire alla chiusura',
    da: `      persistMedia(peerNick, msg.id, blob);\n`,
    a:  ``,
  },
  {
    id: 'M13', origine: 'v3.65-b',
    cosa: 'la cancellazione della cronologia non raggiunge più i media: "distrutto" diventa falso',
    /* Toglierne una sola lasciava in piedi l'altra, e la prova — che contava
       soltanto SE qualcosa veniva cancellato — taceva. Il difetto storico è
       che la cancellazione non raggiunge i media: vanno tolte entrambe. */
    da: `  const keyNow = historyKeyNow(nick);
  try{ localStorage.removeItem(keyNow); }catch(e){}
  mediaDeleteByConv(keyNow);
  if (nick){
    try{ localStorage.removeItem(historyKey(nick)); }catch(e){}
    mediaDeleteByConv(historyKey(nick));
  }`,
    a:  `  const keyNow = historyKeyNow(nick);
  try{ localStorage.removeItem(keyNow); }catch(e){}
  if (nick){
    try{ localStorage.removeItem(historyKey(nick)); }catch(e){}
  }`,
  },
];

/* I mutanti del Worker vivono a parte: sorgente diversa, arnese diverso. */
const MUTANTI_WORKER = [
  {
    id: 'W01', origine: 'anti-calpestio',
    cosa: 'una chiave può essere pubblicata nello slot di un\'altra',
    da: `    if (owns !== key) return json({ error: 'key does not own this slot' }, 403, cors);`,
    a:  ``,
  },
  {
    id: 'W02', origine: 'lettura unica',
    cosa: 'la cassetta non viene svuotata alla lettura',
    da: `    await env.MAILBOX.delete(key);`,
    a:  ``,
  },
  {
    id: 'W03', origine: 'origine',
    cosa: 'qualunque origine viene accettata',
    da: `    if (origin && ALLOWED_ORIGINS.indexOf(origin) < 0) return json({ error: 'Forbidden' }, 403, cors);`,
    a:  ``,
  },
  {
    id: 'W04', origine: 'limiti di frequenza',
    cosa: 'nessuna richiesta viene mai considerata oltre il limite',
    da: `function overLimit(request, bucket, max){`,
    a:  `function overLimit(request, bucket, max){ return false;`,
  },
];

/* Applica una mutazione, verificando che abbia MORSO. Un pattern che non si
   trova produce un errore, non un mutante silenziosamente identico. */
function applica(sorgente, m){
  if (sorgente.indexOf(m.da) === -1){
    throw new Error(`${m.id}: il pattern non esiste più nella sorgente — mutante invalido, da riscrivere`);
  }
  const fuori = sorgente.replace(m.da, m.a);
  if (fuori === sorgente) throw new Error(`${m.id}: la sostituzione non ha cambiato nulla`);
  return fuori;
}

module.exports = { MUTANTI, MUTANTI_WORKER, applica };
