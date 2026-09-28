# Reading the code

Logos keeps the whole application in one file, [`modifica.js`](modifica.js), on purpose:
one person should be able to read everything that touches a conversation, end to end,
with nothing hidden in a dependency. This page is the map for doing that.

## GitHub will not show the file — open it this way

`modifica.js` is just over 1 MB, and GitHub does not display files that large in its
viewer. Nothing is hidden; it is a size limit of the viewer. Any of these works:

- **raw text in the browser:**
  <https://raw.githubusercontent.com/digitalvalut/logos-protocol/main/modifica.js>
  — then use the browser's find (Ctrl/Cmd+F) with the section titles below;
- **a local copy:** `git clone https://github.com/digitalvalut/logos-protocol` and open
  `modifica.js` in any editor.

## Half of the file is translations

About 48% of the bytes (lines ~119–2580 as of 28 Sep 2026, measured) are the interface
text in 13 languages. That part is data, not logic: dense lines of strings, one table
per language. If you are reading for security, you can skip it entirely — search for
`screens ====` to land just after it.

## The map

Each part of the file opens with a banner comment like
`/* ============================== WebRTC core ============================== */`.
Search for the words in the second column to jump there. Titles are in the language they
were written in: some in English, some in Italian (translation in brackets).

| what it does | search for |
|---|---|
| Separating the test copy's storage from the real app's | `la copia di prova` (the test copy) |
| Interface text, 13 languages | `i18n ====` |
| Screens, first launch, spoken instructions | `screens ====`, `saying it out loud` |
| **Peer connection** (RTCPeerConnection, ICE, TURN credentials) | `WebRTC core` |
| Renewing TURN credentials inside a live call | `rinnovare il lasciapassare` (renewing the pass) |
| Passphrase-sealed invites (optional) | `optional lock` |
| **Safety number** and identity pinning | `safety number`, `trust on first use` |
| **The key the address is made of** (ECDH P-256) | `the key the address is actually made of` |
| Recovering a call when the network changes | `la ripresa` (the recovery) |
| Invite: creating and accepting | `side A: create the invite`, `side B: accept the invite` |
| Local history, automatic cleanup, contacts | `history (local`, `automatic cleanup` |
| Relay mailbox and the delete token | `auto-reconnect (mailbox)`, `la cassetta che nessuno` |
| **What the relay may see** — sealing before upload | `nothing readable ever reaches the mailbox` |
| **ECIES** — encrypting to an address | `ECIES: encrypting to an address` |
| Letters for offline recipients | `the letterbox` |
| Permanent and disposable addresses, being called | `the permanent address`, `the burnable ones` |
| Health report shown to the user | `how the app is doing` |
| QR codes, and QR as an authenticated channel | `QR code ====`, `a QR held out in person` |
| Chat, files, removing photo metadata | `chat: text + files`, `away with what a photo says` |
| Calls, camera, speaker, screen sharing | `calls ====` |
| Self-destructing messages | `self-destruct` |

The **relay** is a separate, much smaller file: [`turn-worker/worker.js`](turn-worker/worker.js).
The **protocol**, written out in prose with its formal models, is in
[`prova-formale/`](prova-formale/) — start from `PROTOCOLLO.md` (in Italian) or
[`PER-IL-REVISORE.md`](prova-formale/PER-IL-REVISORE.md), which maps every promise to
code, lemma and test.

## Comments explain why, and some are in Italian

Comments are written for a reader who was not in the room: they say why a line is the
way it is, often with the date and the measurement that forced it. The project started
in Italian and moved to English along the way, so both appear. We know this is a real
obstacle for an international reader, and we are not going to pretend otherwise; if a
passage you need is Italian-only, open an issue and we will translate it.

## How the code is written

Much of this code is written with an AI coding assistant under the direction of
Dr. Giuseppe Falsone. See [How this code is written](README.md#how-this-code-is-written)
in the README for what that means and how the claims are checked.
