#!/bin/bash
# Passi 2-5 di android/RILASCIO.md in un solo comando, per il Mac che tiene la
# chiave. Esiste perche' ogni passo scritto a parte e' un passo che si salta:
# la JDK sbagliata (v65), il secondo file dimenticato (v61-v64), la firma senza
# --alignment-preserved. Qui ognuno di quegli errori ferma lo script invece di
# arrivare online.
#
# Uso, dalla cartella del progetto:   bash tools/rilascio-android.sh
#
# La password della chiave la chiede apksigner e la digita una persona: lo
# script non la vede, non la salva, non la scrive da nessuna parte.
# La macchina NON pubblica: prepara i due file sulla Scrivania e apre la
# pagina del rilascio. Pubblicare resta un gesto di chi decide.
set -euo pipefail

IMPRONTA='423e3094890bd7ee31e4438b687bf0ccdc41dba44a2f512eba27d7e533fee190'
RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"

N="$(sed -n 's/^ *versionCode \([0-9][0-9]*\).*/\1/p' android/app/build.gradle)"
[ -n "$N" ] || { echo "versionCode non trovato"; exit 1; }
grep -q "^const ANDROID_VERSION_CODE = $N;" modifica.js \
  || { echo "ANDROID_VERSION_CODE in modifica.js non e' $N: fermo."; exit 1; }
for l in en-US it-IT; do
  [ -s "fastlane/metadata/android/$l/changelogs/$N.txt" ] \
    || { echo "manca la nota di versione $l/$N.txt: fermo."; exit 1; }
done
echo "== Versione $N"

# JDK 21 esatta. NON java_home -v 21: vuol dire «21 o piu'» (incidente v65).
# Si cerca in tutti i posti dove una JDK finisce su un Mac (Temurin, Homebrew,
# quella dentro Android Studio) e si tiene la prima che SI DICHIARA 21.
e21(){ [ -x "$1/bin/java" ] && "$1/bin/java" -version 2>&1 | head -1 | grep -q '"21\.'; }
JAVA_HOME=""
for c in "${JAVA_HOME_21:-}" \
         $(/usr/libexec/java_home -V 2>&1 | awk '$1 ~ /^21\./ {print $NF}') \
         /Library/Java/JavaVirtualMachines/*/Contents/Home \
         "$HOME"/Library/Java/JavaVirtualMachines/*/Contents/Home \
         /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
         /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
         "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
         "$HOME/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
  if [ -n "$c" ] && e21 "$c"; then JAVA_HOME="$c"; break; fi
done
if [ -z "$JAVA_HOME" ]; then
  echo "JDK 21 non trovata. Su questo Mac ci sono queste Java:"
  /usr/libexec/java_home -V 2>&1 | sed 's/^/   /'
  for c in "/Applications/Android Studio.app/Contents/jbr/Contents/Home" /opt/homebrew/opt/openjdk*/libexec/openjdk.jdk/Contents/Home; do
    [ -x "$c/bin/java" ] && echo "   $c: $("$c/bin/java" -version 2>&1 | head -1)"
  done
  echo "Copia questo messaggio a chi ti aiuta."
  exit 1
fi
export JAVA_HOME
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
BT="$ANDROID_HOME/build-tools/35.0.0"
[ -x "$BT/apksigner" ] || { echo "build-tools 35.0.0 non trovati in $ANDROID_HOME. Ci sono:"; ls "$ANDROID_HOME/build-tools" 2>&1 | sed 's/^/   /'; exit 1; }
export ANDROID_HOME
echo "== JDK: $JAVA_HOME"

LAVORO="$(mktemp -d)"
GREZZO=android/app/build/outputs/apk/release/app-release-unsigned.apk
compila(){ (cd android && ./gradlew clean assembleRelease --no-build-cache --no-daemon -q); }

echo "== Compilo (1 di 2)..."; compila; cp "$GREZZO" "$LAVORO/primo.apk"
echo "== Compilo (2 di 2), per la prova di riproducibilita'..."; compila; cp "$GREZZO" "$LAVORO/secondo.apk"
A="$(shasum -a 256 "$LAVORO/primo.apk" | cut -d' ' -f1)"
B="$(shasum -a 256 "$LAVORO/secondo.apk" | cut -d' ' -f1)"
[ "$A" = "$B" ] || { echo "Le due compilazioni NON coincidono: non si pubblica."; exit 1; }
echo "== Riproducibile: $A"

FIRMATO="$LAVORO/DigitalValut-Logos-v$N.apk"
echo "== Firma: trascina qui il file della chiave (da LOGOS-DA-SALVARE) e premi Invio"
read -e KS; KS="${KS%\"}"; KS="${KS#\"}"; KS="${KS%\'}"; KS="${KS#\'}"; KS="${KS% }"
[ -f "$KS" ] || { echo "File della chiave non trovato: $KS"; exit 1; }
"$BT/apksigner" sign --alignment-preserved --ks "$KS" --ks-key-alias logos \
  --out "$FIRMATO" "$LAVORO/primo.apk"

"$BT/apksigner" verify --print-certs "$FIRMATO" | grep -qi "SHA-256 digest: $IMPRONTA" \
  || { echo "La firma NON e' della chiave di Logos: fermo, non pubblicare."; exit 1; }
voci(){ unzip -v "$1" | awk 'NR>3 && NF>7 {print $8,$7,$1}' | grep -v '^META-INF/' | sort; }
diff <(voci "$FIRMATO") <(voci "$LAVORO/primo.apk") >/dev/null \
  || { echo "La firma ha cambiato il contenuto: fermo."; exit 1; }
echo "== Firma giusta, contenuto intatto."

DEST="$HOME/Desktop/Logos-v$N"; mkdir -p "$DEST"
cp "$FIRMATO" "$DEST/DigitalValut-Logos-v$N.apk"
cp "$FIRMATO" "$DEST/DigitalValut-Logos.apk"
pbcopy < "fastlane/metadata/android/en-US/changelogs/$N.txt"
COMMIT="$(git rev-parse HEAD)"
open "$DEST"
open "https://github.com/digitalvalut/logos-protocol/releases/new?tag=android-$N&target=$COMMIT&title=v$N"
cat <<FINE

FATTO. Ultimo passo, nella pagina GitHub che si e' aperta:
  1. nel riquadro grande della descrizione premi Cmd+V (il testo e' gia' copiato)
  2. trascina DENTRO tutti e DUE i file della cartella Logos-v$N sulla Scrivania
  3. premi «Publish release»
FINE
