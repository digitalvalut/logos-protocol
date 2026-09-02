# DOVE SIAMO — leggi questo per primo

*Aggiornato: 2 settembre 2026, ~02:20. Se stai riprendendo il filo — persona
nuova, AI nuova, o te stesso fra tre mesi — parti da qui.*

---

## In una riga

Logos funziona, è pubblicato, e nelle ultime 48 ore è passato da **avere un buco
per cui una persona sola poteva spegnerlo a tutti** ad avere difese misurate sul
servizio vivo. Il limite che resta è **economico, non tecnico**: il piano gratuito
regge dell'ordine di 50-100 conversazioni al giorno nel mondo.

## Versioni vive adesso

| | versione | dove |
|---|---|---|
| app Android | **v31 / 3.95** | [GitHub Releases](https://github.com/digitalvalut/logos-protocol/releases/latest) |
| app web | **3.95** | https://digitalvalut.github.io/logos-protocol/ |
| relay | pubblicato 2 set 2026, ~00:10 | `digitalvalut-turn` |

**Salute:** tutte le rotte verificate 200/404/403 come atteso, credenziali del
ponte presenti.
**Test:** 297 su 297 verdi — ⚠️ **con Node 22**, non col Node 18 di sistema
(vedi `INCIDENTS.md` §8).
**Build:** riproducibile, impronta di firma `423e3094…fee190` invariata da sempre.
**Spesa Cloudflare:** 0,00 $.

---

## Fatto nelle ultime 48 ore

- **v29** — ritirata la correzione H-01 della v28: rompeva le sei cifre digitate a
  mano. H-01 **torna aperto**, e serve un disegno diverso.
- **v30** — l'avviso "mai verificato" non scatta più fra due sconosciuti senza nome.
- **v31** — **quattro buchi chiusi.** `/wake` e `/letter` in scrittura erano
  **senza alcun limite**: 1.000 richieste e Logos si spegneva per tutti.
  Raccolta lettere da 41 operazioni a 11. Limiti contati in **costo**, non in
  chiamate. Polling del client **8,2 volte più leggero** (132 → 16 letture/min a
  riposo): capacità da ~6 a ~52 utenti.
- **worker, 2 set** — **nessun guasto dello storage esce più come `500`.**
  Erano 11 operazioni su 13 scoperte. Un `500` fa riprovare il client e moltiplica
  il carico proprio quando bisognerebbe rallentare; ora `429` o `503`.
- **`TURN_KEY_ID` convertito in Secret dall'autore** → la fragilità che ha causato
  **quattro disservizi** in due giorni non esiste più.
- **Documentati**: `CAPACITY.md` (quanto regge, con i numeri misurati),
  `INCIDENTS.md` (cosa fare quando va storto), `05-RISCHI-E-LIMITI.md`.
- **notte del 2 set, analisi statica (§59)** — due difetti trovati **leggendo, non
  usando l'app**, entrambi corretti e sabotati:
  1. **Una diagnostica che mentiva.** `__trickleTypes` registrava il tipo
     dell'indirizzo di rete *prima* di provare ad applicarlo: la riga che si
     guarda per prima quando due telefoni non si collegano dichiarava trovate
     strade mai entrate. ⚠️ **Nessun test poteva prenderlo — nel finto browser
     `addIceCandidate` riusciva sempre. Quarta bugia del banco di prova**, corretta.
  2. **Tempesta di ritentativi.** `Math.random` compariva *una volta sola in tutto
     il file*, per un id: nessuna attesa aveva un grano di caso. Il limite del
     relay è una soglia e scatta per tutti insieme, quindi cento dispositivi
     aspettavano tutti esattamente 4.000 ms e ripartivano **nello stesso
     istante**. Ora ±25% di caso (media invariata) e raddoppio a ogni rifiuto di
     fila fino a 20 s, azzerato al primo giro riuscito.
  - **288 test verdi** (erano 281). 2 test preesistenti aggiornati: fissavano i
    millisecondi esatti, che il caso ora fa variare — *provare la garanzia, non il
    meccanismo*. Verificato col sabotaggio che restano più forti di prima.

## Rischi attivi, in ordine

1. ⚠️ **Abuso distribuito non è protetto.** I contatori vivono nella memoria di
   ogni copia del worker, e Cloudflare ne fa girare molte. *Misurato: 60 scritture
   da 10 connessioni → 57 passate; le stesse da una sola → 30.* Il rimedio non è
   nel nostro codice: è una regola di rate limiting **al bordo**, dal pannello
   Cloudflare.
2. ⚠️ **La quota giornaliera non ha un tetto reale.** Il tetto globale delle
   scritture (40/min) vale 57 volte la quota di 1.000/giorno: smorza un picco, non
   protegge la giornata. Farlo bene richiede Durable Objects o il piano a pagamento.
3. **H-01 aperto**: le sei cifre restano l'unico segreto (~20 bit se dette a voce).
   Serve un disegno in cui l'invito sia pubblicato in due forme — una per chi arriva
   dal link, una per chi digita a mano.
4. **H-03, M-03, M-04** dell'audit esterno: ancora aperti.
5. **La cronologia locale è in chiaro** (L-01): la cassaforte col PIN è stata tolta
   su richiesta dell'autore il 31 agosto.

## Cosa NON è stato fatto, di proposito

Il protocollo di ristrutturazione chiedeva anche di spezzare `modifica.js` in
moduli (`src/core/…`). **Non fatto, e la scelta è deliberata:** in due giorni
questo progetto ha avuto quattro disservizi e due versioni ritirate. Riscrivere
l'impalcatura di ciò che finalmente funziona è il modo più rapido per aggiungerne
un quinto. Lo dice il protocollo stesso: *non riscrivere ciò che funziona;
preferisci il blast radius minore.* Da riprendere quando ci saranno alcune
settimane di quiete, non ora.

---

## ⚠️ IN ATTESA DI PROVA SUL TELEFONO — v32 FIRMATA, NON PUBBLICATA

APK sul Desktop: **`DigitalValut-Logos-v32-DA-PROVARE.apk`**. Impronta di firma
invariata, quindi si installa sopra la v31 senza perdere niente.

**Non pubblicare finché l'autore non ha provato.** Cosa contiene:
1. **Squillo ad app chiusa acceso** — la riga commentata da fine agosto.
   ⚠️ **Due rischi noti**: (a) la v5 con questi stessi permessi non si installava
   su alcuni telefoni (causa mai riprodotta, androidx.core l'ipotesi migliore, oggi
   assente); (b) la promessa *"anche ad app chiusa"* compare a schermo **appena la
   riga esiste**, e non è ancora stata vista mantenere. **Se non squilla, la riga
   torna commentata**: meglio nessuna promessa che una falsa.
2. **Ascolto nativo a 45 s invece di 15** — a 15 s costava 5.760 letture/giorno per
   utente 24 ore su 24 (17 utenti in tutto); a 45 s ne costa 1.920 (52 utenti,
   quanto oggi). Prezzo: fino a 45 s prima che squilli.
3. **Polling dell'indirizzo a 60 s** solo quando il servizio nativo sorveglia
   davvero. La rubrica **non** è sorvegliata dal servizio, quindi resta com'era.
4. **Saluto ritentato una volta** se il primo invio fallisce.
5. **Vocale con tetto di 2 minuti**, che manda quello che c'è invece di buttarlo.

## SERVE UNA TUA DECISIONE (2 cose, nessuna urgente)

~~1. Il saluto che può perdersi~~ — **fatto nella v32.**
~~2. Nessun tetto al messaggio vocale~~ — **fatto nella v32** (2 minuti, non 5).

1. **Estendere l'ascolto nativo anche ai contatti.** Oggi il servizio sorveglia solo
   gli slot dell'indirizzo, non la rubrica: chi ti richiama da un contatto salvato
   non ti fa squillare ad app chiusa. Tecnicamente basta aggiungere le chiavi alla
   lista, **senza toccare il Java** — ma moltiplicherebbe il costo sempre-acceso per
   il numero di contatti (5 contatti ≈ 5× le letture, 24 ore su 24). **Da misurare
   prima, non da dare per fatto.**

## PROSSIMA AZIONE

**Misurare quante scritture consuma davvero una connessione vera.**

È l'unica voce grossa ancora marcata SCONOSCIUTO in `CAPACITY.md`, ed è quella da
cui dipende il numero di conversazioni al giorno — cioè se e quando servirà il
piano a 5 $/mese, che è una decisione dell'associazione e non tecnica.

**Come:** collegare i due dispositivi dell'autore e contare le richieste
`PUT /mailbox/…` nel pannello Cloudflare (Workers → digitalvalut-turn →
Metrics), prima e dopo. Cinque minuti di lavoro, e chiude il modello di capacità.

**Prima di quello, però:** l'autore deve confermare che **la v31 si collega ancora**
sui suoi due dispositivi. Nessun test automatico può sostituire quella prova — è
così che sono stati trovati quasi tutti i difetti seri di questo progetto.
