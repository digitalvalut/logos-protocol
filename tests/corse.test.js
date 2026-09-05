/* ============================================================================
   LE CORSE — la campagna, collegata alla suite.

   `tests/races.js` esisteva da settimane come libreria completa e NESSUN file
   la chiamava. Al primo lancio, il 5 set 2026, ha trovato pulsanti che
   restavano spenti per sempre e un ciclo che interrogava il relay all'infinito.

   Un'arma costruita e mai sparata non protegge niente, e da' la falsa
   sicurezza di essere protetti. Quindi da qui in poi spara da sola, a ogni
   giro di test.

   Cosa fa: interrompe una procedura a OGNI suo punto di attesa, in due modi —
   'solleva' (l'attesa esplode: rete caduta, crittografia rifiutata) e
   'soppianta' (un'altra connessione prende il posto della globale) — e
   controlla che non resti niente incastrato.

   ⚠️ Si guardano SOLO i comandi e le bandiere che NON scadono da soli. Gli
   altri due segnali della campagna sono rumore a questo istante:
     - `busyWithSomeone() vero` scade da se' dopo STALE_BUILD_MS (3 minuti),
       ed e' voluto: una connessione appena nata conta come occupata.
     - `pump ancora vivo` adesso scade da se' dopo PUMP_MAX_MS (16 minuti).
   Un pulsante spento invece non lo rimette a posto nessun orologio: chi guarda
   vede un comando morto e deve ricaricare la pagina.
   ========================================================================= */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const R = require('./races.js');

/* Le due procedure che avevano comandi incastrati il 5 set 2026. Tenute
   esplicite invece di girare su tutte: la campagna intera costa minuti, e
   questa deve poter girare a ogni giro senza farsi odiare. La campagna
   completa si lancia a mano quando serve. */
const SORVEGLIATE = ['tryQuickConnect', 'tryAutoReconnectInner'];

/* Solo cio' che non guarisce da solo. */
const PERMANENTI = /btnCreate resta|btnQuickConnect resta|quickConnecting resta|autoAccepting resta|dialing resta/;

test.describe('interrompere una procedura non lascia comandi morti', () => {
  for (const nome of SORVEGLIATE){
    for (const modo of ['solleva', 'soppianta']){
      test(`${nome} interrotta in ogni punto (${modo})`, async () => {
        const res = await R.sweep(nome, 40, modo);
        assert.ok(res.length > 0, 'la spazzata deve provare almeno un punto');

        const incastrati = [];
        for (const r of res){
          for (const p of (r.problemi || [])){
            if (PERMANENTI.test(p)) incastrati.push(`${r.at}ª attesa: ${p}`);
          }
        }
        assert.deepStrictEqual(incastrati, [],
          `interrompendo ${nome} restano comandi spenti che nessun orologio riaccende:\n  ` +
          incastrati.join('\n  '));
      });
    }
  }
});
