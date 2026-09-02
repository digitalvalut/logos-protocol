# RISCHI E LIMITI — cosa è coperto, cosa no, cosa non si sa

*Aggiornato: 2 settembre 2026. Nato dall'analisi statica del §59.*

⚠️ **Regola di questo file (§64): niente "invulnerabile", niente "scala
all'infinito".** Ogni voce dice contro cosa è protetto, entro quale limite
misurato, e cosa resta scoperto.

---

## 1. Trovati con l'analisi statica del 2 settembre

### `catch` vuoti — 100 nell'app, classificati uno per uno

| categoria | quanti | giudizio |
|---|---|---|
| rilevamento di funzionalità del browser | 44 | **VALIDI** — chiedere se esiste una cosa e accettare di no |
| pulizia (chiudere, fermare, revocare) | 24 | **VALIDI** — chiudere ciò che potrebbe essere già chiuso |
| da guardare | 26 | **DEBITO TECNICO** — nessuno urgente |
| **a rischio** | **6** | esaminati a mano, sotto |

**Dei 6 a rischio, uno era un difetto vero** (`__trickleTypes`, §2 qui sotto).
Gli altri cinque sono legittimi: chiudono connessioni già chiuse, o sono
tentativi "meglio se riesce" il cui fallimento non toglie niente a chi usa l'app.

⚠️ **Uno resta aperto e va deciso:** riga ~3363, il saluto `dc.send({type:'hello'})`
che porta l'impronta per le tre parole e l'iscrizione alle notifiche. Se quella
send fallisce (canale che si chiude nell'istante fra il controllo e l'invio), il
fallimento è **silenzioso e il sintomo appare sull'ALTRO dispositivo**: niente tre
parole da quel lato. È esattamente la forma del difetto della v22, che costò
giorni. **Probabilità bassa, conseguenza già pagata una volta.** Rimedio proposto:
un solo nuovo tentativo dopo un istante. Non fatto perché tocca un cammino
faticosamente stabilizzato: **serve una decisione, non è una correzione ovvia.**

### 2. `__trickleTypes` — una diagnostica che mentiva ✅ CORRETTO

Il tipo dell'indirizzo di rete veniva registrato **prima** di provare ad
applicarlo, e `addIceCandidate` fallisce per ragioni ordinarie. La riga
diagnostica dichiarava quindi *"loro: relay"* per strade mai entrate — cioè, quando
due telefoni non si collegano, **la prima cosa che si guarda mandava a cercare il
problema dove non era.** Stessa famiglia di M7: non un guasto, uno stato che mente.

⚠️ **Nessun test poteva prenderlo: nel finto browser `addIceCandidate` riusciva
sempre.** Quarta bugia del banco di prova dopo `localStorage`, IndexedDB e il
magazzino che non si svuotava leggendo. **Corretto anche il finto.**

### 3. Tempesta di ritentativi ✅ CORRETTO

`Math.random` compariva **una volta sola in tutto il file**, e per generare un id:
nessuna attesa aveva un grano di caso.

Il limite del relay è una soglia, quindi scatta **per tutti insieme**: cento
dispositivi ricevevano "rallenta" nello stesso momento, aspettavano tutti
esattamente 4.000 ms e ripartivano **nello stesso istante**. Il relay riceveva di
nuovo la stessa raffica compatta. **Non era il traffico a causarlo: era il fatto
che tutti aspettassero la stessa identica cosa.**

Secondo difetto nello stesso punto: l'attesa era **piatta** — rifiutato una volta o
venti, si riprovava sempre dopo quattro secondi.

**Corretto:** ±25% a caso su ogni attesa (media invariata, quindi non rallenta
nessuno) e raddoppio a ogni rifiuto di fila fino a 20 s, azzerato al primo giro
riuscito. 5 test, 3 sabotaggi indipendenti.

### 4. Nessun tetto alla durata di un messaggio vocale — **APERTO**

`recordedChunks` cresce finché non si tocca stop. Un telefono in tasca che registra
per un'ora accumula ~11 MB in memoria, e alla fine il file supera comunque il tetto
dell'invio: **si registra a lungo per poi perdere tutto.**

**Non corretto perché è una decisione di prodotto** (§82): mettere un tetto
significa decidere quanto può durare un messaggio vocale. Rimedio proposto: tetto a
5 minuti con avviso a schermo prima di fermarsi.

### 5. `batch` della pompa cresce dopo lo `stop()` — **APERTO, minore**

L'ascoltatore `icecandidate` continua a riempire `batch` anche dopo `stop()`,
perché `flush` esce subito ma nessuno stacca l'ascoltatore. Limitato in pratica
(la connessione viene chiusa poco dopo) e senza conseguenze osservate.

---

## 6. NON PROTETTO — da dire in chiaro

| cosa | stato | perché |
|---|---|---|
| **abuso distribuito su molti IP** | **scoperto** | i contatori vivono nella memoria di ogni copia del worker. *Misurato: 60 scritture da 10 connessioni → 57 passate; le stesse da una sola → 30.* Il rimedio è una regola **al bordo**, dal pannello Cloudflare |
| **quota giornaliera** | **nessun tetto reale** | il tetto globale delle scritture vale 57× la quota. Farlo bene richiede Durable Objects o il piano a pagamento |
| **cronologia locale in chiaro** (L-01) | **accettato** | la cassaforte col PIN è stata tolta su richiesta dell'autore il 31 ago |
| **H-01** — sei cifre come unico segreto | **aperto** | ~20 bit se dette a voce. Il tentativo della v28 ruppe le cifre digitate a mano |
| **H-03, M-03, M-04** | **aperti** | audit esterno del 31 ago |

## 7. SCONOSCIUTO — da misurare, non da stimare

- **Quante scritture consuma una connessione vera** (`candidatePump`). È la voce
  più grossa del modello di capacità e l'unica ancora ignota. Serve una prova sui
  dispositivi dell'autore.
- **Quante copie del worker Cloudflare tenga vive.** Senza quel numero, il tetto
  globale non è convertibile in un tetto reale.
- **Se la tastiera copra ancora ciò che si scrive** su Android (correzione v8 mai
  verificata: l'emulatore non apre la tastiera).
