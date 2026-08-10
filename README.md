# LOGOS — The Unbreakable Truth Protocol

**Seal any file with mathematics. No account. No server. No permission needed.**

Drop a document, a photo, an audio recording, a video — anything — into LOGOS. In seconds it
produces a *seal*: a few hundred bytes of plain text proving that this exact file, down to the last
bit, existed at that moment. Change one pixel, one syllable, one comma, and the seal no longer
matches. Nobody on earth can forge a different file with the same fingerprint.

The seal is small enough to email, post, print, or carry on ten USB sticks. Every copy is the
original. Anyone, anywhere, forever, can verify it — offline, with tools that already exist on
every computer.

> Given to humanity so that anyone, anywhere, holds the inalienable power to speak, to bear
> witness, and to defend themselves against abuse. No server to shut down, no intermediary, no
> censorship. Pure mathematics and absolute freedom.

---

## Start in 30 seconds — no installation

**Double-click `LOGOS.html`.** It opens in any browser, on any operating system, on a phone or a
laptop, in 2026 or in 2046. Drop your file in. That is all.

- Works with the internet **turned off**.
- Your file **never leaves your device**. Nothing is uploaded, ever.
- One single file, no libraries, no trackers, no analytics, no accounts, no cookies.
- Copy it to a USB stick, attach it to an email, host it anywhere: it still works.

## Or use the command line

`logos.py` uses only the Python standard library. It produces **exactly the same seals** as
`LOGOS.html` — the two are interchangeable.

```bash
python3 logos.py seal evidence.mp4 --author "Jane Doe" --statement "Recorded on 10 Aug 2026 at..."
python3 logos.py verify evidence.mp4
python3 logos.py anchor evidence.mp4.logos.json
python3 logos.py hash evidence.mp4
```

---

## What it computes

| | |
|---|---|
| **SHA3-512** | The current NIST standard (FIPS 202), the strongest mainstream fingerprint. |
| **SHA-256** | The universal fingerprint — verifiable with a built-in command on every OS, and the one anchored to Bitcoin. |
| **Seal ID** | A fingerprint of the seal itself, so the seal cannot be edited without detection. |

Files are read in 4 MB pieces, so a 50 GB video is sealed without ever loading it into memory.

## Anchoring to Bitcoin — the date becomes independent of you

Your device clock proves nothing to a stranger: a clock can be changed. One click on **Anchor**
(or `--anchor`) writes your fingerprint into the Bitcoin blockchain through free public
[OpenTimestamps](https://opentimestamps.org) calendars.

- **No wallet, no account, no payment, no personal data.** Only the 32-byte fingerprint of your
  file is ever sent — the file itself, its name and its contents stay with you.
- Four independent calendars are used at once, so no single operator holds your proof.
- The result is a standard `.ots` file. Keep it next to your original.
- After a few hours the Bitcoin network confirms it. From then on, the date of your file is proven
  by the whole Bitcoin blockchain, and can be checked by anyone with the official free client:

```bash
pip install opentimestamps-client
ots upgrade evidence.mp4.ots
ots verify evidence.mp4.ots
```

LOGOS never becomes necessary again: the proof is an open standard.

---

## What the seal proves

- **Integrity** — that a file is exactly, bit for bit, the file that was sealed. Absolute and permanent.
- **Priority** — that the file already existed at a certain moment, provided the seal was made
  public or anchored at that moment.
- **Attribution** — that a named person made a specific statement about that file.

## What it does not prove — read this

Honesty is what makes a tool trustworthy, so here are the limits:

- A seal **does not prove the content is true**. It proves the file has not been altered since it
  was sealed. A sealed lie is still a lie — but a sealed truth can no longer be quietly rewritten.
- The timestamp taken from your device is **your own clock**. Alone it convinces nobody. It becomes
  real proof the moment the fingerprint is made public — anchored to Bitcoin, posted, emailed, or
  recorded by anyone else.
- No software can make a file **impossible to delete**. Data survives because copies exist in many
  hands. LOGOS makes the proof small enough to travel anywhere and makes any substituted copy
  instantly detectable. Copying is the survival; mathematics is the proof.

## How to make a proof that cannot be erased

1. Seal the file. Keep the seal.
2. Anchor it to Bitcoin — free, one click. The date stops depending on you.
3. Send the attestation text to several people, in different countries, on different channels.
   Post it publicly. Each copy is a full witness.
4. Keep copies of the original file in several places. The seal proves which copies are authentic.

An adversary would then have to erase every copy, in every country, and break Bitcoin, and break
SHA-3.

---

## Verify without LOGOS

You never have to trust this program. Any computer can check the same numbers:

```bash
sha256sum evidence.mp4                       # Linux
shasum -a 256 evidence.mp4                   # macOS
certutil -hashfile evidence.mp4 SHA256       # Windows
openssl dgst -sha3-512 evidence.mp4          # the SHA3-512 line
```

If the numbers match the seal, the file is authentic. If a single bit changed, they cannot match.

## Install it as an app — phone or computer

LOGOS is one page that behaves like an app everywhere, with nothing to buy and nothing to sign up for.
**Once installed it works with no internet at all** — on a plane, in a blackout, in a country that has
cut the network, or years from now if this website no longer exists.

- **iPhone / iPad** — open the page in Safari, tap **Share**, then **Add to Home Screen**.
- **Android** — open it in Chrome and tap **Install**, or menu → **Add to Home screen**.
- **Windows / Mac / Linux** — click the install icon in the address bar of Chrome or Edge, or simply
  save the page (**Ctrl+S** / **⌘S**) and double-click it whenever you need it.

On a phone you also get **Share the seal**, which hands the proof straight to WhatsApp, Signal,
Telegram or email — because a proof counts once other people hold a copy.

## It speaks 13 languages

Arabic, Bengali, Chinese, English, French, German, Hindi, Indonesian, Italian, Portuguese, Russian,
Spanish and Urdu — the whole interface, not just the buttons. The language is detected from your
device and can be changed at any time. Arabic and Urdu are laid out right to left, while fingerprints
and shell commands stay left to right so they remain readable.

## Spread it — a proof matters when other people hold it

The **SPREAD** tab sends your attestation in one tap to WhatsApp, Telegram, Signal, email, SMS, X,
Bluesky or the system share sheet, and lists the official secure submission channels of investigative
newsrooms and press-freedom organisations — SecureDrop's directory, ICIJ, OCCRP, Bellingcat, the
Guardian, the New York Times, CPJ, RSF, Freedom of the Press Foundation and the ICC. Every one of those
addresses was fetched and confirmed before being listed.

Nothing passes through a LOGOS server, because there is none: these open the apps already on your
device.

## If I don't come back — the posthumous release

For anyone going somewhere dangerous who holds something the world should know, but only if they do
not come back.

LOGOS encrypts the file on your device with **ChaCha20-Poly1305** and cuts the key into pieces with
**Shamir's Secret Sharing**: you choose how many people hold a piece and how many of them must agree.
With 3 of 5, two people can lose their piece — or be silenced — and the truth still comes out, while
no two of them can open it behind your back.

1. Lock the file. The locked `.logos-vault` file is unreadable: **publish it everywhere today**, and
   it can never be taken out of the world.
2. Give one piece of the key to each person you trust, in different countries, on different channels.
3. Tell them plainly when to open it, and that it takes *k* of them together.

**What cryptography cannot do:** no program publishes anything by itself after you are gone — a
computer nobody switches on does nothing. What the mathematics guarantees is the hard part: nobody can
read it early, no single person can betray it, and once the locked file is spread nobody can stop its
release. The people you choose are the trigger. Choose them well.

## Files in this folder

| File | What it is |
|---|---|
| `LOGOS.html` | The whole application, in one self-contained file. Double-click it. |
| `logos.py` | The same protocol on the command line. Standard library only. |
| `index.html`, `manifest.webmanifest`, `sw.js`, `icon-*.png` | What makes it installable and able to run with no internet. |
| `README.md` | This document. |
| `LICENSE` | MIT, © 2026 DigitalValut and the DigitalValut Team — free forever, for everyone, including commercially. |

Seals you create are written next to your file as `yourfile.logos.json`. The certificate
(`yourfile.certificate.html`) is a printable page that is *also* a machine-readable seal — LOGOS
reads it back.

---

## Give it to the world

LOGOS is designed to be copied. Any of these makes it permanent, and they cost nothing:

```bash
# a public repository anyone can clone
git init && git add . && git commit -m "LOGOS 1.0 — DigitalValut — donated to humanity"
# then push to GitHub / GitLab / Codeberg and enable Pages to get a free public web address

# or pin it to IPFS, where it is addressed by its own fingerprint
ipfs add -r .
```

Mirror it on the Internet Archive, attach it to an email, print the source, hand it out on USB
sticks. It is under the MIT License: nobody needs to ask permission, and nobody can take it back.

## Author

**Created and conceived by Dr. Giuseppe Falsone for DigitalValut.**
© 2026 **DigitalValut and the DigitalValut Team** — MIT License — Open source —
**Donated to humanity.**

---

## In breve (italiano)

**LOGOS sigilla qualsiasi file con la matematica. Nessun account, nessun server, nessun permesso.**

Apri `LOGOS.html` con un doppio clic — funziona su qualunque computer o telefono, anche **senza
internet**, e il tuo file **non lascia mai il tuo dispositivo**. Trascina dentro un documento, una
foto, un audio, un video: LOGOS calcola le impronte crittografiche SHA3-512 e SHA-256 e genera un
*sigillo* di poche centinaia di byte. Se anche un solo bit del file cambia, il sigillo non
corrisponde più — e nessuno al mondo può costruire un file diverso con la stessa impronta.

Il pulsante **Anchor** ancora l'impronta alla blockchain di Bitcoin tramite i calendari pubblici e
gratuiti di OpenTimestamps: niente wallet, niente conto, niente pagamento, nessun dato personale —
viene inviata solo l'impronta di 32 byte. Da quel momento la data del tuo file è provata dalla rete
Bitcoin e non più dal tuo orologio.

LOGOS si **installa come app** su iPhone, Android, Windows, Mac e Linux, parla **13 lingue** e ha
due strumenti in più: **DIFFONDI**, che manda l'attestazione in un tocco a WhatsApp, Signal,
Telegram, email o ai canali sicuri ufficiali di redazioni e organizzazioni per i diritti umani
(ogni indirizzo verificato uno per uno); e **SE NON TORNO**, il rilascio postumo — il file viene
cifrato e la chiave tagliata in più pezzi, uno per ogni persona di cui ti fidi, in paesi diversi.
Da soli non aprono nulla e nessuno di loro può tradirti; se abbastanza di loro decidono che il
momento è arrivato, la verità si apre.

Onestà sui limiti: il sigillo prova che il file **non è stato alterato**, non che il contenuto sia
vero; nessun software può rendere un file impossibile da cancellare — sopravvive perché ne
esistono molte copie; e nessun programma pubblica qualcosa da solo dopo la tua morte: le persone
che scegli sono l'innesco. Perciò: sigilla, ancora a Bitcoin, e **diffondi** l'attestazione a più
persone in più paesi. Ogni copia è un testimone completo.

Ideato e creato dal **Dr. Giuseppe Falsone** per **DigitalValut**.
© 2026 **DigitalValut e il Team DigitalValut** — Licenza MIT — **Donato all'umanità.**
