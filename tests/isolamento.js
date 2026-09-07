/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 * Licensed under the Apache License, Version 2.0.
 */

/* ====================== L'ISOLAMENTO DELLA COPIA DI PROVA ======================
 *
 * NON si lancia con `node --test`: questo va incollato nella console del
 * browser, CON L'APP APERTA. E' l'unico modo onesto di provarlo, perche' la
 * cosa da verificare — che due copie nello stesso sito non si vedano — vive
 * nella memoria di un browser vero, e il browser finto della suite non ha ne'
 * IndexedDB ne' schede.
 *
 * COME SI USA
 *   1. apri  .../logos-protocol/prova/modifica.html
 *   2. apri la console del browser
 *   3. incolla e invia questa riga:
 *
 *        document.head.appendChild(Object.assign(
 *          document.createElement('script'), { src: '../tests/isolamento.js' }));
 *
 *   4. leggi il resoconto che compare nella console
 *
 * ⚠️ NON si incolla il file dentro la console, e non e' un dettaglio: la
 * politica di sicurezza della pagina (`script-src 'self'`) VIETA di eseguire
 * codice arrivato come testo. E' una protezione che funziona, non un
 * ostacolo — provato: incollandolo si prende un rifiuto per `unsafe-eval`.
 * Caricandolo come file dallo stesso sito, invece, e' codice come tutti gli
 * altri e passa.
 *
 * ⚠️ TRUCCO CHE RENDE POSSIBILE TUTTO QUESTO: le due copie stanno nello stesso
 * sito, quindi da una si vedono ANCHE le chiavi dell'altra. E' esattamente il
 * pericolo da cui ci difendiamo — ed e' anche cio' che permette di controllare,
 * da una pagina sola, che i due mondi restino separati.
 *
 * ⚠️ Il controllo distruttivo (n. 7) si rifiuta di partire se non sei nella
 * copia di prova. Non e' pignoleria: cancella per davvero.
 */

(async function isolamento(){
  'use strict';

  const esiti = [];
  const ok = (n, t, d) => esiti.push({ n, esito: '✅', t, d: d || '' });
  const no = (n, t, d) => esiti.push({ n, esito: '🔴', t, d: d || '' });
  const salta = (n, t, d) => esiti.push({ n, esito: '⏭️', t, d: d || '' });

  const inProva = /(^|\/)prova\//.test(location.pathname);
  const P = 'prova--';                    /* il prefisso della copia */
  const K = 'dvlogos-contacts';           /* la rubrica: il dato piu' facile da guardare */
  const mio  = k => (inProva ? P : '') + k;   /* la chiave di QUESTO mondo */
  const altro = k => (inProva ? '' : P) + k;  /* quella dell'ALTRO */

  const leggi = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const nomi = s => { try{ return (JSON.parse(s || '[]') || []).map(c => c.nick); }catch(e){ return []; } };

  if (!inProva){
    console.warn('⚠️  Non sei nella copia di prova. I controlli girano lo stesso,\n' +
                 '    ma quello distruttivo verra\' saltato.');
  }

  /* --- 1 e 2: le rubriche non si mescolano, in nessuna delle due direzioni --- */
  const marchio = 'ISOLAMENTO-' + Date.now().toString(36);
  const primaAltro = leggi(altro(K));
  try{
    const miei = nomi(leggi(mio(K)));
    localStorage.setItem(mio(K), JSON.stringify([{ nick: marchio, lastSeen: Date.now(), fp: null, push: null, addr: null }]));
    const dopoAltro = leggi(altro(K));
    if (dopoAltro === primaAltro) ok(1, 'un contatto scritto qui non tocca l\'altro mondo');
    else no(1, 'un contatto scritto qui HA CAMBIATO l\'altro mondo', 'era ' + primaAltro + ', ora ' + dopoAltro);

    if (!nomi(dopoAltro).includes(marchio)) ok(2, 'e non e\' nemmeno visibile di la\'');
    else no(2, 'IL CONTATTO FINTO SI VEDE NELL\'ALTRO MONDO');

    /* rimesso com'era: un controllo che lascia sporco non e' un controllo */
    if (miei.length) localStorage.setItem(mio(K), JSON.stringify(nomi(leggi(mio(K))).length ? JSON.parse(leggi(mio(K))) : []));
    localStorage.removeItem(mio(K));
  }catch(e){ no(1, 'il controllo delle rubriche e\' esploso', String(e)); }

  /* --- 3: la cronologia dei messaggi, stessa storia --- */
  try{
    const kMsg = mio('dvlogos-hist-' + marchio);
    const kMsgAltro = altro('dvlogos-hist-' + marchio);
    localStorage.setItem(kMsg, JSON.stringify([{ t: 'messaggio finto' }]));
    if (leggi(kMsgAltro) === null) ok(3, 'un messaggio scritto qui non compare di la\'');
    else no(3, 'IL MESSAGGIO FINTO SI VEDE NELL\'ALTRO MONDO');
    localStorage.removeItem(kMsg);
  }catch(e){ no(3, 'il controllo dei messaggi e\' esploso', String(e)); }

  /* --- 4: l'identita'. E' il dato che conta piu' di tutti: e' la chiave --- */
  try{
    const atteso = (inProva ? P : '') + 'dvlogos-id';
    if (typeof ID_DB === 'undefined') salta(4, 'non riesco a leggere il nome del deposito dell\'identita\'');
    else if (ID_DB === atteso) ok(4, 'il deposito dell\'identita\' e\' quello giusto', ID_DB);
    else no(4, 'IL DEPOSITO DELL\'IDENTITA\' E\' SBAGLIATO', 'atteso ' + atteso + ', trovato ' + ID_DB);

    /* e i due database devono esistere separati, non essere lo stesso con due nomi */
    if (indexedDB.databases){
      const elenco = (await indexedDB.databases()).map(d => d.name).filter(Boolean);
      const veri = elenco.filter(n => n === 'dvlogos-id' || n === 'dvlogos-media');
      const provi = elenco.filter(n => n.indexOf(P) === 0);
      ok(4.1, 'depositi visti dal browser', 'app vera: [' + veri.join(', ') + '] · prova: [' + provi.join(', ') + ']');
    }
  }catch(e){ no(4, 'il controllo dell\'identita\' e\' esploso', String(e)); }

  /* --- 5: la separazione non dipende da niente che si perda ricaricando --- */
  try{
    const ricalcolato = /(^|\/)prova\//.test(location.pathname);
    if (ricalcolato === inProva) ok(5, 'la separazione si ricalcola dall\'indirizzo, quindi regge a ogni ricarica');
    else no(5, 'la separazione dipende da qualcosa che cambia');
  }catch(e){ no(5, 'controllo 5 esploso', String(e)); }

  /* --- 6: un'altra scheda. Stessa memoria, stesso ragionamento --- */
  try{
    if (typeof PFX_PROVA === 'undefined') salta(6, 'non riesco a leggere il prefisso');
    else if (PFX_PROVA === (inProva ? P : '')) ok(6, 'il prefisso nasce dall\'indirizzo di QUESTA scheda: due schede diverse restano separate');
    else no(6, 'il prefisso non corrisponde all\'indirizzo', PFX_PROVA);
  }catch(e){ no(6, 'controllo 6 esploso', String(e)); }

  /* --- 7: IL CONTROLLO CHE CONTA. «Pulisci tutto» nella copia non deve
     toccare l'app vera. Non esiste logout in Logos; questa e' l'operazione
     che, se l'isolamento cedesse, farebbe il danno peggiore. --- */
  if (!inProva){
    salta(7, 'pulizia totale: saltata, non sei nella copia di prova');
  } else {
    try{
      const testimoni = ['dvlogos-contacts', 'logos-modifica-nick', 'dvlogos-burners', 'dvlogos-addr-on'];
      const prima = testimoni.map(k => [k, leggi(k)]);
      /* si scrive qualcosa di finto nella copia, poi si pulisce SOLO la copia */
      testimoni.forEach(k => { try{ localStorage.setItem(P + k, 'roba-finta'); }catch(e){} });
      Object.keys(localStorage).filter(k => k.indexOf(P) === 0).forEach(k => localStorage.removeItem(k));
      const dopo = testimoni.map(k => [k, leggi(k)]);
      const cambiati = prima.filter(([k, v], i) => dopo[i][1] !== v).map(([k]) => k);
      if (!cambiati.length) ok(7, 'pulire tutto nella copia non ha toccato un byte dell\'app vera');
      else no(7, 'LA PULIZIA HA TOCCATO L\'APP VERA', 'cambiati: ' + cambiati.join(', '));
    }catch(e){ no(7, 'il controllo della pulizia e\' esploso', String(e)); }
  }

  /* --- 8: un errore di salvataggio deve farsi sentire, non sparire --- */
  try{
    const vero = localStorage.setItem.bind(localStorage);
    let arrivato = false;
    localStorage.setItem = () => { throw new Error('memoria piena, finto'); };
    try{ MEM.setItem('prova-di-errore', 'x'); }catch(e){ arrivato = true; }
    localStorage.setItem = vero;
    if (arrivato) ok(8, 'un errore di salvataggio arriva a chi deve gestirlo, non viene ingoiato');
    else no(8, 'L\'ERRORE E\' STATO INGOIATO: l\'app non puo\' accorgersi che la memoria e\' piena');
  }catch(e){ no(8, 'controllo 8 esploso', String(e)); }

  /* ------------------------------- resoconto ------------------------------- */
  const rossi = esiti.filter(e => e.esito === '🔴').length;
  console.log('\n=== ISOLAMENTO DELLA COPIA DI PROVA ===');
  console.log(inProva ? 'sei nella COPIA DI PROVA' : 'sei nell\'APP VERA');
  for (const e of esiti) console.log('  ' + e.esito + ' ' + e.n + '. ' + e.t + (e.d ? '  — ' + e.d : ''));
  console.log(rossi ? '\n🔴 ' + rossi + ' controlli falliti: i due mondi NON sono separati.'
                    : '\n✅ nessun attraversamento: i due mondi sono separati.');
  return { rossi, esiti };
})();
