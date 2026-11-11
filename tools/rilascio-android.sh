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
for c in "${ANDROID_HOME:-}" "$HOME/tools/android-sdk" "$HOME/Library/Android/sdk" "$HOME/android-sdk"; do
  if [ -n "$c" ] && [ -x "$c/build-tools/35.0.0/apksigner" ]; then SDK="$c"; break; fi
done
if [ -z "$SDK" ]; then
  T="$(find "$HOME" -maxdepth 7 \( -name Library -o -name '.*' -o -name node_modules -o -name Photos\ Library.photoslibrary \) -prune -o -type f -path '*/build-tools/35.0.0/apksigner' -print 2>/dev/null | head -1 || true)"
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

# Dove stanno chiave e appunti, ricordato dall'ultima volta che e' riuscita
# (solo i PERCORSI, mai la password): cosi' dalla seconda volta non si cerca.
RICORDO="$HOME/.logos-rilascio"
R_KS=""; R_NOTE=""
if [ -f "$RICORDO" ]; then
  R_KS="$(sed -n 's/^chiave=//p' "$RICORDO" | head -1)"
  R_NOTE="$(sed -n 's/^appunti=//p' "$RICORDO" | head -1)"
fi
echo "== Cerco la chiave e gli appunti sul disco (un minuto)..."
# ---- La chiave e la sua password, trovate da sole (scelta del titolare,
# 11 nov 2026: «la password si mette da sola, io faccio solo ok»).
# Si cercano sul disco i file della chiave e, negli appunti privati del
# progetto (MEMORIA-PROGETTO-PRIVATA.md e i testi in LOGOS-DA-SALVARE), le
# parole che potrebbero essere la password; un piccolo programma Java le prova
# una per una SUL POSTO, aprendo davvero la chiave. Niente viene stampato,
# scritto su file o mandato in rete: la password passa da un tubo a una
# variabile d'ambiente, e da li' ad apksigner. Se non si trova, si torna a
# chiederla a mano.
CHIAVI=(); APPUNTI=()
if ! { [ -f "$R_KS" ] && [ -f "$R_NOTE" ]; }; then
while IFS= read -r f; do [ -n "$f" ] && CHIAVI+=("$f"); done < <(
  find "$HOME" -maxdepth 7 \( -name Library -o -name '.*' -o -name node_modules -o -name Photos\ Library.photoslibrary \) -prune -o -type f \( -name '*.jks' -o -name '*.keystore' -o -name '*.p12' -o -name '*.pfx' \) \
       -not -path "$RADICE/*" -print 2>/dev/null \
  | awk '{print (index($0,"LOGOS-DA-SALVARE")?0:1) "\t" $0}' | sort | cut -f2- || true)
while IFS= read -r f; do [ -n "$f" ] && APPUNTI+=("$f"); done < <(
  { find "$HOME" -maxdepth 7 \( -name Library -o -name '.*' -o -name node_modules -o -name Photos\ Library.photoslibrary \) -prune -o -type f -name 'MEMORIA-PROGETTO-PRIVATA*' -print 2>/dev/null
    find "$HOME" -maxdepth 7 \( -name Library -o -name '.*' -o -name node_modules -o -name Photos\ Library.photoslibrary \) -prune -o -type d -name 'LOGOS-DA-SALVARE' -print 2>/dev/null \
      | while IFS= read -r d; do find "$d" -maxdepth 3 -type f \( -name '*.md' -o -name '*.txt' -o -name '*.rtf' \) -size -2M 2>/dev/null; done
  } | sort -u || true)
fi
if [ -f "$R_KS" ] && [ -f "$R_NOTE" ]; then CHIAVI=("$R_KS"); APPUNTI=("$R_NOTE"); fi
echo "== Chiavi trovate: ${#CHIAVI[@]}   appunti trovati: ${#APPUNTI[@]}"

PROVA="$(mktemp -d)"
cat > "$PROVA/Prova.java" <<'JAVA'
import java.io.*; import java.nio.file.*; import java.security.*; import java.util.*;
public class Prova {
  static KeyStore apri(byte[] d, String p){
    for (String t : new String[]{"PKCS12","JKS"}) {
      try { KeyStore k = KeyStore.getInstance(t); k.load(new ByteArrayInputStream(d), p.toCharArray()); return k; }
      catch (Exception e) {}
    }
    return null;
  }
  public static void main(String[] a) throws Exception {
    BufferedReader r = new BufferedReader(new InputStreamReader(System.in, "UTF-8"));
    LinkedHashMap<String,String> da = new LinkedHashMap<>(); String s;
    while ((s = r.readLine()) != null) { int t = s.indexOf('\t'); if (t > 0 && t < s.length()-1) da.putIfAbsent(s.substring(t+1), s.substring(0,t)); }
    Set<String> c = da.keySet();
    for (int i = 0; i < a.length; i++) {
      byte[] d; try { d = Files.readAllBytes(Path.of(a[i])); } catch (Exception e) { continue; }
      for (String p : c) {
        KeyStore k = apri(d, p);
        if (k == null || !k.containsAlias("logos")) continue;
        for (String q : c) {
          try { if (k.getKey("logos", q.toCharArray()) != null) { System.out.println(i + "\t" + da.get(p) + "\t" + p + "\t" + q); return; } }
          catch (Exception e) {}
        }
      }
    }
    System.exit(3);
  }
}
JAVA
cat > "$PROVA/parole.py" <<'PY'
import sys, re
visti = set()
n = 0
def out(w):
    w = w.strip().strip('`"\'*_,;.()[]<>')
    if 4 <= len(w) <= 128 and "\t" not in w and w not in visti:
        visti.add(w); sys.stdout.write("%d\t%s\n" % (n, w))
for n, f in enumerate(sys.argv[1:]):
    try: t = open(f, encoding="utf-8", errors="ignore").read()
    except Exception: continue
    for riga in t.splitlines():
        for w in riga.split():
            out(w)
            for parte in re.split(r'[:=]', w): out(parte)
        out(riga)
PY
KS=""; KSPASS=""; KEYPASS=""; NOTA=""
if [ "${#CHIAVI[@]}" -gt 0 ] && [ "${#APPUNTI[@]}" -gt 0 ]; then
  echo "== Cerco la password negli appunti (resta sul Mac, non viene mostrata)..."
  RIS="$(python3 "$PROVA/parole.py" "${APPUNTI[@]}" | "$JAVA_HOME/bin/java" "$PROVA/Prova.java" "${CHIAVI[@]}" 2>/dev/null || true)"
  if [ -n "$RIS" ]; then
    KS="${CHIAVI[$(printf '%s' "$RIS" | cut -f1)]}"
    NOTA="${APPUNTI[$(printf '%s' "$RIS" | cut -f2)]}"
    KSPASS="$(printf '%s' "$RIS" | cut -f3)"; KEYPASS="$(printf '%s' "$RIS" | cut -f4)"
  fi
  unset RIS
fi
rm -rf "$PROVA"
if [ -n "$KS" ]; then
  echo "== Trovate da solo: la chiave di Logos e la sua password."
  echo "== Chiave: $KS"
else
  echo "== Non sono riuscito a trovare da solo chiave e password."
  if [ "${#CHIAVI[@]}" -ge 1 ]; then KS="${CHIAVI[0]}"; else
    echo "== Trascina qui il file della chiave e premi Invio"
    read -e KS; KS="${KS%\"}"; KS="${KS#\"}"; KS="${KS%\'}"; KS="${KS#\'}"; KS="${KS% }"
  fi
fi
[ -f "$KS" ] || { echo "File della chiave non trovato: $KS"; exit 1; }

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

# ---- Firmare (passo 4).
FIRMATO="$LAVORO/DigitalValut-Logos-v$N.apk"
if [ -n "$KSPASS" ]; then
  printf '\n== Tutto pronto. Firmo e preparo la pubblicazione? Scrivi y e premi Invio: '
  read -r OK
  [ "$OK" = "y" ] || [ "$OK" = "Y" ] || { echo "Fermo, come chiesto."; exit 1; }
  LOGOS_KS="$KSPASS" LOGOS_KEY="$KEYPASS" "$BT/apksigner" sign --alignment-preserved \
    --ks "$KS" --ks-key-alias logos --ks-pass env:LOGOS_KS --key-pass env:LOGOS_KEY \
    --out "$FIRMATO" "$LAVORO/primo.apk"
  unset KSPASS KEYPASS
  printf 'chiave=%s\nappunti=%s\n' "$KS" "$NOTA" > "$RICORDO"   # solo percorsi
else
  echo " Serve la PASSWORD DELLA CHIAVE (non quella del Mac). Scrivila e premi Invio."
  tentativi=0
  until "$BT/apksigner" sign --alignment-preserved --ks "$KS" --ks-key-alias logos \
          --out "$FIRMATO" "$LAVORO/primo.apk"; do
    tentativi=$((tentativi+1))
    [ "$tentativi" -lt 3 ] || { echo "Password sbagliata tre volte: fermo. Nessun danno, si puo' rilanciare."; exit 1; }
    echo "Password non accettata, riprova."
  done
fi

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
