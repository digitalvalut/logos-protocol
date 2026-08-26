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

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * Why this exists.
 *
 * A web page cannot be woken up. When the app is closed the page is gone, and
 * the only way the web has to make a phone react is Web Push — which on Android
 * means Google's servers. This app ships none, deliberately, and that left it
 * unable to do the one thing people asked for most: ring.
 *
 * So the waiting is done here instead, by the phone itself. This service stays
 * awake and asks the relay, every few seconds, whether anything is waiting in
 * the mailboxes this device listens on. Nothing else. It does not open the
 * envelope, cannot open the envelope, and does not want to: it asks a question
 * whose whole answer is yes or no, and on yes it rings. The app, when it opens,
 * does the real read and the real decryption exactly as it always has.
 *
 * That division is the point. Reading a mailbox empties it, so a service that
 * read one would swallow the very call it was ringing about. It peeks instead —
 * a look that leaves the message where it is, added to the relay for this. The
 * keys it watches are handed to it by the page, which is the only thing that
 * knows them; they are derived from addresses the user hands out anyway, so a
 * key in this app's private storage reveals nothing the address did not.
 *
 * No Google Play Services, no Firebase, no account, no third party of any kind.
 * The cost is honest and belongs in the open: a phone that keeps asking a
 * question every fifteen seconds uses more battery than one that does not,
 * which is why this is off until somebody turns it on.
 */
public class RingService extends Service {

    public static final String ACTION_WATCH   = "io.github.digitalvalut.logos.WATCH";
    public static final String ACTION_STOP    = "io.github.digitalvalut.logos.STOP";
    /* Sent when a call has been answered or waved away, so the watch resumes. */
    public static final String ACTION_HANDLED = "io.github.digitalvalut.logos.HANDLED";

    public static final String EXTRA_KEYS   = "keys";
    public static final String EXTRA_BASE   = "base";
    public static final String EXTRA_TITLE  = "title";
    public static final String EXTRA_BODY   = "body";
    public static final String EXTRA_WATCHING = "watching";

    private static final String PREFS = "ring";
    private static final String CH_WATCHING = "watching";
    private static final String CH_RINGING  = "ringing";
    private static final int NOTE_WATCHING = 1;
    private static final int NOTE_RINGING  = 2;

    /* The mailbox a call arrives in lives two minutes, so asking every fifteen
       seconds cannot miss one and leaves a wide margin for a slow network. It
       is also the number this whole feature is paid for in: every second taken
       off it is battery spent on a phone where, most of the time, nobody is
       calling. */
    private static final long POLL_MS = 15000;
    private static final int CONNECT_TIMEOUT_MS = 8000;
    private static final int READ_TIMEOUT_MS = 8000;

    /* Six rings in five minutes, and then it stops making a sound.

       This is not caution for its own sake, it closes a door this feature would
       otherwise open. Anybody holding an address can put something in the
       mailbox it maps to — that is what an address is for — and this service
       cannot tell a real sealed call from rubbish, because it has no key and is
       never given one. The page can tell, and silently throws rubbish away; it
       always could. But a phone that rings for every envelope turns "silently
       ignored" into "woken at three in the morning, repeatedly".

       Deliberately the same numbers as overKnockLimit in the Worker, which
       exists for exactly this reason and calls six in five minutes generous for
       somebody trying to reach a friend. It is a limit on the *sound*: the
       watch carries on, and a real call that arrives while the phone is quiet
       is still there in the mailbox when the app is next opened. */
    private static final long RING_WINDOW_MS = 5 * 60000;
    private static final int RING_MAX_PER_WINDOW = 6;
    private static final String PREF_RINGS = "rings";

    private Thread worker;
    private volatile boolean running;
    /* Set while a call is on screen: the watch pauses rather than ringing again
       over a phone that is already ringing. */
    private volatile boolean ringing;
    private PowerManager.WakeLock wake;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        final String action = intent == null ? ACTION_WATCH : String.valueOf(intent.getAction());

        if (ACTION_STOP.equals(action)) {
            saveWatching(this, false);
            stopEverything();
            return START_NOT_STICKY;
        }

        if (ACTION_HANDLED.equals(action)) {
            ringing = false;
            cancelRinging();
            return START_STICKY;
        }

        if (intent != null && intent.hasExtra(EXTRA_KEYS)) remember(intent);

        SharedPreferences p = prefs(this);
        if (!p.getBoolean(EXTRA_WATCHING, false) || p.getString(EXTRA_KEYS, "").isEmpty()) {
            stopEverything();
            return START_NOT_STICKY;
        }

        makeChannels();
        startForegroundCompat();
        startWorker();
        /* START_STICKY: if Android reclaims this under memory pressure, the
           user's phone should go back to being able to ring rather than
           quietly stopping and never saying so. */
        return START_STICKY;
    }

    /* ------------------------------------------------------------------ */

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void saveWatching(Context c, boolean on) {
        prefs(c).edit().putBoolean(EXTRA_WATCHING, on).apply();
    }

    private void remember(Intent intent) {
        prefs(this).edit()
            .putString(EXTRA_KEYS, str(intent.getStringExtra(EXTRA_KEYS)))
            .putString(EXTRA_BASE, str(intent.getStringExtra(EXTRA_BASE)))
            .putString(EXTRA_TITLE, str(intent.getStringExtra(EXTRA_TITLE)))
            .putString(EXTRA_BODY, str(intent.getStringExtra(EXTRA_BODY)))
            .putBoolean(EXTRA_WATCHING, true)
            .apply();
    }

    private static String str(String s) { return s == null ? "" : s; }

    /* ------------------------------------------------------------------ */

    private void startWorker() {
        if (running) return;
        running = true;

        /* Held so the poll still happens with the screen off — without it the
           CPU sleeps between ticks and the phone rings whenever it happens to
           wake up next, which is to say too late to answer. */
        if (wake == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wake = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "logos:listening");
            wake.setReferenceCounted(false);
        }
        try { wake.acquire(); } catch (Exception ignored) {}

        worker = new Thread(() -> {
            while (running) {
                try {
                    if (!ringing) {
                        SharedPreferences p = prefs(this);
                        String base = p.getString(EXTRA_BASE, "");
                        for (String key : keysOf(p.getString(EXTRA_KEYS, ""))) {
                            if (!running || ringing) break;
                            if (somethingWaitingAt(base, key)) { ring(); break; }
                        }
                    }
                } catch (Exception ignored) {
                    /* A poll that fails is a poll that failed: no network right
                       now, or the relay is busy. Neither is worth stopping over
                       — the next tick tries again. */
                }
                try { Thread.sleep(POLL_MS); } catch (InterruptedException e) { return; }
            }
        }, "logos-listening");
        worker.setDaemon(true);
        worker.start();
    }

    /** The keys are hex SHA-256 and nothing else is accepted as one. */
    static List<String> keysOf(String joined) {
        List<String> out = new ArrayList<>();
        for (String k : joined.split(",")) {
            String s = k.trim();
            if (s.length() == 64 && s.matches("[0-9a-f]{64}")) out.add(s);
        }
        return out;
    }

    /**
     * Asks whether the box has something in it, and takes care not to empty it.
     * Returns false for anything that is not a plain yes — an error, a refusal,
     * a rate limit — because a phone that rings when it cannot tell is worse
     * than one that stays quiet and asks again in fifteen seconds.
     */
    private boolean somethingWaitingAt(String base, String key) {
        if (!isSafeBase(base)) return false;
        HttpURLConnection c = null;
        try {
            URL u = new URL(base + key + "?peek=1");
            c = (HttpURLConnection) u.openConnection();
            c.setRequestMethod("GET");
            c.setConnectTimeout(CONNECT_TIMEOUT_MS);
            c.setReadTimeout(READ_TIMEOUT_MS);
            c.setUseCaches(false);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("Cache-Control", "no-store");
            /* The relay answers only for origins it knows, and this is the one
               the app itself is served from inside this package. */
            c.setRequestProperty("Origin", "https://appassets.androidplatform.net");
            return c.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        } finally {
            if (c != null) try { c.disconnect(); } catch (Exception ignored) {}
        }
    }

    /**
     * The address to ask is handed over by the page rather than written in here,
     * so that anyone running their own relay — the Worker is in the same
     * repository, Apache-2.0 — is not left out. It still has to be https and a
     * real mailbox path: this service will not be pointed at an arbitrary host
     * by anything that manages to reach the bridge.
     */
    static boolean isSafeBase(String base) {
        if (base == null) return false;
        if (!base.startsWith("https://")) return false;
        if (!base.endsWith("/mailbox/")) return false;
        if (base.contains("@") || base.contains("..")) return false;
        return base.length() < 200;
    }

    /* ------------------------------------------------------------------ */

    /**
     * The rings still inside the window, oldest first, with this one added.
     * Kept as a pure function of its inputs so the rule can be read, and
     * checked, without a phone.
     */
    static List<Long> ringsWithin(String stored, long now, long windowMs) {
        List<Long> keep = new ArrayList<>();
        for (String s : stored.split(",")) {
            if (s.trim().isEmpty()) continue;
            try {
                long t = Long.parseLong(s.trim());
                if (now - t < windowMs && t <= now) keep.add(t);
            } catch (NumberFormatException ignored) {}
        }
        return keep;
    }

    static String joined(List<Long> times) {
        StringBuilder b = new StringBuilder();
        for (Long t : times) { if (b.length() > 0) b.append(','); b.append(t); }
        return b.toString();
    }

    /** False when the phone has already made this noise too often lately. */
    private boolean allowedToMakeANoise() {
        SharedPreferences p = prefs(this);
        long now = System.currentTimeMillis();
        List<Long> recent = ringsWithin(p.getString(PREF_RINGS, ""), now, RING_WINDOW_MS);
        if (recent.size() >= RING_MAX_PER_WINDOW) return false;
        recent.add(now);
        p.edit().putString(PREF_RINGS, joined(recent)).apply();
        return true;
    }

    private void ring() {
        /* Marked as ringing either way: the watch pauses until this call has
           been dealt with, whether or not the phone was allowed to make a
           sound about it. Carrying on polling would find the same envelope
           fifteen seconds later and burn through the limit in a minute. */
        ringing = true;
        if (!allowedToMakeANoise()) return;
        SharedPreferences p = prefs(this);
        String title = p.getString(EXTRA_TITLE, "");
        String body  = p.getString(EXTRA_BODY, "");
        if (title.isEmpty()) title = getString(R.string.incomingTitle);
        if (body.isEmpty())  body  = getString(R.string.incomingBody);

        Intent full = new Intent(this, CallActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra(EXTRA_TITLE, title)
            .putExtra(EXTRA_BODY, body);
        PendingIntent pi = PendingIntent.getActivity(this, 0, full,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = builder(CH_RINGING)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setOngoing(true)
            .setContentIntent(pi)
            /* The whole point: this is what puts the call on a locked screen
               instead of leaving a silent line in the shade nobody looks at. */
            .setFullScreenIntent(pi, true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            b.setCategory(Notification.CATEGORY_CALL);
            b.setVisibility(Notification.VISIBILITY_PUBLIC);
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            b.setPriority(Notification.PRIORITY_MAX);
            b.setSound(ringtone());
            b.setVibrate(new long[]{ 0, 700, 600, 700, 600 });
        }
        notifier().notify(NOTE_RINGING, b.build());
    }

    private void cancelRinging() {
        try { notifier().cancel(NOTE_RINGING); } catch (Exception ignored) {}
    }

    private static Uri ringtone() {
        Uri u = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        return u != null ? u : RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }

    /* ------------------------------------------------------------------ */

    private NotificationManager notifier() {
        return (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    }

    @SuppressWarnings("deprecation")
    private Notification.Builder builder(String channel) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, channel)
            : new Notification.Builder(this);
    }

    private void makeChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = notifier();

        /* Deliberately the quietest channel Android offers that still keeps the
           service alive. The standing "listening" line is a legal requirement
           and a courtesy — it is how somebody can see, at any moment, that this
           is running — not something that should chime. */
        NotificationChannel watching = new NotificationChannel(
            CH_WATCHING, getString(R.string.chWatching), NotificationManager.IMPORTANCE_LOW);
        watching.setDescription(getString(R.string.chWatchingWhy));
        watching.setShowBadge(false);
        nm.createNotificationChannel(watching);

        NotificationChannel ringingCh = new NotificationChannel(
            CH_RINGING, getString(R.string.chRinging), NotificationManager.IMPORTANCE_HIGH);
        ringingCh.setDescription(getString(R.string.chRingingWhy));
        ringingCh.enableVibration(true);
        ringingCh.setVibrationPattern(new long[]{ 0, 700, 600, 700, 600 });
        ringingCh.setSound(ringtone(), new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build());
        nm.createNotificationChannel(ringingCh);
    }

    private void startForegroundCompat() {
        Intent open = new Intent(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 1, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent off = new Intent(this, RingService.class).setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 2, off,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification n = builder(CH_WATCHING)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(getString(R.string.watchingTitle))
            .setContentText(getString(R.string.watchingBody))
            .setContentIntent(pi)
            .setOngoing(true)
            /* One tap to make it stop, from the notification itself, without
               hunting for the switch inside the app. */
            .addAction(0, getString(R.string.watchingStop), stopPi)
            .build();

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTE_WATCHING, n,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTE_WATCHING, n);
        }
    }

    private void stopEverything() {
        running = false;
        ringing = false;
        if (worker != null) { worker.interrupt(); worker = null; }
        if (wake != null && wake.isHeld()) { try { wake.release(); } catch (Exception ignored) {} }
        cancelRinging();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForegroundLegacy();
        stopSelf();
    }

    @SuppressWarnings("deprecation")
    private void stopForegroundLegacy() { stopForeground(true); }

    @Override
    public void onDestroy() {
        running = false;
        if (worker != null) { worker.interrupt(); worker = null; }
        if (wake != null && wake.isHeld()) { try { wake.release(); } catch (Exception ignored) {} }
        super.onDestroy();
    }
}
