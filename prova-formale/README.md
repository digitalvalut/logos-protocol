# La prova formale del protocollo di Logos

*Formal analysis of the Logos signalling protocol — English summary at the end.*

Questa cartella contiene **la descrizione completa del protocollo** con cui due
telefoni si trovano attraverso il relay (`PROTOCOLLO.md`), e **i modelli** con
cui quel protocollo è stato passato a due strumenti di verifica formale:

- **Tamarin** (`tamarin/*.spthy`) — lo strumento usato per analizzare 5G,
  WPA2, Signal
- **ProVerif** (`proverif/*.pv`) — lo strumento usato per TLS 1.3 e Signal

Un test controlla che, *in quella situazione*, l'app faccia la cosa giusta.
Questi strumenti ragionano su **tutte** le sequenze possibili di messaggi che
un avversario che controlla il relay può costruire, e o dimostrano che una
proprietà vale sempre, o mostrano la sequenza che la rompe.

## Cosa dicono, oggi (14 settembre 2026, versione 4.39)

| rito | proprietà | esito | strumento |
|---|---|---|---|
| invito a sei cifre | il relay non legge le SDP | ✅ dimostrata | Tamarin |
| invito a sei cifre | codice segreto ⇒ nessuno in mezzo | ✅ dimostrata | Tamarin |
| invito a sei cifre, fino alla 4.38 | codice **noto** ⇒ l'intruso esiste | ✅ traccia trovata — chiuso nella 4.39 | Tamarin |
| invito a sei cifre | tre parole uguali ⇒ nessuno in mezzo | ✅ dimostrata | Tamarin |
| **invito dalla 4.39** (solo link/QR) | nessuno in mezzo **anche con le sei cifre pubbliche** | ✅ dimostrata | Tamarin |
| chiamata all'indirizzo | offerta e risposta segrete | ✅ dimostrata | ProVerif |
| chiamata all'indirizzo | chi risponde è il proprietario, a *quella* chiamata, una volta sola | ✅ dimostrata | ProVerif |
| chiamata all'indirizzo | il relay non può sostituire la chiave | ✅ dimostrata | ProVerif |
| chiamata all'indirizzo | segretezza in avanti | ❌ falsa dopo la rivelazione della privata — **per costruzione**, dichiarato nel codice | ProVerif |
| contatti in rubrica, fino alla 4.37 | segreta contro chi conosce le impronte | ❌ **attacco trovato** → riparato nella 4.38 | Tamarin |
| contatti in rubrica, dalla 4.38 | segretezza, autenticazione, offerta davvero da A — con le impronte pubbliche | ✅ dimostrata ×4 | ProVerif |

Tre cose sono uscite da questo lavoro e sono state corrette nella 4.38:
la chiave del ricollegamento fra contatti (derivava dalle impronte, che ogni
contatto conosce), il verso delle buste (la stessa chiave sigillava offerta e
risposta senza dire quale fosse), e — per strada — le lettere che si vedevano
solo riaprendo l'app. La 4.39 ha chiuso l'ultima nota: l'invito non si detta
più a voce, e il segreto lungo del link sigilla la busta. Il dettaglio è in
`PROTOCOLLO.md` §6 e §8.

## Cosa NON dicono

- **Non è una verifica indipendente.** I modelli sono stati scritti dal
  progetto a partire dal codice. Se un passaggio è descritto male, la
  dimostrazione è vera su un protocollo che non esiste. Per questo sono qui:
  perché chiunque possa leggerli, farli girare e dire dove sbagliano. Una
  revisione esterna è stata chiesta.
- **Non coprono** DTLS/WebRTC (si assume corretto), il limitatore di
  tentativi del relay, l'app Android, la cache locale. Elenco in
  `PROTOCOLLO.md` §7.
- **Tamarin non termina** sul rito dell'indirizzo (né nel modello fedele con
  Diffie-Hellman né in quello leggero) e sul rito dei contatti 4.38 con
  l'equazione DH: le risposte su quei riti vengono da ProVerif. Chi sa
  scrivere una lemma sorgente migliore è il benvenuto.
- Il modello non misura probabilità: le tre parole hanno ≈25 bit, il codice
  a sei cifre 20; qui contano come «uguale/diverso».

## Da dove cominciare, se siete un revisore

`PER-IL-REVISORE.md`: ogni promessa di Logos con accanto il punto del codice,
la lemma che la copre, il test che la sorveglia e come verificarla da soli —
e i limiti dichiarati con la prova che sono limiti. È pensato per un
pomeriggio di lavoro, e finisce con le cinque domande a cui vorremmo una
risposta.

`PP-APP.md`: l'autovalutazione contro il profilo NIAP per le app
(Common Criteria) — requisito per requisito, con i «no» scritti per esteso.
Non è una certificazione: è la mappa di quanto manca per una.

## Farli girare

Su GitHub: **Actions → «prova formale» → Run workflow** (manuale, ~1 ora; i
risultati sono nei log e nell'artefatto). In locale, con Tamarin 1.12 + Maude
3.5 e ProVerif 2.05 installati:

```bash
proverif prova-formale/proverif/logos-indirizzo.pv
tamarin-prover --prove prova-formale/tamarin/logos-invito.spthy
```

Ogni lemma dice nel commento accanto cosa ci si aspetta: **dimostrata**,
oppure **deve fallire** (una traccia d'attacco attesa, o un limite dichiarato).
Se un giorno una «deve fallire» passa, o il modello è sbagliato o il rito è
cambiato: in entrambi i casi è una notizia.

---

## English summary

This folder holds the full description of Logos's signalling protocol
(`PROTOCOLLO.md`, Italian) and the models used to check it with **Tamarin**
and **ProVerif**. Results as of 4.39 (14 Sep 2026): the address-call
handshake is proven secret and injectively authenticated against a relay
adversary (ProVerif); the six-digit invite was proven safe only while the code was
secret, so since 4.39 invites are link/QR only and the 128-bit secret they carry
seals the envelope — proven safe even with the digits public (Tamarin); the
three-word SAS is proven to detect a man-in-the-middle when the link itself
leaks; the pre-4.38 contact reconnect was **broken** against a
former mutual contact (Tamarin found the trace) and the 4.38 redesign is
proven ×4 (ProVerif). No forward secrecy on addresses, by construction and
declared. **The models were written by the project and have not been
independently reviewed** — that is the next step, and the reason they are
published: run them, read them, tell us where they are wrong. Tamarin does not
terminate on the DH-based models; ProVerif answers there.
