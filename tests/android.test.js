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
const HTML = read('modifica.html');
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

  test('v47: la chiamata parte dall\'altoparlante, e nella vocale e\' il sensore di prossimita\' a portarla all\'orecchio', () => {
    /* 14 set 2026, due telefoni veri: la vocale partiva dall'auricolare e chi
       teneva il telefono in mano non sentiva («voce bassa», «non mi sente»);
       la video, dall'altoparlante, andava. */
    const enter = CALL.slice(CALL.indexOf('static synchronized void enterCallMode'), CALL.indexOf('static synchronized void leaveCallMode'));
    assert.ok(/setSpeaker\(c, true\)/.test(enter), 'il punto di partenza e\' l\'altoparlante, per tutte e due le chiamate');
    assert.ok(!/setSpeaker\(c, video\)/.test(enter), 'non piu\' «auricolare se vocale»');
    assert.ok(/if \(!video\) startProximity\(c\)/.test(enter), 'nella vocale si accende il sensore');
    assert.ok(/Sensor\.TYPE_PROXIMITY/.test(CALL) && /registerListener\(proximity/.test(CALL), 'il sensore di prossimita\' va ascoltato');
    assert.ok(/PROXIMITY_SCREEN_OFF_WAKE_LOCK/.test(CALL), 'all\'orecchio lo schermo si spegne, o la guancia preme i tasti');
    assert.ok(/if \(manualRoute \|\| videoCall\) return;/.test(CALL), 'il pulsante toccato a mano vince sul sensore');
    const leave = CALL.slice(CALL.indexOf('static synchronized void leaveCallMode'));
    assert.ok(/stopProximity\(\)/.test(leave), 'a fine chiamata il sensore si spegne e il blocco si rilascia');
    assert.ok(/userSetSpeaker\(MainActivity\.this, on\)/.test(MAIN), 'il pulsante della pagina passa da userSetSpeaker, che segna la scelta manuale');
    assert.ok(/dvSpeakerRoute/.test(MAIN) && /window\.dvSpeakerRoute = function/.test(APP), 'quando il sensore cambia strada, la pagina lo viene a sapere');
    assert.ok(/android\.permission\.WAKE_LOCK/.test(MANIFEST), 'il blocco di prossimita\' vuole WAKE_LOCK');
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
    /* dalla v49 la fetta e' un wait sul lucchetto (cosi' il filo tirato la interrompe), non un sleep */
    assert.ok(/lucchetto\.wait\(SLICE_MS\)/.test(loop), 'dormire POLL_MS intero vuol dire che un\'attivita\' arrivata adesso aspetta fino a 90 s');
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

/* =========================================================================
   v49 — il filo aperto (16 set 2026): il campanello tiene un WebSocket con il
   relay (classe Filo, scritta a mano) e si sveglia quando il relay lo tira;
   le tre marce restano come rete di sicurezza.
   ========================================================================= */
test.describe('v49: il filo aperto nel campanello', () => {
  const RING = read(J + 'RingService.java');
  const FILO = read(J + 'Filo.java');

  test('il filo e\' scritto a mano: nessuna libreria WebSocket, solo le prese di Java', () => {
    assert.ok(!/okhttp|java_websocket|org\.java_websocket|nv-websocket|tyrus|jetty/i.test(FILO + RING), 'niente codice di altri');
    assert.ok(/SSLSocketFactory\.getDefault\(\)/.test(FILO) && /Sec-WebSocket-Key/.test(FILO) && /Sec-WebSocket-Version: 13/.test(FILO));
    assert.ok(/258EAFA5-E914-47DA-95CA-C5AB0DC85B11/.test(FILO) && /stretta di mano sbagliata/.test(FILO), 'la risposta del server va verificata (Sec-WebSocket-Accept), non creduta');
    assert.ok(/mask\[i & 3\]/.test(FILO), 'le cornici dal client sono mascherate, come vuole il protocollo');
    assert.ok(/MAX_FRAME_BYTES = 4096/.test(FILO) && /frammentazione non ammessa/.test(FILO), 'una cornice lunga o frammentata non e\' del relay');
  });

  test('il filo e\' un campanello, non una posta: dal telefono parte solo «ping», dal relay conta solo «busta»', () => {
    assert.ok(/mandaTesto\("ping"\)/.test(FILO));
    assert.ok(/s\.contains\("\\"busta\\""\)\) ascoltatore\.busta\(\)/.test(FILO));
    const invii = (FILO.match(/mandaTesto\(/g) || []).length;
    assert.strictEqual(invii, 2, 'una definizione e una sola chiamata (il ping): niente altro parte dal telefono');
  });

  test('la linea si tiene viva con un ping ogni 4 minuti, e un ping senza risposta chiude il filo', () => {
    assert.ok(/PING_EVERY_MS = 4 \* 60000/.test(FILO) && /READ_TIMEOUT_MS = \(int\) PING_EVERY_MS/.test(FILO));
    assert.ok(/catch \(java\.net\.SocketTimeoutException t\)/.test(FILO) && /if \(attesaPong\) throw new IOException/.test(FILO));
  });

  test('il campanello: con il filo aperto bussa di rado, senza filo come prima; il filo tirato sveglia subito', () => {
    assert.ok(/POLL_WITH_WIRE_MS = 10 \* 60000/.test(RING));
    assert.ok(/long intervallo = filiAperti > 0 \? POLL_WITH_WIRE_MS : currentPollInterval\(\);/.test(RING), 'senza filo: le tre marce di sempre');
    assert.ok(/if \(sveglia \|\| now - lastPoll >= intervallo \|\| lastPoll == 0\)/.test(RING), 'il filo tirato salta l\'attesa');
    assert.ok(/lucchetto\.wait\(SLICE_MS\)/.test(RING) && /lucchetto\.notifyAll\(\)/.test(RING), 'e non aspetta la fine della fetta di sonno');
    assert.ok(/noteActivity\(RingService\.this\)/.test(RING), 'una busta arrivata dal filo e\' attivita\': la marcia svelta');
  });

  test('se il relay non ha il filo (404) o il filo cade, si riprova con calma e si continua a bussare', () => {
    assert.ok(/WIRE_RETRY_UNAVAILABLE_MS = 10 \* 60000/.test(RING) && /contains\("404"\)/.test(RING));
    assert.ok(/WIRE_RETRY_MIN_MS = 5000/.test(RING) && /WIRE_RETRY_MAX_MS = 60000/.test(RING) && /attesa\[0\] \* 2/.test(RING));
    assert.ok(/filiAperti = Math\.max\(0, filiAperti - 1\)/.test(RING), 'un filo caduto non lascia il conto sballato');
    const stop = RING.slice(RING.indexOf('private void stopEverything'));
    assert.ok(/fermaFili\(\)/.test(stop), 'a servizio fermato i fili si chiudono');
  });

  test('l\'indirizzo del filo nasce dalla base della cassetta, e solo da una base sicura', () => {
    assert.ok(/static String wireUrlFor\(String base, String key\)/.test(RING));
    assert.ok(/if \(!isSafeBase\(base\)\) return null;/.test(RING.slice(RING.indexOf('static String wireUrlFor'))));
    assert.ok(/"wss:\/\/" \+ host \+ "\/ascolta\/" \+ key/.test(RING));
  });
});

test.describe('v48: il campanello non resta «gia\' in squillo» per sempre, e dice cosa fa', () => {
  const RING = read(J + 'RingService.java');
  test('uno squillo scade da solo dopo 90 s: chi apre l\'app da solo non zittisce il telefono per sempre', () => {
    /* 16 set 2026, dal registro del relay: sveglia in 0,5 s, busta vista, nessun
       suono — `ringing` acceso da una prova precedente e mai spento */
    assert.ok(/RING_STALE_MS = 90_000/.test(RING));
    assert.ok(/private boolean staSquillando\(\)/.test(RING) && /System\.currentTimeMillis\(\) - ringingSince > RING_STALE_MS/.test(RING));
    assert.ok(/if \(!staSquillando\(\)\)/.test(RING), 'il ciclo chiede «sto DAVVERO squillando?», non legge la spia grezza');
    assert.ok(!/if \(!ringing\) \{/.test(RING), 'la spia grezza non decide piu\'');
    const ring = RING.slice(RING.indexOf('private void ring()'), RING.indexOf('private void ring()') + 120);
    assert.ok(/ringingSince = System\.currentTimeMillis\(\)/.test(ring), 'ogni squillo segna l\'ora');
  });
  test('la pagina puo\' leggere lo stato del filo e degli squilli recenti (niente piu\' da indovinare)', () => {
    assert.ok(/public String wireStatus\(\)/.test(MAIN) && /RingService\.wireStatus\(MainActivity\.this\)/.test(MAIN));
    /* nel Java le chiavi JSON sono scritte con le virgolette scappate: \"aperti\" */
    for (const k of ['aperti', 'squilliRecenti', 'maxSquilli', 'errore']) assert.ok(RING.indexOf('\\"' + k + '\\"') >= 0, 'manca ' + k + ' nello stato');
    assert.ok(/androidRing\.wireStatus\(\)/.test(APP) && /health\.wireDown/.test(APP) && /health\.ringQuotaHit/.test(APP), 'la scheda «Come sta l\'app» lo mostra');
  });
});

/* ⚠️ v52 (17 set 2026). Due cose che il WebView non sa fare da solo e che
   Chrome fa: la tendina «Condividi con…» (navigator.share non esiste nel
   WebView: nell'APK «Manda l'invito» finiva sempre in «copiato», e chi non
   sa cos'e' la clipboard restava fermo) e lo schermo protetto
   (FLAG_SECURE: niente screenshot, anteprima nera nel multitasking), che
   e' un interruttore SPENTO di partenza — acceso bloccherebbe anche lo
   screenshot del QR che la gente manda. */
test.describe('v52: condividere dalla tendina di Android, e lo schermo protetto', () => {
  const CALLACT = read(J + 'CallActivity.java');

  test('AndroidShare.text() esiste, è montato, e la pagina lo prova PRIMA di navigator.share', () => {
    assert.ok(exposed(MAIN, 'ShareBridge', 'text'), 'AndroidShare.text() manca o non ha @JavascriptInterface');
    assert.ok(/addJavascriptInterface\(new ShareBridge\(\), "AndroidShare"\)/.test(MAIN), 'il ponte va montato col nome che la pagina cerca');
    assert.ok(/ACTION_SEND/.test(MAIN) && /createChooser/.test(MAIN), 'deve aprire la tendina di sistema, non un\'app scelta da noi');
    const siti = APP.split('navigator.share(').length - 1;
    const conPonte = APP.split('AndroidShare.text(').length - 1;
    assert.ok(siti >= 6, 'i punti di condivisione sono almeno sei, oggi: ' + siti);
    assert.strictEqual(conPonte, siti, 'OGNI punto che condivide deve provare prima il ponte Android: ' + conPonte + ' su ' + siti);
    /* e nell'ordine giusto: il ponte viene letto prima di navigator.share in ognuno */
    let pos = 0;
    for (let i = 0; i < siti; i++){
      const p = APP.indexOf('AndroidShare.text(', pos), n = APP.indexOf('navigator.share(', pos);
      assert.ok(p > 0 && p < n, 'sito ' + (i+1) + ': il ponte deve venire PRIMA di navigator.share');
      pos = n + 1;
    }
  });

  test('AndroidScreen.setSecure()/isSecure() esistono, e il flag si applica in TUTTE E DUE le finestre', () => {
    assert.ok(exposed(MAIN, 'ScreenBridge', 'setSecure'), 'AndroidScreen.setSecure() manca');
    assert.ok(exposed(MAIN, 'ScreenBridge', 'isSecure'), 'AndroidScreen.isSecure() manca');
    assert.ok(/addJavascriptInterface\(new ScreenBridge\(\), "AndroidScreen"\)/.test(MAIN));
    assert.ok(/FLAG_SECURE/.test(MAIN), 'MainActivity deve applicare FLAG_SECURE');
    /* CallActivity e' la schermata dello squillo sopra il blocco: mostra il
       nome di chi chiama. Il flag vale per finestra, quindi anche li'. */
    assert.ok(/applySecureScreen\(this\)/.test(CALLACT), 'la schermata dello squillo deve applicare lo stesso flag: vale per finestra, non per app');
    assert.ok(/"secureScreen"/.test(MAIN), 'la scelta va letta dalle preferenze all\'avvio, prima che la pagina carichi');
    assert.ok(/applySecureScreen\(this\)/.test(MAIN.slice(MAIN.indexOf('protected void onCreate'), MAIN.indexOf('setContentView'))),
      'in MainActivity il flag va messo in onCreate, PRIMA di setContentView');
  });

  test('l\'interruttore nella pagina: esiste, parte SPENTO, e senza il ponte non si vede', () => {
    assert.ok(/id="secureRow"/.test(HTML), 'manca la riga dell\'interruttore');
    assert.ok(/'dvlogos-secure'/.test(APP), 'la scelta va ricordata');
    assert.ok(/AndroidScreen\.setSecure\(/.test(APP), 'la pagina deve dirlo al telefono');
    assert.ok(/if \(!window\.AndroidScreen\) \$\('secureRow'\)\.classList\.add\('hide'\)/.test(APP),
      'nel browser (senza ponte) l\'interruttore non ha senso e non si mostra');
  });
});

/* Android Lint, 18 set 2026: due chiamate che esistono solo da API 28 e 23 su
   un'app con minSdk 21. Su Android 5-8 l'app si chiudeva (NoSuchMethodError
   non e' un'Exception: il catch non lo prendeva). I controlli qui sotto
   guardano che i due punti restino protetti da un controllo di versione. */
test.describe('v58: Android 5-8 non si chiudono da soli (Android Lint)', () => {
  test('getLongVersionCode() (API 28) e\' protetto da un controllo di versione', () => {
    const i = MAIN.indexOf('info.getLongVersionCode()');
    assert.ok(i > 0);
    const intorno = MAIN.slice(i - 120, i);
    assert.match(intorno, /Build\.VERSION\.SDK_INT >= 28/, 'senza il controllo, Android 5-8 crashano all\'apertura');
  });
  test('checkSelfPermission() (API 23) non viene chiamato sotto Android 6', () => {
    const i = MAIN.indexOf('private boolean holdsAll(');
    const corpo = MAIN.slice(i, MAIN.indexOf('(checkSelfPermission(p)', i));
    assert.match(corpo, /if \(Build\.VERSION\.SDK_INT < 23\) return true;/, 'senza, Android 5 crasha accendendo «Fatti trovare»');
  });
  test('niente copie dei dati fuori dal telefono: allowBackup=false E le regole per Android 12+', () => {
    assert.match(MANIFEST, /android:allowBackup="false"/);
    assert.match(MANIFEST, /android:dataExtractionRules="@xml\/data_extraction_rules"/);
    const regole = read('android/app/src/main/res/xml/data_extraction_rules.xml');
    for (const sez of ['cloud-backup', 'device-transfer']) assert.ok(regole.includes('<' + sez), sez);
    assert.ok((regole.match(/<exclude domain="root"/g) || []).length === 2, 'root escluso in tutte e due le sezioni');
  });
});
