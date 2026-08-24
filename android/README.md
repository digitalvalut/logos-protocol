# Logos — Android package

This folder is not a second app. It's a thin installable wrapper — a Trusted
Web Activity — around the real Logos, which is the web app in the repository
root (`modifica.html`/`modifica.js`). Opening the installed app just opens
that same page, full-screen, with its own home-screen icon. Nothing about
how Logos works — the encryption, the peer-to-peer connection, the absence
of a server — changes here.

Two things this deliberately does **not** add:

- **No push notifications.** `enableNotifications` is off in
  `twa-manifest.json`. Nothing here talks to Firebase or any Google
  messaging service.
- **No signing key checked in.** F-Droid builds this from source on its own
  servers and signs the result with its own key — that's the point of
  submitting there instead of shipping a pre-built APK. A local
  `android.keystore` is only ever needed to test a build on this machine
  (see below), and is gitignored on purpose.

## Building it yourself

```
cd android
./gradlew assembleRelease
```

Needs a JDK 17 and the Android SDK on the machine (`ANDROID_HOME` set, or a
`local.properties` pointing `sdk.dir` at one). The generated app is signed
with whatever keystore `twa-manifest.json` points at — for a first local
test, `bubblewrap build` (from the `@bubblewrap/cli` package) will offer to
generate one.

## Where it points

The app opens `https://digitalvalut.github.io/logos-protocol/modifica.html`
— the same page anyone reaches directly today. `twa-manifest.json` is the
single source of truth for the app's name, colors, icon and package ID
(`io.github.digitalvalut.logos`); regenerate the Android project from it
with `bubblewrap update` after any change there.
