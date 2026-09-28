# TLA+ — il rinnovo del lasciapassare e la ripresa delle chiamate

*In English, briefly:* Tamarin and ProVerif in this folder check what an attacker can
learn or forge. This model checks something they cannot: **timing**. It describes how a
live call renews its TURN credentials (over the data channel) and how a dropped call is
repaired (over the relay), together, with the real timeouts of the app, and TLC explores
every interleaving. On 28 Sep 2026 it found two defects in 4.61; 4.62 fixes both, and the
model of 4.62 passes.

---

Tamarin e ProVerif, qui accanto, rispondono alla domanda «cosa può leggere o falsificare
un avversario». Questo modello risponde a un'altra, che quelli non vedono: **il tempo**.
Descrive insieme due cose che l'app fa durante una chiamata sul ponte:

- **il rinnovo del lasciapassare** (`renewIceNow`, `onIceRenewOffer`, `onIceRenewAnswer`):
  ogni ~4 minuti, sul canale dati, uno dei due lati propone credenziali TURN nuove;
- **la ripresa** (`startRepair`, `repairAsOfferer`, `scheduleNextRepair`): se la rete
  cade, un'offerta nuova passa dal relay, con un numero limitato di giri.

Con i tempi veri dell'app (ritiro, attesa massima di chi risponde, intervallo fra i giri,
numero di giri), TLC prova **tutte** le combinazioni di eventi entro l'orizzonte del
modello: ritardi dei messaggi, lentezza delle credenziali, la rete che cade in qualunque
istante.

## Le promesse controllate

| promessa | significa |
|---|---|
| `MaiArresaSenzaProvare` | se l'app chiude la chiamata perché «non è stato possibile riprenderla», almeno un'offerta di ripresa è partita davvero |
| `MaiSessioniDiverse` | a bocce ferme, i due lati sono sulla stessa sessione ICE |
| `TettoScritture` | le offerte scritte sul relay restano sotto il tetto dell'intera conversazione |

## Cosa ha trovato (28 settembre 2026) e com'è stato corretto (4.62)

1. **Arrendersi senza provare.** Se la rete cadeva mentre un rinnovo aspettava la sua
   risposta, la connessione restava in `have-local-offer`: ogni giro di ripresa la trovava
   occupata, non offriva niente, ma contava. Tre giri, sette-nove secondi, chiamata chiusa
   con zero tentativi veri. Confermato anche sul codice vero prima di correggerlo.
   **Correzione:** il giro di ripresa ritira subito un rinnovo a metà (la sua risposta
   viaggiava sul canale dati, morto con la rete), e un giro che non ha potuto offrire non
   conta.
2. **Due sessioni diverse.** La regola «chi risponde in ritardo non risponde» (6 s, contro
   i 15 del ritiro) non contava il viaggio dei messaggi: offerta in ritardo di 4 s,
   credenziali in 6, risposta in 5, e la risposta arrivava nell'istante del ritiro.
   **Correzione:** ritiro a 30 s, e un test che tiene almeno 20 s di margine.

## Rifarlo

```sh
# TLA+ Tools v1.7.4 (rilascio ufficiale), Java 11 o piu' recente
curl -sSLO https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar
echo "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88  tla2tools.jar" | shasum -a 256 -c
prova-formale/tla/controlla.sh "$PWD/tla2tools.jar"
```

`controlla.sh` confronta ogni modello con il suo esito **atteso**: il modello della 4.61
**deve fallire** (è la prova dei due difetti), quello della 4.62 **deve passare**. Gira
anche nel workflow manuale «prova formale» di GitHub. Ogni verifica dura pochi secondi.

## I limiti, detti

- È un modello: il tempo è a secondi interi, e i ritardi di rete sono ipotesi dichiarate
  nei `.cfg` (canale dati fino a 5 s, credenziali fino a 6 s nel caso peggiore).
- Un solo incidente per conversazione e al più due rinnovi: basta a far emergere le
  interazioni, non a descrivere una chiamata di un'ora.
- Il modello è stato scritto dal progetto e non è ancora stato revisionato da altri,
  come gli altri modelli di questa cartella.
