#!/bin/bash
# Passi 2-5 di android/RILASCIO.md in un solo comando, per il Mac che tiene la
# chiave. Esiste perche' ogni passo scritto a parte e' un passo che si salta:
# la JDK sbagliata (v65), il secondo file dimenticato (v61-v64), la firma senza
# --alignment-preserved. Qui ognuno di quegli errori ferma lo script invece di
# arrivare online. E si prende da solo quello che manca (JDK 21, strumenti
# Android) in cartelle dell'utente, senza password di amministratore: chi
# pubblica non deve saper installare niente.
#
# Uso:   bash tools/rilascio-android.sh
#
# La password della chiave la chiede apksigner e la digita una persona: lo
# script non la vede, non la salva, non la scrive da nessuna parte. Se esistono
# gli appunti privati del progetto, li apre perche' la si possa leggere li'.
# Lo script NON pubblica: prepara i due file sulla Scrivania e apre la pagina
# del rilascio. Pubblicare resta un gesto di chi decide.
set -euo pipefail

IMPRONTA='423e3094890bd7ee31e4438b687bf0ccdc41dba44a2f512eba27d7e533fee190'
RADICE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RADICE"
ARCH="$(uname -m)"   # arm64 o x86_64

N="$(sed -n 's/^ *versionCode \([0-9][0-9]*\).*/\1/p' android/app/build.gradle)"
[ -n "$N" ] || { echo "versionCode non trovato"; exit 1; }
grep -q "^const ANDROID_VERSION_CODE = $N;" modifica.js \
  || { echo "ANDROID_VERSION_CODE in modifica.js non e' $N: fermo."; exit 1; }
for l in en-US it-IT; do
  [ -s "fastlane/metadata/android/$l/changelogs/$N.txt" ] \
    || { echo "manca la nota di versione $l/$N.txt: fermo."; exit 1; }
done
echo "== Versione $N"

# ---- JDK 21 esatta. NON java_home -v 21: vuol dire «21 o piu'» (incidente v65).
e21(){ [ -x "$1/bin/java" ] && "$1/bin/java" -version 2>&1 | head -1 | grep -q '"21\.'; }
JAVA_HOME=""
for c in "${JAVA_HOME_21:-}" "$HOME/jdk21/Contents/Home" \
         $(/usr/libexec/java_home -V 2>&1 | awk '$1 ~ /^21\./ {print $NF}') \
         /Library/Java/JavaVirtualMachines/*/Contents/Home \
         "$HOME"/Library/Java/JavaVirtualMachines/*/Contents/Home \
         /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
         /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; do
  if [ -n "$c" ] && e21 "$c"; then JAVA_HOME="$c"; break; fi
done
if [ -z "$JAVA_HOME" ]; then
  # Temurin: la stessa distribuzione del controllo di riproducibilita' in CI.
  echo "== Scarico Java 21 (una volta sola, ~190 MB)..."
  A="$(echo "$ARCH" | sed 's/arm64/aarch64/;s/x86_64/x64/')"
  curl -fsSL -o "$HOME/jdk21.tar.gz" "https://api.adoptium.net/v3/binary/latest/21/ga/mac/$A/jdk/hotspot/normal/eclipse"
  rm -rf "$HOME/jdk21"; mkdir "$HOME/jdk21"
  tar -xzf "$HOME/jdk21.tar.gz" -C "$HOME/jdk21" --strip-components=1; rm -f "$HOME/jdk21.tar.gz"
  JAVA_HOME="$HOME/jdk21/Contents/Home"
  e21 "$JAVA_HOME" || { echo "Java 21 scaricata ma non funziona: fermo."; exit 1; }
fi
export JAVA_HOME
echo "== Java 21: $JAVA_HOME"

# ---- Strumenti Android: build-tools 35.0.0 esatti, come F-Droid.
SDK=""
for c in "${ANDROID_HOME:-}" "$HOME/Library/Android/sdk" "$HOME/android-sdk"; do
  if [ -n "$c" ] && [ -x "$c/build-tools/35.0.0/apksigner" ]; then SDK="$c"; break; fi
done
if [ -z "$SDK" ]; then
  T="$(find "$HOME" -maxdepth 7 -type f -path '*/build-tools/35.0.0/apksigner' 2>/dev/null | head -1 || true)"
  if [ -n "$T" ]; then SDK="$(dirname "$(dirname "$(dirname "$T")")")"; fi
fi
if [ -z "$SDK" ]; then
  echo "== Scarico gli strumenti Android (una volta sola, qualche minuto)..."
  SDK="$HOME/android-sdk"; mkdir -p "$SDK/cmdline-tools"
  TMPZ="$(mktemp -d)"
  curl -fsSL -o "$TMPZ/clt.zip" "https://dl.google.com/android/repository/commandlinetools-mac_${ARCH}-15859902_latest.zip"
  unzip -q "$TMPZ/clt.zip" -d "$TMPZ"
  rm -rf "$SDK/cmdline-tools/latest"; mv "$TMPZ/cmdline-tools" "$SDK/cmdline-tools/latest"
  (yes | "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" --licenses >/dev/null 2>&1) || true
  "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" "build-tools;35.0.0" "platforms;android-36" >/dev/null
fi
export ANDROID_HOME="$SDK"
BT="$SDK/build-tools/35.0.0"
[ -x "$BT/apksigner" ] || { echo "Strumenti Android non pronti in $SDK: fermo."; exit 1; }
echo "== Strumenti Android: $SDK"

# ---- La chiave: si cerca da sola. Prima quella dentro LOGOS-DA-SALVARE.
CHIAVI=()
while IFS= read -r f; do [ -n "$f" ] && CHIAVI+=("$f"); done < <(
  find "$HOME" -maxdepth 6 -type f \( -name '*.jks' -o -name '*.keystore' \) \
       -not -path '*/Library/*' -not -path '*/.*' -not -path "$RADICE/*" 2>/dev/null \
  | awk '{print (index($0,"LOGOS-DA-SALVARE")?0:1) "\t" $0}' | sort | cut -f2- || true)
KS=""
if [ "${#CHIAVI[@]}" -eq 1 ]; then
  KS="${CHIAVI[0]}"
elif [ "${#CHIAVI[@]}" -gt 1 ] && [[ "${CHIAVI[0]}" == *LOGOS-DA-SALVARE* ]]; then
  KS="${CHIAVI[0]}"
elif [ "${#CHIAVI[@]}" -gt 1 ]; then
  echo "== Ho trovato piu' chiavi. Scrivi il numero di quella di Logos e premi Invio:"
  select k in "${CHIAVI[@]}"; do if [ -n "$k" ]; then KS="$k"; break; fi; done
fi
if [ -z "$KS" ]; then
  echo "== Non trovo la chiave da solo: trascina qui il file della chiave e premi Invio"
  read -e KS; KS="${KS%\"}"; KS="${KS#\"}"; KS="${KS%\'}"; KS="${KS#\'}"; KS="${KS% }"
fi
[ -f "$KS" ] || { echo "File della chiave non trovato: $KS"; exit 1; }
echo "== Chiave: $KS"

# ---- Compilare due volte e confrontare (passo 3).
LAVORO="$(mktemp -d)"
GREZZO=android/app/build/outputs/apk/release/app-release-unsigned.apk
compila(){ (cd android && ./gradlew clean assembleRelease --no-build-cache --no-daemon -q); }
echo "== Compilo (1 di 2), qualche minuto..."; compila; cp "$GREZZO" "$LAVORO/primo.apk"
echo "== Compilo (2 di 2), per la prova di riproducibilita'..."; compila; cp "$GREZZO" "$LAVORO/secondo.apk"
A1="$(shasum -a 256 "$LAVORO/primo.apk" | cut -d' ' -f1)"
A2="$(shasum -a 256 "$LAVORO/secondo.apk" | cut -d' ' -f1)"
[ "$A1" = "$A2" ] || { echo "Le due compilazioni NON coincidono: non si pubblica."; exit 1; }
echo "== Riproducibile: $A1"

# ---- Firmare (passo 4). La password la scrive una persona, qui sotto.
APPUNTI="$(find "$HOME" -maxdepth 6 -type f -name 'MEMORIA-PROGETTO-PRIVATA.md' -not -path '*/Library/*' 2>/dev/null | head -1 || true)"
echo
echo "================================================================"
echo " Adesso serve la PASSWORD DELLA CHIAVE (non quella del Mac)."
if [ -n "$APPUNTI" ]; then
  echo " Ti apro gli appunti privati del progetto: e' scritta li'."
  open -e "$APPUNTI" || true
else
  echo " E' scritta negli appunti privati, nella cartella LOGOS-DA-SALVARE."
fi
echo " Scrivila a mano (mentre scrivi non si vede niente) e premi Invio."
echo " Non incollarla mai in una chat."
echo "================================================================"
FIRMATO="$LAVORO/DigitalValut-Logos-v$N.apk"
tentativi=0
until "$BT/apksigner" sign --alignment-preserved --ks "$KS" --ks-key-alias logos \
        --out "$FIRMATO" "$LAVORO/primo.apk"; do
  tentativi=$((tentativi+1))
  [ "$tentativi" -lt 3 ] || { echo "Password sbagliata tre volte: fermo. Nessun danno, si puo' rilanciare."; exit 1; }
  echo "Password non accettata, riprova."
done

"$BT/apksigner" verify --print-certs "$FIRMATO" | grep -qi "SHA-256 digest: $IMPRONTA" \
  || { echo "La firma NON e' della chiave di Logos: fermo, non pubblicare."; exit 1; }
voci(){ unzip -v "$1" | awk 'NR>3 && NF>7 {print $8,$7,$1}' | grep -v '^META-INF/' | sort; }
diff <(voci "$FIRMATO") <(voci "$LAVORO/primo.apk") >/dev/null \
  || { echo "La firma ha cambiato il contenuto: fermo."; exit 1; }
echo "== Firma giusta, contenuto intatto."

# ---- Preparare il rilascio (passo 5): DUE file, con e senza numero.
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
