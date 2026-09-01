# QUANDO QUALCOSA VA STORTO — manuale d'emergenza

*Ultimo aggiornamento: 2 settembre 2026.*

Questo file esiste perché chi lo legge possa **agire senza capire tutto**, magari
mesi dopo, magari essendo un'altra persona o un'altra AI. Ogni scheda dice: come
te ne accorgi, come capisci qual è, cosa fai subito, cosa fai dopo.

⚠️ **Regola numero uno, imparata a caro prezzo il 31 agosto e il 1 settembre:
registra lo stato PRIMA di toccare qualsiasi cosa.** Quattro disservizi su
quattro sono stati diagnosticati in fretta solo dove esisteva una misura del
"prima". Senza, un guasto sembra normale.

```bash
curl -s -H "Origin: https://digitalvalut.github.io" \
  https://digitalvalut-turn.burbeng78.workers.dev/
```
Deve tornare **200** e contenere `username` dentro `iceServers`. Qualsiasi altra
cosa è un guasto.

---

## 1. Il relay non risponde più / le chiamate non si collegano

**COME TE NE ACCORGI** — Due dispositivi non si trovano più, da nessuna strada.
Il comando qui sopra non torna 200.

**DIAGNOSI**

| risposta | significa |
|---|---|
| `500 TURN not configured` | **è sparita una variabile del worker.** Vedi §2 |
| `403 Forbidden` | stai chiamando da un'origine non consentita (non è un guasto) |
| `429 too many attempts` | limite di frequenza: qualcuno sta martellando, o sei tu |
| `503 storage unavailable` | KV di Cloudflare in difficoltà: non dipende da noi |
| nessuna risposta | worker non pubblicato, o Cloudflare giù |

**CONTENIMENTO IMMEDIATO** — Torna all'ultima versione buona:
```bash
npx wrangler rollback 8008555c-21a3-4442-ad77-c469f7214b01 --name digitalvalut-turn -y
```
Poi riverifica col comando in testa. **Ha funzionato tutte e quattro le volte,
disservizio ~90 secondi.**

**COSA CONTINUA A FUNZIONARE INTANTO** — Le conversazioni **già aperte non
passano dal relay** e non se ne accorgono. Si rompe solo il *trovarsi*.

---

## 2. Sparisce una variabile pubblicando il worker

**STORIA** — Successo **quattro volte** (31 ago ×2 con `wrangler deploy`, 1 set ×2
via API). Ogni volta si perdeva **esattamente un binding**: `TURN_KEY_ID`,
l'unico di tipo `plain_text`. I segreti veri non si sono **mai** persi.

⚠️ **RISOLTO ALLA RADICE IL 1 SET 2026:** l'autore ha convertito `TURN_KEY_ID` in
**Secret**. I segreti sopravvivono a ogni pubblicazione (4 deploy falliti su 4 lo
dimostrano). **Verificato: zero binding `plain_text` rimasti.** Questa scheda
resta come storia; se un giorno qualcuno riaggiunge una variabile in chiaro,
il problema torna.

**TRAPPOLA DA CONOSCERE** — `TURN_KEY_ID` **non compariva in nessuna delle due
API delle impostazioni**. Si vedeva solo interrogando la *versione*:
```
GET /accounts/{ACC}/workers/scripts/{S}/versions/{version_id}  →  resources.bindings
```
È per questo che nessuno capiva cosa sparisse.

---

## 3. Email di Cloudflare: quota KV al 50% / 100%

**COME TE NE ACCORGI** — Email automatica, oppure connessioni che smettono di
funzionare a metà giornata e riprendono dopo mezzanotte UTC.

**DIAGNOSI — la prima domanda è: letture o scritture?** Sono quote diverse
(100.000 contro 1.000) e hanno cause diverse.

| se sono le **letture** | causa quasi certa: troppi utenti con l'app aperta, o polling troppo fitto |
| se sono le **scritture** | causa quasi certa: molte connessioni, oppure inviti lasciati aperti (si rinfrescano per 15 minuti) |

⚠️ **Il 1 settembre 2026 l'avviso al 50% NON era un attacco: era il polling
normale.** Un dispositivo fermo con l'app aperta faceva 132 letture/minuto.
Sceso a 16 con la v31. **Prima di dare la colpa a un attacco, misura il costo
del comportamento normale.** Vedi `CAPACITY.md`.

**CONTENIMENTO** — Non c'è un interruttore. La quota si azzera da sola a
mezzanotte UTC. Se serve subito: il piano a 5 $/mese si attiva in un minuto.

**DOPO** — Se ricapita **senza che si stia provando l'app**, allora sono utenti
veri o abuso: guarda il grafico per rotta nel pannello Cloudflare.

---

## 4. Qualcuno martella il relay

**COME TE NE ACCORGI** — Grafico delle richieste che sale senza utenti nuovi;
molti `429` nei log.

**COSA È GIÀ AUTOMATICO** — Limiti per indirizzo IP su letture (450/min),
scritture (30/min) e credenziali (120/min), più un tetto globale per copia del
worker. Chi supera prende `429` e il client rallenta da solo.

⚠️ **COSA NON È PROTETTO** — **Abuso distribuito su molti indirizzi.** I contatori
vivono nella memoria di ogni copia del worker, e Cloudflare ne fa girare molte.
*Misurato: 60 scritture da 10 connessioni parallele → 57 passate; le stesse 60 da
una connessione sola → 30 passate, 30 respinte.*

**SE SUCCEDE DAVVERO** — Nel pannello Cloudflare, sezione Security: si può
aggiungere una regola di rate limiting **al bordo**, che blocca prima ancora di
arrivare al nostro codice. È il posto giusto per fermare un abuso distribuito, e
non richiede di ripubblicare niente.

---

## 5. Una versione nuova rompe l'app

**STORIA** — Successo con la **v17** (due relay) e la **v28** (correzione H-01):
entrambe con i test verdi, entrambe ritirate in giornata.

**COME TE NE ACCORGI** — L'autore prova sui suoi due dispositivi e non si
collegano. **È così che sono stati trovati quasi tutti i difetti seri: usando
l'app, non leggendo i test.**

**CONTENIMENTO** — Pubblica una versione che riporta il codice a com'era:
```bash
git revert <commit>      # oppure ripristina i punti di chiamata a mano
```
Poi ricompila, firma, e pubblica **subito**: chi ha installato la versione rotta
non riceve niente in automatico.

**DOPO, OBBLIGATORIO** — Chiediti **quale test sarebbe dovuto diventare rosso e
non lo è**. Nella v28 esistevano sei test nuovi, tutti veri e tutti inutili
contro quel difetto: mancava l'unico che contava. Scrivilo, poi verifica che
diventi rosso rimettendo il difetto.

---

## 6. Un test verde che non prova niente

**STORIA** — Successo almeno quattro volte: il finto browser senza IndexedDB, il
finto magazzino che non si svuotava leggendo, il conteggio dei test con `grep` che
contava anche i titoli, i sei test della v28.

**SEGNALE** — Un test che non è mai stato visto **rosso** non è un test.

**REGOLA** — Ogni protezione: scrivi il test → guardalo verde → **rompi apposta
il codice** → guardalo rosso → ripristina → riguardalo verde. Se non diventa
rosso, il test è decorativo.

---

## 7. Come si pubblica il worker (procedura buona)

⚠️ **`wrangler deploy` NON è la strada** — vedi §2 per la storia.

**La ricetta verificata (1 set 2026):**
`PUT /accounts/{ACC}/workers/scripts/digitalvalut-turn` multipart, con
`metadata = {main_module:"worker.js", compatibility_date:"2024-11-01", bindings:[...]}`,
dove i binding si **ricostruiscono da quelli della versione viva**: `kv_namespace`
col suo `namespace_id`, i segreti come `{"type":"inherit"}`. Token OAuth in
`~/Library/Preferences/.wrangler/config/default.toml`.

**Prima e dopo, sempre**: il `curl` in testa a questo file.

---

## 8. I test "falliscono" ma non hai toccato niente

**Controlla la versione di Node.** Con Node 18 tre test del worker falliscono con
`crypto is not defined` (`crypto` globale esiste da Node 19). **Non è una
regressione.**

```bash
~/.nvm/versions/node/v22.21.0/bin/node --test --test-force-exit tests/logic.test.js …
```

⚠️ **`--test-force-exit` è obbligatorio**: la suite finisce tutti i test e poi
resta appesa su un handle aperto. Senza, non vedi mai il riepilogo.

⚠️ **Non contare i test con `grep -c "^ok"`**: conta anche i titoli dei gruppi.
Usa la riga `# pass` del corridore.
