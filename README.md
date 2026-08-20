# DigitalValut Logos

**Talk to anyone, wherever they are. No sign-up, no phone number, free forever.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Web app: **https://digitalvalut.github.io/logos-protocol/**
Source code: **https://github.com/digitalvalut/logos-protocol** · Apache 2.0 license

---

## What it is

A peer-to-peer encrypted chat that runs entirely in the browser. There is no account to
create, no phone number to give up, no company sitting between you and the person you're
talking to. Two browsers connect directly to each other over **WebRTC**; once that
connection exists, every message, call, photo and file travels straight from one device to
the other. There is no server in the middle that could read it, log it, or hand it over to
anyone — because there is no server handling your conversation at all.

## Architecture

- **Direct connection, not a relay.** The two browsers negotiate a private WebRTC channel
  and talk to each other directly. A single Cloudflare Worker helps the two sides *find*
  each other at the start and, when a very restrictive network requires it, relays the
  encrypted traffic — it never has a key and never sees a plaintext message.
- **Permanent and throwaway identity, built on ECIES over ECDH (P-256).** A device holds
  an ECDH key pair on the P-256 curve, generated on-device with a private half that has no
  byte form this code — or any code — can read back out. A shareable address
  (`DV-XXXX-XXXX-XXXX`) is the SHA-256 hash of the public half, so the address is
  self-certifying: whoever dials it fetches the published key, checks it actually hashes
  back to the address dialled, and only then trusts it. A substituted key produces a
  different address and is rejected. Each call seals its offer under a fresh one-time key
  pair of its own, so two calls to the same address share no secret with each other. A
  device can hold up to eight independent addresses at once, each revocable on its own.
- **Encrypted from the first handshake.** Six-digit and link-based invites derive their key
  from PBKDF2 + AES-256-GCM; address-based calls use the ECIES scheme above. Either way,
  the offer is useless to anyone who intercepts it without the matching device.
- **You verify who you're really talking to.** The first time you connect to someone, both
  sides see the same three-word security code, generated from the actual cryptographic
  connection (the same principle used by ZRTP-based secure calling). Read them out loud to
  each other once; if they match, nobody is sitting in the middle of your connection. That
  check is then bound to the other person's cryptographic fingerprint, not their name, so
  the app always knows if a "contact" is suddenly using different keys. Two devices in
  physical proximity can also connect by scanning a QR code carrying that fingerprint
  directly — a channel nobody can get into the middle of, so it verifies itself outright.
- **Nothing is stored anywhere but your own device.** Conversation history lives only in
  your browser's local storage, tied to who you were talking to. Close the tab, and unless
  you chose to keep it, it's gone. There is no database, anywhere, holding your messages.
- **Zero runtime dependencies.** Every cryptographic primitive comes from the browser's own
  Web Crypto API — no cryptography is hand-written, and no third-party script, library, or
  CDN resource is loaded at any point.

## What you can do with it

- Text messages, emoji, voice messages, photos, video and file sharing.
- Audio and video calls, direct between the two browsers.
- **A permanent address** (`DV-XXXX-XXXX-XXXX`) to hand out instead of a phone number, plus
  up to **8 throwaway addresses** for a listing or a stranger — delete one and that person
  can no longer reach you, without touching anything else.
- Connect by short 6-digit code, by a tappable invite link, by dialling an address, or by
  scanning a QR code in person — whichever is easiest for the two of you.
- **An invite that waits.** Send one and close the app. Whoever opens it — an hour later,
  a day later — makes your phone ring; you open the app and you're connected. Neither of
  you has to be sitting there waiting.
- **A letter for someone who doesn't answer.** Call an address and nobody's there? Leave a
  message, held for up to 7 days, sealed so only the address's owner can open it.
- **A simple mode**: two very large buttons and nothing else on screen, with the
  instructions read out loud in your own language. Both off unless you switch them on.
- A self-destruct timer for messages, when you want a conversation to leave no trace at all.
- **Automatic cleanup**, entirely opt-in and off by default: turn it on and the app quietly
  deletes conversations older than the number of days you choose (7, 30, 90 or 365), so
  history never has to be managed by hand.
- An optional "knock" — a push notification with no name and no message inside it, only
  "someone wants to talk" — so you can hear from someone without keeping the app open, and
  without any server ever learning who your contacts are.
- Works as an installable app on iPhone, Android, and desktop, and keeps working offline
  once installed for everything except reaching another person (that part always needs
  both of you online, since there is no server to hold a connection open on your behalf).
- The full interface in **13 languages** — Arabic, Bengali, Chinese, English, French,
  German, Hindi, Indonesian, Italian, Portuguese, Russian, Spanish and Urdu — detected
  automatically from your device, with proper right-to-left layout for Arabic and Urdu.

## Install it — phone or computer

- **iPhone / iPad** — open the page in Safari, tap **Share**, then **Add to Home Screen**.
- **Android** — open it in Chrome and tap **Install**, or menu → **Add to Home screen**.
- **Windows / Mac / Linux** — click the install icon in the address bar of Chrome or Edge,
  or just keep it open as a normal browser tab — no installation is required to use it.

No app store, no account, nothing to buy.

## It is also one single file

```bash
python3 build-single-file.py
```

That produces `digitalvalut-logos.html` — the whole application, stylesheet and logic
folded into one self-contained file. Put it on any web host and the app is running again;
keep it on a USB stick and you are carrying it. It is the real thing, not a reduced copy.

The page refuses to run any code that is not its own, so the build names its two inlined
blocks by their SHA-256: change a single character anywhere in that file and the browser
itself will refuse to run it.

## Quality signal

60 automated tests, each verified by deliberately reintroducing the bug it guards against
and confirming it fails red before the fix — not just written to pass. They run in a
~150-line hand-written browser sandbox, not a framework, in keeping with the
zero-runtime-dependency rule. `node --test` from the repository root.

## License

DigitalValut Logos is released under the **Apache License, Version 2.0** — see
[`LICENSE`](LICENSE) for the full text. You may use, modify, and redistribute this
software, including in closed-source or commercial products, under its terms.

For arrangements outside the terms of the Apache License 2.0 — custom support, warranty
commitments, or other terms not covered by the license as published — contact DigitalValut
via [www.digitalvalut.it](https://www.digitalvalut.it).

## Brand

"DigitalValut" and "Logos", and their associated logos, are the exclusive property of the
Associazione di Promozione Sociale DigitalValut. The license above governs the source
code; it does not grant rights to use the DigitalValut or Logos names, or their logos, to
identify or endorse a derivative product without separate written permission.

## About

Conceived by **Dr. Giuseppe Falsone**, President of **DigitalValut**, built with the
DigitalValut Team.

© 2026 **Associazione di Promozione Sociale DigitalValut** (Ente del Terzo Settore), a
registered Italian nonprofit.

**[www.digitalvalut.it](https://www.digitalvalut.it)**

---

## In breve (italiano)

**Parla con chi vuoi, ovunque sia. Senza registrarsi, senza numero di telefono, gratis per
sempre.**

DigitalValut Logos è una chat criptata da persona a persona (peer-to-peer), che funziona
interamente nel browser: nessun account, nessun numero di telefono, nessuna azienda in mezzo
tra te e chi parli con te. I due browser si collegano direttamente tramite **WebRTC**: una
volta stabilita la connessione, messaggi, chiamate, foto e file viaggiano direttamente da un
dispositivo all'altro, senza passare da nessun server che potrebbe leggerli o conservarli.

L'indirizzo permanente (`DV-XXXX-XXXX-XXXX`) è l'impronta di una coppia di chiavi ECDH su
curva P-256, generata sul dispositivo: chi chiama verifica che la chiave ricevuta corrisponda
davvero all'indirizzo composto, e cifra la busta con **ECIES** verso quella chiave — solo il
dispositivo che possiede la chiave privata può aprirla. Il codice d'invito e i dati di
riconnessione sono cifrati prima ancora di lasciare il dispositivo; alla prima connessione
con qualcuno, entrambi vedete lo stesso codice di sicurezza a tre parole, generato dalla
connessione crittografica reale — dette a voce una volta, confermano che nessuno si è messo
in mezzo. La cronologia resta solo sul tuo dispositivo: nessun database, da nessuna parte,
la conserva al posto tuo.

Messaggi, foto, video, chiamate, un **indirizzo permanente** più fino a **8 indirizzi
usa e getta**, autodistruzione dei messaggi, **pulizia automatica** opzionale (spenta di
base), un "colpetto" push discreto per farsi sentire senza tenere l'app aperta, codice QR
o link per collegarsi, e tutta l'interfaccia in **13 lingue**. Si installa su iPhone,
Android, Windows, Mac e Linux senza alcun account né pagamento.

**L'invito aspetta:** mandalo e chiudi pure l'app — chi lo apre, anche il giorno dopo, ti
fa squillare il telefono, e appena riapri siete connessi. **Il QR si verifica da solo:**
inquadrare il codice sullo schermo di chi hai davanti è un canale che nessuno può
intercettare, e l'app lo riconosce senza chiedervi altro. C'è una **modalità semplice** con
due soli pulsanti giganti e le istruzioni lette ad alta voce, per chi non vede bene o non
legge. E tutta l'app sta in **un unico file** che chiunque può caricare ovunque.

Ideato dal **Dott. Giuseppe Falsone**, Presidente di **DigitalValut**, realizzato con il
Team DigitalValut.
© 2026 **Associazione di Promozione Sociale DigitalValut** (Ente del Terzo Settore) —
software libero e open source, licenza **Apache 2.0**.

**[www.digitalvalut.it](https://www.digitalvalut.it)**
