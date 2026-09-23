# Domande che fa chi legge il codice — risposte misurate

Questo foglio esiste perché il 23 settembre 2026 un membro del direttivo di
Italian Linux Society ha letto Logos con attenzione vera e ha fatto sei
domande. Due erano sbagliate, una riguardava una frase imprecisa sul sito
(corretta), le altre sono scelte deliberate spiegate qui. Il foglio raccoglie
le risposte una volta sola, con i numeri misurati quel giorno — così la
prossima persona che guarda con la stessa attenzione le trova già scritte,
invece di doverle scoprire lei e farcelo notare in pubblico.

Se una risposta qui sotto e quella di un altro documento del progetto non
coincidono, ha ragione questo foglio solo se è stato aggiornato più di
recente: altrimenti segnalate la discrepanza, è un errore nostro da correggere.

## «Quanto è coperto dai test, per davvero?»

Il numero dei test (vedi CLAUDE.md) non dice la copertura: un test esegue
molte righe, non una. La copertura vera si misura con lo strumento nativo di
Node (`NODE_V8_COVERAGE`, nessuna libreria in più — coerente con la regola
del progetto), guardando quali funzioni di `modifica.js` vengono davvero
invocate durante `node --test`.

**Misurato il 23 settembre 2026: 494 funzioni chiamate su 698 dichiarate —
70,8%.** Non è un numero eccellente, e lo diciamo così com'è. Riguarda la
sola suite automatica: non include i due test che girano solo in un browser
vero (`tests/aspetto.js`, misure di leggibilità; `tests/isolamento.js`,
separazione fra l'app vera e la copia di prova) né i test di mutazione
(`tests/mutanti.js`, rimettono difetti storici per verificare che vengano
ricatturati), che si eseguono a mano.

Per rifare la misura: `NODE_V8_COVERAGE=/tmp/cov node --test`, poi un piccolo
script che somma le funzioni con `count > 0` nei profili V8 di ogni processo
(un file di test = un processo = un profilo separato).

## «Il codice è minificato?»

No. Misurato sulla stessa base: 84,5 caratteri di media a riga su 12.000
righe, commenti estesi (in italiano, spiegano il perché di ogni scelta),
nomi di variabili descrittivi. Le 177 righe più lunghe di 500 caratteri sono
le tabelle delle 13 traduzioni — dizionari densi per natura, non codice
compresso. Se qualcosa sembra diverso, probabilmente si sta guardando un
artefatto di build (mai committato, vedi CLAUDE.md) e non la sorgente
pubblicata.

## «C'è un server o no?»

C'è: è il relay (`turn-worker/worker.js`, Cloudflare Worker). Nessuna pagina
di questo progetto ha mai voluto dire che non esiste — quello che è vero, ed
è la proprietà che conta, è che **non vede mai il contenuto**. Riceve solo
buste già sigillate, le tiene al massimo due minuti per far incontrare i due
dispositivi, e poi esce di scena: la conversazione viaggia diretta, cifrata,
da un dispositivo all'altro (WebRTC/DTLS 1.3). Il dettaglio completo, ruta
per ruta, è in `prova-formale/PROTOCOLLO.md`.

Se una frase su un sito o in un'email sembra dire «nessun server esiste», è
una nostra imprecisione di formulazione, non del codice: segnalatela, la
correggiamo.

## «L'indirizzo IP si vede?»

Sì, fra chi chiama e chi risponde, una volta stabilita la connessione diretta
— è inerente a qualunque collegamento P2P via WebRTC, non una scelta né una
falla di Logos (vale anche per le chiamate dirette di altri messenger
cifrati). Il relay stesso non lo collega a nessuna identità. Chi ha bisogno
di nascondere anche quello trova la strada con Tor, spiegata nella pagina
`installa.html` del sito.

## «Perché un file solo da 12.000 righe, invece di moduli?»

Scelta deliberata (CLAUDE.md, regola 3), non mancanza di struttura. L'app va
sul telefono come un unico file HTML; per un progetto che promette che
nessuno legge le conversazioni, poter essere letto per intero da una persona
sola vale, per noi, più di una struttura modulare convenzionale. È il motivo
per cui è stato possibile leggerlo criticamente in poche ore invece che
fidarsi di un albero di dipendenze.

## «Perché zero librerie esterne, niente CDN?»

Non è un giudizio sulla privacy dei CDN in sé: è una scelta sulla catena di
fornitura. Un messenger cifrato che dipende da librerie di terzi eredita ogni
vulnerabilità di quelle librerie — è successo, seriamente, con xz-utils nel
2024. Zero dipendenze significa zero superficie di attacco ereditata da
codice che non abbiamo scritto né possiamo controllare quando cambia.
`tests/fake-browser.js` (150 righe scritte a mano) esiste per la stessa
ragione: anche nei test, niente jsdom.

## «Perché il README è in inglese e i file si chiamano in italiano?»

Vero, è un'incoerenza reale: i file (`modifica.js`, `modifica.html`...) sono
nati per un autore italiano; il README guarda a un pubblico internazionale.
Non è urgente, ma è segnata per essere sistemata.

---

Domande nuove, di questo tipo, sono benvenute — è esattamente a cosa serve
pubblicare tutto: `github.com/digitalvalut/logos-protocol`.
