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
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;

import java.util.List;

/**
 * Il telefono durante una chiamata.
 *
 * ⚠️ NATO L'11 SETTEMBRE 2026 da una prova su due telefoni veri, tutti e due
 * su rete mobile: «si collega, ma l'audio non si sente bene; in video peggio».
 * Cercando `AudioManager` in tutto il pacchetto Android il risultato era
 * ZERO. Cioe': quando partiva una chiamata, il telefono non lo sapeva.
 *
 * Cosa vuol dire, in concreto. Android tratta l'audio in due modi diversi:
 * «musica» (MODE_NORMAL) e «telefonata» (MODE_IN_COMMUNICATION). Nel primo
 * la voce esce dall'altoparlante grande, il volume e' quello dei media, e la
 * cancellazione dell'eco fatta dall'hardware — quella che ogni telefono ha,
 * e che e' l'unica che funziona davvero — resta spenta. Un microfono e un
 * altoparlante sullo stesso telefono, senza cancellazione dell'eco, danno
 * esattamente la voce metallica e il rimbombo che l'operatore ha sentito.
 * La pagina non puo' cambiare questa modalita': e' un'impostazione del
 * telefono, e la pagina vive dentro una WebView che non la tocca.
 *
 * Questo servizio fa tre cose, tutte reversibili, e le disfa tutte a fine
 * chiamata:
 *   1. mette il telefono in MODE_IN_COMMUNICATION e chiede il «fuoco» audio,
 *      cosi' la musica di un'altra app si abbassa e la voce ha la strada;
 *   2. sceglie da dove esce la voce — auricolare per una chiamata vocale,
 *      altoparlante per una videochiamata, e il pulsante nella pagina puo'
 *      cambiarlo (nella WebView `setSinkId` non esiste, quindi il pulsante
 *      passa da qui);
 *   3. resta in primo piano come servizio di tipo microfono/fotocamera:
 *      da Android 14 e' l'unico modo per cui il microfono NON venga tolto
 *      all'app quando lo schermo si spegne o si guarda un'altra app.
 *
 * Non tocca la rete, non tocca la cifratura, non vede un byte di quello che
 * si dice: e' il telefono che viene messo nella posizione giusta.
 */
public class CallService extends Service {

    static final String ACTION_START = "io.github.digitalvalut.logos.CALL_START";
    static final String ACTION_STOP  = "io.github.digitalvalut.logos.CALL_STOP";
    static final String EXTRA_VIDEO  = "video";

    static final String CH_CALL = "call";
    static final int NOTE_CALL = 31;

    /* Lo stato dell'audio prima della chiamata, per rimetterlo com'era.
       Statico e non per-istanza: il servizio puo' essere ricreato da Android
       fra uno start e uno stop, e quello che conta e' com'era il telefono
       PRIMA della prima chiamata, non prima dell'ultima ricreazione. */
    private static int modeBefore = -1;
    private static boolean speakerBefore = false;
    private static AudioFocusRequest focus = null;
    private static boolean inCall = false;

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            leaveCallMode(this);
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        boolean video = intent != null && intent.getBooleanExtra(EXTRA_VIDEO, false);
        ensureChannel();
        startForegroundCompat(video);
        enterCallMode(this, video);
        /* Non ricreare la chiamata da solo se Android uccide il processo:
           una chiamata che il telefono ha perso e' finita, e un servizio
           che rinasce senza nessuno dall'altra parte terrebbe il microfono
           «in uso» per niente. */
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        /* Qualunque strada porti qui — stop esplicito, sistema, task tolto
           dalle recenti — il telefono non deve restare in modalita' chiamata
           con un microfono acceso e nessuna chiamata. */
        leaveCallMode(this);
        super.onDestroy();
    }

    /* ------------------------------------------------------------------
       La modalita' chiamata.
       ------------------------------------------------------------------ */

    static synchronized void enterCallMode(Context c, boolean video) {
        AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return;
        if (!inCall) {
            modeBefore = am.getMode();
            speakerBefore = am.isSpeakerphoneOn();
            inCall = true;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes voice = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
                focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(voice)
                    .setAcceptsDelayedFocusGain(false)
                    .setWillPauseWhenDucked(false)
                    .build();
                am.requestAudioFocus(focus);
            } else {
                am.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
            }
        } catch (Exception ignored) { /* senza fuoco si parla lo stesso, solo con la musica sotto */ }
        try { am.setMode(AudioManager.MODE_IN_COMMUNICATION); } catch (Exception ignored) {}
        /* Vocale: all'orecchio, come una telefonata. Video: si guarda lo
           schermo, quindi l'altoparlante. E' il punto di partenza; il pulsante
           nella pagina lo cambia con setSpeaker(). */
        setSpeaker(c, video);
    }

    static synchronized void leaveCallMode(Context c) {
        if (!inCall) return;
        inCall = false;
        AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (focus != null) am.abandonAudioFocusRequest(focus);
            } else {
                am.abandonAudioFocus(null);
            }
        } catch (Exception ignored) {}
        focus = null;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) am.clearCommunicationDevice();
            else am.setSpeakerphoneOn(speakerBefore);
        } catch (Exception ignored) {}
        try { am.setMode(modeBefore >= 0 ? modeBefore : AudioManager.MODE_NORMAL); } catch (Exception ignored) {}
        modeBefore = -1;
    }

    /** Da dove esce la voce. Restituisce se e' riuscito. */
    static boolean setSpeaker(Context c, boolean on) {
        AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                /* Da Android 12 `setSpeakerphoneOn` e' deprecato e su alcuni
                   telefoni viene ignorato in MODE_IN_COMMUNICATION: la via
                   giusta e' dire QUALE dispositivo, non «altoparlante si/no». */
                int want = on ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE;
                List<AudioDeviceInfo> devs = am.getAvailableCommunicationDevices();
                for (AudioDeviceInfo d : devs) {
                    if (d.getType() == want) return am.setCommunicationDevice(d);
                }
                /* un tablet senza auricolare: l'altoparlante e' l'unica uscita
                   e chiedere l'auricolare non e' un errore da segnalare */
                if (!on) { am.clearCommunicationDevice(); return true; }
                return false;
            }
            am.setSpeakerphoneOn(on);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    static boolean isSpeakerOn(Context c) {
        AudioManager am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AudioDeviceInfo d = am.getCommunicationDevice();
                return d != null && d.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER;
            }
            return am.isSpeakerphoneOn();
        } catch (Exception e) { return false; }
    }

    /* ------------------------------------------------------------------
       Il servizio in primo piano.
       ------------------------------------------------------------------ */

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        /* Silenzioso: e' la riga che dice «chiamata in corso», non un avviso. */
        NotificationChannel ch = new NotificationChannel(
            CH_CALL, getString(R.string.chCall), NotificationManager.IMPORTANCE_LOW);
        ch.setDescription(getString(R.string.chCallWhy));
        ch.setShowBadge(false);
        nm.createNotificationChannel(ch);
    }

    private void startForegroundCompat(boolean video) {
        Intent open = new Intent(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 3, open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CH_CALL)
            : new Notification.Builder(this);
        Notification n = b
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(getString(video ? R.string.callVideoTitle : R.string.callAudioTitle))
            .setContentText(getString(R.string.callBody))
            .setContentIntent(pi)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_CALL)
            .build();

        if (Build.VERSION.SDK_INT >= 30) {
            /* ⚠️ Il tipo dichiarato qui deve stare dentro quello del manifest,
               e da Android 14 ogni tipo vuole il suo permesso
               (FOREGROUND_SERVICE_MICROPHONE, FOREGROUND_SERVICE_CAMERA):
               mancarne uno = SecurityException all'avvio, cioe' la chiamata
               parte senza questo servizio e il microfono cade al primo
               schermo spento. I due tipi esistono da Android 11 (API 30);
               Android 10 conosce solo «quello che dice il manifest». */
            int type = android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            if (video) type |= android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
            startForeground(NOTE_CALL, n, type);
        } else if (Build.VERSION.SDK_INT == 29) {
            startForeground(NOTE_CALL, n, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MANIFEST);
        } else {
            startForeground(NOTE_CALL, n);
        }
    }
}
