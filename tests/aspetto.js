/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 * Licensed under the Apache License, Version 2.0.
 */

/* ========================= GLI OCCHI DEL COLLAUDO =========================
 *
 * COME SI USA — con l'app aperta, nella console del browser:
 *
 *     document.head.appendChild(Object.assign(
 *       document.createElement('script'), { src: 'tests/aspetto.js' }));
 *
 * (dalla copia di prova: `../tests/aspetto.js`)
 *
 * ⚠️ Come `isolamento.js`, NON si incolla nella console: la politica di
 * sicurezza vieta di eseguire codice arrivato come testo. Si carica come file
 * dallo stesso sito. La protezione funziona.
 *
 * PERCHE' ESISTE
 * Fino al 7 set 2026 NESSUN controllo guardava come appare l'app — contati:
 * zero in tutti i file di collaudo. Ogni cosa che si vede la guardava una
 * persona, a occhio, una volta, e poi mai piu'. Due difetti di quel giorno
 * («Chiamalo» e «Parla con qualcuno» fusi in una macchia arancione sola;
 * l'intestazione della chat cresciuta a tre righe sfilacciate) sono stati
 * presi per fortuna.
 *
 * ⚠️ PERCHE' NON CONFRONTA IMMAGINI, che sarebbe la scelta ovvia.
 * Due motivi, tutti e due decisivi qui:
 *   1. questo progetto non carica una sola riga di codice altrui, e leggere un
 *      PNG a mano per confrontarlo sarebbe codice complicato scritto apposta
 *      per il collaudo — cioe' altra roba che si puo' rompere;
 *   2. un confronto di pixel grida al lupo a ogni cambio di carattere, di
 *      sistema operativo, di zoom. Un controllo che grida al lupo viene
 *      ignorato entro due settimane: e' il modo piu' comune in cui muore un
 *      collaudo, e in questo progetto e' gia' successo con un banco costruito
 *      male lo stesso giorno.
 * Quindi si misurano NUMERI: dove sta un elemento, quanto e' grande, quante
 * righe occupa, se sborda, se e' coperto. Un guasto dice «il pulsante Invia e'
 * alto 38 px invece di 44», non «1.247 pixel diversi».
 *
 * LE REGOLE SONO ASSOLUTE, NON UN CONFRONTO CON IERI.
 * Un'immagine di riferimento va riaggiornata a ogni modifica voluta, e dopo
 * tre volte la si aggiorna senza guardarla. Queste regole invece valgono
 * sempre e non vanno mantenute: o un pulsante e' grande abbastanza per un
 * dito, o non lo e'.
 */

(function aspetto(){
  'use strict';

  const esiti = [];
  const ok = (t, d) => esiti.push({ e: '✅', t, d: d || '' });
  const no = (t, d) => esiti.push({ e: '🔴', t, d: d || '' });
  const nota = (t, d) => esiti.push({ e: '·', t, d: d || '' });

  const vis = el => {
    if (!el) return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  /* ---- 1. niente sborda di lato ----------------------------------------
     Il difetto piu' brutto su un telefono: la pagina che si muove in
     orizzontale. Si misura sul documento, non a occhio. */
  const largo = document.documentElement.scrollWidth;
  const finestra = document.documentElement.clientWidth;
  if (largo <= finestra + 1) ok('niente sborda di lato', largo + ' px su ' + finestra);
  else {
    const colpevoli = [...document.querySelectorAll('body *')]
      .filter(vis).filter(el => el.getBoundingClientRect().right > finestra + 1)
      .slice(0, 4).map(el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''));
    no('LA PAGINA SBORDA DI LATO', largo + ' px su ' + finestra + ' — ' + colpevoli.join(', '));
  }

  /* ---- 2. ogni bersaglio e' grande per un dito -------------------------
     44 px e' la regola che questo progetto si e' gia' dato nel foglio di
     stile. Qui si controlla che valga anche DOPO che il testo di una lingua
     lunga ha stretto qualcosa. */
  const MIN = 44;
  const piccoli = [...document.querySelectorAll('button, a, [role="button"]')]
    .filter(vis)
    .map(el => ({ el, r: el.getBoundingClientRect() }))
    .filter(x => x.r.height < MIN - 0.5)
    .map(x => (x.el.id || x.el.className || x.el.tagName).toString().slice(0, 28) +
              ' (' + Math.round(x.r.width) + '×' + Math.round(x.r.height) + ')');
  if (!piccoli.length) ok('ogni bersaglio visibile e\' alto almeno ' + MIN + ' px');
  else no('BERSAGLI TROPPO PICCOLI PER UN DITO', piccoli.slice(0, 6).join(' · '));

  /* ---- 3. nessun testo tagliato ----------------------------------------
     Una traduzione lunga che non ci sta viene tagliata in silenzio: si vede
     solo guardando, e nessuno guarda in tredici lingue. */
  const tagliati = [...document.querySelectorAll('button, .t, .d, b, h1, h2, h3, label, .lbl')]
    .filter(vis)
    .filter(el => {
      const s = getComputedStyle(el);
      if (s.overflow === 'auto' || s.overflow === 'scroll') return false;
      /* i puntini di sospensione sono una scelta, non un guasto */
      if (s.textOverflow === 'ellipsis') return false;
      return el.scrollWidth > el.clientWidth + 2;
    })
    .map(el => (el.id || el.className || el.tagName).toString().slice(0, 26) +
               ' «' + (el.textContent || '').trim().slice(0, 24) + '»');
  if (!tagliati.length) ok('nessun testo tagliato dai suoi bordi');
  else no('TESTO TAGLIATO', tagliati.slice(0, 6).join(' · '));

  /* ---- 4. niente di importante e' coperto da qualcos'altro -------------
     Il difetto storico: il pulsante «riattacca» diventato invisibile perche'
     il riquadro era collassato a zero. Un pulsante c'e', esiste, e nessuno
     puo' premerlo. Si chiede al browser chi c'e' davvero in quel punto. */
  const coperti = [...document.querySelectorAll('button, a')]
    .filter(vis)
    .filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) return false;   /* fuori schermo: e' un altro controllo */
      const sopra = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return sopra && sopra !== el && !el.contains(sopra) && !sopra.contains(el);
    })
    .map(el => (el.id || el.className || el.tagName).toString().slice(0, 28));
  if (!coperti.length) ok('niente di premibile e\' coperto da altro');
  else no('PULSANTI COPERTI: esistono ma nessuno puo\' premerli', coperti.slice(0, 5).join(' · '));

  /* ---- 5. quante righe occupa cio' che dovrebbe starne in una ----------
     Il caso vero: l'intestazione della chat passata da due a tre righe
     sfilacciate quando e' entrato il quarto pulsante. Si misura in righe,
     non in pixel, cosi' vale in tutte le lingue. */
  const righeDi = el => {
    const h = el.getBoundingClientRect().height;
    const l = parseFloat(getComputedStyle(el).lineHeight);
    return (!l || isNaN(l)) ? 1 : Math.round(h / l);
  };
  const TETTI = [
    ['peerNameLbl', 1, 'il nome di chi hai davanti'],
    ['btnAddrDial', 2, 'il pulsante «Chiamalo»'],
    ['goStart', 4, 'il pulsantone «Parla con qualcuno»'],
    ['goJoin', 4, 'il pulsantone «Ho un codice»'],
    ['btnShareApp', 3, 'il pulsante per far conoscere l\'app'],
  ];
  const troppe = [];
  for (const [id, tetto, nome] of TETTI){
    const el = document.getElementById(id);
    if (!vis(el)) continue;
    const r = righeDi(el);
    if (r > tetto) troppe.push(nome + ': ' + r + ' righe invece di ' + tetto);
  }
  if (!troppe.length) ok('niente e\' andato a capo piu\' del previsto');
  else no('QUALCOSA E\' CRESCIUTO IN ALTEZZA', troppe.join(' · '));

  /* ---- 6. quello che conta si vede senza scorrere ----------------------
     Non e' un guasto, e' una misura: quanto della prima pagina arriva prima
     che uno debba scorrere. Detto, non deciso. */
  const sotto = ['goStart', 'goJoin', 'btnShareApp']
    .map(id => document.getElementById(id)).filter(vis)
    .filter(el => el.getBoundingClientRect().bottom > window.innerHeight)
    .map(el => el.id);
  if (sotto.length) nota('sotto la piega (va scorso per vederli)', sotto.join(', '));
  else nota('tutte le azioni principali stanno in una schermata', '');

  /* ------------------------------- resoconto ------------------------------ */
  const rossi = esiti.filter(x => x.e === '🔴').length;
  const dove = ['screenHome', 'screenStart', 'screenJoin', 'screenChat', 'screenSettings']
    .find(s => { const el = document.getElementById(s); return el && !el.classList.contains('hide'); });
  console.log('\n=== ASPETTO — ' + (dove || 'schermata sconosciuta') +
              '  ' + window.innerWidth + '×' + window.innerHeight +
              '  lingua ' + document.documentElement.lang + ' ===');
  for (const x of esiti) console.log('  ' + x.e + ' ' + x.t + (x.d ? '  — ' + x.d : ''));
  console.log(rossi ? '\n🔴 ' + rossi + ' problemi di aspetto.' : '\n✅ niente fuori posto.');
  return { rossi, esiti };
})();
