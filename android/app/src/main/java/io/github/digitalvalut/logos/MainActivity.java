/*
 * Copyright 2026 Associazione di Promozione Sociale DigitalValut (ETS)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.github.digitalvalut.logos;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.OutputStream;

/**
 * The whole application is inside this package, in assets/logos.html, and is
 * served to the WebView over https://appassets.androidplatform.net.
 *
 * Serving it rather than opening it as a file is not a detail. A file:// page is
 * not a secure context, and a browser withholds Web Crypto and WebRTC from one —
 * which would leave this app with neither encryption nor calls, that is to say
 * nothing at all. WebViewAssetLoader answers on an https origin that only this
 * app's own WebView can reach, so the page is a secure context and every
 * cryptographic primitive it relies on is available.
 */
public class MainActivity extends Activity {

    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String START = ORIGIN + "/assets/logos.html";
    private static final int REQ_PERMS = 1;
    private static final int REQ_FILE = 2;
    private static final int REQ_NOTIFY = 3;

    private WebView web;
    private ValueCallback<Uri[]> pendingFiles;
    private PermissionRequest pendingWebPermission;
    /* A call answered before the page has finished loading: the nudge is held
       until onPageFinished, or it would be sent to nothing at all. */
    private boolean answeredPending;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        /* Only ever true for a build made for development. A published package is
           not debuggable, so this cannot open a window into somebody's
           conversations on their phone — but it does let the app be inspected
           while it is being worked on, which is how anyone can check for
           themselves that the page really is a secure context in here. */
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        /* ⚠️ AGGIUNTO IL 2 SET 2026, DOPO UN AGGIORNAMENTO CHE NON SI VEDEVA.
           L'operatore ha installato la v32 e l'app continuava a dichiararsi
           3.95. Il pacchetto era giusto — verificato aprendolo: dentro c'era
           3.96 — ma la WebView serviva la propria copia vecchia della pagina.

           Senza questa riga vale LOAD_DEFAULT, cioe' la WebView applica la
           cache HTTP a ciò che le serve WebViewAssetLoader. Ma qui non c'e'
           nessuna rete da risparmiare: la pagina e' un file dentro il
           pacchetto, a un centimetro di distanza. Metterla in cache non fa
           guadagnare niente e fa perdere l'unica cosa che conta — che dopo un
           aggiornamento si veda il codice aggiornato.

           E' la stessa famiglia del difetto gia' pagato sul web a fine agosto:
           il browser cercava la versione nuova GUARDANDO LA PROPRIA COPIA
           VECCHIA. Superficie diversa, errore identico.
           ⚠️ Un aggiornamento che non si vede e' peggio di un aggiornamento
           mancato: chi lo installa crede di avere le correzioni e non le ha. */
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        /* localStorage holds the conversation history and IndexedDB holds the
           device's own key pair — the thing an address *is*. Without this the app
           would come up with no identity every single time. */
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        /* A WebView ignores the page's own <meta name="viewport"> unless told
           not to. The page says width=device-width, and without this line that
           instruction is thrown away and the layout is measured against a width
           that is not the screen's — so the app sits wider than the phone and
           slides sideways. It also restores viewport-fit=cover, which is how
           the page keeps clear of the notch and the gesture bar. */
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        /* Nothing here is a document to be zoomed into; the layout already
           answers to the screen, and pinch-zoom on it only breaks the framing. */
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        /* A ringtone has to be able to start without somebody first tapping the
           screen, which is the entire point of a ringtone. */
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return loader.shouldInterceptRequest(req.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (u != null && u.toString().startsWith(ORIGIN)) return false;
                /* Anything that is not the app itself — a licence link, the
                   source repository — belongs to the phone's browser, not in
                   here. */
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(SAVE_SHIM, null);
                if (answeredPending) { answeredPending = false; tellPageACallIsWaiting(); }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            /* getUserMedia asks twice over: once of Android, for the app, and
               once of the WebView, for the page. Granting only the first leaves
               calls failing with no reason given. */
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    if (!ORIGIN.equals(request.getOrigin().toString().replaceAll("/$", ""))) {
                        request.deny();
                        return;
                    }
                    String[] needed = permissionsNeededFor(request);
                    if (needed.length == 0) { request.deny(); return; }
                    if (holdsAll(needed)) {
                        request.grant(request.getResources());
                    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        pendingWebPermission = request;
                        requestPermissions(needed, REQ_PERMS);
                    } else {
                        request.grant(request.getResources());
                    }
                });
            }
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb,
                                             FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = cb;
                try {
                    startActivityForResult(params.createIntent(), REQ_FILE);
                    return true;
                } catch (Exception e) {
                    pendingFiles = null;
                    return false;
                }
            }
        });

        /* The one bridge from the page to the phone, and it does exactly one
           thing: write bytes the page already has into the Downloads folder. The
           page it is exposed to is the one inside this package, under a policy
           that refuses to run any script but its own. */
        web.addJavascriptInterface(new SaveBridge(), "AndroidSave");
        /* ⚠️ COLLEGATO IL 2 SETTEMBRE 2026, dopo essere rimasto commentato da
           fine agosto. Il commento di allora diceva: "una riga, e torna il
           giorno che squilla davvero". Questo è quel commit.

           Cosa cambia nel momento in cui questa riga esiste: la pagina cerca
           `AndroidRing`, lo trova, e cambia ciò che l'interruttore "resta in
           ascolto" PROMETTE — da "finché tieni questa schermata aperta" a
           "anche ad app chiusa" (`listen.subApp`). È una promessa scritta sullo
           schermo di qualcuno, ed è il motivo per cui la riga è rimasta
           commentata: non si mette una promessa davanti a una persona sulla
           forza di codice che si limita a compilare.

           ⚠️ QUELLA PROMESSA NON È ANCORA STATA VISTA MANTENERE SU UN TELEFONO
           VERO. Il codice c'è tutto e i permessi ora ci sono, ma finché non si
           vede un telefono squillare ad app chiusa questa resta una promessa
           sulla parola. È la prima cosa da provare, e se non squilla la riga
           torna commentata: meglio nessuna promessa che una falsa. */
        web.addJavascriptInterface(new RingBridge(), "AndroidRing");

        /* A frame around the WebView, so the insets have something to shrink
           that the page will actually feel. */
        FrameLayout root = new FrameLayout(this);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        keepClearOfTheSystemBars(root);

        setContentView(root);
        if (getIntent() != null
                && getIntent().getBooleanExtra(CallActivity.EXTRA_ANSWERED, false)) {
            answeredPending = true;
        }
        /* ⚠️ La riga qui sopra (setCacheMode) impedisce che ricapiti, ma non
           ripulisce quello che una versione precedente ha gia' messo da parte:
           chi aggiorna DA una versione senza quella riga si porterebbe dietro
           la pagina vecchia comunque. Una volta sola, quando il numero di
           versione del pacchetto cambia, si butta via tutto il conservato.
           Costa un caricamento leggermente piu' lento al primo avvio dopo un
           aggiornamento, ed e' esattamente il momento in cui si vuole essere
           sicuri di guardare il codice nuovo. */
        try {
            android.content.SharedPreferences p =
                getSharedPreferences("dvlogos-app", MODE_PRIVATE);
            long installata = getPackageManager()
                .getPackageInfo(getPackageName(), 0).getLongVersionCode();
            if (p.getLong("vistaVersione", -1) != installata) {
                web.clearCache(true);
                p.edit().putLong("vistaVersione", installata).apply();
                /* uno stato salvato appartiene alla versione che l'ha scritto:
                   ripartire dalla pagina, non da com'era prima */
                state = null;
            }
        } catch (Exception e) { /* nel dubbio si carica normalmente */ }

        String invite = inviteFragmentFrom(getIntent());
        if (invite != null) web.loadUrl(START + "#" + invite);
        else if (state != null) web.restoreState(state);
        else web.loadUrl(START);
    }

    /* ------------------------------------------------------------------
       An invite or address link tapped in another app.

       The links are https://digitalvalut.github.io/logos-protocol/modifica.html
       with the code carried after the '#': #a=<address>, #q=<six digits>, or the
       older #i=<invite>. A fragment is never sent to a server and the bundled
       page already handles all three (autoFillFromHash in modifica.js), so all
       that is needed on this side is to carry the fragment across to the page
       that is actually served — appassets.androidplatform.net/assets/logos.html.

       Only those three shapes are passed on. Anything else on the domain just
       opens the app on its normal screen rather than acting on the address bar. */
    private static String inviteFragmentFrom(Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) return null;
        Uri u = intent.getData();
        if (u == null) return null;
        String frag = u.getEncodedFragment();     /* the part after '#', without it */
        if (frag == null || frag.isEmpty()) return null;
        if (frag.startsWith("a=") || frag.startsWith("q=") || frag.startsWith("i=")
                || frag.contains("&a=") || frag.contains("&q=") || frag.contains("&i=")) {
            return frag;
        }
        return null;
    }

    /**
     * Keeps the page out from under the clock and the navigation bar.
     *
     * From Android 15 an app that targets a recent SDK — this one targets 36 —
     * is laid out edge to edge whether it asks to be or not, behind the status
     * bar at the top and the navigation bar at the bottom. Handling that is the
     * app's job, and not doing it is not subtle: the header sits underneath the
     * clock and the battery, sliced in half.
     *
     * The page cannot rescue itself. It only ever asks for the bottom inset,
     * because in a browser the top one is the browser's own problem.
     *
     * Edge to edge is switched on deliberately for every version rather than
     * left to arrive by itself on new ones, so that one arrangement holds from
     * Android 5 to Android 16 — and so the behaviour can be seen and tested on
     * an older emulator instead of only in the hands of whoever has a new phone.
     * The cutout is included: on a phone with a hole-punch camera in landscape,
     * the system bar insets alone do not clear it.
     *
     * Below Android 11 nothing is changed. Edge to edge is not forced there and
     * the system already lays the window out below the bars, so the correct
     * amount of work is none. Android 11 is old enough to cover every phone the
     * enforcement will ever reach, and new enough to be sitting on an emulator
     * here — which is what makes this testable rather than hopeful.
     *
     * Written against the framework rather than androidx.core on purpose. That
     * library injects a permission of its own into the manifest, and this app
     * asking for a permission nobody can explain is worse than a version check.
     */
    private void keepClearOfTheSystemBars(FrameLayout root) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        getWindow().setDecorFitsSystemWindows(false);
        /* The padding goes on the frame holding the WebView, not on the WebView.
           Padding a WebView directly does fire and does hold — it simply does
           not reach the page: the viewport it reports stayed the full height of
           the screen, so the layout went on being computed as though the status
           bar were not there, and the header went on being sliced. Padding the
           frame makes the WebView genuinely smaller, which is a thing the page
           cannot fail to notice. */
        root.setOnApplyWindowInsetsListener((v, windowInsets) -> {
            android.graphics.Insets bars = windowInsets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            /* The keyboard belongs in here too, and this is the debt that came
               with going edge to edge. adjustResize works by letting the system
               shrink the window when the keyboard opens; a window told not to
               fit system windows is no longer shrunk for anything, the keyboard
               included. Without this the keyboard sits over the message box and
               somebody typing cannot see a word of what they are writing —
               which is not a rough edge, it is the app not working.

               The larger of the two, never the sum: while the keyboard is up it
               covers the navigation bar, so adding both would leave a strip of
               dead space the height of that bar underneath it. */
            android.graphics.Insets keyboard = windowInsets.getInsets(WindowInsets.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
            return WindowInsets.CONSUMED;
        });
    }

    /* ------------------------------------------------------------------
       Saving a received file.

       In a browser a received file is an ordinary download. In a WebView a link
       to a blob: URL does nothing at all, silently — so every photo and document
       anyone sent would arrive, be visible, and be impossible to keep. The page
       is not modified for this: a small shim added after load intercepts those
       clicks, reads the bytes the page already holds, and hands them here to be
       written where the phone keeps downloads.
       ------------------------------------------------------------------ */
    private static final String SAVE_SHIM =
        "(function(){" +
        " if (window.__dvSaveShim) return; window.__dvSaveShim = 1;" +
        " document.addEventListener('click', function(ev){" +
        "  var a = ev.target && ev.target.closest && ev.target.closest('a[download]');" +
        "  if (!a) return;" +
        "  var href = a.getAttribute('href') || '';" +
        "  if (href.indexOf('blob:') !== 0) return;" +
        "  ev.preventDefault();" +
        "  fetch(href).then(function(r){ return r.blob(); }).then(function(b){" +
        "   var fr = new FileReader();" +
        "   fr.onload = function(){" +
        "    var s = String(fr.result); var i = s.indexOf(',');" +
        "    AndroidSave.save(a.getAttribute('download') || 'file', b.type || '', s.slice(i+1));" +
        "   };" +
        "   fr.readAsDataURL(b);" +
        "  }).catch(function(){});" +
        " }, true);" +
        "})();";

    public class SaveBridge {
        @JavascriptInterface
        public void save(String name, String mime, String base64) {
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                String safe = name == null || name.trim().isEmpty() ? "file" : name.replaceAll("[/\\\\]", "_");
                Uri target;
                OutputStream out;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    if (mime != null && !mime.isEmpty()) v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    target = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (target == null) throw new IllegalStateException("no target");
                    out = getContentResolver().openOutputStream(target);
                } else {
                    java.io.File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    dir.mkdirs();
                    java.io.File f = new java.io.File(dir, safe);
                    out = new java.io.FileOutputStream(f);
                }
                if (out == null) throw new IllegalStateException("no stream");
                out.write(bytes);
                out.close();
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                        getString(R.string.savedToDownloads, safe), Toast.LENGTH_LONG).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                        R.string.saveFailed, Toast.LENGTH_LONG).show());
            }
        }
    }

    /* ------------------------------------------------------------------
       Ringing while the app is closed.

       The page cannot do this and never will: when the app is shut, the page is
       gone, and the only thing the web offers for waking a phone is Web Push,
       which on Android runs through Google. This app carries none of that on
       purpose. So the page hands the waiting over to a service on this side —
       the mailbox keys it listens on, the relay to ask, and the two lines of
       text to show, already in whichever of the thirteen languages the person
       chose. Keeping the wording on that side is why this feature does not need
       thirteen more translations over here.
       ------------------------------------------------------------------ */
    public class RingBridge {

        /** Lets the page know it is running somewhere that can actually ring. */
        @JavascriptInterface
        public boolean available() { return true; }

        /**
         * @param keysCsv hex SHA-256 mailbox keys, comma separated
         * @param base    the relay's mailbox address, https and ending /mailbox/
         * @param title   what a locked screen should say, in the user's language
         * @param body    the quieter line under it
         */
        /* ⚠️ RESTITUISCE UN ESITO, DAL 2 SET 2026. Prima non restituiva niente e
           il fallimento finiva in un `catch (Exception ignored) {}`: se Android
           rifiutava di avviare il servizio, la pagina non lo sapeva e continuava
           a promettere "ti raggiungono anche ad app chiusa". Una promessa falsa
           e' peggio di una funzione mancante — chi la legge smette di stare
           attento, e nessuno lo avvisa.

           Android RIFIUTA per davvero, e non e' un caso raro: da Android 12 un
           servizio in primo piano non puo' essere avviato mentre l'app e' gia'
           in secondo piano (ForegroundServiceStartNotAllowedException). Se la
           consegna viene tentata solo quando lo schermo si spegne, arriva
           sistematicamente tardi — ed e' esattamente il difetto per cui lo
           squillo ad app chiusa non e' mai partito sul telefono dell'autore.

           Il permesso delle notifiche si chiede PRIMA e a parte: senza, il
           servizio parte e viene ucciso perche' non puo' mostrare la propria
           notifica — un fallimento che sembrerebbe tutt'altro. */
        @JavascriptInterface
        public boolean watch(String keysCsv, String base, String title, String body) {
            if (RingService.keysOf(String.valueOf(keysCsv)).isEmpty()) return false;
            if (!RingService.isSafeBase(base)) return false;
            runOnUiThread(() -> askToPostNotifications());
            Intent go = new Intent(MainActivity.this, RingService.class)
                .setAction(RingService.ACTION_WATCH)
                .putExtra(RingService.EXTRA_KEYS, keysCsv)
                .putExtra(RingService.EXTRA_BASE, base)
                .putExtra(RingService.EXTRA_TITLE, title)
                .putExtra(RingService.EXTRA_BODY, body);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(go);
                else startService(go);
                return true;
            } catch (Exception e) {
                /* il piu' delle volte: chiesto da background su Android 12+ */
                return false;
            }
        }

        /* Perche' la pagina possa dire la verita' invece di sperarci: il
           permesso senza il quale il servizio viene ucciso appena parte. */
        @JavascriptInterface
        public boolean canPostNotifications() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
            return checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        }

        /**
         * From Android 14 the right to take over a locked screen is not handed
         * out at install any more — it is granted per app, in the phone's own
         * settings. Without it a call still arrives, but as a banner that a
         * locked phone never shows, which is the whole difference between
         * ringing and not. This reports the state so the page can say so
         * plainly rather than letting somebody believe they are reachable.
         */
        @JavascriptInterface
        public boolean canTakeOverLockScreen() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true;
            NotificationManager nm = getSystemService(NotificationManager.class);
            return nm != null && nm.canUseFullScreenIntent();
        }

        /** Opens the one settings page where that permission is given. */
        @JavascriptInterface
        public void askForLockScreen() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(
                        android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                        Uri.parse("package:" + getPackageName())));
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void stop() {
            RingService.saveWatching(MainActivity.this, false);
            runOnUiThread(() -> {
                try {
                    startService(new Intent(MainActivity.this, RingService.class)
                        .setAction(RingService.ACTION_STOP));
                } catch (Exception ignored) {}
            });
        }
    }

    /* A silent ring is not a ring. Asked for only when somebody actually turns
       the feature on, never at launch. */
    private void askToPostNotifications() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) return;
        try { requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, REQ_NOTIFY); }
        catch (Exception ignored) {}
    }

    /* Answering from the lock screen brings us here. The service only ever knew
       that something was waiting; the reading and the decrypting are the page's,
       so all this does is tell it to look now instead of at its next poll. */
    private void tellPageACallIsWaiting() {
        if (web == null) return;
        web.evaluateJavascript(
            "window.dvAndroidCall && window.dvAndroidCall();", null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra(CallActivity.EXTRA_ANSWERED, false)) {
            answeredPending = true;
            tellPageACallIsWaiting();
        }
        /* An invite tapped while the app is already open. Changing only
           location.hash is exactly what that tap does in a browser, and the
           page listens for hashchange and runs the same handler — no reload,
           so whatever screen the person was on is not thrown away. */
        String invite = inviteFragmentFrom(intent);
        if (invite != null && web != null) {
            web.evaluateJavascript(
                "location.hash = " + JSONObject.quote("#" + invite) + ";", null);
        }
    }

    /* ---------------- permissions ---------------- */

    /**
     * The Android permissions a particular page request actually needs.
     *
     * Asked for exactly, rather than as a pair. A voice call requests the
     * microphone and nothing else; demanding the camera as well meant that
     * somebody who had turned the camera down could not place a voice call
     * either, and was told the microphone was busy. Two separate things, asked
     * for separately.
     */
    private static String[] permissionsNeededFor(PermissionRequest request) {
        java.util.List<String> need = new java.util.ArrayList<>();
        for (String r : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) need.add(Manifest.permission.RECORD_AUDIO);
            else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) need.add(Manifest.permission.CAMERA);
        }
        return need.toArray(new String[0]);
    }

    private boolean holdsAll(String[] permissions) {
        for (String p : permissions) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) return false;
        }
        return true;
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code != REQ_PERMS || pendingWebPermission == null) return;
        PermissionRequest r = pendingWebPermission;
        pendingWebPermission = null;
        /* Answered either way. A request left hanging is a call that never says
           yes and never says no. */
        if (holdsAll(permissionsNeededFor(r))) { r.grant(r.getResources()); return; }
        r.deny();
        /* A refusal reaches the page as a media error, and the page reads that
           the same way it would on a laptop: as the microphone being held by
           some other program. Nobody would guess from that message that the
           answer is a switch in Android's own settings — so it is said here,
           where the refusal actually happened, and the settings page is one tap
           away rather than five. */
        sendToSettingsAbout(Manifest.permission.RECORD_AUDIO);
    }

    private void sendToSettingsAbout(String permission) {
        boolean askedAgainWouldWork = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && shouldShowRequestPermissionRationale(permission);
        Toast.makeText(this, R.string.micDenied, Toast.LENGTH_LONG).show();
        /* Only when Android will not ask again. While it still would, another
           attempt at calling brings the ordinary prompt back, and throwing
           somebody into a settings screen for that would be heavy-handed. */
        if (askedAgainWouldWork) return;
        try {
            startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.fromParts("package", getPackageName(), null)));
        } catch (Exception ignored) {}
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code != REQ_FILE) { super.onActivityResult(code, result, data); return; }
        if (pendingFiles == null) return;
        pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
        pendingFiles = null;
    }

    /* ---------------- lifecycle ---------------- */

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        /* The app is one page with its own screens; letting Back walk the
           WebView's history would take somebody out of a conversation and into
           whatever they were looking at before it. */
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
