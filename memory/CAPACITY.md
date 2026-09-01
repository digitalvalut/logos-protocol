# QUANTO REGGE LOGOS — modello di capacità

*Ultimo aggiornamento: 2 settembre 2026, app v31 / 3.95, worker v32.*

⚠️ **REGOLA DI QUESTO FILE: nessun numero inventato.** Ogni cifra qui sotto è
*misurata* (letta dalle costanti del codice, o osservata sul servizio vivo) oppure
marcata **SCONOSCIUTO**. Un numero plausibile ma non verificato in un documento di
capacità è peggio di nessun numero, perché ci si prendono decisioni.

---

## 1. IL TETTO VERO: le scritture, non le letture

Piano gratuito Cloudflare KV (verificato sull'account il 1 set 2026):

| Risorsa | Quota giornaliera |
|---|---|
| letture | 100.000 |
| **scritture** | **1.000** |
| cancellazioni | 1.000 |
| elenchi (`list`) | 1.000 |

**Le scritture sono cento volte più scarse delle letture, ed è lì che Logos si
ferma per primo.** Ogni ragionamento sulla crescita deve partire da 1.000, non da
100.000. Questo è l'errore che ha reso il commento nel worker (*"lookups are
free"*) falso e pericoloso per settimane.

---

## 2. COSTO DI UN UTENTE FERMO (misurato dalle costanti del client)

Un dispositivo con **l'app aperta che non sta facendo niente** interroga comunque
il relay, per poter ricevere una chiamata.

| | intervallo | contatti/slot per giro | letture/min |
|---|---|---|---|
| rubrica (`INBOX_FAST_MS`) primi 30 s | 4 s | 4 | 60 |
| rubrica (`INBOX_SLOW_MS`) a riposo | 20 s | 4 | **12** |
| indirizzo (`ADDR_FAST_MS`) primi 30 s | 5 s | 1 | 12 |
| indirizzo (`ADDR_SLOW_MS`) a riposo | 15 s | 1 | **4** |

- **A riposo: 16 letture/minuto per dispositivo.**
- Primi 30 secondi dopo l'apertura: 72 letture/minuto.
- **Prima del 1 set 2026 era 132/min** (rubrica 4 s × 8 contatti, indirizzo 5 s
  fisso): **8,2 volte più caro**, ed è ciò che ha fatto scattare l'avviso
  Cloudflare al 50% della quota il 1 settembre. ⚠️ **Non era un attacco: era il
  funzionamento normale.**
- **Zero** quando l'app è in secondo piano: entrambi i cicli si fermano su
  `visibilitychange` e ripartono al ritorno.

### Quanti utenti reggono le letture

| app aperta | letture/utente/giorno | utenti prima della quota |
|---|---|---|
| 1 h | 960 | ~104 |
| 2 h | 1.920 | **~52** |
| 4 h | 3.840 | ~26 |

*(prima della correzione, con 2 h/giorno: **6 utenti**.)*

---

## 3. COSTO DI UNA CONVERSAZIONE (scritture)

| operazione | scritture |
|---|---|
| offerta pubblicata | 1 |
| risposta pubblicata | 1 |
| rinfresco dell'offerta mentre si aspetta (`nextRefresh`, ogni 80 s) | 1 ogni 80 s |
| indirizzi di rete (`candidatePump`, raggruppati a 350 ms) | **SCONOSCIUTO — stimato 3-6 per lato** |
| busta per chi non è online (`/wake`) | 1 |
| lettura della casella (get + delete) | 1 cancellazione |

⚠️ **`candidatePump` non è misurato.** Raggruppa gli indirizzi di rete con un
ritardo di 350 ms e ne scrive un lotto per volta; quanti lotti escano dipende da
quanti indirizzi trova la rete di quel dispositivo, che varia. **È la voce più
grossa e la meno nota: va misurata su una connessione vera prima di fidarsi di
qualunque totale.**

**Stima di lavoro, dichiarata come stima:** ~10-15 scritture per conversazione
riuscita → **~70-100 conversazioni al giorno in tutto il mondo** sul piano
gratuito. Coerente con l'ordine di grandezza già annotato nel progetto (~80).

**Un invito che nessuno apre costa di più di uno accettato subito**: continua a
rinfrescarsi per 15 minuti (fino a ~11 scritture) prima di scadere.

---

## 4. LIMITI ATTIVI SUL RELAY, E PERCHÉ QUEI NUMERI

Contati in **unità di costo**, non in chiamate: una lettura della casella ne
spende 2 (la `get` più la `delete`), una raccolta di lettere fino a 11. Contare le
chiamate invece del costo è ciò che rendeva cieco il limite precedente.

| limite | valore | da cui deriva |
|---|---|---|
| `RL_MAX_READS` (per IP, al minuto) | 900 unità = **450 letture** | 28 dispositivi fermi dietro lo stesso WiFi (16 let/min l'uno) |
| `RL_MAX_WRITES` (per IP, al minuto) | **30** | una connessione onesta ne fa ~1 ogni 80 s: 40× di margine |
| `RL_TURN_MAX` (per IP, al minuto) | 120 | l'app le chiede una volta per apertura e le tiene |
| `GLOBAL_MAX_READS` (per isolate) | 3.000 unità = 1.500 letture | ~94 utenti fermi per isolate |
| `GLOBAL_MAX_WRITES` (per isolate) | 40 | ⚠️ vedi sotto |
| `LETTERS_PER_COLLECT` | 5 | prima una sola richiesta poteva costare 41 operazioni |

### ⚠️ Il tetto globale delle scritture non protegge la quota giornaliera

40 scritture/minuto × 1.440 minuti = **57.600 al giorno**, cioè **57 volte** la
quota di 1.000. Come difesa della quota giornaliera **non serve a niente**;
serve solo a smorzare un picco istantaneo.

**Perché è così e non più stretto:** un contatore davvero globale e giornaliero
dovrebbe vivere nello storage, e leggerlo/scriverlo a ogni richiesta costerebbe
quanto la richiesta che protegge — l'errore descritto al §35 del protocollo, e
già commesso una volta in questo worker (annotato nel commento a `RL_MAX_LOOKUPS`).
Con Durable Objects si farebbe bene; sul piano gratuito **no**.

**Conseguenza da dire in chiaro: la quota giornaliera non è protetta da un
tetto. È protetta solo dai limiti per indirizzo IP e dal fatto che il traffico
oggi è minuscolo.** Un attaccante distribuito su molti indirizzi può ancora
esaurirla. → vedi *Non protetto*, §7.

---

## 5. AMPLIFICAZIONE: quanto costa una singola richiesta

| rotta | letture | scritture | elenchi | costo massimo |
|---|---|---|---|---|
| `GET /mailbox/<k>` | 1 | 1 (delete) | – | 2 |
| `GET /mailbox/<k>?peek=1` | 1 | – | – | 1 |
| `PUT /mailbox/<k>` | – | 1 | – | 1 |
| `GET /wake/<k>` | 1 | – | – | 1 |
| `PUT /wake/<k>` | – | 1 | – | 1 |
| `GET /key/<k>` | 1 | – | – | 1 |
| `PUT /key/<k>` | – | 1 | – | 1 |
| `PUT /letter/<k>/<r>` | – | 1 | 1 | 2 |
| **`GET /letter/<k>`** | fino a 5 | fino a 5 (delete) | 1 | **11** |

⚠️ **`GET /letter` era l'amplificazione peggiore: fino a 41 operazioni** (1 elenco
+ 20 letture + 20 cancellazioni) da una sola richiesta. Con
`LETTERS_PER_COLLECT = 5` scende a 11. Chi ha più di cinque lettere le ritira in
più giri: nessuna va persa.

---

## 6. COSA SUCCEDE QUANDO UN LIMITE SCATTA

| situazione | risposta | cosa vede la persona |
|---|---|---|
| oltre il limite per IP | `429` | il client rallenta da solo (`THROTTLE_BACKOFF_MS`, 4 s) e riprova |
| oltre il tetto globale | `429` | come sopra |
| storage che rifiuta per frequenza | `429` | come sopra — **non più `500`** |
| storage guasto | `503` | "riprova più tardi" |
| origine non consentita | `403` | — |

⚠️ **La distinzione 429/503 non è cosmetica.** Un `500` dice "il server è rotto",
e un client che crede il server rotto **riprova** — moltiplicando il carico
proprio quando la causa è che si stava già andando troppo forte. Prima del
2 set 2026 **11 delle 13 operazioni sullo storage** potevano restituire `500`.

---

## 7. PROTETTO / NON PROTETTO

**Protetto, e verificato sul servizio vivo il 1-2 set 2026:**
- Diluvio di letture da un indirizzo → 450 passano, poi `429`. *Misurato.*
- Diluvio di scritture da un indirizzo → 30 passano, poi `429`. *Misurato.*
  (era **senza alcun limite**: 1.000 richieste spegnevano Logos a tutti)
- Amplificazione della raccolta lettere: da 41 operazioni a 11.
- Guasto o rifiuto dello storage → `429`/`503`, mai `500`. *Test sabotati.*

**NON protetto, e va detto:**
- ⚠️ **Abuso distribuito.** I contatori vivono nella memoria di ogni isolate, e
  Cloudflare ne fa girare molte. *Misurato: 60 scritture da 10 connessioni
  parallele → 57 passate; le stesse 60 da una sola connessione → 30 passate e
  30 respinte.* Chi distribuisce il traffico su molti indirizzi aggira i limiti
  per indirizzo.
- ⚠️ **La quota giornaliera non ha un tetto reale** (§4).
- **SCONOSCIUTO:** il costo in scritture di `candidatePump` su una connessione
  vera.
- **SCONOSCIUTO:** quante isolate Cloudflare tenga vive per questo worker; senza
  quel numero il tetto globale non è convertibile in un tetto vero.

---

## 8. LE TRE ZONE

| zona | quando | cosa succede |
|---|---|---|
| **sicura** | < 50 utenti attivi/giorno | tutto funziona |
| **degradata** | oltre i limiti per IP | `429` sulle richieste in eccesso, il client rallenta e riprova; le conversazioni già aperte **non passano dal relay** e continuano indisturbate |
| **esaurita** | quota giornaliera finita | nessuna connessione nuova fino a mezzanotte UTC. ⚠️ **Le conversazioni in corso restano vive**: sono dirette fra i due dispositivi |

**La cosa che rende sopportabile la zona esaurita:** il relay serve solo a farsi
*trovare*. Chi è già collegato non lo attraversa, e non se ne accorge.

---

## 9. LA DECISIONE CHE PRIMA O POI VA PRESA

**Sul piano gratuito Logos regge dell'ordine di 50-100 conversazioni al giorno
nel mondo.** Non è un difetto da correggere: è il prezzo del piano.

Il piano a pagamento (5 $/mese) porta 10 milioni di letture e 1 milione di
scritture al mese — **circa mille volte** la capacità attuale in scrittura.

⚠️ **Non è una decisione tecnica, è una decisione di prodotto**, e spetta
all'associazione: oggi la spesa è 0,00 $ e il traffico sono le prove dell'autore.
Va ripresa **prima** di qualunque annuncio pubblico (F-Droid, NLnet, stampa), non
dopo — perché il giorno in cui Logos funziona è il giorno in cui smette di
funzionare, se resta com'è.

---

## 10. PROSSIMA AZIONE

**Misurare quante scritture consuma davvero una connessione reale**, contando le
`PUT /mailbox/*trickle*` di un collegamento vero fra i due dispositivi
dell'autore. È l'unica voce grossa ancora marcata SCONOSCIUTO, ed è quella da cui
dipende il numero di conversazioni al giorno — cioè la decisione del §9.
