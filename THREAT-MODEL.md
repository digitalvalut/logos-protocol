# Threat model

Who Logos defends against, who it does not, and — for every claim — where the
evidence is and how to check it yourself. Nothing here asks to be taken on trust.

*In breve, in italiano:* questo documento dice contro chi Logos protegge e contro
chi no. Per ogni avversario: cosa può fare, cosa non può fare, quale prova lo
mostra e cosa resta scoperto. In fondo, le prove che chiunque può ripetere.

This complements [`SECURITY.md`](SECURITY.md) (how to report a problem, known
limits) and [`prova-formale/`](prova-formale/) (the formal models). It was written
on 4 October 2026 and describes the code in this repository at that date.

---

## What is being protected

| Asset | Where it lives |
|---|---|
| What two people say: text, voice, video, files | only on the two devices, and on the wire inside DTLS/SRTP |
| Who talks to whom | not stored anywhere by design; partly visible to the relay (see below) |
| The device identity (ECDH P-256 key pair) | created on the device with `extractable: false`: no code, including this code, can read the private half out |
| An address (`DV-…`) | a hash of that public key: it verifies itself |
| An invite | a link or QR carrying a 128-bit secret (`s=`) that seals the envelope |

---

## The adversaries

### 1. Someone watching the network (Wi-Fi owner, ISP, state-level observer)

- **Can:** see that a device talks to the relay host and to Cloudflare's STUN/TURN;
  see the other device's network address on a direct call; see timing and volume.
- **Cannot:** read or alter content. Calls and messages travel inside DTLS/SRTP
  negotiated by the browser; the relay is reached over HTTPS; everything placed
  in the relay is sealed before it leaves the device.
- **Evidence:** the browser's WebRTC stack; `modifica.js` (sealing with
  AES-GCM under ECDH-derived keys); [`prova-formale/`](prova-formale/).
- **Remaining:** metadata. Mitigations the user can turn on: **Hide where you
  are** (all traffic through the TURN bridge), a VPN, Orbot on Android.

### 2. The relay operator — us, and Cloudflare, which runs it

- **Can:** see network addresses, timing and the size of sealed envelopes; delay
  or drop envelopes (deny service); count how many keys exist.
- **Cannot:** read anything (it holds no key); forge an answer the caller will
  accept (every offer and answer carries its direction, `kind`, inside the seal,
  and stale envelopes older than 10 minutes are refused, `FRESHNESS_MS`);
  publish a key in someone else's address slot (`/key` checks that the slot is the
  hash of the key); empty someone's mailbox (deleting needs a random token that
  only the writer and the reader of the envelope hold).
- **Evidence:** `turn-worker/worker.js`; `tests/worker-audit.test.js`;
  `tests/relay-a-tappeto.test.js`; the formal models.
- **Remaining:** the relay is **not anonymous to the relay**. Denial of service by
  the operator is possible and cannot be prevented by the client.

### 3. Someone who has your address

- **Can:** ring you; leave a sealed letter (kept up to 7 days, at most 20 waiting).
- **Cannot:** read your mailbox or remove what others left there (token, above);
  ring an Android phone more than 6 times in 5 minutes (the phone stays silent
  after that, `RingService`); see your conversations.
- **Evidence:** `tests/worker-audit.test.js` («la cassetta che nessuno puo'
  svuotare»); `RingService.java` (`RING_MAX_PER_WINDOW`).
- **Remaining:** an address handed out is an address that can ring. Burner
  addresses (up to eight) can be deleted one by one.

### 4. Whoever carries an invite (the messenger you send the link through)

- **Can:** read the link, and with it the 128-bit secret that seals the envelope.
- **Cannot:** stay unnoticed if the two people compare the three-word safety code:
  the formal model shows the comparison detects an interception.
- **Evidence:** [`prova-formale/`](prova-formale/) and the section «The invite link
  carries the secret» in [`SECURITY.md`](SECURITY.md).
- **Remaining:** if nobody compares the three words, a man-in-the-middle by the
  carrier is possible. The app asks people to compare them; it cannot force it.

### 5. A contact turning hostile

- **Can:** send files, photos and voice notes; see your network address on a
  direct call unless **Hide where you are** is on.
- **Cannot:** pass as someone else you have verified (the contact is pinned to
  its cryptographic fingerprint, not to a name); run code in your app (messages
  are shown as text; photos are stripped of location and device metadata before
  sending).
- **Remaining:** received images are decoded by the browser, so the browser's own
  decoders are attack surface, as in every app that shows images.

### 6. Someone holding your phone, locked or unlocked

- **Locked:** protected by the operating system's storage encryption.
- **Unlocked:** the **local history is stored unencrypted** and can be read, as
  stated in [`SECURITY.md`](SECURITY.md). The private key cannot be exported, but
  a person using the unlocked phone can use the app. Mitigations: self-destructing
  conversations, automatic cleanup of old ones, protected screen (no screenshots).

### 7. A compromised phone (spyware such as Pegasus)

- **Out of reach, for Logos and for every messenger.** Spyware that controls the
  operating system reads the screen and the keyboard before anything is encrypted.
  No app can defend against it. If you may be a target, keep the system updated and
  consider iPhone Lockdown Mode or GrapheneOS.

### 8. The supply chain: whoever could change the code you run

- **Android:** no third-party code at runtime (the only dependency is
  `androidx.webkit`). Every release is rebuilt from a clean checkout of its tag by
  CI and compared entry by entry with the published APK
  (`.github/workflows/riproducibile.yml`). The signing key is RSA 4096; it is kept
  on the maintainer's machine, not in hardware.
- **Web:** the page is served by GitHub Pages and fetched fresh on every start.
  Whoever controls the repository or its hosting controls the code the browser
  runs. The Android package does not have this exposure: its code is inside it and
  verifiable.

### 9. Someone trying to make Logos unavailable

- **Can:** exhaust the free daily quota of the relay with volume from many
  addresses (limits are per address and kept per Worker instance). Calls would
  stop until the quota resets at 00:00 UTC.
- **Cannot:** read anything by doing so. Availability, not confidentiality.

---

## What we have tried, and how to repeat it

Every item below runs on your own machine. None of them touches the live relay or
its quota.

| What | How to repeat it |
|---|---|
| The whole suite: crypto, connection, interface, relay logic | `node --test` (Node 22, no install step) |
| 600 malformed, oversized and hostile requests against the relay, from a fixed seed | `node --test tests/relay-a-tappeto.test.js` |
| The relay's properties one by one (origins, slot ownership, tokens, quotas) | `node --test tests/worker-audit.test.js` |
| Historical defects put back to check the suite catches them | `node tests/mutanti.js` |
| The signalling protocol in Tamarin and ProVerif; timing in TLA+ | [`prova-formale/`](prova-formale/) |
| The published APK equals the source | workflow `riproducibile.yml`, or by hand with the commands in [`android/RILASCIO.md`](android/RILASCIO.md) |
| Signature and manifest of the APK | `apksigner verify --print-certs` and `aapt2 dump xmltree --file AndroidManifest.xml` on the APK from the release page |

What the static check of the published APK (v72) shows: signed with schemes v1, v2
and v3, RSA 4096, certificate SHA-256 `423e3094…fee190`; not debuggable;
`allowBackup="false"`; `usesCleartextTraffic="false"`; only two exported
components (the launcher and the boot receiver, which acts only if the user turned
ringing on). F-Droid's reviewers reached the same conclusions independently.

**Not yet done by us:** a capture of a phone's traffic during a call (for example
with PCAPdroid) published with its result; an independent audit. The second one
needs funding; the first one anyone can do today.

---

## What we will never claim

That Logos is unbreakable. It has not been audited independently, and the models
and tests above were written by the project itself. What we claim is narrower and
checkable: here is everything, here is how to verify it, and here is what it cannot
do. If you find a way through, [`SECURITY.md`](SECURITY.md) says how to tell us
privately.
