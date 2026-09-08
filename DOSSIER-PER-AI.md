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

*Versione descritta: `logos-modifica-4.32` — 8 settembre 2026.*
*App Android: `versionCode 39`, che contiene la 4.31.*

> Le versioni si muovono in fretta. Se stai leggendo questo file molto dopo
> quella data, la struttura (§2, §3, §5, §7) invecchia lentamente, gli elenchi
> di funzioni no. Il numero vero lo dice `APP_VERSION` in `modifica.js`.
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

Esiste **un solo componente lato server**: un Cloudflare Worker (809 righe) che
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
| `modifica.js` | 10.799 | Tutta la logica dell'app + 13 lingue |
| `modifica.html` | 995 | Le schermate |
| `modifica.css` | 944 | L'aspetto |
| `turn-worker/worker.js` | 809 | Il Worker |
| `index.html/js/css` | 1.120 | La pagina di presentazione pubblica |

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
**Il telefono squilla anche con l'app chiusa, senza Google e senza Firebase**
(da versionCode 36, solo nel pacchetto Android): un servizio in primo piano
dell'app stessa legge la propria casella cifrata sul relay ogni 45 secondi e,
quando trova qualcosa, alza una schermata di chiamata sopra il blocco. Non
possiede nessuna chiave e non puo' leggere niente: la domanda che pone ha come
unica risposta possibile si o no, e chi chiama e cosa ha scritto li legge l'app
quando la apri. I costi, detti in chiaro: fino a 45 secondi di attesa prima che
squilli, e piu' batteria di una notifica push. E' spento finche' non lo accendi.
⚠️ Il periodo di 45 secondi non e' arbitrario: a 15 secondi la sola funzione
costava 5.760 letture al giorno per utente, tre volte quanto l'app spende mentre
qualcuno la sta davvero guardando.
Nel browser esiste invece **"resta in ascolto"**, che tiene lo schermo acceso e
fa squillare finche' la scheda e' aperta.
**Foto ripulite dai metadati prima di partire** (v3.69): un JPEG o PNG scattato
con il telefono porta con sé GPS, modello del dispositivo, a volte il software
usato per salvarlo — tolto sul dispositivo, byte a byte, prima dell'invio, senza
toccare un solo pixel dell'immagine (non è ricompressione: i segmenti EXIF/XMP/
IPTC vengono ritagliati fuori, i dati dell'immagine passano intatti). Copre
JPEG e PNG; WebP e HEIC non ancora.

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
- **Le economie invisibili, chiuse (v3.72)**: un file gia ricevuto usciva dalla
  contabilita della memoria e restava vivo senza essere contato (40 file da 4 MB
  = 160 MB che il conteggio giurava fossero zero); il tetto di 768 MB difendeva
  da un muro che un telefono raggiunge fra i 200 e i 400 MB, quindi sui
  dispositivi che dovevano proteggere non scattava mai — la scheda moriva e
  basta; a memoria piena ogni messaggio ripagava l'intera riserializzazione
  della cronologia per una scrittura che poteva solo fallire; e il ciclo che
  raccoglie gli indirizzi di rete moriva in silenzio lasciando uno stato che
  diceva il falso. **In piu**, trovato lavorando: il rifiuto di un file per
  memoria piena era un `return` muto — nessuna bolla, nessuna riga, su nessuno
  dei due lati, cioe la stessa perdita silenziosa che il lato mittente considera
  il guasto peggiore di tutti. Ora viene detto.
- **Due contatti che si leggono uguali non sono piu indistinguibili (v3.71)**:
  chiunque poteva presentarsi come "Mамма" (con lettere cirilliche) e comparire
  in rubrica come una riga identica a quella vera — e **sopra** di essa, perche
  la piu recente va in cima. Costo dell'attacco: mandare un saluto. Ora i nomi
  vengono confrontati su una forma normalizzata (NFKC, invisibili rimossi,
  omoglifi cirillici/greci ricondotti al latino), **solo per il confronto e mai
  per la memorizzazione** — il nome di chi si chiama davvero cosi resta scritto
  come lo ha scelto. E dove due nomi collidono, la rubrica dice **quale dei due
  e stato verificato a voce**, usando le tre parole che l'app gia ricorda per
  impronta: "(2)" dice che sono due, non quale sia tua madre.
- **Una connessione abbandonata non rende piu sordo il telefono (v3.70)**: una
  procedura interrotta da un'eccezione lasciava la connessione in stato `new` —
  ne chiusa ne fallita — e `busyWithSomeone()` la leggeva come "occupato" per
  sempre, rendendo il dispositivo irraggiungibile a chiunque fino a un
  ricaricamento. Invisibile a chi lo subisce, innescabile da remoto. Corretto in
  due modi insieme: ogni connessione viene **marcata alla nascita** nell'unico
  punto da cui passano tutte (`newPeerConnection`), cosi nessuna procedura deve
  ricordarsi di nulla e una `new` piu vecchia di 3 minuti smette da sola di
  bloccare; e i due `catch` che potevano lasciarla li ora la chiudono subito,
  perche il recupero sia immediato invece che fra tre minuti.
- **Un pulsante di uscita quando il collegamento vacilla**: se lo stato
  `disconnected` non si risolve da solo entro qualche secondo (tipico di un
  cambio rete a metà chiamata), offre subito la stessa via d'uscita già
  costruita per una connessione davvero caduta, invece di aspettare passivamente
  il timeout interno del browser (20+ secondi)

### Resilienza
- **File unico**: tutta l'app in un solo HTML da mettere ovunque
- **Sopravvive senza Cloudflare**: il codice lungo non passa da nessun server
- **141 test automatici** a ogni pubblicazione, senza installare niente

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

## 6. Limiti noti, dichiarati

Qui stanno i limiti di progetto e le cose non ancora fatte. **Non** ci stanno i
difetti aperti: una regola del progetto vieta di pubblicare la mappa di ciò che
è ancora rotto, e pubblicare il codice non è la stessa cosa che pubblicare
l'elenco di dove colpire. Chi trova qualcosa scriva a quanto indicato in
`SECURITY.md`.

- **Le letture del relay (KV di Cloudflare) sono eventualmente coerenti**, non
  immediate: un valore scritto da un lato può metterci qualche secondo a essere
  visibile dall'altro. È la causa residua più probabile dei collegamenti lenti
  nei casi peggiori. Soluzione individuata e **non** eseguita: Durable Objects
  al posto di KV, solo per `/mailbox`. Costo vero: richiede il piano a pagamento,
  **5 dollari al mese fissi**. Non si esegue finché quel costo non viene accettato
  consapevolmente dall'associazione, che non ha entrate.
- **Nessun riavvio ICE attivo** quando la connessione si degrada. L'app offre
  un'uscita rapida se lo stato resta `disconnected`, ma non tenta una
  rinegoziazione: è un intervento ad alto rischio sul protocollo di segnalazione,
  per recuperare qualcosa che dopo un cambio di rete vero è spesso irrecuperabile
  comunque (i candidati della vecchia rete non esistono più).
- **iOS non è mai stato collaudato su un dispositivo reale.** Nessun iPhone
  disponibile. Non si dichiara funzionante ciò che nessuno ha provato.
- **Nessun audit indipendente esterno.** Due candidature a finanziamenti pubblici
  aperte, una respinta.
- **La cronologia dei messaggi è salvata in chiaro sul dispositivo.** Dichiarato
  in `SECURITY.md`. Chi ha accesso al telefono sbloccato legge le conversazioni:
  la cifratura protegge il transito, non un telefono in mano a qualcun altro.
- **Il codice a sei cifre è un segreto corto.** Vive pochi minuti e la casella si
  svuota alla prima lettura, ma resta l'anello più debole fra i modi di
  collegarsi. Il QR di persona e l'indirizzo permanente non hanno questo limite.
- **Disponibilità legata a un piano gratuito.** Il relay ha un tetto giornaliero
  di scritture. Misurato: una chiamata costa ~4 scritture, un telefono in ascolto
  ~1.920 letture al giorno. **Una conversazione già collegata non costa nulla al
  relay**, perché non ci passa.
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

## 9. Come si lavora — la parte su cui giudicarci

Il codice di questa applicazione è stato scritto in larghissima parte da
un'intelligenza artificiale, diretta da una persona che non è programmatore.
Lo diciamo per primi perché è verificabile in trenta secondi: `CLAUDE.md` nella
radice è indirizzato a chi modifica il codice, *«una persona o un'AI»*, e i
commit portano la firma di coautore.

La domanda interessante quindi non è *se* sia stata usata un'AI, ma **cosa è
stato costruito perché il risultato sia verificabile lo stesso**. Questo:

### I test si sabotano, uno per uno

Un test che non può fallire è decorazione. Nessun test entra prima che il
comportamento che sorveglia sia stato **rotto apposta** e il test sia stato visto
diventare rosso — rotto il *comportamento*, non la sintassi: un test verde contro
codice che non compila non dimostra niente.

Serve davvero. In un solo giorno sono stati scoperti così due test che non
guardavano niente: preparavano a mano lo stato invece di lasciarlo produrre al
codice, e restavano verdi anche cancellando la riga che dovevano proteggere.
Li ha trovati il sabotaggio, non chi li aveva scritti.

### Una campagna che rimette dentro i difetti veri

`tests/mutanti.js` contiene **17 difetti che questo progetto ha realmente**
**pubblicato in passato**. Un comando li reinserisce uno alla volta nel codice e
verifica che la suite li riprenda tutti.

⚠️ Si rifiuta di partire se prima non ha dimostrato che il codice **non** mutato
passa: la prima versione dava «16 uccisi su 16» mentre in realtà mancavano dei
file e la suite era rossa comunque. Un arnese che trova tutto è rotto quanto uno
che non trova niente.

### Una copia gemella dove provare, che non può toccare i dati veri

Niente arriva all'app di tutti direttamente. Esiste una copia a `prova/`, sullo
stesso sito — deve esserlo, perché il relay accetta tre origini e rifiuta tutto il
resto, `localhost` compreso: una copia altrove non potrebbe provare inviti,
indirizzi e chiamate, cioè le uniche cose che vale la pena provare.

Stesso sito significa stessa memoria del browser, quindi tutto ciò che l'app salva
passa da **un solo punto** che rinomina i dati quando riconosce di girare nella
copia. Un test vieta di chiamare `localStorage` da qualunque altro punto: una
separazione che dipende dal ricordarsene non è una separazione. La copia porta una
fascia rossa che non si può chiudere.

### Occhi, non impressioni

`tests/aspetto.js` gira in un browser vero e misura **numeri**: niente esce
lateralmente, ogni bersaglio toccabile è almeno 44px, nessun testo è tagliato,
niente di premibile è coperto. Non confronta immagini — servirebbe una libreria
che questo progetto non caricherà mai, e griderebbe al lupo a ogni cambio di
carattere. Le regole sono assolute, quindi non c'è nessun riferimento da
aggiornare: un bersaglio o è grande abbastanza per un dito o non lo è.

Ha trovato sei bersagli sotto i 44px, fra cui il controllo di sicurezza
(60×15 px) e i tre tasti della dimensione del testo. Corretti tutti, senza
eccezioni.

### Regole che prendono ciò che un revisore umano non vede

- **13 lingue, sempre tutte e 13.** Una frase aggiunta in una sola fa fallire i
  test finché non esiste in tutte, segnaposti compresi.
- **Due lingue non possono avere la stessa frase lunga** (soglie misurate sul
  codice sano: 20 caratteri e 3 parole, zero falsi allarmi). Nasce da una frase
  inglese finita nella pagina italiana e pubblicata con la suite tutta verde.
- **Una lingua che si scrive in un altro alfabeto lo usa davvero**, dove
  l'alfabeto è inequivocabile (russo, cinese, arabo, urdu, hindi, bengalese).
- **Un testo che resta a schermo deve passare da `setT()`**, altrimenti si
  congela nella prima lingua in cui è stato disegnato. Regola scritta al
  contrario di proposito: non un elenco dei casi rotti, che invecchia, ma il
  divieto della scorciatoia — chi la vuole deve dichiarare perché.
- **Il numero di versione nell'app deve essere uguale a quello nella cache**, e
  ogni elemento che il codice cerca deve esistere nella pagina.

### Build riproducibile, verificata da una macchina

Il pacchetto Android pubblicato è ricostruibile byte per byte dal codice.
Misurato l'8 settembre 2026: due compilazioni pulite su un Mac e una su una
macchina Linux di GitHub hanno prodotto la **stessa identica impronta**
(`e61e44c6…`), e le 48 voci dell'archivio pubblicato corrispondono a quelle
ricostruite. Una CI lo rifà dopo ogni pubblicazione.

Significa che nessuno — gli autori compresi — può infilare qualcosa nel pacchetto
senza che si veda. ⚠️ La chiave di firma **non** sta nella CI: la macchina
costruisce e confronta, la firma resta sul computer di chi pubblica. Per un'app
che promette di non affidare niente a nessuno, la chiave che dimostra «questo
pacchetto è nostro» non si dà in custodia a un terzo.

### Zero dipendenze, sul serio

Nessun `node_modules`, nessuna CDN, nessuna libreria — **nell'app e nei suoi
test**. Non c'è nessun `npm install` perché non c'è niente da installare. Al
posto di jsdom c'è un finto browser scritto a mano di ~150 righe. La
rivendicazione più forte di Logos è che una persona sola possa leggerlo tutto, e
un albero di dipendenze la annulla in silenzio.

### Cosa nessun collaudo qui dentro può vedere

Detto chiaramente, perché è la parte che conta:

- **Le chiamate vere** — audio, video, altoparlante, cambio fotocamera. Nessun
  test le tocca. Si provano a mano, su telefoni veri.
- **Se una schermata si capisce.** Nessuna macchina lo sa.
- **iPhone e Safari.**

I difetti peggiori di questo progetto li ha trovati una persona che guardava lo
schermo, non la suite. L'ultimo l'8 settembre 2026: tredici frasi restavano nella
lingua sbagliata, e i 373 test erano tutti verdi perché guardavano i dizionari,
che erano a posto.

### I numeri, misurati l'8 settembre 2026

| | |
|---|---|
| Test automatici | **375**, in 54 gruppi, ~2 minuti e mezzo |
| Difetti storici rimessi dentro e ripresi | **17 su 17** |
| Dipendenze di terzi, a esecuzione | **0** |
| Lingue | **13**, tutte complete |
| Build riproducibile | verificata su **due sistemi operativi diversi** |

⚠️ Questi numeri invecchiano. Una regola del progetto dice di non citarne mai uno
senza averlo appena misurato: diverse delle ore peggiori di questo progetto sono
nate da una cifra detta con sicurezza e sbagliata.
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

*Dossier generato il 16 agosto 2026, aggiornato il 25 agosto 2026 sulla versione
`logos-modifica-3.72`.*
*Non contiene chiavi, password né dati personali: può essere condiviso liberamente.*
