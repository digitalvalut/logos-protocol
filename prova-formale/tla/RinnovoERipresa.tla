------------------------------ MODULE RinnovoERipresa ------------------------------
(* Il rinnovo del lasciapassare del ponte (dentro una chiamata, sul canale dati)
   e la ripresa dopo una caduta (dal relay), modellati insieme — perche' e'
   insieme che possono pestarsi i piedi.

   Fonte: modifica.js 4.61 — renewIceNow / onIceRenewOffer / onIceRenewAnswer
   (righe ~3618-3682), startRepair / scheduleNextRepair / repairAsOfferer
   (righe ~4720-4942). A e' il lato che guida (repairBase.offerer), B l'altro.

   Il tempo e' un intero, in secondi. Ogni timer scatta esattamente alla sua
   scadenza: `Tick` non puo' scavalcarne nessuna. Ogni messaggio del canale
   dati arriva in una finestra [invio, invio + DC_MAX]; ogni attesa di rete
   (chiedere credenziali fresche) dura fra 0 e FETCH_MAX.

   Le due domande:
   1. MaiArresaSenzaProvare — se l'app chiude la chiamata perche' «non e' stato
      possibile riprenderla», almeno un'offerta di ripresa e' partita davvero.
   2. MaiSessioniDiverse — a bocce ferme (niente in volo, niente in corso), i
      due lati sono sulla stessa sessione ICE. E' la promessa della regola
      «chi risponde in ritardo non risponde» (6 s contro 15 s).            *)

EXTENDS Integers, FiniteSets

CONSTANTS
    ROLLBACK,     \* ICE_RENEW_ROLLBACK_MS / 1000  = 15
    RISPOSTA_MAX, \* ICE_RENEW_RISPOSTA_MAX_MS / 1000 = 6
    GAP,          \* REPAIR_RETRY_GAP_MS / 1000 = 3
    MAX_ROUNDS,   \* REPAIR_MAX_ROUNDS = 3
    MAX_TOTAL,    \* REPAIR_MAX_TOTAL = 12
    ROUND,        \* REPAIR_ROUND_MS / 1000 = 60
    DC_MAX,       \* ritardo massimo di un messaggio sul canale dati (ipotesi)
    FETCH_MAX,    \* durata massima di una richiesta di credenziali (ipotesi)
    T_MAX         \* orizzonte del modello

NONE == -1
NESSUNA == [sess |-> -1, arr |-> -1, pronta |-> -1]   \* nessuna offerta in attesa da B

VARIABLES
    t,            \* orologio
    rete,         \* "su" | "giu"
    sigA,         \* "stable" | "have-local-offer"
    sessA, sessB, \* sessione ICE in uso da ciascun lato
    offertaA,     \* sessione offerta da A e non ancora risposta, o NONE
    ritiroA,      \* scadenza del ritiro (rollback) di A, o NONE
    volo,         \* messaggi sul canale dati: [tipo, sess, da, entro]
    pendB,        \* offerta arrivata a B mentre chiede credenziali: [sess, arr, pronta] o NONE
    rip,          \* stato della ripresa di A: "ferma" | "attende" | "in-corso" | "aspetta-risposta"
    ripQuando,    \* quando parte il prossimo giro, o quando finisce quello in corso
    rounds, total, offerte,
    resa, ripresa

vars == <<t, rete, sigA, sessA, sessB, offertaA, ritiroA, volo, pendB,
          rip, ripQuando, rounds, total, offerte, resa, ripresa>>

Init ==
    /\ t = 0 /\ rete = "su"
    /\ sigA = "stable" /\ sessA = 0 /\ sessB = 0
    /\ offertaA = NONE /\ ritiroA = NONE
    /\ volo = {} /\ pendB = NESSUNA
    /\ rip = "ferma" /\ ripQuando = NONE
    /\ rounds = 0 /\ total = 0 /\ offerte = 0
    /\ resa = FALSE /\ ripresa = FALSE

(* ---------------- il rinnovo, sul canale dati ---------------- *)

\* renewIceNow: A e' 'stable' e connesso; restartIce + offerta; il ritiro fra ROLLBACK s.
RinnovoParte ==
    /\ rete = "su" /\ ~resa /\ sigA = "stable" /\ offertaA = NONE /\ rip = "ferma"
    /\ sessA + 1 <= 2                      \* due rinnovi bastano a vedere tutto
    /\ offertaA' = sessA + 1
    /\ sigA' = "have-local-offer"
    /\ ritiroA' = t + ROLLBACK
    /\ \E d \in 0..DC_MAX :
          volo' = volo \cup {[tipo |-> "offerta", sess |-> sessA + 1, entro |-> t + d]}
    /\ UNCHANGED <<t, rete, sessA, sessB, pendB, rip, ripQuando, rounds, total, offerte, resa, ripresa>>

\* L'offerta arriva a B (onIceRenewOffer): se B e' 'stable' parte a chiedere credenziali fresche.
OffertaArrivaAB(m) ==
    /\ m \in volo /\ m.tipo = "offerta" /\ rete = "su"
    /\ volo' = volo \ {m}
    /\ IF pendB = NESSUNA
         THEN \E f \in 0..FETCH_MAX : pendB' = [sess |-> m.sess, arr |-> t, pronta |-> t + f]
         ELSE UNCHANGED pendB
    /\ UNCHANGED <<t, rete, sigA, sessA, sessB, offertaA, ritiroA, rip, ripQuando, rounds, total, offerte, resa, ripresa>>

\* B ha le credenziali: se e' passato troppo, lascia perdere; se no applica e risponde.
BRisponde ==
    /\ pendB # NESSUNA /\ t = pendB.pronta
    /\ pendB' = NESSUNA
    /\ IF t - pendB.arr > RISPOSTA_MAX \/ rete = "giu"
         THEN UNCHANGED <<sessB, volo>>
         ELSE /\ sessB' = pendB.sess
              /\ \E d \in 0..DC_MAX :
                    volo' = volo \cup {[tipo |-> "risposta", sess |-> pendB.sess, entro |-> t + d]}
    /\ UNCHANGED <<t, rete, sigA, sessA, offertaA, ritiroA, rip, ripQuando, rounds, total, offerte, resa, ripresa>>

\* La risposta arriva ad A (onIceRenewAnswer): conta solo se A e' ancora in attesa di quella.
RispostaArrivaAdA(m) ==
    /\ m \in volo /\ m.tipo = "risposta" /\ rete = "su"
    /\ volo' = volo \ {m}
    /\ ritiroA' = NONE
    /\ IF sigA = "have-local-offer" /\ offertaA = m.sess
         THEN /\ sessA' = m.sess /\ sigA' = "stable" /\ offertaA' = NONE
         ELSE UNCHANGED <<sessA, sigA, offertaA>>
    /\ UNCHANGED <<t, rete, sessB, pendB, rip, ripQuando, rounds, total, offerte, resa, ripresa>>

\* Il ritiro: se nessuno ha risposto in ROLLBACK secondi, A torna 'stable' sulla sessione di prima.
Ritiro ==
    /\ ritiroA # NONE /\ t = ritiroA
    /\ ritiroA' = NONE
    /\ IF sigA = "have-local-offer"
         THEN /\ sigA' = "stable" /\ offertaA' = NONE
         ELSE UNCHANGED <<sigA, offertaA>>
    /\ UNCHANGED <<t, rete, sessA, sessB, volo, pendB, rip, ripQuando, rounds, total, offerte, resa, ripresa>>

(* ---------------- la caduta e la ripresa, dal relay ---------------- *)

\* La rete cade: il canale dati muore con i suoi messaggi, la connessione va a 'failed'
\* e A parte con la ripresa (onConnectionStateChange -> startRepair).
Caduta ==
    /\ rete = "su" /\ ~resa /\ rip = "ferma"
    /\ rete' = "giu" /\ volo' = {}
    /\ rip' = "attende" /\ ripQuando' = t
    /\ rounds' = 0
    /\ UNCHANGED <<t, sigA, sessA, sessB, offertaA, ritiroA, pendB, total, offerte, resa, ripresa>>

\* Un giro di startRepair per chi offre: prima le credenziali fresche (0..FETCH_MAX s),
\* poi rounds++ e total++, e repairAsOfferer — che torna SUBITO, senza scrivere niente,
\* se la connessione non e' 'stable' (riga ~4887). Poi scheduleNextRepair.
GiroDiRipresa ==
    /\ rip = "attende" /\ t = ripQuando /\ ~resa
    /\ \E f \in 0..FETCH_MAX :
       LET r2 == rounds + 1
           t2 == total + 1
       IN
       /\ rounds' = r2 /\ total' = t2
       /\ IF t2 > MAX_TOTAL
            THEN /\ resa' = TRUE /\ rip' = "ferma" /\ ripQuando' = NONE /\ UNCHANGED offerte
            ELSE IF r2 <= MAX_ROUNDS /\ sigA = "stable"
                   THEN \* l'offerta parte davvero: il giro dura fino a ROUND s, o finche' risponde
                        /\ offerte' = offerte + 1
                        /\ rip' = "aspetta-risposta" /\ ripQuando' = t + f + ROUND
                        /\ UNCHANGED resa
                   ELSE \* nessuna offerta: scheduleNextRepair decide se riprovare o arrendersi
                        /\ UNCHANGED offerte
                        /\ IF r2 >= MAX_ROUNDS
                             THEN /\ resa' = TRUE /\ rip' = "ferma" /\ ripQuando' = NONE
                             ELSE /\ rip' = "attende" /\ ripQuando' = t + f + GAP /\ UNCHANGED resa
    /\ UNCHANGED <<t, rete, sigA, sessA, sessB, offertaA, ritiroA, volo, pendB, ripresa>>

\* L'offerta di ripresa trova risposta: la connessione torna su (rinegoziata da capo,
\* quindi le due sessioni ripartono allineate) e i giri per incidente si azzerano.
RipresaRiesce ==
    /\ rip = "aspetta-risposta" /\ t < ripQuando
    /\ rete' = "su" /\ ripresa' = TRUE
    /\ rip' = "ferma" /\ ripQuando' = NONE /\ rounds' = 0
    /\ sessA' = 10 /\ sessB' = 10 /\ sigA' = "stable" /\ offertaA' = NONE
    /\ ritiroA' = NONE /\ pendB' = NESSUNA
    /\ UNCHANGED <<t, volo, total, offerte, resa>>

\* Il giro scade senza risposta: si ritira l'offerta e si torna in coda (o ci si arrende).
GiroScade ==
    /\ rip = "aspetta-risposta" /\ t = ripQuando
    /\ IF rounds >= MAX_ROUNDS
         THEN /\ resa' = TRUE /\ rip' = "ferma" /\ ripQuando' = NONE
         ELSE /\ rip' = "attende" /\ ripQuando' = t + GAP /\ UNCHANGED resa
    /\ UNCHANGED <<t, rete, sigA, sessA, sessB, offertaA, ritiroA, volo, pendB, rounds, total, offerte, ripresa>>

(* ---------------- il tempo ---------------- *)

Scadenze == { m.entro : m \in volo }
            \cup (IF ritiroA # NONE THEN {ritiroA} ELSE {})
            \cup (IF pendB # NESSUNA THEN {pendB.pronta} ELSE {})
            \cup (IF rip \in {"attende", "aspetta-risposta"} THEN {ripQuando} ELSE {})

Tick ==
    /\ t < T_MAX
    /\ \A s \in Scadenze : s > t          \* nessuna scadenza lasciata indietro
    /\ t' = t + 1
    /\ UNCHANGED <<rete, sigA, sessA, sessB, offertaA, ritiroA, volo, pendB, rip, ripQuando, rounds, total, offerte, resa, ripresa>>

Next ==
    \/ RinnovoParte
    \/ \E m \in volo : OffertaArrivaAB(m)
    \/ BRisponde
    \/ \E m \in volo : RispostaArrivaAdA(m)
    \/ Ritiro
    \/ Caduta
    \/ GiroDiRipresa
    \/ RipresaRiesce
    \/ GiroScade
    \/ Tick

Spec == Init /\ [][Next]_vars

(* ---------------- le promesse ---------------- *)

MaiArresaSenzaProvare == resa => offerte > 0

Fermo == volo = {} /\ pendB = NESSUNA /\ sigA = "stable" /\ rete = "su"
MaiSessioniDiverse == Fermo => sessA = sessB

TettoScritture == offerte <= MAX_TOTAL
===================================================================================
