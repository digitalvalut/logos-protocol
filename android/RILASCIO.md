# Come si pubblica una versione Android

Questa pagina esiste perché l'8 settembre 2026 la procedura viveva solo negli
appunti privati dell'autore e nella testa di chi aveva fatto l'ultimo rilascio.
È costato un'ora, un pacchetto firmato male e una password finita a schermo.

Chi legge — una persona o un'AI, oggi o fra due anni — deve poter pubblicare
una versione seguendo solo questo file. Se qualcosa qui non basta, il difetto è
di questa pagina: correggila.

I percorsi della macchina di compilazione (dove stanno JDK, SDK e chiave) non
sono qui, perché questo file è pubblico. Stanno in `LOGOS-DA-SALVARE/`.

---

## L'ordine è obbligato

```
1. versionCode  →  2. compila  →  3. verifica riproducibilità
                                        ↓
4. FIRMA  →  5. rilascio su GitHub  →  6. ricetta F-Droid  →  7. messaggio
```

**Non si scavalca il 5 prima del 6.** La ricetta F-Droid contiene:

```yaml
Binaries: https://github.com/digitalvalut/logos-protocol/releases/download/android-%v/DigitalValut-Logos-v%v.apk
```

Il loro server **scarica quel file da quell'indirizzo esatto**. Se aggiorni la
ricetta a una versione il cui rilascio non esiste ancora, la pipeline va in 404
e un manutentore volontario ha perso un giro per colpa tua. È già successo tre
volte.

---

## 1. Alzare il numero di versione

In `android/app/build.gradle`, `versionCode` e `versionName` — stesso numero,
il precedente più uno. Non saltare numeri: F-Droid li usa per l'ordine.

Poi le note di versione, **in tutte e due le lingue**, nominate col versionCode:

- `fastlane/metadata/android/en-US/changelogs/<N>.txt`
- `fastlane/metadata/android/it-IT/changelogs/<N>.txt`

La prima riga dice **perché uno dovrebbe aggiornare oggi**, non cosa è cambiato
in ordine cronologico. Se in mezzo c'è una correzione di sicurezza, apre quella.

## 2. Compilare

```
cd android
JAVA_HOME=<jdk21> ANDROID_HOME=<sdk> ./gradlew clean assembleRelease --no-build-cache --no-daemon
```

⚠️ **JDK 21 e build-tools 35.0.0, non altro.** F-Droid ricostruisce con quelli;
una versione diversa produce un pacchetto diverso e la verifica fallisce. Serve
anche un `python3` funzionante: il task Gradle `bundleWebApp` è agganciato a
`preBuild` e rigenera `app/src/main/assets/logos.html` a ogni compilazione.
Quel file **non si committa mai**.

⚠️ `clean` e `--no-build-cache` non sono prudenza eccessiva: una cache vecchia
ha già prodotto un `classes.dex` che non corrispondeva, ed è costata una
pipeline a F-Droid e mezza giornata a capire.

Esce `app/build/outputs/apk/release/app-release-unsigned.apk`.

## 3. Verificare la riproducibilità PRIMA di pubblicare

Non dopo. Se scopri dopo che non si riproduce, l'hai già fatto scoprire a loro.

> **Una macchina lo rifà da sola dopo ogni pubblicazione.**
> `.github/workflows/riproducibile.yml` ricompila due volte da zero, verifica
> che diano lo stesso pacchetto, e lo confronta voce per voce con l'APK che
> avete pubblicato. Si può lanciare anche a mano su un tag qualsiasi:
> `gh workflow run riproducibile.yml -f tag=android-39`.
> Misurato l'8 set 2026: la stessa sorgente compilata su un Mac e su una
> macchina Linux di GitHub ha dato la stessa impronta,
> `e61e44c6ad75f7e6faee459ad2bd0aa9e030a1873f9767e89a00597b6363b0df`.
> ⚠️ La macchina non firma e non deve mai avere la chiave: costruisce e
> confronta, e per questo il confronto ignora `META-INF/`.
> Resta comunque buona pratica fare il doppio giro in locale prima di
> pubblicare — la CI ti dice che hai sbagliato *dopo* che il pacchetto è già
> online.

Metti da parte il pacchetto, ricompila da zero con lo stesso comando, e
confronta:

```
shasum -a 256 primo.apk secondo.apk
```

Devono essere **la stessa impronta**. Se differiscono, non pubblicare: cerca
cosa nella build dipende dall'ora, dal percorso o dalla cache.

## 4. Firmare

⚠️⚠️ **`--alignment-preserved` non è opzionale.** Senza, `apksigner` riallinea
l'archivio, `apksigcopier` lo riallinea a modo suo, e F-Droid **non riesce a
verificare la ricostruzione** — con la beffa che il confronto dei contenuti
risulta vuoto, quindi *sembra* che combaci tutto. Niente `zipalign` prima:
l'uscita di Gradle è già allineata.

```
apksigner sign --alignment-preserved \
  --ks <chiave> --ks-key-alias logos \
  --out DigitalValut-Logos-v<N>.apk app-release-unsigned.apk
```

L'alias è **`logos`**. (In `twa-manifest.json` c'è ancora scritto `android` e un
file `android.keystore` che non esiste: resti di Bubblewrap, ignorali.)

La password la digita **una persona**. Non si incolla in una chat, non si mette
in un file nuovo, non si passa a un'AI. Se finisce a schermo va cambiata — è già
successo due volte, il 26 agosto e l'8 settembre.

**Poi si controlla che sia la chiave giusta:**

```
apksigner verify --print-certs DigitalValut-Logos-v<N>.apk
```

L'impronta SHA-256 deve essere
`423e3094890bd7ee31e4438b687bf0ccdc41dba44a2f512eba27d7e533fee190`.
Se è diversa, **fermati**: chi ha già l'app non riuscirebbe ad aggiornare, e la
riga `AllowedAPKSigningKeys` della ricetta F-Droid non corrisponderebbe più.

**Controllo finale** che il contenuto non sia cambiato firmando — confronta le
voci dell'archivio firmato con quelle del grezzo, escluse le firme:

```
unzip -v FIRMATO   | awk 'NR>3 && NF>7 {print $8,$7,$1}' | grep -v ^META-INF/ | sort > a
unzip -v NONFIRMATO| awk 'NR>3 && NF>7 {print $8,$7,$1}' | grep -v ^META-INF/ | sort > b
diff a b
```

Deve essere vuoto. (Se `apksigcopier` è installato, la prova prescritta è
`apksigcopier copy FIRMATO GREZZO RIC.apk && apksigner verify RIC.apk`, poi
`cmp` fra FIRMATO e RIC.)

## 5. Rilascio su GitHub — **due file, non uno**

```
git tag -a android-<N> -m "v<N> (<versione app>)" && git push origin android-<N>
gh release create android-<N> DigitalValut-Logos-v<N>.apk \
   --notes-file fastlane/metadata/android/en-US/changelogs/<N>.txt
```

⚠️ **Poi carica una seconda copia dello stesso pacchetto, chiamata
`DigitalValut-Logos.apk`** (senza numero). Il tasto "Scarica l'app per Android"
del sito punta a
`releases/latest/download/DigitalValut-Logos.apk`: senza quel file il tasto dà
404 e il sito è rotto per tutti, mentre il rilascio sembra perfetto.

Verifica tutti e due gli indirizzi prima di considerarti a posto:

```
curl -sIL <.../releases/latest/download/DigitalValut-Logos.apk>        -o /dev/null -w '%{http_code}\n'
curl -sIL <.../releases/download/android-N/DigitalValut-Logos-vN.apk>  -o /dev/null -w '%{http_code}\n'
```

## 6. Ricetta F-Droid

Nel fork `digitalvalut/fdroiddata`, ramo `add-logos`, file
`metadata/io.github.digitalvalut.logos.yml`. Cambiano **cinque righe e basta**:
`versionName`, `versionCode`, `commit` (l'hash completo, non il tag),
`CurrentVersion`, `CurrentVersionCode`.

Metodo sicuro nell'editor web: scarica il file grezzo, sostituisci solo quelle
righe via programma, incolla il risultato. Non riscriverlo a mano — l'editor
auto-indenta e lo YAML si rompe in silenzio.

Guarda sempre "Preview changes" prima di confermare: **se il confronto mostra
più di cinque righe, hai rotto qualcosa.**

## 7. Il messaggio al manutentore

Corto, e apre riconoscendo il loro lavoro. Sono volontari con una coda lunga:
un messaggio che si apre con la missione si legge per ultimo. Dire cosa hai
verificato *prima* di chiedere vale più di qualsiasi presentazione.

---

## Cosa non si fa mai

- **Non pubblicare una release Android mentre la richiesta F-Droid è in coda**,
  a meno che nella versione ferma ci sia un difetto che non deve arrivare agli
  utenti. È successo l'8 set 2026: in coda c'era la 4.02, che nel caso di rete
  censurata contattava gli STUN di Google. In quel caso pubblicare è giusto, e
  la ragione va scritta nel messaggio.
- **Non committare `app/src/main/assets/logos.html`** né
  `digitalvalut-logos.html`: sono prodotti della compilazione. Un artefatto
  vecchio nel sorgente è il modo classico in cui una build smette di essere
  riproducibile.
- **Non cambiare la chiave di firma.** Non è sostituibile: senza, nessuno
  aggiorna sopra l'app che ha già.
