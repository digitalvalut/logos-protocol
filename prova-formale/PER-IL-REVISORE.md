# Per chi revisiona Logos — ogni promessa, e dove sta la prova

*For reviewers — English summary at the end.*

Questo fascicolo esiste per una ragione sola: far lavorare un revisore in un
pomeriggio invece che in una settimana. Logos promette poche cose precise;
per ognuna, qui sotto c'è **dove sta nel codice**, **quale modello formale la
copre** (se la copre), **quale test la sorveglia**, e **come verificarla da
soli**. Dove una promessa *non* ha una prova, è scritto.

Tutto è pubblico e rieseguibile. Niente qui chiede fiducia.

## Come usare un pomeriggio

1. **Leggere** `PROTOCOLLO.md` (il rito, riga per riga: 30 minuti).
2. **Scorrere** la tabella qui sotto e scegliere le promesse che vi
   interessano.
3. **Far girare i modelli**: su GitHub, *Actions → «prova formale» → Run
   workflow* (circa un'ora, i risultati sono nei log e nell'artefatto); o in
   locale con Tamarin 1.12 + Maude 3.5 e ProVerif 2.05.
4. **Far girare i test**: `node --test` dalla radice, Node 22, nessuna
   dipendenza da installare (tre minuti; 488 test, 74 suite — misurati il 16
   settembre 2026, contateli voi).
5. **Dirci dove sbagliamo**: `SECURITY.md` dice come, in privato o in pubblico
   a vostra scelta.

## Le promesse, una per una

Convenzioni: `modifica.js` è l'app (un file), `turn-worker/worker.js` è il
relay, `tests/` i test. I lemma Tamarin stanno in `tamarin/*.spthy`, le query
ProVerif in `proverif/*.pv`. «§» rimanda a `PROTOCOLLO.md`.

| # | Promessa | Nel codice | Modello formale | Test | Verificatelo voi |
|---|---|---|---|---|---|
| 1 | **Il relay non legge mai un messaggio né una SDP.** Tutto ciò che scrive è sigillato prima di arrivare. | `sealFor` / `openFrom` (ECIES verso la chiave dell'indirizzo), `sealWith` / `mailboxPutSealed` (chiave simmetrica derivata) — `modifica.js` ~6208–6300. Il relay (`handleMailbox`, `handleLetter`) conserva byte opachi con scadenza. | Invito: `A1_relay_non_legge` (`logos-invito.spthy`), `A1_cifre_pubbliche_relay_non_legge` (`logos-invito-v46.spthy`). Indirizzo: `query attacker(new sdpA)` in `logos-indirizzo.pv` (true). Contatti: le due query di segretezza in `logos-contatto-v45.pv` (true). | `worker-audit.test.js`: «quello che entra esce una volta e poi non c'è più», «il gettone NON esce mai dal relay». | Leggete `handleMailbox`: non c'è una riga che decodifichi il corpo. Cercate `JSON.parse` nel worker: si applica solo a metadati. |
| 2 | **L'indirizzo è l'impronta di una chiave pubblica; il relay non può sostituire la chiave.** | `addressFromPub` / `myAddress` (~6864–6893): l'indirizzo è l'hash della chiave pubblica; `fetchAddrKey` (~6426) ricalcola l'hash e rifiuta ciò che non corrisponde. | `B4_chiave_non_sostituibile` (`logos-indirizzo.spthy`, non termina) → in ProVerif: `event(AChiama(pkb,…)) ==> event(Nasce(pkb))` in `logos-indirizzo.pv` (true: A chiama solo una chiave nata come chiave di un B onesto). | `worker-audit.test.js`: «LA PROVA CHE CONTA: una chiave non può calpestare lo slot di un'altra», «materiale che non è una chiave P-256 viene rifiutato». | Cambiate un byte alla chiave pubblicata (`PUT /key/:slot`) e chiamate: l'app deve rifiutare prima di cifrare. |
| 3 | **La chiave privata non si può leggere, nemmeno dal codice di Logos.** | `extractable: false` alla creazione (~3997). | Fuori dal modello simbolico (è una proprietà della piattaforma). | Nessun test può leggerla: è il punto. `checks.test.js` verifica invece che nessun codice esterno entri nella pagina (CSP). | Cercate `extractable` in `modifica.js`; nella console del browser provate `crypto.subtle.exportKey` sulla chiave: deve fallire. |
| 4 | **L'invito (link/QR) resta sicuro anche se le sei cifre sono pubbliche.** Le cifre nominano lo slot; il segreto lungo nel link sigilla. | `quickSecrets(code, lungo)` (~6122), `quickSecretsBoth` (~6169), `mailboxGetSealedAny` (~6177). | `A2_cifre_pubbliche_nessun_mitm` (`logos-invito-v46.spthy`, dimostrata). `A3_mitm_con_lungo_rivelato_ESISTE` (traccia attesa: chi porta il link porta il segreto — dichiarato in `SECURITY.md`). | `logic.test.js`: «chi invita sigilla col segreto lungo: le sei cifre da sole NON aprono la busta (H-01)», «quickSecretsBoth paga PBKDF2 una volta sola». | Fate un invito, leggete la cassetta con le sole sei cifre: la busta non si apre. |
| 5 | **Le tre parole rilevano un intruso nel mezzo.** Sono derivate dal canale DTLS aperto, non da qualcosa che il relay può scegliere. | `showSasPanel` (~4545) e il calcolo dalle due impronte DTLS + due numeri casuali. | `A4_sas_uguali_implica_nessun_mitm` (dimostrata in entrambi i modelli dell'invito). | `logic.test.js`: «IL DIFETTO DELLE TRE PAROLE: il canale che si apre porta con sé la sua connessione», «si arma solo con le due impronte e i due numeri casuali». | Interponetevi sul relay e sostituite le SDP: le parole sui due telefoni divergono. |
| 6 | **Due contatti si ricollegano sotto le loro chiavi ECDH, non sotto le impronte** (che ogni ex contatto comune conosce). | `contactDialSecrets` / `contactOpenIncoming` (~6575–6598): `HKDF(ECDH(eph, pub_B) ‖ ECDH(priv_A, pub_B))`; `contact.pub` imparato nel `hello` sotto DTLS. | `logos-contatto-v45.pv`: segretezza offerta e risposta, autenticazione iniettiva, offerta da A — **true ×4** con le impronte pubbliche. Il difetto precedente: `C2_..._DEVE_FALLIRE` in `logos-contatto.spthy` (traccia trovata, riparato nella 4.38). | `logic.test.js`: «la busta sigillata da A si apre solo da B, e un terzo che conosce le due impronte resta fuori (lemma C2)», «il saluto porta la chiave pubblica, e la rubrica la salva solo se legata all'impronta provata». | Con le impronte di A e B alla mano, provate ad aprire una busta di ricollegamento: non si apre. |
| 7 | **Ogni offerta e risposta porta la direzione (`kind`) dentro il sigillo**; il relay non può restituire a chi chiama la sua stessa busta come risposta. | `kind:'offer'|'answer'` scritto in `sealOrEncodeOffer` e nei percorsi di risposta; il lettore lo esige (`bustaDelVerso`). | Trovato dal modello **prima** che dal codice: la prima stesura senza etichetta è stata bocciata tre volte per riflessione (§6.4). | `logic.test.js`: «statico: ogni offerta e ogni risposta scritta nella cassetta porta `kind`», «l'offerta di A rimandata come risposta (riflessione) non viene accettata». | Rimandate un'offerta come risposta: viene scartata. |
| 8 | **Chi conosce il vostro indirizzo non può svuotarvi la cassetta** (zittire le chiamate). Il gettone dentro la busta è l'unica cosa che cancella. | `mailboxPut` / `mailboxDelete` (~5995–6020), header `X-Logos-Token`, `?keep=1`; nel relay `handleMailbox` (metadato KV, mai nel corpo). | **Fuori dal modello**: è disponibilità, non segretezza (§7). | `worker-audit.test.js`: «l'ATTACCO: chi conosce la cassetta ma non il gettone non può svuotarla», «il gettone NON esce mai dal relay: né nel corpo, né nel peek», i due test «due tempi» sulla compatibilità. | `GET ?keep=1` poi `DELETE` senza gettone: 403 e la busta è ancora lì. |
| 9 | **Il relay non è un oracolo gratuito**: risponde solo alle origini di Logos, e misura letture e scritture per indirizzo. | `ALLOWED_ORIGINS` (worker ~60), `overReadLimit` (~376), e la metratura delle scritture. | Fuori dal modello (§7: limitatore di tentativi). | `worker-audit.test.js`: la serie «un'origine sconosciuta viene respinta», «un diluvio di letture viene respinto con 429», «BUCO 1–4» (quattro buchi storici, chiusi e tenuti come test), «IL FONDO DEL SECCHIO». | Da `localhost` niente funziona: è voluto (`CLAUDE.md`). |
| 10 | **Zero codice di terzi a runtime.** Niente librerie, CDN, font esterni; CSP che lo vieta. | `modifica.html` (CSP), nessun `node_modules`, nessun `package.json` con dipendenze. Android: una dipendenza, `androidx.webkit` (README). | — | `checks.test.js`: «the page loads no script, style or font from anywhere else», «the security policy still forbids outside code», «nothing in the page uses an inline style». | `grep -r "https://" modifica.html` e la CSP. `ls node_modules` → non esiste. |
| 11 | **L'app e la sua cache offline hanno la stessa versione**, così nessuno resta con codice vecchio credendolo nuovo. | `APP_VERSION` in `modifica.js` = `CACHE` in `modifica-sw.js`. | — | `checks.test.js`: «the app and its service worker claim the same version». | Confrontate le due costanti. |
| 12 | **La copia di prova non tocca i dati dell'app vera.** Ogni accesso alla memoria passa da un punto solo. | `MEM` / `PFX_PROVA` (~100–112). | — | `checks.test.js`: «nessuno tocca la memoria del browser scavalcando il punto di passaggio», «la copia di prova si annuncia, e non si può chiudere»; `tests/isolamento.js` nel browser vero (otto controlli). | Cercate `localStorage.` in `modifica.js`: compare solo dentro `MEM`. |
| 13 | **L'APK pubblicato è quello che il codice produce.** | `android/`, `build-single-file.py`, `android/RILASCIO.md`. | — | `.github/workflows/riproducibile.yml`: due build da zero devono essere identiche; poi scarica il pacchetto pubblicato e lo confronta col prodotto del codice (firma esclusa). | Rifate la build con JDK 21 e build-tools 35.0.0 e confrontate: il workflow mostra i comandi esatti. |
| 14 | **Il codice regge a input ostili.** | Ogni lettura da rete passa da un parser che tratta il messaggio come dato. | — | `tests/hostile.js`, `tests/fuzz.js`, `tests/races.js` girano *dentro* la suite (`corse.test.js`, `audit.test.js`); `tests/mutanti.js` rimette 17 difetti storici veri e verifica che i test li colgano (si lancia a mano). | `node tests/mutanti.js`: ogni mutante deve morire. |
| 15 | **Il filo aperto (squillo istantaneo) non porta contenuti.** L'unico messaggio è `{"busta":1}`. | `Filo.java` (client WebSocket scritto a mano, verifica `Sec-WebSocket-Accept`); nel relay la classe `Ascolto` (nessuno storage). | Fuori dal modello (Android, §7). | `worker-audit.test.js`: «l'oggetto: accetta il filo, tira TUTTI i fili aperti con {"busta":1}, e non ricorda niente d'altro»; `android.test.js` sul contratto pagina↔telefono. | Leggete `Ascolto.fetch`: nessun accesso a KV, nessun corpo inoltrato. |

## I limiti dichiarati (non sono promesse, e lo diciamo)

| Limite | Dove è dichiarato | Prova che è così |
|---|---|---|
| **Niente segretezza in avanti** per gli indirizzi permanenti (e per le lettere): chi ottiene la chiave privata apre anche il passato. | `SECURITY.md`; §3, §7. | `NON_forward_secrecy_deve_fallire` (Tamarin), `logos-indirizzo-reveal.pv` (`attacker(new sdpA) phase 1` → vera dopo la rivelazione). Se un giorno **passa**, il modello o il rito sono cambiati. |
| **Chi porta il link dell'invito porta il segreto.** | `SECURITY.md` («Things we already know»). | `A3_mitm_con_lungo_rivelato_ESISTE`. La difesa che resta: le tre parole (#5). |
| **La memoria locale è in chiaro**: cronologia, rubrica, invito aperto. | `SECURITY.md`. | Per costruzione; solo la chiave privata è inestraibile (#3). |
| **Tamarin non termina** sui modelli con Diffie-Hellman (indirizzo, contatti 4.38): lì risponde ProVerif. | `README.md` di questa cartella; §8. | Provate voi: `logos-indirizzo.spthy` con `--prove`. Una lemma sorgente migliore è benvenuta. |
| **Il rito D (ripresa di una chiamata) non è modellato.** | §5, §8. | — |
| **DTLS-SRTP e WebRTC sono assunti corretti.** | §7. | — |
| **Il relay è un punto di disponibilità**: piano gratuito, quote giornaliere. Confidenzialità no, disponibilità sì. | `SECURITY.md`, `CLAUDE.md`. | I test «BUCO» e «FONDO DEL SECCHIO» misurano il costo di ogni rotta. |
| **Nessuna revisione indipendente, finora.** I modelli e i test sono del progetto. | Ovunque, con le stesse parole: «modelli pubblici, non ancora revisionati da terzi». | È il motivo di questo fascicolo. |
| **Parte del codice è scritta con l'assistenza di un'AI**, poi provata e riletta dal progetto. | `README.md`. | — |

## Le cinque domande a cui vorremmo una risposta

1. I modelli in `tamarin/` e `proverif/` descrivono **davvero** il codice in
   `modifica.js`? Dove divergono?
2. Le proprietà scelte (A1–A4, B1–B4, C1–C3) sono **quelle giuste** per un
   messenger di questo tipo? Quale manca?
3. `A3` e `NON_forward_secrecy` sono limiti accettabili per gli utenti a cui
   Logos si rivolge, o vanno chiusi prima di ogni altra cosa?
4. Esiste una lemma sorgente che faccia terminare Tamarin sui modelli DH?
5. C'è qualcosa in §7 («fuori dal modello») che secondo voi **doveva** stare
   dentro?

---

## English summary — for reviewers

This file maps every promise Logos makes to **where it lives in the code**,
**which formal lemma covers it** (if any), **which test guards it**, and **how
to check it yourself**. Where a promise has no proof, it says so. Declared
limits (no forward secrecy on permanent addresses, the invite link carries
its secret, local storage in clear, Tamarin non-termination on DH models,
the repair rite not modelled, DTLS/WebRTC assumed, no independent review yet,
AI-assisted development) are listed with the evidence that they are limits.
Run the models from *Actions → «prova formale»* (about an hour) and the tests
with `node --test` (Node 22, no dependencies, about three minutes). We would
be grateful for answers to the five questions above — in private via
`SECURITY.md`, or in public, as you prefer.
