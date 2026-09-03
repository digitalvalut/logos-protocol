# App Links — perché un invito toccato apre l'app e non il browser

## Il problema che chiude

Un invito o un indirizzo permanente condiviso (WhatsApp, email, messaggi) è un
link `https://digitalvalut.github.io/logos-protocol/modifica.html#a=…`. Toccato
su un telefono che **ha già l'app installata**, apriva lo stesso **Logos web nel
browser** — che ha un'identità e un indirizzo *separati* da quelli dell'app.
Risultato: l'indirizzo salvato lì non compare nell'app, e la persona si ritrova
con due indirizzi senza capire perché.

## Cosa è stato fatto nel codice (commit)

- **`app/src/main/AndroidManifest.xml`** — `MainActivity` dichiara un
  `intent-filter` con `android:autoVerify="true"` per
  `https://digitalvalut.github.io/logos-protocol/…`.
- **`app/src/main/java/…/MainActivity.java`** — `inviteFragmentFrom()` estrae il
  frammento (`#a=` / `#q=` / `#i=`) dal link e lo passa alla pagina
  impacchettata: `loadUrl(START + "#…")` all'avvio, o `location.hash = "#…"` (che
  fa scattare `hashchange`) se l'app è già aperta. La pagina ha già
  `autoFillFromHash()` che fa il resto — nessuna modifica a `modifica.js`.

**Finché il file qui sotto non è online, `autoVerify` non passa e il link torna
al browser esattamente come adesso. Nessuna regressione.**

## Il passo manuale: il file `assetlinks.json` sulla RADICE del dominio

Android controlla `https://digitalvalut.github.io/.well-known/assetlinks.json` —
sulla **radice** `digitalvalut.github.io`, non sotto `/logos-protocol/`. Quel
repository di GitHub Pages **non esiste ancora** (`digitalvalut.github.io/` dà
"Site not found").

### Come metterlo online (gratis, ~3 minuti su github.com)

1. Crea un repository nuovo chiamato **esattamente** `digitalvalut.github.io`
   (owner: `digitalvalut`), pubblico.
2. Dentro, crea il file **`.well-known/assetlinks.json`** con lo stesso
   contenuto di `android/assetlinks.json` in questo repository.
3. Impostazioni → Pages → Source: `Deploy from a branch`, branch `main`, cartella
   `/ (root)`. Salva.
4. Dopo un minuto, verifica che
   `https://digitalvalut.github.io/.well-known/assetlinks.json` si apra e mostri
   il JSON.
5. Reinstalla / aggiorna l'app: Android rifà la verifica e da lì i link aprono
   l'app.

Verifica della verifica (facoltativo, da PC con adb):
`adb shell pm get-app-links io.github.digitalvalut.logos`

## ⚠️ L'impronta nel file dipende da CHI firma l'app

`android/assetlinks.json` contiene l'impronta della chiave di firma nostra
(`logos-release.keystore`, `42:3E:30:94:…`). Va bene **se l'APK che le persone
installano è quello firmato da noi** (GitHub Releases).

Se F-Droid finisce per firmare l'app con la **sua** chiave (è la richiesta in
sospeso nella MR !46727), quel build ha un'impronta diversa. In quel caso il
campo `sha256_cert_fingerprints` è una **lista**: si aggiunge anche l'impronta
di F-Droid (la si legge dopo la prima pubblicazione, o la fornisce F-Droid),
senza togliere la nostra. Due impronte, e i link funzionano da entrambe le
provenienze.

## ⚠️ Non ancora provato su un telefono vero

Le modifiche compilano ma non sono state viste funzionare su un dispositivo —
serve una build dell'APK e la prova con un link vero toccato da WhatsApp, ad app
chiusa e ad app aperta. Regola del progetto: niente si pubblica finché non l'ha
provato l'operatore sul telefono.
