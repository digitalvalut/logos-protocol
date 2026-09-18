#!/usr/bin/env bash
# Confronta l'esito di Verifpal con quello ATTESO, riga per riga.
# Un «FAIL» atteso e' un limite dichiarato (o un attacco noto): se un giorno
# PASSA, il modello o il rito sono cambiati e va capito — rosso anche quello.
set -u
vp="$1"; rosso=0
for m in prova-formale/verifpal/*.vp; do
  att="${m%.vp}.atteso"
  echo "=== $m"
  "$vp" verify "$m" > "$m.log" 2>&1; tail -n 40 "$m.log"
  while read -r esito query; do
    [ -z "$esito" ] && continue
    if grep -i -q "^\s*$esito.*$query" "$m.log"; then echo "  ok      $esito  $query"
    else echo "  DIVERSO atteso $esito: $query"; rosso=1; fi
  done < "$att"
done
exit $rosso
