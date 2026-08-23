# DigitalValut Logos — dossier tecnico completo

**Documento pensato per essere incollato dentro un'intelligenza artificiale** per
chiedere consigli sul progetto.

> ## ⚠️ Come usare questo file
>
> Incollalo per intero, poi fai la tua domanda. Contiene apposta tre sezioni che
> servono a **evitare consigli inutili**:
> - **§4 — cosa l'app fa già** (perché non ti venga riproposto)
> - **§8 — cosa è stato scartato e perché** (perché non ti venga riproposto)
> - **§7 — i vincoli veri** (perché il consiglio sia realizzabile)
>
> Se salti quelle sezioni, riceverai suggerimenti per funzioni che esistono già
> da mesi. È successo davvero.
>
> **Non contiene chiavi né password**: si può incollare ovunque senza rischi.

*Versione descritta: `logos-modifica-3.66` — 23 agosto 2026*

---

## 1. Cos'è, in una riga

Una chat cifrata da persona a persona che gira **interamente dentro il browser**,
senza account, senza numero di telefono, senza che nessun server veda mai il
contenuto di quello che due persone si dicono.

- **App online:** https://digitalvalut.github.io/logos-protocol/
- **Codice pubblico:** https://github.com/digitalvalut/logos-protocol
- **Licenza:** Apache 2.0 — **Proprietà:** DigitalValut APS ETS (associazione italiana no-profit)

---

## 2. Architettura

Due browser si collegano **direttamente** fra loro con **WebRTC**. Messaggi,
file e chiamate viaggiano da un dispositivo all'altro senza attraversare nessun
server intermedio.

Esiste **un solo componente lato server**: un Cloudflare Worker (550 righe) che
fa esclusivamente da "ufficio postale" per la fase di presentazione:

| Rotta | A cosa serve | Quanto conserva |
|---|---|---|
| `/turn` | Genera le credenziali per il ponte, usato quando le reti non permettono il collegamento diretto | niente |
| `/mailbox/<hash>` | Scambio delle buste cifrate di presentazione | **120 secondi**, cancellata alla lettura |
| `/wake/<hash>` | "Come farmi squillare il telefono" (iscrizione notifiche, cifrata) | 24 ore |
| `/letter/<hash>` | Messaggi lasciati a chi non risponde | **7 giorni**, max 20, cancellati alla lettura |
| `/knock` | Inoltra una notifica push firmata VAPID — **senza contenuto** | niente, nessuna iscrizione salvata |

**Tutto ciò che passa dal Worker è cifrato prima di partire.** Il Worker non
può leggere nulla: vede solo hash a 64 caratteri e buste opache.

### Dimensioni

| File | Righe | Cosa |
|---|---|---|
| `modifica.js` | 7.516 | Tutta la logica dell'app + 13 lingue |
| `modifica.html` | 757 | Le schermate |
| `modifica.css` | 683 | L'aspetto |
| `turn-worker/worker.js` | 550 | Il Worker |
| `index.html/js/css` | 989 | La pagina di presentazione pubblica |

**Dipendenze esterne a runtime: ZERO.** Nessun CDN, nessun npm, nessuna
libreria. Nessuna riga di codice scritta da altri viene caricata.

---

## 3. Crittografia

**Nessuna crittografia è scritta a mano.** Tutto usa Web Crypto del browser:

- **AES-256-GCM** per le buste (7 punti)
- **PBKDF2-SHA256** per irrobustire i codici corti (100.000 giri per il codice
  a 6 cifre, 250.000 per la parola d'ordine opzionale)
- **HKDF-SHA256** dove il segreto è già lungo (impronte di certificato)
- **ECDSA P-256** per il certificato d'identità del dispositivo
- **DTLS-SRTP** (nativo del browser) protegge messaggi, file e chiamate

**Verifica dell'identità**: modello ZRTP (RFC 6189) — tre parole da dirsi a
voce. La fiducia è ancorata all'**impronta del certificato**, non al nome, che
chiunque può dichiarare.

---

## 4. Cosa l'app fa GIÀ

> ⚠️ **Leggi questa sezione prima di suggerire qualcosa.** Ogni voce qui sotto
> è già implementata, collaudata e online.

### Tre modi di collegarsi
- **Codice a 6 cifre** + link condivisibile + **codice QR**
- **Indirizzo permanente** (`DV-XXXX-XXXX-XXXX`), non registrato in nessun elenco
- **Fino a 8 indirizzi usa e getta**, con nome, cancellabili singolarmente
- **Rubrica locale**: dopo il primo contatto, un tocco sul nome ricollega da
  solo — nessun codice da reinserire ✅ *già esistente*

### Quando l'altro non c'è
- **Invito che aspetta 24 ore**: chi lo crea può chiudere l'app
- **Notifica push** senza contenuto ("Qualcuno vuole parlarti")
- **Lettera** fino a 7 giorni per chi non risponde
- **Biglietto automatico**: una chiamata senza risposta lascia traccia da sola

### In chat
Messaggi, emoji, **messaggi vocali**, foto, video, file di qualsiasi tipo fino a
**512 MB, mandati non compressi** (qualità originale — WhatsApp/Telegram li
ricomprimono, questa app no), **più file alla volta** scelti o trascinati dentro,
ciascuno con la propria barra di avanzamento. **Chiamate audio e video**, con
**condivisione dello schermo** durante una videochiamata (sostituisce la traccia
video della fotocamera con quella dello schermo sullo stesso collegamento già
aperto — nessun server nuovo, nessun costo aggiuntivo). Cambio fotocamera, muto,
vivavoce, autodistruzione a tempo, pulizia automatica opzionale, svuota cronologia.

### Interfaccia e accessibilità
- **13 lingue** complete (it, en, ar, bn, de, es, fr, hi, id, pt, ru, ur, zh),
  con RTL per arabo e urdu
- **Modalità semplice**: due pulsanti giganti, ora offerta da sola alla prima
  apertura invece di restare nascosta nelle impostazioni
- **Lettura vocale** delle istruzioni
- **Tre dimensioni di testo**
- **Condivisione nativa** (Web Share API) in 6 punti ✅ *già esistente*
- **Ricevere condivisioni da altre app** (Android): si può scegliere
  "DigitalValut Logos" dal menu Condividi di Foto, Gmail, ecc. — il file arriva
  pronto da mandare, anche prima di essersi collegati a qualcuno
- Installabile come app (PWA), funziona offline
- **Scheda "Come sta l'app"**: dice in parole semplici se sei raggiungibile e,
  se non lo sei, perché
- **Puntino di avviso** sull'icona delle impostazioni se arriva un messaggio
  mentre non si sta guardando la chat

### Affidabilità del collegamento
- **Controlli più rapidi nei primi 15 secondi** di ogni attesa (400ms invece di
  1,2-1,5s) — le letture non hanno il limite stretto che hanno le scritture sul
  piano gratuito, quindi costa zero
- **Un intoppo di rete non disattiva più il ponte per tutta la sessione**: prima,
  un solo fallimento nel prendere le credenziali del relay veniva salvato come se
  fosse una risposta valida, e nessun tentativo successivo ne aveva più uno
- **Rispetta un "rallenta" (429) del Worker** invece di continuare a insistere
  allo stesso ritmo
- **Un pulsante di uscita quando il collegamento vacilla**: se lo stato
  `disconnected` non si risolve da solo entro qualche secondo (tipico di un
  cambio rete a metà chiamata), offre subito la stessa via d'uscita già
  costruita per una connessione davvero caduta, invece di aspettare passivamente
  il timeout interno del browser (20+ secondi)

### Resilienza
- **File unico**: tutta l'app in un solo HTML da mettere ovunque
- **Sopravvive senza Cloudflare**: il codice lungo non passa da nessun server
- **110 test automatici** a ogni pubblicazione, senza installare niente

---

## 5. Il limite fondamentale

**Servono entrambi online nello stesso momento.** È il prezzo del non avere
server, ed è architetturale. Mitigato da: invito che aspetta 24h, notifiche
push, lettera 7 giorni. Ma non eliminato.

Altri limiti dichiarati apertamente nell'app stessa:
- Chi parla con te **vede il tuo indirizzo di rete (IP)**
- Su reti molto filtrate le chiamate possono non collegarsi
- Nessun sito può impedire uno screenshot
- **Se cambi telefono o cancelli i dati del browser, perdi indirizzo e rubrica**
  — nessun recupero (problema aperto e riconosciuto)
- L'indirizzo permanente **non scade più** da quando P2 è stato completato
  (v3.48, §6): non dipende dal certificato DTLS, quindi resta valido finché i
  dati dell'app restano sul dispositivo. Quello che ruota ancora una volta
  l'anno sono le *parole di sicurezza* (legate al certificato), non l'indirizzo

---

## 6. Problemi noti ancora aperti

### P2 — RISOLTO (v3.48, 17 agosto 2026)

*Questa era la falla più importante del progetto, e per un po' questo stesso
documento la descriveva come ancora aperta — se hai letto una copia di questo
dossier con quella sezione, era una versione vecchia (v3.45).*

Il problema era reale: la chiave che cifrava le buste dirette a un indirizzo
era ricavata **dalla sola stringa dell'indirizzo**, che è pubblica per
definizione — chi possedeva un indirizzo poteva leggere i metadati delle
chiamate dirette a esso. **Corretto**: l'indirizzo è ora **l'impronta di una
chiave pubblica ECDH** invece della chiave stessa. Chi chiama scarica la chiave
pubblica del destinatario, **verifica che il suo hash corrisponda
all'indirizzo** (una chiave sostituita darebbe un indirizzo diverso, e viene
rifiutata), poi cifra con ECDH verso di essa — solo chi possiede la parte
privata può aprire. La rotta `/key` nel Worker verifica in scrittura che solo
il vero proprietario della chiave possa pubblicarla su quello slot. Conseguenza
collaterale positiva: l'indirizzo non dipende più dal certificato DTLS e quindi
**non scade più** (vedi §5).

### Ancora da valutare

- **Le letture del Worker (KV di Cloudflare) sono eventualmente coerenti, non
  immediate** — un valore scritto da un lato può metterci qualche secondo a
  essere visibile dall'altro, specialmente fra regioni diverse. È quasi
  certamente la causa residua di collegamenti lenti nei casi peggiori.
  **Soluzione individuata ma non eseguita**: Durable Objects di Cloudflare al
  posto di KV, solo per la rotta `/mailbox` (le altre tre — `/wake`, `/key`,
  `/letter` — non ne hanno bisogno, non sono in un ciclo di attesa stretto).
  Costo vero da sapere: **richiede il piano Workers a pagamento, minimo 5
  dollari al mese fissi** — non c'è un piano gratuito che lo includa. Non
  eseguito finché questo costo non viene accettato consapevolmente
  dall'associazione.
- **Nessun riavvio ICE attivo quando la connessione si degrada.** Da v3.59
  l'app offre un pulsante di uscita rapida se lo stato resta `disconnected`
  oltre una pausa ragionevole (§4), ma non tenta un vero riavvio con
  rinegoziazione. Scartato deliberatamente per ora: è un intervento ad alto
  rischio sul protocollo di segnalazione, che potrebbe rompere connessioni
  funzionanti per guadagnare un recupero spesso comunque impossibile (i
  candidati della vecchia rete non esistono più dopo un cambio rete vero).

### Altri, minori
- **iOS mai collaudato su dispositivo reale** (nessun iPhone disponibile)
- Nessun **audit indipendente** esterno
- Le connessioni abbandonate non vengono chiuse esplicitamente (misurato: nessun
  impatto pratico, 10 tentativi di fila non degradano nulla)

---

## 7. I vincoli veri

> ⚠️ **Un consiglio che ignora questi vincoli non è realizzabile.**

1. **Nessun budget.** Associazione no-profit. Niente dominio a pagamento
   (sta su github.io per scelta), niente servizi a pagamento.
2. **Un solo manutentore**, non programmatore di professione. Ogni cosa
   aggiunta va mantenuta da lui per anni.
3. **Zero dipendenze a runtime, e va preservato.** È la proprietà di sicurezza
   più forte del progetto: non esiste catena di fornitura da compromettere.
4. **CSP severa**: `script-src 'self'`, `style-src 'self'`. Niente stili o
   script inline, niente WebAssembly senza indebolire la politica.
5. **Licenza Apache 2.0, di proprietà dell'ETS DigitalValut** (passata da MIT
   il 20 agosto 2026). Permissiva di proposito: consente anche fork chiusi e
   uso commerciale senza obbligo di restituire nulla — scelta fatta per
   massimizzare la diffusione, verificata compatibile con lo statuto
   dell'associazione (Art. 6 e 7: sviluppo/distribuzione software e
   "royalties, licenze di proprietà intellettuale" sono attività statutarie
   esplicite, non improvvisate). Resta comunque il vincolo #3: zero
   dipendenze a runtime, quindi la domanda "questa libreria ha una licenza
   compatibile?" non si pone quasi mai in pratica.
6. **Il pubblico include persone anziane e non tecniche.** Qualunque cosa
   richieda competenza tecnica all'utente è, per questo progetto, un fallimento.
7. **Il Worker accetta solo due origini** (`digitalvalut.github.io` e
   `logos.digitalvalut.it`): da localhost gli indirizzi non funzionano.

---

## 8. Cosa è già stato valutato e SCARTATO (con il motivo)

> ⚠️ **Non riproporre queste cose senza un argomento nuovo.**

| Proposta | Perché è stata scartata |
|---|---|
| **Instradare dentro Tor** | **Impossibile**, non difficile: Tor trasporta TCP, WebRTC richiede UDP; JavaScript non può scegliere il proprio trasporto; Tor Browser stesso **disattiva** WebRTC perché rivela l'IP. |
| **"Il sistema più complesso possibile"** | In sicurezza la complessità è il nemico. WireGuard ha sostituito OpenVPN passando da ~100.000 righe a ~4.000. Un sistema che nessuno può verificare non è sicuro, è opaco. |
| **Livello post-quantistico** | Analizzato a fondo: il pezzo che si potrebbe rafforzare in JS (le buste) **non usa lo scambio di chiavi che il quantistico romperebbe**; il pezzo che ne avrebbe bisogno (la telefonata, dentro DTLS) **JavaScript non può toccarlo**. Guadagno reale quasi nullo. |
| **Proof-of-work contro gli abusi** | Penalizza il telefono vecchio e la persona meno paziente — il pubblico di quest'app — e infastidisce a malapena chi ha le macchine per abusarne. Sostituito con un normale limite di richieste. |
| **Dominio personalizzato a pagamento** | Nessun budget. Resta su github.io. |
| **Consigliare una VPN agli utenti** | Risolve solo l'IP (1 problema su 5) e spingerebbe utenti non tecnici verso VPN gratuite, che spesso rivendono i dati: peggio di niente. |
| **Gruppi (chat a più persone)** | Tecnicamente possibile fino a 4-5 persone, ma moltiplica i modi di rompersi. Rimandato dopo l'audit indipendente. |
| **Modalità "ponte sempre attivo" con interruttore** | Un interruttore di sicurezza spento di base non protegge nessuno, e chiede all'utente di fare l'ingegnere. Meglio: attivarlo **da solo** quando si parla con sconosciuti. *(progettato, non ancora eseguito)* |
| **Instradamento interno (Tor/VPN "scaricabile da dentro Logos"), presentato come "sistema militare"** | **Non è possibile tecnicamente**: una pagina web non può forzare il proprio traffico dentro Tor — è una decisione del browser/sistema operativo, non del sito. Anche solo il "camuffare" il traffico perché non sembri quello che è (elusione della censura) è un campo di ricerca a sé, su cui il progetto Tor lavora da vent'anni e sbaglia ancora. Costruirlo qui, chiamarlo "militare" davanti a chi ci scommette la sicurezza, e sbagliare, metterebbe in pericolo persone vere con falsa fiducia — peggio che non offrirlo affatto. |
| **Posizionare Logos per giornalisti/attivisti in paesi senza libertà di stampa** | L'app non nasconde l'IP dal proprio contatto, non elude la censura di rete, e l'infrastruttura di segnalazione gira su servizi americani (Cloudflare, GitHub) — nessuno di questi fatti si concilia con quel tipo di promessa. Nessun audit di sicurezza indipendente l'ha mai verificata per quel livello di rischio. |
| **Firma crittografica dei file per provarne l'autenticità (stile notarile)** | Idea valida — le chiavi ECDH per farlo esistono già — ma rimandata: l'app ha ancora pochissimi utenti, e aggiungere funzionalità nuove prima di consolidare quelle di base (soprattutto l'affidabilità del collegamento) sposta l'attenzione dal problema più urgente. Da riconsiderare quando ci sarà un uso reale da servire. |

---

## 9. Storia recente (per capire il metodo)

Nell'ultima sessione di lavoro sono state trovate e corrette **otto falle reali**,
tutte verificate **provandole dal vivo**, non leggendo il codice:

1. L'app diventava **irraggiungibile da tutte le strade** quando un invito
   restava in attesa — invisibile, per giorni
2. **L'autodistruzione non distruggeva niente**: diceva "conversazione
   autodistrutta" e lasciava una copia intera sul telefono
3. Un partner ostile poteva **esaurire la memoria** dichiarando un file da 10
   byte e mandandone 25 MB
4. Il controllo di sicurezza **non bloccava nulla** neanche quando l'app stessa
   diceva "qualcuno potrebbe essersi messo in mezzo"
5. La cronologia era indicizzata **per soprannome**, non per certificato
6. Chi possedeva un indirizzo poteva **intercettare e bloccare** le chiamate
7. Le **notifiche non arrivavano mai** se attivate dopo l'indirizzo (ordine
   naturale per chiunque)
8. La rotta delle credenziali TURN **non aveva nessun limite** — l'unica che
   costa soldi veri quando abusata

**Metodo applicato**: ogni correzione è protetta da un test automatico, e ogni
test è validato **rimettendo dentro la falla originale** per verificare che
diventi rosso. Due test sono stati riscritti perché passavano anche col codice
sabotato.

### Da allora (v3.45 → v3.64, 16-23 agosto 2026)

Lo stesso metodo — sabotare ogni test per verificarlo davvero, verificare dal
vivo nel browser, non solo leggere il codice — applicato a un altro giro di
lavoro:

- **Trasferimento file reso davvero usabile**: barra di avanzamento, più file
  alla volta trascinabili, condivisione diretta da altre app su Android (§4)
- **Condivisione dello schermo** nelle videochiamate — riusa il collegamento
  già aperto, zero costo aggiuntivo
- **Rubrica**: un indirizzo permanente chiamato con successo viene ricordato,
  richiamarlo poi è un tocco solo
- **Durata della chiamata**: il testo fisso "In videochiamata" diventa un
  cronometro che scorre (`MM:SS`, `H:MM:SS` oltre l'ora), calcolato ogni tick
  dalla differenza con l'istante di inizio — resta preciso anche se il
  browser rallenta i timer di una scheda in background
- **Sito vetrina** (`index.html`) rifatto: QR per aprire l'app, tabella di
  confronto onesta con WhatsApp/Telegram, la sezione "cosa non fa" tolta dalla
  prima pagina su richiesta esplicita — resta invece intatta in questo dossier
  e nell'app stessa, dove il pubblico è tecnico o ha già deciso di fidarsi
- **Un audit dedicato all'affidabilità del collegamento** (§4, "Affidabilità
  del collegamento"): tre cause reali di fallimenti silenziosi trovate e
  corrette, non ipotizzate
- **Due proposte fatte e respinte nella stessa sessione**, per iscritto qui in
  §8: instradamento Tor/VPN interno "in stile militare", e il posizionamento
  per giornalisti/attivisti in paesi senza libertà di stampa — entrambe
  respinte per ragioni tecniche verificabili, non per eccesso di prudenza

### La revisione esterna del 22 agosto 2026 (v3.62 → v3.64)

Revisione indipendente commissionata dall'autore a un modello di un altro
fornitore. Otto rilievi su nove confermati leggendo il codice, e corretti.

Il più importante non era un errore di crittografia ma di **conclusione**: il
bollino "verificato di persona" veniva scritto in base ad affermazioni che
l'app non può autenticare. Il `v=` nel QR arriva identico se il link è stato
inquadrato o toccato in una chat, quindi chiunque poteva scriverselo da sé; e
una lettera firmata "Mamma" con dentro l'indirizzo di chi la scrive porta a una
connessione **senza intermediari verso la persona sbagliata** — che è ciò che
il phishing produce.

Prima correzione: fiducia negata solo al percorso delle lettere. Sbagliata —
quattro percorsi su cinque restavano dalla parte fidata, il link toccato fra
questi. **Regola finale, adottata su decisione dell'autore**: nessun record di
fiducia viene scritto senza la conferma umana delle tre parole, su nessun
percorso. La prova ECDH resta e viene *detta*, non *scritta come fiducia*. È il
modello di Signal: un safety number non si certifica da solo.

Corretti inoltre: memoria non limitata in aggregato (20 trasferimenti × 512 MB),
pump della casella che non morivano nei catch (fino a metà della quota di
lookup bruciata da un solo caso, provocabile da un peer ostile), `hello` con
nick non-stringa che faceva sparire la verifica, rubrica dirottabile per nome,
`call-offer-sdp` senza guardia, falsi allarmi MITM, file oltre il limite
spediti nel vuoto, foto rotte nella cronologia. Corretto anche un commento che
affermava una forward secrecy inesistente.

Le tre cose che la revisione ha classificato "vere ma non dichiarate" sono ora
scritte nella scheda dei limiti dentro l'app, in tutte le 13 lingue: il grafo
sociale visibile a chi gestisce il Worker, la debolezza intrinseca del codice a
sei cifre, e l'invito lungo in chiaro senza il lucchetto opzionale.

Verificata anche l'**interoperabilità 3.61 ↔ 3.64** dal vivo, due origini
separate, invito lungo in entrambe le direzioni: messaggi, file piccolo, file
da 600 MB, e le tre parole identiche sulle due versioni.

### L'audit ostile del 23 agosto e le prime correzioni (v3.66)

Un audit condotto come attacco, non come lettura: peer ostile programmabile,
150.000 messaggi di fuzzing con generatore seedato, rottura deterministica di
ogni singola attesa delle sei procedure di connessione, il Worker interrogato
su una replica locale, e diciassette difetti storici rimessi dentro apposta per
misurare se l'attrezzatura sapesse ancora vederli (**uccisi 17 su 17**).

Dodici rilievi. **Il più grave era una regressione della correzione stessa**: in
`acceptAddrCall` e `tryQuickConnect` la variabile che il gestore d'errore doveva
leggere era dichiarata dentro il `try`, quindi il gestore sollevava un errore
proprio invece di ripulire — inghiottendo l'errore vero e lasciando acceso
esattamente il ciclo che doveva spegnere. I test non l'avevano vista perché il
sabotaggio era stato fatto sul percorso felice invece che sul ramo `catch`.

Corretti subito i cinque che pesano su un'app **gratuita**, cioè quelli che
consumano il piano su cui gira o rendono falsa una promessa:

- la variabile fuori dal `try` in entrambe le funzioni, e la stessa correzione
  applicata a `startQuickShare`, la sesta procedura che non l'aveva mai ricevuta
- **guardia di rientro** su `checkInboxOnce`: passate sovrapposte moltiplicavano
  le letture (misurato: N passate = N volte le richieste)
- **rubrica a turno**: scorrere quaranta contatti ogni quattro secondi faceva
  seicento letture al minuto contro un budget di trecento — nessun difetto, solo
  uso, e la rubrica la riempie il peer. Ora otto per giro, 120/min, e in sei giri
  la rubrica è coperta tutta
- il **cancello dell'autodistruzione** spostato dentro `persistMedia`: con il
  timer armato il testo non toccava il disco e la foto sì, mentre il codice
  dichiarava il contrario

Rimandati per scelta, non per svista: gli **omoglifi** in rubrica (gravità alta,
ma richiede un attaccante mirato e costa due giorni in tredici lingue) e la
**sordità dopo un'eccezione**, dove esistono due strade e va scelta, non
improvvisata. Il report completo resta privato: elenca difetti non ancora
corretti con le sequenze per riprodurli.

### Foto e video persistenti, per decisione dell'autore (v3.65)

Fino alla v3.64 una foto o un video ricevuti vivevano solo per la durata della
pagina: riaperta la chat il giorno dopo, restava un'icona rotta (poi una
scritta onesta, dalla v3.63). Decisione esplicita dell'autore, dopo aver
valutato l'alternativa più semplice ("scarica o si perde"): **i media restano
sul dispositivo, dentro la stessa conversazione, senza nessun pulsante o
scelta in più da fare** — la priorità dichiarata è non confondere un pubblico
non tecnico con troppe opzioni.

Tenuti in IndexedDB, separati dal testo (che resta in localStorage): un file
può pesare centinaia di megabyte, e la quota di localStorage non lo reggerebbe.
La condizione posta fin dall'inizio della discussione: **ogni funzione che già
promette cancellazione — autodistruzione, "svuota cronologia", pulizia
automatica per data — doveva raggiungere anche i media, senza eccezioni**,
proprio perché uno scarto fra "distrutto" detto e "distrutto" fatto è già
successo una volta in questo progetto. Le tre funzioni riusano la stessa
chiamata (`mediaDeleteByConv`/`mediaDeleteOlderThan`) già agganciata dove
cancellavano il testo — nessuna delle tre è stata duplicata.

Verificato dal vivo, non solo nei test: una foto vera inviata, la chat svuotata
e ricaricata, la foto tornata identica (stesse dimensioni); "svuota cronologia"
cliccato per davvero e la foto sparita anche dal database, non solo dallo
schermo; la pulizia automatica che cancella un media vecchio e lascia intatto
uno recente.

Un limite dichiarato, non nascosto: il browser può evacuare questo spazio da
solo sotto pressione di memoria (specialmente Safari/iOS) — l'app mostra la
scritta onesta anche in quel caso, la stessa già usata per un media
genuinamente perso.

---

## 10. Domande utili da fare a un'AI

Se vuoi un parere davvero utile, chiedi cose come:

- Come progettereste la **migrazione a Durable Objects** (§6) rispettando i
  vincoli §7, in particolare il costo?
- Vale la pena un **riavvio ICE con rinegoziazione** (§6), o il pulsante di
  uscita rapida già costruito è la scelta più sicura?
- Come si risolve la **perdita di identità al cambio telefono** senza
  introdurre account né server?
- Cosa manca perché un'associazione possa **basarci sopra un servizio reale**?
- Quali domande farebbe un **auditor di sicurezza indipendente**?
- Come si rende comprensibile a una persona anziana che **servono entrambi
  online**?

**Domanda da NON fare**: "che funzioni aggiungeresti?" — porta a riproporre
cose della §4 che esistono già.

---

*Dossier generato il 16 agosto 2026, aggiornato il 23 agosto 2026 sulla versione
`logos-modifica-3.66`.*
*Non contiene chiavi, password né dati personali: può essere condiviso liberamente.*
