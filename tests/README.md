# I controlli automatici

Si lanciano così, dalla cartella dell'app:

```bash
node --test
```

Senza argomenti: Node trova da solo i file qui dentro.

Non serve installare niente. Nessun `npm install`, nessuna cartella
`node_modules`, nessuna libreria di test: si usa solo quello che Node ha già
dentro. Questa è una scelta, non una pigrizia — il punto di forza più solido di
quest'app è che **non carica una sola riga di codice scritta da altri**, e una
rete di sicurezza che tirasse dentro trecento pacchetti per verificarlo sarebbe
un modo bizzarro di proteggerlo.

Partono anche da soli, su GitHub, a ogni pubblicazione.

## Cosa c'è dentro

**`checks.test.js`** — i controlli che non hanno bisogno di far girare l'app:

- ogni file è sintatticamente valido
- ogni elemento che il codice cerca (`$('...')`) **esiste davvero** nella pagina
- nessun elemento è dichiarato due volte
- tutte e 13 le lingue ci sono, nessuna riga manca, nessuna è di troppo, nessuna
  è vuota
- ogni frase che il codice chiede è stata scritta
- un segnaposto tipo `{nome}` presente in una lingua c'è in tutte
- `APP_VERSION` in `modifica.js` e `CACHE` in `modifica-sw.js` **coincidono**
- l'elenco degli indirizzi validi nell'app **coincide** con quello del Worker
- la pagina non carica niente da fuori (nessun CDN)
- la politica di sicurezza non è stata allentata
- nessuno stile inline, che la politica bloccherebbe
- la cache offline contiene tutti i file e nessun file inesistente

**`logic.test.js`** — le decisioni vere dell'app, interrogate direttamente.
L'app viene caricata **intera** e poi le si fanno domande. Non c'è nessuna
finzione sulle funzioni: quello che gira qui è lo stesso codice che gira su un
telefono.

Copre in particolare `busyWithSomeone()`, cioè «sono libero di essere
raggiunto?»: la funzione che ha risposto male per giorni rendendo il telefono
irraggiungibile da tutte le strade insieme, senza che nulla sullo schermo lo
dicesse.

**`fake-browser.js`** — un browser finto in centocinquanta righe, scritto a mano.
La soluzione consueta sarebbe `jsdom`: tre megabyte e diverse centinaia di
pacchetti. Questo file si legge tutto d'un fiato, che è lo stesso metro con cui
è tenuta l'app. Legge le classi iniziali dalla pagina vera, perché `class="hide"`
sulla schermata della chat è il modo in cui l'app capisce che non sei in una
conversazione.

## Come si verifica che i controlli servano davvero

Un test che non può fallire è un ornamento. Ogni controllo qui dentro è stato
verificato **rimettendo dentro il guasto vero** che doveva intercettare e
controllando che scattasse: indirizzo sordo, contatti sordi, connessione morta
che blocca per sempre, falso messaggio di errore, indirizzi non più accettati,
app installata scambiata per browser, versione sfasata, traduzione mancante,
segnaposto perso, stile inline, CDN esterno, politica allentata, errore di
sintassi, cache che cita un file inesistente.

Se aggiungi un controllo, fai la stessa cosa: rompi la cosa a mano e guarda che
diventi rosso. Se resta verde, il controllo non sta guardando dove credi.

## Quello che questi controlli **non** possono vedere

Da dire chiaramente, perché una rete di sicurezza di cui ci si fida troppo è
peggio di nessuna rete:

- **le chiamate vere.** Audio, video, altoparlante, cambio fotocamera: servono un
  telefono e un microfono veri. Il guasto del vivavoce e quello del cambio
  fotocamera non sarebbero stati presi da qui.
- **l'aspetto.** Il pulsante «riattacca» diventato invisibile perché il riquadro
  era collassato a zero: nessun controllo qui misura una pagina disegnata.
- **iPhone.** Nessuna di queste prove gira su Safari o su iOS.

Per quelle tre cose serve ancora provare l'app con le mani, su un telefono vero.
