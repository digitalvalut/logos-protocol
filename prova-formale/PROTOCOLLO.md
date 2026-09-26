# Il rito di Logos, scritto per chi deve dimostrarlo

Questa è la descrizione precisa del protocollo di **segnalazione** di Logos —
cosa si scambiano due telefoni prima di parlarsi direttamente — presa dal
codice riga per riga il 13 settembre 2026 (versione 4.37; i numeri di riga si
riferiscono a quella; la 4.38 ha cambiato il rito C, §4, e aggiunto il verso
delle buste, §6.4). Serve a tre cose: i modelli formali in questa cartella,
un audit esterno (la prima domanda sarà «descrivetemi il protocollo»), e a
chiunque debba capire cosa protegge cosa senza leggere 10.500 righe.

Dove dico «riga N» intendo `modifica.js`; `worker.js` è indicato a parte.
Dove non ho verificato, è scritto. Le cose che **non** reggono sono scritte
qui con la stessa evidenza di quelle che reggono: è il motivo per cui il
documento esiste.

---

## 0. Le primitive (tutte del browser, niente scritto a mano)

| cosa | come | dove |
|---|---|---|
| hash | SHA-256 | `sha256Hex2` 6065 |
| cifratura simmetrica | AES-256-GCM, IV casuale 12 byte | `sealFor`/`openFrom` 6158–6172 |
| derivazione da segreto lungo | HKDF-SHA256, salt fisso `SIGNAL_SALT` | `pairSecrets` 6142 |
| derivazione da codice corto | PBKDF2-SHA256, 100.000 giri, poi 512 bit divisi in chiave (0–32) e seme (32–64) | `quickSecrets` 6099–6138 |
| accordo di chiave | ECDH P-256 | `addrDialSecrets` 6389, `addrOpenIncoming` 6432 |
| identità di trasporto | certificato DTLS di WebRTC, impronta SHA-256 (`fp`) | `myFingerprintHex` 5921 |
| identità di indirizzo | coppia ECDH P-256 a lungo termine, privata non esportabile | `myKeyPair`, `myPubB64` |
| casualità | `crypto.getRandomValues` | ovunque |

Una **busta** è `{ i: IV, c: AES-GCM(chiave, JSON(oggetto)) [, e: chiave pubblica effimera] }`.
Il campo `e` viaggia in chiaro e deve: è pubblico (6176–6183).

Ogni busta prodotta da `mailboxPutSealed` (6195) contiene, dentro il sigillo,
`ts` (orario di chi scrive, ms) e `tok` (32 esadecimali casuali). Chi legge
rifiuta `|ora − ts| > 10 min` (`bustaFresca` 6217; una busta *senza* `ts`
passa, per le versioni vecchie). `tok` è anche nell'intestazione HTTP
`X-Logos-Token`: il relay lo tiene come metadato e cancella solo a chi lo
ripresenta (worker.js 101–122).

Le **caselle** sul relay hanno nomi calcolati: `slotId(seme, etichetta) =
SHA-256(seme + '/' + etichetta)` (6149). Il relay non sa cosa sia un seme.

## 1. Il relay (worker.js): cosa sa, cosa può

- Vede: nomi di casella (hash), buste sigillate, orari di arrivo, IP di chi
  scrive/legge, intestazioni. Non vede: chiavi, contenuti, chi parla con chi
  (i nomi non sono collegabili a persone senza il seme).
- Può: cancellare tutto, non rispondere, rispondere in ritardo, servire una
  busta vecchia (entro la scadenza), servire la stessa busta due volte,
  rifiutare una chiave. **Non può** cancellare una busta con gettone
  fingendo di leggerla (v44), né sostituire la chiave di un indirizzo senza
  che chi chiama se ne accorga (§3).
- **Dal 16 set 2026 (v50)** il relay tiene anche i *fili*: un oggetto per
  cassetta ricorda «c'è un telefono in ascolto qui» finché il WebSocket è
  aperto, e lo tira quando arriva una busta (`{"busta":1}`). Non è
  un'informazione nuova — la stessa cosa la vedeva già a ogni bussata — ma
  è continua invece che a scatti: chi osserva il relay vede *quando* una
  cassetta ha un ascoltatore. Contenuti e chiavi: come prima, mai.
- Il modello dell'avversario per la prova: **il relay è l'avversario**
  (Dolev-Yao sul canale verso il relay), più eventuali contatti disonesti.

## 2. Rito A — l'invito a sei cifre («quick connect»)

Chi invita = A. Chi accetta = B. Il codice `code` è di 6 cifre, generato da A.

1. A: `(key, seed) = quickSecrets(code)` — **dal solo codice** (9135).
   ⚠️ Il link/QR porta anche un segreto lungo di 128 bit (`makeQuickSecret`
   6091) ma **non viene usato** per sigillare: ritirato il 1 set 2026 perché
   A non può sapere se B arriverà dal link o digitando a mano (9119–9134).
   Quindi oggi: chi indovina le sei cifre trova la casella **e** apre la busta.
2. A crea la connessione WebRTC, l'offerta SDP (che contiene l'impronta DTLS
   `fpA`), e scrive `busta(key, {sdp, nick, ts, tok})` in
   `slotId(seed,'offer')` (9154–9158).
3. B: stesso `quickSecrets(code)`, legge `offer`, apre, mette l'offerta,
   scrive `busta(key, {sdp_answer, nick, ts, tok})` in `slotId(seed,'answer')`.
4. Candidati ICE: entrambi, sigillati con la stessa `key`, in caselle
   `slotId(seed,'a')`/`'b'` (`candidatePump`).
5. DTLS-SRTP fra i due telefoni: da qui in poi il relay non c'è. La
   sicurezza del canale è quella di WebRTC, **ancorata alle impronte nelle
   SDP**: se le SDP sono arrivate integre, nessuno è in mezzo.
6. Dopo il collegamento, entrambi calcolano `SHA-256(sort(fpA, fpB).join('|'))`
   e ne mostrano 3 parole (16 bit l'una da `LOCK_WORDS`, ≈25 bit utili)
   (`safetyDigest` / `computeSafetyWords` 3888–3910). È la SAS di ZRTP. Se
   B ha inquadrato il QR **dallo schermo di A**, il QR porta `fpA` e l'app lo
   confronta da sola («verificato di persona»; mismatch → allarme
   `sas.leadMismatch`).

**Cosa protegge:** confidenzialità e integrità delle SDP contro il relay e
contro chiunque **non** conosca `code`. **Cosa non protegge:** contro chi
conosce `code` (o lo indovina: 10^6 possibilità, PBKDF2 100k giri,
limite tentativi del Worker). Il tetto vero contro l'indovinare è il
limitatore del Worker (`RL_*`), che vive nella memoria di ogni isolate
(il limitatore per IP vive nella memoria di ogni isolate, quindi un abuso distribuito è meno contenuto: dichiarato in `SECURITY.md`).

**Proprietà da dimostrare (Tamarin):**
- A1. Se `code` è segreto, l'avversario non apprende `sdpA` né `sdpB`.
- A2. Se `code` è segreto, quando A e B si collegano hanno le stesse impronte
  in mano (nessun MITM).
- A3. **Se `code` è noto all'avversario**, A2 fallisce — e la SAS a 3 parole
  lo rileva con probabilità 1 − 2^−25 (questo Tamarin non lo misura; lo si
  scrive come lemma condizionato: «se le SAS coincidono e i due le hanno
  confrontate su un canale autentico, allora niente MITM»).

## 3. Rito B — la chiamata all'indirizzo

Indirizzo = 12 caratteri (alfabeto di 32, 60 bit) = primi 60 bit di
`SHA-256('logos-address-v2:' + pub_B64 + '/' + slot)` (`addressFromPub` 6700).
Un dispositivo ha uno slot 0 (indirizzo vero) e fino a 255 slot usa e getta.

Pubblicazione: B scrive `{p: pub, n: slot}` in `/key/SHA-256('logos-pubkey-v2:'+addr)`
(6317). Il Worker ricalcola l'indirizzo e rifiuta se non torna (worker.js
494–499, non riletto oggi: preso dagli appunti del 5 set).

Chi chiama = A (sconosciuto a B, in generale). Chi possiede l'indirizzo = B.

1. A legge la chiave da tutti i relay e crede **solo** a quella che ricalcola
   `addr` (`fetchAddrKey` 6346–6367). Un relay che manda una chiave falsa
   viene scartato, non fa fallire il giro.
2. A genera una coppia ECDH effimera `(e, E)`, `k = HKDF(ECDH(e, pub_B),
   salt=SIGNAL_SALT, info='logos-addr-v2')` (6389–6402). Seme di casella:
   `SHA-256('logos-addr-slot-v2:' + addr)` — **calcolabile da chiunque abbia
   l'indirizzo**, e deve esserlo (A è uno sconosciuto).
3. A scrive `busta(k, {sdp_A, nick, rid, fp_A, intro, ts, tok}) + E` in
   `slotId(seme,'addr-offer')` (7470 circa). `rid` = 8 byte casuali. Legge
   anche la nota `addr-wake` (sigillata con `pairSecrets('logos-addr-wake-v2:'+addr)`,
   cioè con una chiave **derivata dal solo indirizzo**: chi ha l'indirizzo la
   legge; contiene solo l'endpoint push, dichiarato a 6404–6418) e bussa.
4. B (ogni 5–45 s) legge `addr-offer`, ricava `k` da `E` e dalla propria
   privata (6432–6445): **che la busta si apra è la prova che B possiede la
   chiave dell'indirizzo**. B controlla `ts`, `rid` non già visto
   (`acceptedRids`/`refusedRids`), `fp_A` non bloccata. Poi cancella con `tok`.
5. B risponde con `busta(k, {sdp_B, ts, tok})` in `slotId(seme,'addr-answer-'+rid)`.
6. A legge la risposta, controlla `ts`, ritira la propria offerta
   (`withdrawOffer` = DELETE con `tok`). Candidati ICE sotto `k`.
7. DTLS fra i due. SAS come in §2 (le 3 parole vengono dalle impronte DTLS,
   non dalle chiavi ECDH: per questo «chi ha già letto le tre parole con te
   ritrova le stesse tre parole» anche su un indirizzo usa e getta).

**Cosa protegge:** B è autenticato (solo chi ha la privata apre); il
contenuto dell'offerta (IP, nick, fp) è segreto verso il relay e verso
chiunque non abbia la privata di B. **Cosa non protegge, dichiarato nel
codice (6369–6388):** non c'è segretezza in avanti — la privata di B apre
ogni busta mai indirizzata a B, anche registrata mesi prima. **A non è
autenticato** dal rito: chiunque può chiamare un indirizzo; l'identità di A
è `fp_A`, che vale solo dopo la SAS o se A era già in rubrica.

**Proprietà da dimostrare:**
- B1. Segretezza di `sdp_A`, `sdp_B` verso l'avversario che non ha `priv_B`,
  anche se controlla il relay e conosce `addr`.
- B2. Se A conclude con «risposta da addr», la risposta è stata prodotta da
  chi possiede `priv_B` (autenticazione di B verso A).
- B3. Nessun replay: una risposta accettata da A corrisponde a un `rid`
  che A ha generato in questa chiamata.
- B4. Il relay non può sostituire `pub_B` senza che A se ne accorga
  (dipende dal fatto che `addr` è un hash di `pub_B`; secondo preimmagine a
  60 bit con 256 slot: ≈2^52, dichiarato a 6343–6345).
- B5 (v44). L'avversario che conosce `addr` ma non `priv_B` non può far
  sparire una busta indirizzata a B prima che B la legga (gettone).

## 4. Rito C — ricollegarsi a un contatto già in rubrica

A e B si sono già parlati: ognuno ha in rubrica l'impronta DTLS dell'altro
(`contact.fp`). Non c'è codice né indirizzo.

1. A: `sec = pairSecrets(fp_A + ':' + fp_B)` (8317) → `key`, `seed` **da HKDF
   delle due impronte**. Casella d'annuncio `pairKey(fp_A, fp_B) =
   SHA-256(fp_A + '>' + fp_B)` (5928).
2. A scrive `busta(key, {nick, sdp_A, ts, tok})` nella casella. B, ogni
   4–20 s per ciascun contatto a turno, calcola la stessa `sec` e legge
   (8420–8428). Risposta e candidati sotto la stessa `key`.
3. DTLS. Poi `checkSafetyFor(fp_remota)`: se l'impronta di chi si è collegato
   non è quella salvata → allarme `sas.leadChanged`.

**Il commento a 8313–8316 dice: «the two fingerprints, which both sides
already hold and nobody else knows».** Vedi §6.1: non è vero in generale.

**Proprietà da dimostrare:**
- C1. Segretezza di `sdp_A` verso un avversario che **non** conosce entrambe
  le impronte.
- C2. Segretezza di `sdp_A` verso un avversario che **conosce** entrambe le
  impronte (es. un contatto comune). — **Attesa: FALLISCE.** Vedi §6.1.
- C3. Se B si collega credendo di parlare con A e la DTLS finisce con
  un'impronta ≠ `fp_A`, B viene avvisato (è un controllo dell'app, non del
  rito: lo si modella come «B accetta ⇒ fp = fp_A»).

## 5. Rito D — la ripresa di una chiamata (repair, v40)

Durante la chiamata, sul canale dati (già DTLS), i due si scambiano un nonce
casuale ciascuno (`repairNonce`, 32–128 hex). `repairBase =
'logos-repair-v1:' + sort(fp) + sort(nonce)` (4218). Se ICE cade, chi ha
l'impronta minore fa da offerente; caselle e chiavi da
`pairSecrets(repairBase + ':' + round)`, al massimo 3 giri.

**Proprietà:** D1. Segretezza della nuova offerta verso il relay (i nonce
sono passati dentro DTLS: l'avversario non li ha). D2. Un avversario non può
far ripartire una chiamata altrui (non conosce i nonce). Entrambe dovrebbero
reggere senza sorprese; D è il rito più semplice da dimostrare.

**Aggiornato il 26 set 2026 (4.60), senza cambiare il rito.** Tre cose,
misurate su due Logos vere collegate dal ponte:
- La descrizione dentro la busta può viaggiare compressa (`z`, deflate del
  browser) invece che in chiaro (`sdp`), quando supera i 4.000 caratteri:
  in videochiamata, sigillata, superava gli 8.192 byte che il relay accetta,
  e la ripresa non partiva mai. È una codifica **prima** del sigillo: il
  relay vede solo la lunghezza, come prima, e nel modello l'offerta resta il
  segreto `offerR`.
- Chi risponde toglie l'offerta dalla casella con il suo gettone e **non ne
  accetta mai una già usata** (ne ricorda il gettone). Prima la casella
  teneva l'offerta due minuti dopo la lettura, e una seconda caduta entro
  quel tempo poteva rileggerla: è l'iniettività di D2 portata nel codice.
- Il **rinnovo** del lasciapassare del ponte durante una chiamata
  (`call-ice-renew-*`) viaggia tutto sul canale dati, dentro DTLS: non tocca
  il relay e resta fuori da questo modello, come ogni altro messaggio della
  conversazione (§7).

## 6. Cosa è emerso scrivendo questo, e cosa ne è stato

### ~~6.1 Rito C: la chiave viene da valori che un terzo può conoscere~~ — ✅ CHIUSO nella 4.38/v45 (14 set): sigillo con le chiavi, `logos-contatto-v45.spthy`

Le impronte DTLS **non sono segrete**: ogni contatto di A conosce `fp_A`
(è ciò che salva in rubrica, `loadContacts().filter(c => c.fp)`), ogni
contatto di B conosce `fp_B`. Quindi **un contatto comune C** — o chiunque
abbia parlato una volta con entrambi, anche anni fa — può calcolare
`pairSecrets(fp_A:fp_B)` e `pairKey(...)`, e:
- **leggere** ogni offerta di ricollegamento fra A e B: IP, nick, SDP (non
  la conversazione, che è DTLS; ma esattamente i metadati che il rito B ha
  chiuso al relay a 6040–6043);
- **scrivere** un'offerta nella casella di B a nome di A: B squilla, risponde
  (con il proprio IP) e al collegamento vede `sas.leadChanged` — l'allarme
  c'è, ma B ha già risposto e la sua SDP è già uscita sotto una chiave che C
  conosce;
- **cancellare?** No, dalla v44: serve il gettone dentro la busta — ma C la
  busta la sa aprire, quindi il gettone ce l'ha. **Sì, può cancellarla.**
  Il gettone protegge da chi non sa aprire; qui C sa aprire.

Non è il relay (che le impronte non le ha: viaggiano sigillate) ed è un
avversario più debole — ma è precisamente il caso «il tuo ex contatto».

**Rimedio possibile, senza primitive nuove:** i due dispositivi hanno già
una coppia ECDH a lungo termine (quella degli indirizzi). Sigillare il rito
C con `HKDF(ECDH(priv_A, pub_B))` invece che con le impronte: chi non ha una
delle due private non apre. La casella d'annuncio può restare dalle impronte
(deve essere trovabile), il contenuto no. Va pensato con la compatibilità:
un contatto salvato prima della v2 degli indirizzi potrebbe non avere la
`pub` dell'altro in rubrica — da verificare cosa salva `saveContact`.
**Chiuso nella 4.38** (`contactDialSecrets`/`contactOpenIncoming`; i contatti salvati prima restano sul rito vecchio finché non si ricollegano una volta con la 4.38 da entrambe le parti).

### ~~6.2 Rito A: il segreto lungo inerte~~ — ✅ CHIUSO nella 4.39/v46: niente più dettatura a voce, il segreto lungo sigilla (`logos-invito-v46.spthy`)

Già noto (H-01), già scritto nel codice (9119–9134) e in `SECURITY.md`. La
correzione va disegnata così che A pubblichi in modo che *sia* chi ha il
link *sia* chi digita a mano possano aprire — p.es. due buste, una per
strada. Le «tre parole al posto delle cifre» di cui si è parlato con
l'operatore sono un'alternativa: rendono il codice dettato più forte
(3 parole da 2048 = 33 bit contro 20), non risolvono la strada del link
meglio del segreto lungo che c'è già. Da decidere quale delle due.

### ~~6.4 Le buste non dicono in che direzione vanno~~ — ✅ CHIUSO nella 4.38/v45: `kind` dentro il sigillo, `bustaDelVerso` a ogni lettura (trovato da Tamarin il 13 set)

Prima stesura dei modelli: in tutti e tre i riti la stessa chiave `k` sigilla
sia l'offerta sia la risposta, e dentro la busta niente dice quale delle due
sia. Tamarin ha trovato **tre volte lo stesso trucco** (C3, A2, B2): il relay
rimanda ad A la busta che A stesso ha scritto, nella casella della risposta, e
A la accetta come risposta di B (riflessione). Nell'app la busta è `{sdp,
nick, rid, fp, …}` per l'offerta e `{sdp}` per la risposta: **nessun campo
esplicito**. La difesa reale è che un SDP di offerta (`a=setup:actpass`)
non passa `setRemoteDescription({type:'answer'})` in WebRTC — cioè ci si
affida a un controllo che non è nostro e non è scritto da nessuna parte.
Un campo `kind: 'offer'|'answer'` dentro la busta, controllato da chi legge;
le buste vecchie senza campo passano (come per `ts`). Nei modelli l'etichetta è stata aggiunta (`'offer'`/`'answer'`
dentro `senc`) perché è la forma reale dell'SDP; **nel codice è stata aggiunta nella 4.38** (`bustaDelVerso`).
Effetto pratico oggi: al massimo una chiamata che fallisce — che il relay
può causare comunque non rispondendo. Non è urgente; è pulizia.

### 6.5 Chi risponde a un indirizzo rivela il proprio IP a chi ha chiamato — **per costruzione, non un difetto**

La prima lemma B1 chiedeva «la risposta di B è sempre segreta»; Tamarin l'ha
bocciata mostrando l'avversario che chiama B con la propria chiave effimera e
riceve la risposta. Giusto: chiunque abbia l'indirizzo può chiamare, e B
risponde **dopo che la persona ha accettato** (`acceptAddrCall`). La lemma è
stata riscritta: segreta se B stava rispondendo a un A onesto. Da dire
all'utente? Già implicito in «rispondere»; niente da cambiare.

### 6.3 Rito B: `intro` e `nick` sono a scelta di A

Chi chiama un indirizzo può scriverci qualsiasi nome. Già dichiarato
all'utente (`addr.provenNotWho`). Non è un difetto del rito, è un limite
del modello; lo si scrive nel modello come «A non autenticato».

---

## 8. RISULTATI — 13/14 set 2026 (Tamarin 1.12.0 + ProVerif 2.05, su GitHub Actions)

Modelli in `prova-formale/tamarin/` (Tamarin) e `prova-formale/proverif/`
(ProVerif); si fanno girare con il workflow `prova-formale.yml` (GitHub
Actions, a mano) o in locale con gli stessi comandi.

| rito | proprietà | esito | strumento |
|---|---|---|---|
| A invito | A1 relay non legge | ✅ dimostrata (14 passi) | Tamarin |
| A invito | A2 codice segreto ⇒ nessun MITM | ✅ dimostrata (18) | Tamarin |
| A invito | A3 codice noto ⇒ MITM esiste | ✅ traccia trovata (attesa: H-01) | Tamarin |
| A invito | A4 SAS uguali ⇒ nessun MITM | ✅ dimostrata (14) | Tamarin |
| **A invito v46** (4.39, solo link/QR, segreto lungo nel sigillo) | A1, A2 **con le sei cifre pubbliche**; A3 solo se il segreto lungo è rivelato; A4 | ✅ dimostrate (21, 25, 8, 14 passi) | Tamarin (`logos-invito-v46.spthy`) |
| B indirizzo | B1 offerta segreta | ✅ **true** | ProVerif |
| B indirizzo | B1b risposta segreta se A onesto | ✅ **true** | ProVerif |
| B indirizzo | B2+B3 autenticazione iniettiva di B | ✅ **true** | ProVerif |
| B indirizzo | B4 chiave = quella di un B onesto | ✅ **true** | ProVerif |
| B indirizzo | segretezza in avanti | ❌ **falsa dopo la rivelazione** (attesa, dichiarata nel codice); vera prima | ProVerif |
| B indirizzo | (tutte, modello DH fedele e modello KEM) | ⏳ Tamarin non termina in 8 min; varianti v1–v5 per capire perché — in corso | Tamarin |
| C contatto (fino alla 4.37) | C1 segreta se impronte private | ✅ dimostrata (9) | Tamarin |
| C contatto (fino alla 4.37) | C2 segreta con impronte note | ❌ **attacco trovato** (7) → §6.1, riparato nella 4.38 | Tamarin |
| C contatto (fino alla 4.37) | C3 offerta autentica | ✅ dimostrata (33), dopo l'etichetta di direzione | Tamarin |
| **C contatto v45** (4.38, chiavi) | segretezza offerta e risposta, autenticazione iniettiva, offerta da A — **con le impronte pubbliche** | ✅ **true ×4** (14 set) | ProVerif (`proverif/logos-contatto-v45.pv`); Tamarin `logos-contatto-v45.spthy` non termina (equazione DH) |
| D ripresa | — | non ancora modellato | — |

**Cosa ha insegnato il processo, oltre ai risultati:**
- La prima stesura senza etichetta `'offer'/'answer'` dentro la busta è stata
  bocciata tre volte per riflessione (§6.4) — vero anche nel codice.
- Due lemma erano domande sbagliate («risposta sempre segreta», «B risponde
  solo a chiamate oneste»): chiunque può chiamare un indirizzo, per costruzione (§6.5).
- Il modello dei contatti C ha confermato §6.1 al primo colpo.
- Tamarin e ProVerif si sono divisi il lavoro: Tamarin per A e C, ProVerif per
  B (dove Tamarin non termina). Due strumenti indipendenti che concordano sulle
  parti in comune (eseguibilità, assenza di forward secrecy) valgono più di uno.

**Cosa NON è:** una verifica indipendente. I modelli sono stati scritti dal
progetto a partire dal codice; se un passaggio è descritto male, la
dimostrazione è vera su un rito che non esiste. Per questo i modelli sono qui,
leggibili e rieseguibili da chiunque: il passo successivo è una revisione
esterna, che è stata chiesta.

## 7. Cosa è FUORI dal modello, e va detto all'auditor

- La sicurezza di DTLS-SRTP e di WebRTC (si assume: dato che le impronte
  nelle SDP sono integre, il canale è sicuro).
- Il limitatore di tentativi del Worker e la sua distribuzione per isolate.
- La cache locale (cronologia in chiaro, accettata: L-01).
- Android, il servizio di squillo, le notifiche push (l'endpoint push è
  leggibile da chi ha l'indirizzo, dichiarato).
- Le lettere (`/letter`): stesso rito B (ECIES verso `pub_B`) con vita 7
  giorni; ereditano B1–B5 e l'assenza di segretezza in avanti, che per loro
  pesa di più.
