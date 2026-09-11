/* ============================================================================
   Il contratto fra la pagina e il telefono.

   La pagina chiama `AndroidCall.started()`, `AndroidRing.activity()` e
   compagni credendo che esistano. Non c'e' un banco di prova per il Java
   in questo progetto — niente dipendenze, niente JVM nei test — quindi
   l'unica cosa che si puo' fare da qui e' leggere i sorgenti e controllare
   che ogni promessa abbia la sua controparte: il metodo con l'annotazione
   giusta, il servizio nel manifest col tipo giusto, il permesso che quel
   tipo pretende, la stringa in tutte e due le lingue.

   Sono controlli STATICI, e lo dicono: dimostrano che il ponte c'e', non
   che il telefono suoni bene. Quello lo dicono solo due telefoni.
   Nati l'11 settembre 2026 con CallService e il ritmo adattivo.
   ========================================================================= */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const J = 'android/app/src/main/java/io/github/digitalvalut/logos/';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const MAIN = read(J + 'MainActivity.java');
const RING = read(J + 'RingService.java');
const CALL = read(J + 'CallService.java');
const MANIFEST = read('android/app/src/main/AndroidManifest.xml');
const APP = read('modifica.js');
const STR_EN = read('android/app/src/main/res/values/strings.xml');
const STR_IT = read('android/app/src/main/res/values-it/strings.xml');

/* un metodo esposto alla pagina: l'annotazione DEVE stare sulla riga prima,
   o Android lo nasconde in silenzio e la pagina trova `undefined` */
function exposed(src, bridgeClass, method){
  const cls = src.indexOf('public class ' + bridgeClass);
  assert.ok(cls > 0, bridgeClass + ' non esiste in MainActivity');
  const body = src.slice(cls);
  const re = new RegExp('@JavascriptInterface\\s*\\n\\s*public [\\w<>\\[\\]]+ ' + method + '\\(');
  return re.test(body);
}

test.describe('il telefono durante una chiamata: il ponte esiste davvero', () => {
  test('ogni metodo che la pagina chiama su AndroidCall e\' esposto', () => {
    for (const m of ['available', 'started', 'ended', 'setSpeaker', 'isSpeakerOn']){
      assert.ok(exposed(MAIN, 'CallBridge', m), 'AndroidCall.' + m + '() manca o non ha @JavascriptInterface');
      assert.ok(APP.includes('androidCall.' + m + '(') || APP.includes('AndroidCall.' + m + '('),
        'la pagina non usa ' + m + ': o e\' morto, o il test guarda la cosa sbagliata');
    }
    assert.ok(/addJavascriptInterface\(new CallBridge\(\), "AndroidCall"\)/.test(MAIN),
      'il ponte va montato sulla WebView col nome che la pagina cerca');
  });

  test('CallService mette il telefono in modalita\' telefonata e lo rimette com\'era', () => {
    assert.ok(/setMode\(AudioManager\.MODE_IN_COMMUNICATION\)/.test(CALL),
      'senza MODE_IN_COMMUNICATION niente cancellazione d\'eco hardware: e\' la causa n.1 dell\'audio cattivo');
    assert.ok(/requestAudioFocus\(/.test(CALL), 'senza il fuoco audio la musica di un\'altra app resta sopra la voce');
    assert.ok(/USAGE_VOICE_COMMUNICATION/.test(CALL), 'il fuoco va chiesto come voce, non come media');
    /* e si disfa: il contrario di ogni cosa fatta */
    const leave = CALL.slice(CALL.indexOf('static synchronized void leaveCallMode'));
    assert.ok(/abandonAudioFocus/.test(leave), 'a fine chiamata il fuoco va restituito');
    assert.ok(/setMode\(modeBefore >= 0 \? modeBefore : AudioManager\.MODE_NORMAL\)/.test(leave),
      'a fine chiamata il telefono torna nella modalita\' in cui era, non in una a caso');
    assert.ok(/onDestroy\(\)\s*\{[^}]*leaveCallMode/.test(CALL),
      'se Android uccide il servizio, il telefono non deve restare in modalita\' chiamata');
  });

  test('la strada dell\'audio: da Android 12 si sceglie il dispositivo, prima si usa il vivavoce', () => {
    assert.ok(/setCommunicationDevice\(/.test(CALL), 'su Android 12+ setSpeakerphoneOn e\' deprecato e su alcuni telefoni ignorato');
    assert.ok(/setSpeakerphoneOn\(on\)/.test(CALL), 'sotto Android 12 resta la via vecchia');
    assert.ok(/TYPE_BUILTIN_EARPIECE/.test(CALL) && /TYPE_BUILTIN_SPEAKER/.test(CALL));
  });

  test('il servizio in chiamata e\' nel manifest col tipo giusto, e i permessi che quel tipo pretende', () => {
    assert.match(MANIFEST, /<service\s+android:name="\.CallService"[^>]*android:foregroundServiceType="microphone\|camera"/,
      'senza il tipo microfono|fotocamera Android 14 toglie il microfono a schermo spento');
    assert.ok(MANIFEST.includes('android.permission.FOREGROUND_SERVICE_MICROPHONE'), 'il tipo microphone vuole il suo permesso o il servizio non parte (SecurityException)');
    assert.ok(MANIFEST.includes('android.permission.FOREGROUND_SERVICE_CAMERA'), 'idem per camera');
    assert.ok(MANIFEST.includes('android.permission.MODIFY_AUDIO_SETTINGS'), 'senza questo AudioManager rifiuta di cambiare strada');
    assert.ok(/FOREGROUND_SERVICE_TYPE_MICROPHONE/.test(CALL), 'startForeground deve dichiarare lo stesso tipo del manifest');
    assert.ok(/if \(video\) type \|= android\.content\.pm\.ServiceInfo\.FOREGROUND_SERVICE_TYPE_CAMERA/.test(CALL),
      'la fotocamera si dichiara solo in video: dichiararla in una vocale e\' chiedere un permesso che non serve');
  });

  test('le parole che Android tiene per se\' esistono in tutte e due le lingue', () => {
    for (const s of ['callAudioTitle', 'callVideoTitle', 'callBody', 'chCall', 'chCallWhy']){
      assert.ok(STR_EN.includes('name="' + s + '"'), s + ' manca in values/strings.xml');
      assert.ok(STR_IT.includes('name="' + s + '"'), s + ' manca in values-it/strings.xml');
      assert.ok(CALL.includes('R.string.' + s), s + ' esiste ma nessuno la usa');
    }
  });
});

test.describe('il ritmo adattivo dell\'ascolto a telefono chiuso', () => {
  /* Le costanti si leggono dal Java e la regola si rifa\' qui, uguale: cosi'
     un cambio di numero o di ordine delle marce si vede da questo lato. */
  /* ⚠️ Le finestre sono scritte come `3 * 60000`: la prima versione di questo
     lettore prendeva solo il `3`, e il test sul costo restava verde con una
     marcia veloce da un secondo per un'ora. L'ha scoperto il sabotaggio, non
     io. Si accettano numeri e prodotti, e basta: niente eval. */
  const num = name => {
    const m = RING.match(new RegExp('private static final long ' + name + ' = ([0-9 *]+);'));
    assert.ok(m, name + ' non trovata in RingService (o scritta in una forma che questo lettore non capisce)');
    return m[1].split('*').map(s => Number(s.trim())).reduce((a, b) => a * b, 1);
  };
  const FAST = num('POLL_FAST_MS'), NORMAL = num('POLL_MS'), SLOW = num('POLL_SLOW_MS');
  const FASTW = num('FAST_WINDOW_MS'), NORMALW = num('NORMAL_WINDOW_MS'), SLICE = num('SLICE_MS');

  test('tre marce, in ordine, e le finestre in ordine', () => {
    assert.ok(FAST < NORMAL && NORMAL < SLOW, 'veloce < normale < lenta, o il nome mente');
    assert.ok(FASTW < NORMALW, 'la finestra veloce sta dentro quella normale');
    assert.strictEqual(NORMAL, 45000, 'la marcia normale e\' quella misurata in CAPACITY.md; cambiarla e\' rifare quel conto');
    assert.ok(SLICE <= FAST, 'la fetta di sonno deve essere al massimo la marcia veloce, o quella marcia non esiste');
  });

  test('la regola: veloce subito dopo un\'attivita\', normale per un\'ora, lenta poi', () => {
    const body = RING.slice(RING.indexOf('static long pollIntervalFor'));
    assert.match(body, /if \(sinceActivityMs < FAST_WINDOW_MS\) return POLL_FAST_MS;/);
    assert.match(body, /if \(sinceActivityMs < NORMAL_WINDOW_MS\) return POLL_MS;/);
    assert.match(body, /return POLL_SLOW_MS;/);
    assert.match(body, /if \(sinceActivityMs < 0\) return POLL_MS;/, 'un orologio tornato indietro non deve scegliere la marcia lenta per sbaglio');
  });

  test('il ciclo dorme a fette e ricalcola, non dorme un intervallo intero', () => {
    const loop = RING.slice(RING.indexOf('worker = new Thread'));
    assert.ok(/Thread\.sleep\(SLICE_MS\)/.test(loop), 'dormire POLL_MS intero vuol dire che un\'attivita\' arrivata adesso aspetta fino a 90 s');
    assert.ok(!/Thread\.sleep\(POLL_MS\)/.test(loop));
    assert.ok(/currentPollInterval\(\)/.test(loop), 'la marcia va chiesta a ogni giro');
    assert.ok(/noteActivity\(this\);\s*\n\s*ring\(\);/.test(loop), 'una chiamata arrivata E\' attivita\': chi ha appena chiamato richiama');
  });

  test('costa MENO di prima, non di piu\' — il conto del commento rifatto qui', () => {
    /* un telefono con un'ora di attivita' al giorno e dieci scatti veloci */
    const prima = 86400000 / NORMAL;
    const dopo = (23 * 3600000) / SLOW + (1 * 3600000) / NORMAL + 10 * (FASTW / FAST);
    assert.ok(dopo < prima, 'il ritmo adattivo deve far risparmiare quota, non bruciarla: prima ' + Math.round(prima) + ', dopo ' + Math.round(dopo));
  });

  test('la pagina puo\' dire «e\' successo qualcosa», e lo dice nei momenti giusti', () => {
    assert.ok(exposed(MAIN, 'RingBridge', 'activity'), 'AndroidRing.activity() manca o non ha @JavascriptInterface');
    assert.ok(/RingService\.noteActivity\(MainActivity\.this\)/.test(MAIN.slice(MAIN.indexOf('public boolean watch('))),
      'consegnare l\'ascolto vuol dire che l\'app era aperta: e\' attivita\'');
    /* nella pagina: all'apertura di una conversazione e alla chiusura */
    const saluto = APP.slice(APP.indexOf('provaSaluto(1);'), APP.indexOf('provaSaluto(1);') + 200);
    assert.ok(/noteAndroidActivity\(\)/.test(saluto), 'una conversazione aperta deve accelerare l\'ascolto');
    const fine = APP.slice(APP.indexOf('function endSession()'), APP.indexOf('function endSession()') + 900);
    assert.ok(/noteAndroidActivity\(\)/.test(fine), '«ho appena chiuso con Mario e mi richiama» e\' IL caso da rendere veloce');
    assert.ok(/typeof androidRing\.activity !== 'function'\) return;/.test(APP), 'un ponte vecchio senza activity() non deve far esplodere la pagina');
  });
});
