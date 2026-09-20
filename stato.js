/* Stato di Logos — legge l'esito del guardiano dall'API pubblica di GitHub.

   Niente token: l'API pubblica risponde a chiunque, 60 letture l'ora per
   indirizzo IP. Questa pagina ne fa tre (i giri, poi i job di due giri).
   Se GitHub non risponde, la pagina dice «non lo so»: una pagina di stato
   che indovina è peggio di nessuna pagina.

   Il guardiano gira con due orari: ogni mezz'ora (relay, sito, apk) e ogni
   due ore (cassetta). Per ogni controllo si prende l'ULTIMO giro in cui quel
   job è stato eseguito davvero — un job saltato (`skipped`) non è un esito. */
(function(){
  'use strict';
  const API = 'https://api.github.com/repos/digitalvalut/logos-protocol/actions';
  const $ = id => document.getElementById(id);
  const righe = Array.from(document.querySelectorAll('#tabella tr[data-job]'));

  function quando(iso){
    if (!iso) return '';
    const d = new Date(iso);
    const min = Math.round((Date.now() - d.getTime()) / 60000);
    const ora = d.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    if (min < 1) return 'adesso';
    if (min < 60) return min + ' min fa (' + ora + ')';
    if (min < 60 * 48) return Math.round(min / 60) + ' h fa (' + ora + ')';
    return ora;
  }

  function segna(riga, stato, testo, iso, url){
    riga.classList.remove('ok', 'male', 'boh');
    riga.classList.add(stato);
    const e = riga.querySelector('.esito');
    e.textContent = '';
    if (url){ const a = document.createElement('a'); a.href = url; a.textContent = testo; e.appendChild(a); }
    else e.textContent = testo;
    riga.querySelector('.quando').textContent = quando(iso);
  }

  function nonLoSo(motivo){
    const r = $('riassunto');
    r.className = 'stato-riassunto attesa';
    r.textContent = 'Non riesco a leggere l\'esito del guardiano adesso' + (motivo ? ' (' + motivo + ')' : '') + '. Riprova tra qualche minuto, o guarda la cronologia su GitHub.';
    righe.forEach(x => segna(x, 'boh', '?', null));
  }

  async function leggi(url){
    const r = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function principale(){
    let giri;
    try{
      giri = await leggi(API + '/workflows/guardiano.yml/runs?status=completed&per_page=12');
    }catch(e){ nonLoSo(String(e.message || e)); return; }
    const runs = (giri && giri.workflow_runs) || [];
    if (!runs.length){ nonLoSo('nessun giro ancora'); return; }

    /* i job degli ultimi giri, finche' ogni controllo ha un esito vero */
    const esiti = {};   // job -> { conclusion, at, url }
    let letti = 0;
    for (const run of runs){
      if (letti >= 4) break;
      if (righe.every(x => esiti[x.dataset.job])) break;
      let jobs;
      try{ jobs = await leggi(API + '/runs/' + run.id + '/jobs'); letti++; }
      catch(e){ break; }
      for (const j of (jobs.jobs || [])){
        if (j.conclusion === 'skipped' || !j.conclusion) continue;
        if (esiti[j.name]) continue;
        esiti[j.name] = { conclusion: j.conclusion, at: j.completed_at || run.updated_at, url: j.html_url || run.html_url };
      }
    }

    let tuttoOk = true, qualcosa = false, ultimo = null;
    for (const riga of righe){
      const e = esiti[riga.dataset.job];
      if (!e){ segna(riga, 'boh', '?', null); continue; }
      qualcosa = true;
      if (!ultimo || e.at > ultimo) ultimo = e.at;
      if (e.conclusion === 'success') segna(riga, 'ok', 'ok', e.at, e.url);
      else { tuttoOk = false; segna(riga, 'male', 'problema', e.at, e.url); }
    }
    const r = $('riassunto');
    if (!qualcosa){ nonLoSo('nessun esito'); return; }
    r.className = 'stato-riassunto ' + (tuttoOk ? 'ok' : 'male');
    r.textContent = tuttoOk
      ? 'Tutto risponde. Ultimo controllo: ' + quando(ultimo) + '.'
      : 'Qualcosa non risponde: guarda la tabella. Ultimo controllo: ' + quando(ultimo) + '.';
  }

  principale();
})();
