# LOGOS — The Unbreakable Truth Protocol

**A free tool that proves a file has not been altered, proves when it existed, and can release it only
if its author does not come back.**

Web app (works offline): **https://digitalvalut.github.io/logos-protocol/**
Source code: **https://github.com/digitalvalut/logos-protocol** · MIT licence

---

## In one paragraph

Drop any file — a document, a photo, a recording, a video — into a single web page. Nothing is
uploaded: the file never leaves the device. In seconds LOGOS produces a *seal*: a few hundred bytes of
plain text containing the file's cryptographic fingerprints. Anyone who later holds the file and the
seal can prove, with standard tools and no trust in LOGOS whatsoever, that the file is bit for bit the
one that was sealed. One optional click writes that fingerprint into the Bitcoin blockchain — free, no
wallet, no account — so the date stops depending on the author's word.

## Who this is for

- **Journalists and newsrooms** — establish that raw footage or a leaked document existed in a given
  state at a given time, before publication and before any dispute. A source can send you a fingerprint
  first and the material later.
- **Lawyers and investigators** — attach an integrity certificate to digital evidence at the moment of
  collection; demonstrate later that nothing changed in the chain of custody.
- **Human-rights defenders and NGOs** — field workers can seal testimony on a phone with no signal, no
  account and no trace of an upload.
- **Anyone at all** — a tenant photographing a defect, a doctor keeping a record, a person documenting
  abuse. The tool asks nothing of them: no signup, no payment, no technical knowledge.

## What it proves, and what it does not

Stating the limits is what makes the rest credible.

| It proves | It does not prove |
|---|---|
| **Integrity** — that a file is exactly the one sealed, bit for bit. Absolute and permanent. | **Truth of the content.** A sealed lie is still a lie. It proves nothing was altered afterwards. |
| **Priority** — that the file existed by a certain date, if the seal was published or anchored then. | **The date, on its own.** A device clock can be changed. It becomes proof when the fingerprint is made public or anchored to Bitcoin. |
| **Attribution** — that a named person made a specific statement about that file. | **Identity.** LOGOS does not verify who anyone is. |

No software can make a file impossible to delete. Data survives because copies exist in many hands.
LOGOS makes the *proof* small enough to travel anywhere and makes any substituted copy instantly
detectable.

## What a technical reviewer will want to know

- **Fingerprints:** SHA3-512 (FIPS 202) and SHA-256, computed locally, streaming in 4 MB blocks, so a
  50 GB video never enters memory whole.
- **Independent verification:** the SHA-256 in every seal is checkable with tools already installed on
  every operating system — `sha256sum`, `shasum -a 256`, `certutil -hashfile`. LOGOS is never required
  again.
- **Timestamping:** [OpenTimestamps](https://opentimestamps.org), the open Bitcoin standard. LOGOS
  submits only the 32-byte digest to four independent public calendars and writes a standard `.ots`
  proof, verifiable with the official client (`ots verify`) by anyone, forever, without LOGOS.
- **Posthumous release:** the file is encrypted with ChaCha20-Poly1305 (RFC 8439) and the key is split
  with Shamir's Secret Sharing over GF(256): *k* of *n* holders can open it, *k−1* learn nothing. The
  encrypted vault can be published immediately, since it is unreadable until the holders act.
- **No server, anywhere.** One HTML file, no libraries, no trackers, no analytics, no network calls
  except the anchoring button the user presses. It runs from a USB stick, offline, in a browser.
- **Correctness is tested, not asserted.** The hash implementations are checked against the reference
  implementations; the AEAD against the RFC 8439 test vector and 200 randomised cross-checks against an
  independent implementation; the key splitting for recovery with any *k* shares and for leaking nothing
  with *k−1*.

## Availability

Free, MIT licensed, no accounts, no advertising, nothing to unlock. Installs as an app on iPhone,
Android, Windows, macOS and Linux, and **works with no internet connection at all** once installed.
Interface in 13 languages: Arabic, Bengali, Chinese, English, French, German, Hindi, Indonesian,
Italian, Portuguese, Russian, Spanish, Urdu.

Created and conceived by **Dr. Giuseppe Falsone** for **DigitalValut**. © 2026 DigitalValut and the
DigitalValut Team. Donated to humanity.

---

# Template — to send to a newsroom, an NGO or a lawyer

> **Subject:** A free tool for proving digital evidence has not been altered
>
> Dear [name],
>
> I am writing about a free, open-source tool that may be useful to your work: **LOGOS**
> (https://digitalvalut.github.io/logos-protocol/).
>
> It lets anyone prove that a file — a document, a photograph, a recording — has not been modified since
> a given moment, and, with one optional click, anchor that moment in the Bitcoin blockchain so the date
> no longer depends on anyone's word. Everything is computed on the user's own device: **no file is ever
> uploaded**, there is no account, no payment and no server involved.
>
> Two things may matter to you in particular. First, verification does not require our tool: the
> SHA-256 in every proof can be checked with commands already present on any computer, so nothing rests
> on trusting us. Second, it works offline, which matters for anyone documenting something where there
> is no connection — or where using one is dangerous.
>
> It also offers a protected release for people at risk: a file can be encrypted and the key split
> among several trusted people in different countries, so that it opens only if enough of them agree
> that the moment has come.
>
> The tool is honest about its limits, and I would rather state them than have you discover them: it
> proves that a file was not altered, not that its content is true; and no software can make a file
> impossible to delete.
>
> It is free forever under the MIT licence, with no strings of any kind. If it is useful, please use it,
> pass it on, or host your own copy — the source is at https://github.com/digitalvalut/logos-protocol.
>
> Kind regards,
> [your name]

---

# Italiano

## In un paragrafo

Trascina un file qualsiasi — un documento, una foto, una registrazione, un video — in una sola pagina
web. Non viene caricato nulla: il file non lascia mai il dispositivo. In pochi secondi LOGOS produce un
*sigillo*: poche centinaia di byte di testo con le impronte crittografiche del file. Chiunque, in
seguito, avendo il file e il sigillo può dimostrare — con strumenti standard e senza dover credere a
LOGOS — che quel file è bit per bit quello sigillato. Un clic facoltativo scrive l'impronta nella
blockchain di Bitcoin, gratis, senza wallet e senza account: da quel momento la data non dipende più
dalla parola dell'autore.

## A chi serve

- **Giornalisti e redazioni** — stabilire che un girato o un documento esisteva in un certo stato a una
  certa ora, prima della pubblicazione e prima di qualunque contestazione. Una fonte può mandare prima
  l'impronta e il materiale solo dopo.
- **Avvocati e investigatori** — allegare un certificato d'integrità alla prova digitale nel momento
  della raccolta, e dimostrare in seguito che nulla è cambiato nella catena di custodia.
- **Difensori dei diritti umani e ONG** — sigillare una testimonianza sul telefono senza rete, senza
  account e senza lasciare traccia di un caricamento.
- **Chiunque** — un inquilino che fotografa un danno, un medico che conserva un referto, una persona che
  documenta un sopruso. Non chiede nulla: né registrazione, né pagamento, né competenze tecniche.

## Che cosa prova e che cosa non prova

Dichiarare i limiti è ciò che rende credibile il resto.

| Prova | Non prova |
|---|---|
| **Integrità** — che un file è esattamente quello sigillato, bit per bit. Assoluto e permanente. | **La verità del contenuto.** Una bugia sigillata resta una bugia: prova solo che nulla è stato alterato dopo. |
| **Priorità** — che il file esisteva entro una certa data, se il sigillo è stato pubblicato o ancorato allora. | **La data, da sola.** L'orologio di un dispositivo si cambia. Diventa prova quando l'impronta è resa pubblica o ancorata a Bitcoin. |
| **Attribuzione** — che una persona con nome e cognome ha fatto una dichiarazione precisa su quel file. | **L'identità.** LOGOS non verifica chi sia nessuno. |

Nessun software può rendere un file impossibile da cancellare: i dati sopravvivono perché esistono copie
in molte mani. LOGOS rende la **prova** abbastanza piccola da viaggiare ovunque e rende immediatamente
riconoscibile qualunque copia sostituita.

## Per chi valuta la parte tecnica

- **Impronte:** SHA3-512 (FIPS 202) e SHA-256, calcolate in locale a blocchi di 4 MB — un video da 50 GB
  non entra mai per intero in memoria.
- **Verifica indipendente:** lo SHA-256 di ogni sigillo si controlla con comandi già presenti in ogni
  sistema operativo (`sha256sum`, `shasum -a 256`, `certutil -hashfile`). LOGOS non serve mai più.
- **Marca temporale:** [OpenTimestamps](https://opentimestamps.org), standard aperto su Bitcoin. Viene
  inviata solo l'impronta di 32 byte a quattro calendari pubblici indipendenti; il file `.ots` prodotto è
  verificabile da chiunque con il client ufficiale, per sempre, senza LOGOS.
- **Rilascio postumo:** cifratura ChaCha20-Poly1305 (RFC 8439) e chiave divisa con lo schema di Shamir su
  GF(256): *k* custodi su *n* possono aprire, *k−1* non ottengono nulla. Il caveau cifrato può essere
  pubblicato subito, perché resta illeggibile finché i custodi non agiscono.
- **Nessun server, da nessuna parte.** Un solo file HTML, nessuna libreria, nessun tracciatore, nessuna
  statistica, nessuna chiamata di rete tranne il pulsante di ancoraggio premuto dall'utente.
- **La correttezza è collaudata, non dichiarata.** Le funzioni hash sono confrontate con le
  implementazioni di riferimento; la cifratura con il vettore ufficiale RFC 8439 e 200 verifiche
  incrociate con un'implementazione indipendente; la divisione della chiave sia per il recupero con *k*
  parti sia per la non-divulgazione con *k−1*.

## Disponibilità

Gratuito, licenza MIT, nessun account, nessuna pubblicità, niente da sbloccare. Si installa come app su
iPhone, Android, Windows, macOS e Linux e, una volta installato, **funziona senza alcuna connessione**.
Interfaccia in 13 lingue.

Ideato e creato dal **Dr. Giuseppe Falsone** per **DigitalValut**. © 2026 DigitalValut e il Team
DigitalValut. Donato all'umanità.

---

## Modello — da mandare a una redazione, a una ONG o a un avvocato

> **Oggetto:** Uno strumento gratuito per provare che una prova digitale non è stata alterata
>
> Gentile [nome],
>
> le scrivo a proposito di uno strumento gratuito e open source che potrebbe esserle utile: **LOGOS**
> (https://digitalvalut.github.io/logos-protocol/).
>
> Permette a chiunque di dimostrare che un file — un documento, una fotografia, una registrazione — non
> è stato modificato da un certo momento in poi e, con un clic facoltativo, di ancorare quel momento
> alla blockchain di Bitcoin, così che la data non dipenda più dalla parola di nessuno. Tutto viene
> calcolato sul dispositivo dell'utente: **nessun file viene mai caricato**, non c'è alcun account, alcun
> pagamento né alcun server.
>
> Due aspetti le interesseranno in particolare. Primo: la verifica non richiede il nostro strumento —
> lo SHA-256 contenuto in ogni prova si controlla con comandi già presenti in qualunque computer, quindi
> nulla poggia sulla fiducia verso di noi. Secondo: funziona offline, il che conta per chi documenta
> qualcosa dove non c'è connessione, o dove usarla è pericoloso.
>
> Offre anche un rilascio protetto per chi è in pericolo: un file può essere cifrato e la chiave divisa
> fra più persone fidate in paesi diversi, così da aprirsi solo se abbastanza di loro concordano che il
> momento è arrivato.
>
> Lo strumento è onesto sui propri limiti, e preferisco dichiararli io: prova che un file non è stato
> alterato, non che il suo contenuto sia vero; e nessun software può rendere un file impossibile da
> cancellare.
>
> È gratuito per sempre con licenza MIT, senza vincoli di alcun tipo. Se le è utile, lo usi, lo passi ad
> altri, oppure ne ospiti una propria copia — il codice è su
> https://github.com/digitalvalut/logos-protocol.
>
> Cordiali saluti,
> [suo nome]
