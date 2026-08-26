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

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * A phone gets restarted, and somebody who turned on "ring when a call comes
 * in" has no reason to suspect that turning it off again was part of the deal.
 * Silently stopping would be the worst kind of failure here: the setting still
 * reads as on, and calls simply stop arriving.
 *
 * Only ever starts the watch back up if it was on. It reads one boolean out of
 * this app's own storage and does nothing else.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String a = intent == null ? "" : String.valueOf(intent.getAction());
        if (!Intent.ACTION_BOOT_COMPLETED.equals(a)
            && !"android.intent.action.QUICKBOOT_POWERON".equals(a)) return;

        if (!RingService.prefs(context).getBoolean(RingService.EXTRA_WATCHING, false)) return;
        if (RingService.prefs(context).getString(RingService.EXTRA_KEYS, "").isEmpty()) return;

        Intent go = new Intent(context, RingService.class).setAction(RingService.ACTION_WATCH);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(go);
            else context.startService(go);
        } catch (Exception ignored) {
            /* Some Android versions refuse to start a service this early. The
               app starts it again the next time it is opened. */
        }
    }
}
