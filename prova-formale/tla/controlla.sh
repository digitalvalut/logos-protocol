#!/bin/sh
# Ogni modello TLA+ contro il suo esito ATTESO. Il modello della 4.61 DEVE
# fallire (e' la prova dei due difetti che ha trovato); quello della 4.62 DEVE
# passare. Se un giorno il primo passa o il secondo fallisce, qualcosa si e'
# mosso: e' esattamente cio' che questo controllo serve a dire.
#   prova-formale/tla/controlla.sh percorso/tla2tools.jar     (Java 11+)
set -u
JAR="$1"
cd "$(dirname "$0")"
sbagliati=0
prova(){
  modello=$1; cfg=$2; atteso=$3
  out=$(java -XX:+UseParallelGC -cp "$JAR" tlc2.TLC -workers auto -deadlock -config "$cfg" "$modello" -metadir "${TMPDIR:-/tmp}/tlc-$$-$cfg" 2>&1)
  echo "$out" > "$cfg.log"
  if echo "$out" | grep -q "No error has been found"; then avuto=verde
  elif echo "$out" | grep -q "is violated"; then avuto="violata:$(echo "$out" | sed -n 's/.*Invariant \([A-Za-z]*\) is violated.*/\1/p' | head -1)"
  else avuto=errore; fi
  if [ "$avuto" = "$atteso" ]; then echo "ok   $modello $cfg -> $avuto"
  else echo "NO   $modello $cfg -> $avuto (atteso $atteso)"; sbagliati=$((sbagliati+1)); fi
}
prova RinnovoERipresa.tla          RinnovoERipresa.cfg                     violata:MaiArresaSenzaProvare
prova RinnovoERipresa.tla          RinnovoERipresa-tutto-lento.cfg         violata:MaiSessioniDiverse
prova RinnovoERipresaCorretto.tla  RinnovoERipresaCorretto.cfg             verde
prova RinnovoERipresaCorretto.tla  RinnovoERipresaCorretto-tutto-lento.cfg verde
exit $sbagliati
