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
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

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

    private WebView web;
    private ValueCallback<Uri[]> pendingFiles;
    private PermissionRequest pendingWebPermission;

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
        /* localStorage holds the conversation history and IndexedDB holds the
           device's own key pair — the thing an address *is*. Without this the app
           would come up with no identity every single time. */
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
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
                    if (hasAvPermissions()) {
                        request.grant(request.getResources());
                    } else {
                        pendingWebPermission = request;
                        askAvPermissions();
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

        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl(START);
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

    /* ---------------- permissions ---------------- */

    private boolean hasAvPermissions() {
        return checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private void askAvPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{ Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA }, REQ_PERMS);
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code != REQ_PERMS || pendingWebPermission == null) return;
        PermissionRequest r = pendingWebPermission;
        pendingWebPermission = null;
        /* Answered either way. A request left hanging is a call that never says
           yes and never says no. */
        if (hasAvPermissions()) r.grant(r.getResources()); else r.deny();
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
