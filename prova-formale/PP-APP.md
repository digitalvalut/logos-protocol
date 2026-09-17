# Logos e il profilo NIAP per le app (PP_APP v2.0) — autovalutazione

*Self-assessment against the NIAP Protection Profile for Application
Software v2.0 — English summary at the end.*

**Cos'è.** Il *Protection Profile for Application Software* (NIAP, USA) è la
lista di requisiti contro cui un laboratorio accreditato valuta un'app per
una certificazione Common Criteria. Non è una certificazione: è la scaletta.
Questo documento la percorre requisito per requisito e dice, per ciascuno,
**cosa fa Logos oggi, dove sta la prova, e cosa manca**. È scritto dal
progetto, il 17 settembre 2026, sulla versione web 4.43 / Android v51, e
non è stato controllato da nessun laboratorio. Serve a due cose: sapere noi
quanto manca, e far arrivare un eventuale valutatore con il lavoro
preparato.

**Cosa NON è.** Non rende Logos «certificato», «militare» o «conforme».
Una valutazione vera costa, dura mesi e richiede un'organizzazione che
risponda nel tempo. Qui ci sono anche i «no», scritti per esteso: un
valutatore che trova un «no» nascosto chiude la pratica.

**Legenda.** ✅ soddisfatto · 🟡 in parte (funziona, ma non nel modo che
il profilo chiede o con una lacuna dichiarata) · ❌ non soddisfatto.
«TOE» = l'oggetto valutato: l'app web (`modifica.js` e file collegati) e
l'involucro Android (`android/`). Il relay (`turn-worker/`) è *ambiente
operativo*, non TOE: il profilo valuta l'app.

## 5.1.1 Crittografia (FCS)

| Requisito | Cosa chiede | Logos | Prova | Cosa manca |
|---|---|---|---|---|
| **FCS_CKM_EXT.1** generazione di chiavi asimmetriche | dichiarare se l'app genera chiavi asimmetriche, da sola o tramite la piattaforma | ✅ *tramite la piattaforma*: ECDH P-256 con Web Crypto (`crypto.subtle.generateKey`, chiave privata `extractable: false`); le chiavi DTLS di WebRTC le genera lo stack WebRTC della piattaforma. Nessuna crittografia scritta a mano (regola 2 di `CLAUDE.md`). | `modifica.js` ~4029, ~6501; `PROTOCOLLO.md` §0 | Per una valutazione servirebbe indicare quale modulo della piattaforma: nel WebView Android è BoringSSL di Chromium, **non** in modalità FIPS. È un limite della piattaforma, non dell'app. |
| **FCS_RBG_EXT.1** numeri casuali | dichiarare da dove viene la casualità | ✅ *dalla piattaforma*: `crypto.getRandomValues` (Web Crypto) nell'app; `java.security.SecureRandom` in `Filo.java` (nonce della stretta di mano WebSocket). Entrambe nella lista che il profilo accetta per Android. | grep `getRandomValues` in `modifica.js`; `Filo.java` riga ~80 | — |
| **FCS_STO_EXT.1** conservazione delle credenziali | le credenziali persistenti (chiavi private, segreti) stanno in un deposito sicuro della piattaforma o cifrate | 🟡 La **chiave privata dell'indirizzo** è un `CryptoKey` non estraibile conservato in IndexedDB (`dvlogos-id`): il browser la custodisce e non la rende mai in forma di byte, nemmeno al codice di Logos; su Android vive nella cartella privata dell'app (sandbox, `MODE_PRIVATE`, cifrata dal telefono se il telefono è cifrato). **Non** è nel KeyStore Android, che è ciò che il test del profilo cerca. I segreti di coppia con i contatti (`dvlogos-contacts`) e il segreto di un invito aperto (`dvlogos-pending-invite`, 24 h) stanno in `localStorage` in chiaro dentro la stessa sandbox. Nessuna password, nessun certificato. | `modifica.js` ~3934–4029, ~6828; `SECURITY.md` («Things we already know») | La chiave in IndexedDB non estraibile è una protezione reale ma non è quella che il profilo enumera per Android. Chiuderlo = cifrare il deposito locale con una chiave nel **KeyStore hardware** (idea n. 4 della lista di progetto). Nel browser puro non esiste un KeyStore: lì resta così, e va dichiarato. |
| **FCS_COP.1** operazioni crittografiche | elencare algoritmi e modi | ✅ AES-256-GCM (buste), HKDF-SHA-256 (derivazione), PBKDF2-HMAC-SHA-256 (segreti dell'invito), SHA-256 (indirizzi, impronte), ECDH P-256 (accordo di chiave), DTLS-SRTP (media, dalla piattaforma). Tutto via Web Crypto. | `PROTOCOLLO.md` §0 | Come sopra: modulo della piattaforma non FIPS. |

## 5.1.2 Protezione dei dati dell'utente (FDP)

| Requisito | Cosa chiede | Logos | Prova | Cosa manca |
|---|---|---|---|---|
| **FDP_DAR_EXT.1** dati sensibili a riposo | i dati sensibili su disco sono cifrati (dalla piattaforma o dall'app) o non esistono | 🟡 La cronologia (`dvlogos-history-*`), la rubrica (`dvlogos-contacts`), le lettere (`dvlogos-letters`) e i file ricevuti (IndexedDB `dvlogos-media`) stanno nella cartella privata dell'app, in chiaro. Su Android sono protetti dalla **cifratura del dispositivo** (file-based encryption, presente su ogni Android moderno) e dalla sandbox (`MODE_PRIVATE`), che è la selezione «piattaforma» che il profilo ammette per Android. Non c'è cifratura a livello di app. Dichiarato pubblicamente in `SECURITY.md`. | `SECURITY.md`; `modifica.js` ~4838, ~4897 | Per essere solidi anche a telefono sbloccato o con backup estratti: **cronologia cifrata con chiave nel KeyStore** (stessa lacuna di FCS_STO). È la modifica di codice più utile che questa autovalutazione indica. |
| **FDP_DEC_EXT.1.1** risorse hardware | elencare e giustificare ogni risorsa hardware | ✅ **Rete** (relay e chiamate dirette), **fotocamera** (video, QR), **microfono** (voce). Nel manifest: `INTERNET`, `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (altoparlante/auricolare), `WRITE_EXTERNAL_STORAGE` **solo fino ad Android 9** (salvare un file che l'utente sceglie; da Android 10 passa da MediaStore senza permesso), più i permessi di servizio (`FOREGROUND_SERVICE*`, `POST_NOTIFICATIONS`, `USE_FULL_SCREEN_INTENT`, `WAKE_LOCK`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`) che non sono risorse hardware. Niente posizione, NFC, USB, Bluetooth. | `android/app/src/main/AndroidManifest.xml` | — |
| **FDP_DEC_EXT.1.2** archivi sensibili | elencare gli archivi condivisi a cui accede | ✅ **Nessuno**: niente rubrica del telefono, calendario, registro chiamate, log di sistema. La «rubrica» di Logos è sua e sta nella sandbox. | manifest: nessun `READ_CONTACTS`, `READ_CALL_LOG`, `READ_LOGS` | — |
| **FDP_NET_EXT.1** comunicazioni di rete | elencare ogni comunicazione: avviata dall'utente, dall'app, o ricevuta | ✅ **Avviate dall'utente**: invito (scrittura/lettura cassetta sul relay), chiamata a un indirizzo (lettura chiave, scrittura busta, sveglia), lettera, chiamata WebRTC verso l'altro dispositivo (diretta o via TURN Cloudflare), download di un file scelto. **Avviate dall'app**: controllo periodico della propria cassetta e del bigliettino (app aperta), filo WebSocket verso il relay (`/ascolta`, Android con app chiusa), richiesta credenziali TURN, STUN Cloudflare, controllo della versione nuova sulla **propria** origine (service worker). **Ricevute**: pacchetti DTLS/SRTP del pari durante una chiamata; notifiche push (`/knock`, contenuto vuoto) se attivate. Nessun altro host: la CSP vieta ogni script/stile/font esterno e un test lo verifica. | `modifica.html` (CSP); `checks.test.js` «the page loads no script, style or font from anywhere else»; `PROTOCOLLO.md` §1 | Un valutatore farà lo sniffing: gli host attesi sono `digitalvalut.github.io`, `digitalvalut-turn.burbeng78.workers.dev`, `stun.cloudflare.com`, i TURN di Cloudflare, e l'IP del pari. |

## 5.1.3 Gestione (FMT)

| Requisito | Cosa chiede | Logos | Prova | Cosa manca |
|---|---|---|---|---|
| **FMT_CFG_EXT.1.1** niente credenziali di default | nessuna chiave o password preinstallata | ✅ Nessuna credenziale di default: la coppia di chiavi nasce sul dispositivo al primo avvio; non esistono account né password. | `modifica.js` ~3990–4030 | — |
| **FMT_CFG_EXT.1.2** permessi dei file | binari e dati non modificabili da utenti non privilegiati | ✅ Android: APK in `/data/app` (sola lettura per l'app), dati in `/data/data/io.github.digitalvalut.logos` con `MODE_PRIVATE`; nessun file world-writable creato. | `MainActivity.java` ~256, `RingService.java` ~313 | Test del valutatore: `find -L . -perm /002` nella cartella dati. Non ancora eseguito da noi con `adb`. |
| **FMT_MEC_EXT.1** meccanismo di configurazione | le impostazioni usano il meccanismo raccomandato dalla piattaforma | 🟡 Lato Android: `SharedPreferences` (`dvlogos-app`, prefs del campanello) — è il meccanismo raccomandato. Lato pagina: le impostazioni (`dvlogos-lang`, `-textsize`, `-easy`, `-notify`, `-autoclean*`, `-speaker`, `-voice`, `-addr-on`) stanno in `localStorage` del WebView, che è lo storage standard del web ma non `SharedPreferences`/`DataStore`. | elenco chiavi `MEM.setItem` in `modifica.js` | Per il profilo bisognerebbe o dichiarare `localStorage` del WebView come «meccanismo della piattaforma web» (accettato per PWA? da verificare con il laboratorio) o specchiare le impostazioni nelle `SharedPreferences`. |
| **FMT_SMF.1** funzioni di gestione | elencare cosa l'utente può accendere/spegnere | ✅ Avvisi/notifiche push (spento di default), indirizzo raggiungibile (spento di default), pulizia automatica della cronologia (spenta), autodistruzione dei messaggi, modalità semplice, lingua, dimensione testo, altoparlante, indirizzi usa e getta (crea/cancella), blocco di una persona. Nessuna trasmissione di dati di sistema, di crash o di backup in rete: non esiste, quindi non c'è nulla da spegnere. | schermata impostazioni; `README.md` | — |

## 5.1.4 Riservatezza (FPR)

| Requisito | Cosa chiede | Logos | Prova | Cosa manca |
|---|---|---|---|---|
| **FPR_ANO_EXT.1** consenso per i dati personali | l'app non usa PII, o non li trasmette, o chiede il consenso prima | ✅ L'unico dato personale che l'app chiede è il **nome** che l'utente sceglie («Come ti chiami», facoltativo, può essere inventato). Viaggia **solo** verso l'altro dispositivo dentro il canale cifrato (nel `hello` su DTLS, o sigillato nella busta di chiamata); il relay non lo vede mai. Nessun numero di telefono, email, contatti, posizione. Inserire il nome è l'atto di consenso: la schermata dice a cosa serve. | `PROTOCOLLO.md` §3; `SECURITY.md` | Selezione da dichiarare: «richiede l'approvazione dell'utente prima di [inviare il nome al pari]». |

## 5.1.5 Protezione dell'app (FPT)

| Requisito | Cosa chiede | Logos | Prova | Cosa manca |
|---|---|---|---|---|
| **FPT_AEX_EXT.1.1–.5** anti-sfruttamento (ASLR, W^X, stack protection, niente file in cartelle eseguibili) | nessuna mappatura a indirizzo fisso, nessuna memoria scrivibile ed eseguibile, protezione dello stack | ✅ **Nessun codice nativo**: l'APK non contiene librerie `.so`; il codice è Java (Dalvik/ART) e JavaScript eseguito dal WebView della piattaforma. Nessuna chiamata a `mmap`/`mprotect`. Lo stack protection riguarda i binari nativi: non ce ne sono. I dati stanno in `/data/data/<pkg>`, che non contiene eseguibili. Android non permette di disattivare le protezioni di piattaforma (.3 soddisfatto per costruzione, come dice il profilo). | `unzip -l DigitalValut-Logos-v51.apk` (nessun `lib/`); `apkanalyzer dex packages` | Il test del valutatore (.1: confrontare `/proc/PID/maps` su due telefoni) non l'abbiamo eseguito. |
| **FPT_API_EXT.1** solo API documentate | elencare le API di piattaforma usate | ✅ Android: `WebView`/`WebViewClient`/`WebChromeClient`/`JavascriptInterface`/`PermissionRequest`, `WebViewAssetLoader` (androidx.webkit), `Service`/`Notification*`/`PendingIntent`, `AudioManager`/`AudioFocusRequest`/`AudioDeviceInfo`, `SensorManager` (prossimità), `PowerManager` (wake lock), `KeyguardManager`, `MediaStore`/`ContentValues` (salvataggio file), `SharedPreferences`, `BroadcastReceiver` (avvio), `SSLSocketFactory`/`SSLSocket`, `SecureRandom`, `MessageDigest`, `HttpURLConnection`. Web: Web Crypto, WebRTC, IndexedDB, `localStorage`, Service Worker, Push API, `MediaDevices`. Tutte documentate e non deprecate. | `grep ^import android/app/src/main/java/.../*.java` | — |
| **FPT_LIB_EXT.1** librerie di terzi | elencare ogni libreria impacchettata | ✅ con una precisazione. **Dichiarata**: `androidx.webkit:webkit:1.11.0`. **Transitive** (le porta lei, tutte di Google/AndroidX, presenti nel dex): `androidx.core:core:1.1.0`, `androidx.annotation`, `androidx.lifecycle:lifecycle-runtime/-common:2.0.0`, `androidx.arch.core:core-common:2.0.0`, `androidx.collection:1.0.0`, `androidx.versionedparcelable:1.1.0`, più le classi di ponte `org.chromium.support_lib_boundary` (parte di androidx.webkit). Nessuna libreria di terzi nella pagina web: zero. Nessuna libreria pubblicitaria o di analisi. | `./gradlew app:dependencies --configuration releaseRuntimeClasspath`; `apkanalyzer dex packages` | Il README diceva «una dipendenza»: corretto il 17 set 2026 in «una dichiarata, che porta le librerie AndroidX di compatibilità». Dependabot le sorveglia (dal 16 set). |
| **FPT_TUD_EXT.1.1** controllo aggiornamenti | l'app o la piattaforma sanno controllare se c'è un aggiornamento | 🟡 **Web**: sì — il service worker controlla la propria origine e la pagina mostra «C'è una versione nuova dell'app» con il pulsante *Aggiorna* (un test lo verifica). **Android**: nessun controllo dentro l'app; l'aggiornamento arriva dalla piattaforma tramite **F-Droid** (richiesta di inclusione aperta, con ricetta di aggiornamento automatico) o a mano da GitHub Releases. | `checks.test.js` «quando arriva una versione nuova, l'app lo DICE»; `android/RILASCIO.md` | Finché F-Droid non accetta, il canale Android è manuale. Un controllo in-app della versione pubblicata (una lettura di GitHub Releases) è possibile ma non fatto. |
| **FPT_TUD_EXT.1.2** versione interrogabile | l'utente può vedere la versione | ✅ Scheda «Come sta l'app → Versione in uso» (`APP_VERSION`); Android: `versionName` nelle impostazioni di sistema; `logos-modifica-4.43` = `CACHE` del service worker (test). | `checks.test.js` «the app and its service worker claim the same version» | — |
| **FPT_TUD_EXT.1.3** non modifica il proprio codice | l'app non scarica né sostituisce il proprio binario | ✅ Android: la pagina è **impacchettata nell'APK** (`assets/logos.html`, servita da `appassets.androidplatform.net`) — non carica codice dalla rete. L'aggiornamento è un APK nuovo installato dalla piattaforma. Web: il service worker aggiorna la cache dalla propria origine — è il normale meccanismo delle web app, e il codice è sempre quello dell'origine, verificabile. | `MainActivity.java` (`WebViewAssetLoader`); `build-single-file.py` | — |
| **FPT_TUD_EXT.1.4** aggiornamenti firmati | la piattaforma verifica la firma prima di installare | ✅ APK firmato con schemi v1+v2+v3, impronta del certificato `423e3094…` pubblicata nel README; Android rifiuta un aggiornamento firmato da un'altra chiave. **Build riproducibile**: un workflow ricostruisce l'APK da zero e lo confronta con quello pubblicato. | `apksigner verify --verbose`; `.github/workflows/riproducibile.yml` | — |
| **FPT_TUD_EXT.1.5** distribuzione | con il sistema o come pacchetto aggiuntivo | ✅ Pacchetto aggiuntivo (APK; F-Droid in attesa). | — | Con questa selezione il profilo chiede anche **FPT_TUD_EXT.2** (formato del pacchetto, rimozione dei dati alla disinstallazione): APK standard, disinstallazione via piattaforma che rimuove `/data/data/<pkg>`. |
| **FPT_IDV_EXT.1** (facoltativo) identificazione della versione | versione riconoscibile per correlare vulnerabilità | ✅ `versionCode`/`versionName` (51), `APP_VERSION` (4.43), tag di release `android-51`, note di rilascio in `fastlane/`. | — | — |
| **FPT_API_EXT.2** (facoltativo) parsing dei formati MIME dalla piattaforma | immagini/video/audio decodificati dalla piattaforma | ✅ `<img>`, `<video>`, `<audio>` del WebView; nessun decoder proprio. L'unica elaborazione propria è la rimozione dei metadati EXIF (taglio di segmenti, senza ricodifica). | `README.md` («A photo leaves its GPS location…») | — |

## 5.1.6 Canale fidato (FTP)

| Requisito | Cosa chiede | Logos | Prova | Cosa manca |
|---|---|---|---|---|
| **FTP_DIT_EXT.1** dati in transito | tutto ciò che viaggia è cifrato con HTTPS/TLS/DTLS della piattaforma o dell'app, con certificati X.509 | ✅ *tramite la piattaforma*: HTTPS (WebView) verso il relay; **WSS** con `SSLSocket` di sistema e CA di sistema per il filo (`Filo.java` verifica anche `Sec-WebSocket-Accept`); **DTLS-SRTP** (WebRTC della piattaforma) per media e dati fra i due dispositivi. **In più, a livello di app**: ogni busta di segnalazione è sigillata (ECIES/AES-GCM) prima di entrare in HTTPS, così il relay — pur terminando il TLS — non legge nulla. Questo secondo strato è quello modellato in `prova-formale/`. | `PROTOCOLLO.md`; `PER-IL-REVISORE.md` #1; `Filo.java` | Per il profilo va dichiarato che il TLS lo fa la piattaforma (WebView/JSSE), non l'app: corretto e voluto. |

## Il conto

Su 16 requisiti obbligatori: **11 ✅, 4 🟡, 0 ❌**; più 2 facoltativi ✅.
I quattro «in parte» sono in realtà **due lacune** e **due questioni di
forma**:

1. **Chiavi e dati a riposo (FCS_STO, FDP_DAR)** — la lacuna vera. Oggi la
   protezione a riposo è quella della sandbox e della cifratura del
   telefono; il profilo per Android vuole il KeyStore. La risposta è una
   sola modifica: cifrare il deposito locale con una chiave nel KeyStore
   hardware (idea n. 4 del progetto). Chiude tutte e due le righe.
2. **Controllo aggiornamenti Android (FPT_TUD_EXT.1.1)** — si chiude da
   solo con l'accettazione su F-Droid; nel frattempo un controllo in-app è
   possibile.
3. **Impostazioni in `localStorage` (FMT_MEC)** — questione di forma per
   un'app web dentro un WebView; da chiarire con un laboratorio prima di
   spostare qualcosa.
4. **Modulo crittografico della piattaforma non FIPS** — non dipende da
   Logos: è il WebView. Va dichiarato, non risolto.

Tre test del valutatore che possiamo fare noi con `adb`, e non abbiamo
ancora fatto: `find -L . -perm /002` nella cartella dati; confronto di
`/proc/PID/maps` su due telefoni; sniffing del traffico per confermare
l'elenco degli host.

## Cosa NON copre questo profilo

Le cose per cui Logos esiste — che il relay non legga nulla, che nessuno si
metta in mezzo, che l'indirizzo sia autocertificante — **non sono
requisiti del PP_APP**: il profilo guarda l'igiene dell'app (permessi,
librerie, aggiornamenti, dati a riposo), non il protocollo. Il protocollo
sta in `PROTOCOLLO.md` e nei modelli; la mappa promessa→prova sta in
`PER-IL-REVISORE.md`. Una valutazione seria guarderebbe tutte e tre le cose.

---

## English summary

Self-assessment of Logos (web 4.43 / Android v51, 17 Sep 2026) against
the NIAP **Protection Profile for Application Software v2.0**, written by
the project and not reviewed by any lab. Of the 16 mandatory requirements:
11 met, 4 partially, 0 unmet. The two real gaps are one and the same: the
identity key is a non-extractable Web Crypto key in the app sandbox (not in
the Android KeyStore) and local history/contacts rest in clear inside that
sandbox, relying on device encryption — closing both means encrypting local
storage with a hardware KeyStore key. The other two are form: Android has
no in-app update check (F-Droid pending), and settings live in the
WebView's `localStorage` rather than `SharedPreferences`. The Android
package contains no native code and one declared dependency
(`androidx.webkit`) plus its AndroidX transitive libraries, all listed
above. The platform crypto module (Chromium's BoringSSL in the WebView) is
not FIPS-validated; that is a platform fact, declared. This profile does
not cover the protocol itself — see `PROTOCOLLO.md` and
`PER-IL-REVISORE.md`.
