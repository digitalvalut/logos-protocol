# Distinta dei componenti (SBOM)

Quello che c'è dentro Logos, misurato — non dichiarato. La versione leggibile
dalle macchine è [`sbom.cdx.json`](sbom.cdx.json) (formato CycloneDX 1.5).

## App web (`modifica.html`, `modifica.js`, `modifica.css`, `modifica-sw.js`)

**Zero dipendenze a runtime.** Nessun pacchetto npm, nessun `node_modules`,
nessun CDN, nessun font o script esterno. Ogni primitiva crittografica viene da
Web Crypto del browser; il trasporto da WebRTC del browser. Lo stesso vale per
i test (`tests/`): il finto browser è scritto a mano (`tests/fake-browser.js`).
Lo garantisce il CSP della pagina (`default-src 'self'`) e lo controlla un test.

## Involucro Android (`android/`)

Una sola dipendenza dichiarata, e le sue transitive. Elenco preso da
`./gradlew app:dependencies --configuration releaseRuntimeClasspath`
(20 set 2026, tag `android-60`):

| artefatto | versione | perché |
|---|---|---|
| androidx.webkit:webkit | 1.11.0 | **dichiarata** — serve la pagina nel WebView dall'origine sicura `https://appassets.androidplatform.net` |
| androidx.core:core | 1.1.0 | transitiva di webkit |
| androidx.annotation:annotation | 1.2.0 | transitiva |
| androidx.arch.core:core-common | 2.0.0 | transitiva |
| androidx.collection:collection | 1.0.0 | transitiva |
| androidx.lifecycle:lifecycle-common | 2.0.0 | transitiva |
| androidx.lifecycle:lifecycle-runtime | 2.0.0 | transitiva |
| androidx.versionedparcelable:versionedparcelable | 1.1.0 | transitiva |

Tutte con licenza Apache-2.0, tutte di Google (AndroidX). Il client WebSocket
del campanello (`Filo.java`) è scritto a mano: nessuna libreria di rete.

## Relay (`turn-worker/worker.js`)

Zero dipendenze: un solo file, le sole API della piattaforma Cloudflare Workers
(KV, Durable Objects, Web Crypto).

## Come si ricontrolla

```
cd android && ./gradlew app:dependencies --configuration releaseRuntimeClasspath
```

Dependabot sorveglia `android/` e i workflow di GitHub ogni mese; una
dipendenza nuova comparirebbe come pull request, mai in silenzio.
