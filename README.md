# DigitalValut Logos

**Talk to anyone, wherever they are. No sign-up, no phone number, free forever.**

Web app: **https://digitalvalut.github.io/logos-protocol/**
Source code: **https://github.com/digitalvalut/logos-protocol** · MIT license

---

## What it is

A peer-to-peer encrypted chat that runs entirely in the browser. There is no account to
create, no phone number to give up, no company sitting between you and the person you're
talking to. Two browsers connect directly to each other over **WebRTC**; once that
connection exists, every message, call, photo and file travels straight from one device to
the other. There is no server in the middle that could read it, log it, or hand it over to
anyone — because there is no server handling your conversation at all.

## How it works

- **Direct connection, not a relay.** The two browsers negotiate a private WebRTC channel
  and talk to each other directly. A small Cloudflare Worker only helps the two sides *find*
  each other at the start (exchanging connection details through a short-lived, end-to-end
  encrypted mailbox that deletes itself) and, when a very restrictive network requires it,
  relays the encrypted traffic — it never has the keys and never sees a message.
- **Encrypted from the first handshake.** The invite code and the reconnection data exchanged
  between two devices are encrypted (PBKDF2 key derivation + AES-GCM) before they ever leave
  the device — even if a code is intercepted in transit, it's useless without the matching
  device.
- **You verify who you're really talking to.** The first time you connect to someone, both
  sides see the same three-word security code, generated from the actual cryptographic
  connection (the same principle used by ZRTP-based secure calling). Read them out loud to
  each other once; if they match, nobody is sitting in the middle of your connection. That
  check is then bound to the other person's cryptographic fingerprint, not their name, so
  the app always knows if a "contact" is suddenly using different keys.
- **Nothing is stored anywhere but your own device.** Conversation history lives only in
  your browser's local storage, tied to who you were talking to. Close the tab, and unless
  you chose to keep it, it's gone. There is no database, anywhere, holding your messages.

## What you can do with it

- Text messages, emoji, voice messages, photos, video and file sharing.
- Audio and video calls, direct between the two browsers.
- Connect by short 6-digit code, by a tappable invite link, or by scanning a QR code in
  person — whichever is easiest for the two of you.
- A self-destruct timer for messages, when you want a conversation to leave no trace at all.
- **Automatic cleanup**, entirely opt-in and off by default: turn it on and the app quietly
  deletes conversations older than the number of days you choose (7, 30, 90 or 365), so
  history never has to be managed by hand.
- An optional "knock" — a push notification with no name and no message inside it, only
  "someone you already know wants to talk" — so you can hear from a contact without keeping
  the app open, and without any server ever learning who your contacts are.
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

## Be clear about what it is and is not

Honesty is what makes a tool trustworthy, so here are the limits, plainly:

- It reveals your network address (IP) to whoever you're talking to — that's how a direct
  connection works. It needs both of you online at the same time, or nothing arrives.
- On very restrictive or heavily filtered networks, a direct connection may not be able to
  form at all.
- No website, this one included, can prevent the other person from taking a screenshot.
- **For safety when it truly matters**, use a dedicated, professionally audited secure
  messenger — **Signal**, **Session** or **Briar** — instead of this. DigitalValut Logos is
  built to be simple, free and serverless, not to replace years of audited cryptographic
  engineering.

## About

Conceived by **Dr. Giuseppe Falsone** for **DigitalValut**, built with the DigitalValut Team.

© 2026 **DigitalValut and the DigitalValut Team** — free and open-source software (MIT
license), a project of **Associazione di Promozione Sociale DigitalValut** (Ente del Terzo
Settore), a registered Italian nonprofit.

**info@digitalvalut.it** · **[www.digitalvalut.it](https://www.digitalvalut.it)**

---

## In breve (italiano)

**Parla con chi vuoi, ovunque sia. Senza registrarsi, senza numero di telefono, gratis per
sempre.**

DigitalValut Logos è una chat criptata da persona a persona (peer-to-peer), che funziona
interamente nel browser: nessun account, nessun numero di telefono, nessuna azienda in mezzo
tra te e chi parli con te. I due browser si collegano direttamente tramite **WebRTC**: una
volta stabilita la connessione, messaggi, chiamate, foto e file viaggiano direttamente da un
dispositivo all'altro, senza passare da nessun server che potrebbe leggerli o conservarli.

Il codice d'invito e i dati di riconnessione sono cifrati prima ancora di lasciare il
dispositivo; alla prima connessione con qualcuno, entrambi vedete lo stesso codice di
sicurezza a tre parole, generato dalla connessione crittografica reale — dette a voce una
volta, confermano che nessuno si è messo in mezzo. La cronologia resta solo sul tuo
dispositivo: nessun database, da nessuna parte, la conserva al posto tuo.

Messaggi, foto, video, chiamate, autodistruzione dei messaggi, **pulizia automatica**
opzionale (spenta di base) per non far crescere lo spazio occupato, un "colpetto" push
discreto per farsi sentire senza tenere l'app aperta, codice QR o link per collegarsi, e
tutta l'interfaccia in **13 lingue**. Si installa su iPhone, Android, Windows, Mac e Linux
senza alcun account né pagamento.

**Onestà sui limiti:** rivela il tuo indirizzo IP a chi parli con te, serve che siate online
insieme, e su reti molto filtrate la connessione può non formarsi. Per la sicurezza quando
conta davvero, usa Signal, Session o Briar.

Ideato dal **Dott. Giuseppe Falsone** per **DigitalValut**, realizzato con il Team
DigitalValut.
© 2026 **DigitalValut e il Team DigitalValut** — software libero e open source (licenza
MIT), un progetto dell'**Associazione di Promozione Sociale DigitalValut** (Ente del Terzo
Settore).

**info@digitalvalut.it** · **[www.digitalvalut.it](https://www.digitalvalut.it)**
