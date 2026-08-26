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

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * What a locked phone shows when somebody is calling.
 *
 * Deliberately not the app. This screen appears over the lock screen, and
 * anything it shows can be read by whoever is holding the phone without knowing
 * the passcode — so it shows the least that still makes sense: that someone is
 * calling, and two buttons. No name, no message, no conversation, nothing from
 * any past one. The relay could not have told us more than this anyway; the
 * service that put this here only ever learned that a sealed envelope exists.
 *
 * Answering unlocks in the ordinary way and hands over to the app, which reads
 * the envelope, decrypts it and gets on with the call.
 */
public class CallActivity extends Activity {

    /** Set on the intent that opens MainActivity, so the page checks at once. */
    public static final String EXTRA_ANSWERED = "answered";

    private static final int INK      = 0xFFF2EFEA;
    private static final int GROUND   = 0xFF0B0B0D;
    private static final int QUIET    = 0xFF8A8580;
    private static final int ANSWER   = 0xFF1F7A4C;
    private static final int DISMISS  = 0xFF2A2A2E;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        showOverLockScreen();

        Intent in = getIntent();
        String title = text(in, RingService.EXTRA_TITLE, getString(R.string.incomingTitle));
        String body  = text(in, RingService.EXTRA_BODY,  getString(R.string.incomingBody));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(GROUND);
        int pad = dp(28);
        root.setPadding(pad, pad, pad, pad);

        root.addView(label(title, 30, INK, true));
        root.addView(spacer(dp(12)));
        root.addView(label(body, 17, QUIET, false));
        root.addView(spacer(dp(48)));

        Button answer = button(getString(R.string.answer), ANSWER, INK);
        answer.setOnClickListener(v -> answer());
        root.addView(answer);

        root.addView(spacer(dp(14)));

        Button dismiss = button(getString(R.string.dismiss), DISMISS, QUIET);
        dismiss.setOnClickListener(v -> handled());
        root.addView(dismiss);

        setContentView(root);
    }

    /* Announced to the service either way. A call left neither answered nor
       waved away would leave the watch paused, and the next caller would find a
       phone that had quietly stopped ringing. */
    private void handled() {
        try {
            startService(new Intent(this, RingService.class).setAction(RingService.ACTION_HANDLED));
        } catch (Exception ignored) {}
        finish();
    }

    private void answer() {
        Intent open = new Intent(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra(EXTRA_ANSWERED, true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null && km.isKeyguardLocked()) {
                /* Asks for the passcode first and only then opens the app. The
                   conversation is not something to hand to whoever picked the
                   phone up. */
                km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                    @Override public void onDismissSucceeded() { startActivity(open); handled(); }
                    @Override public void onDismissCancelled() { handled(); }
                    @Override public void onDismissError()     { handled(); }
                });
                return;
            }
        }
        startActivity(open);
        handled();
    }

    /* ---------------- window flags ---------------- */

    @SuppressWarnings("deprecation")
    private void showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
              | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    /* ---------------- small view helpers ---------------- */

    private static String text(Intent in, String key, String fallback) {
        String s = in == null ? null : in.getStringExtra(key);
        return s == null || s.trim().isEmpty() ? fallback : s;
    }

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView label(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        return t;
    }

    private View spacer(int h) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(1, h));
        return v;
    }

    private Button button(String s, int background, int color) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 19);
        b.setTextColor(color);
        b.setBackgroundColor(background);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dp(62));
        b.setLayoutParams(lp);
        b.setPadding(dp(16), 0, dp(16), 0);
        return b;
    }

    @Override
    public void onBackPressed() {
        /* Back is not an answer and not a refusal, but the phone has to stop
           ringing when somebody presses it, and the watch has to resume. */
        handled();
    }
}
