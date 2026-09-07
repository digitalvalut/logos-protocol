# Logos — Android package

This folder is not a second app. It is a container around the real Logos —
the web app in the repository root (`modifica.html` / `modifica.js`) — and the
application it contains is that same one, unaltered. Nothing about how Logos
works — the encryption, the peer-to-peer connection, the absence of a server —
changes here.

**The whole application travels inside the package.** At build time
`build-single-file.py` folds the page, the stylesheet and the logic into one
self-contained file, `app/src/main/assets/logos.html` (~1 MB), and the app
serves it to its own WebView over `https://appassets.androidplatform.net` — an
origin Android reserves for a package's own assets and that nothing outside
this app can answer. So the installed app never fetches the website, and keeps
working where that website is blocked or gone. See `MainActivity.java`.

> This used to be a Trusted Web Activity that simply opened
> `digitalvalut.github.io` full-screen, and `twa-manifest.json` survives from
> that design as the source of truth for the name, colours, icon and package
> ID (`io.github.digitalvalut.logos`). The app has not opened a remote page
> for a long time. If you read a description of a "thin wrapper" anywhere,
> it is out of date — this paragraph replaces it.

Two things this deliberately does **not** add:

- **No Google Play Services, no Firebase, no third party of any kind.** The
  app can ring while it is closed, but not through anyone's push network:
  `RingService` is a plain Android foreground service that reads the app's own
  mailbox on the relay every 45 seconds, and it is refused any address that is
  not a mailbox path. It can tell you *someone* is calling; reading who, and
  answering, still happen entirely inside the app.
- **No signing key checked in.** F-Droid builds this from source on its own
  servers and signs the result with its own key — that's the point of
  submitting there instead of shipping a pre-built APK. A local
  `android.keystore` is only ever needed to test a build on this machine,
  and is gitignored on purpose.

## Building it yourself

```
cd android
./gradlew assembleRelease
```

Needs a JDK 17, the Android SDK (`ANDROID_HOME` set, or a `local.properties`
pointing `sdk.dir` at one) and a working `python3`.

You do not run the bundler yourself: the `bundleWebApp` task in
`app/build.gradle` is wired to `preBuild`, so every build regenerates
`assets/logos.html` from the current sources and fails loudly if it cannot.
That is deliberate — a stale bundle sitting in the source tree is how a build
stops being reproducible, and how a fix appears to have failed.

The build is reproducible: a clean rebuild has been verified to produce a
byte-identical APK to the one F-Droid's own build server produced.
