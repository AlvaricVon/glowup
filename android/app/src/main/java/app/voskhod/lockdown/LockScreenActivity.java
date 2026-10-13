package app.voskhod.lockdown;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import java.util.Arrays;

import app.voskhod.R;
import app.voskhod.plugin.LockdownPlugin;

public class LockScreenActivity extends Activity {

    public static final String EXTRA_PRAYER_NAME = "prayer_name";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_lock_screen);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                        | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);

        LockdownManager lm = LockdownManager.from(this);
        if (lm.isDeviceOwner()) {
            lm.applyLockTaskWhitelist();
            // Kiosk: keep the keyguard on but disable Home so the user can't dodge
            // the prayer by jumping to the launcher.
            lm.applyKioskFeatures();
            try {
                startLockTask();
            } catch (Exception ignored) {
            }
        }

        String prayerName = getIntent().getStringExtra(EXTRA_PRAYER_NAME);
        if (prayerName == null) prayerName = "Sholat";

        TextView tvPrayer = findViewById(R.id.tvPrayerName);
        TextView tvMsg = findViewById(R.id.tvMessage);
        Button btnUnlock = findViewById(R.id.btnUnlock);

        tvPrayer.setText(prayerName);
        tvMsg.setText("Waktu " + prayerName + ". Belum konfirmasi = HP tetap terkunci.");

        boolean dayGate = "Subuh".equalsIgnoreCase(prayerName)
                || "Dzuhur".equalsIgnoreCase(prayerName)
                || "Ashar".equalsIgnoreCase(prayerName);

        btnUnlock.setOnClickListener(v -> {
            try {
                stopLockTask();
            } catch (Exception ignored) {
            }
            AdhanPlayer.stop();
            LockdownPlugin.notifyUnlocked();
            // Bring the app back so the JS gate can re-engage and keep the phone
            // locked while the period's habits are still unfinished. Also do it for
            // maghrib/isya when a period gate is currently holding the lock, since
            // stopping this kiosk also exits lock task mode device-wide.
            boolean gateActive = Arrays.equals(lm.getWhitelist(), LockdownManager.NIGHT_WHITELIST);
            if (dayGate || gateActive) {
                try {
                    Intent i = new Intent(LockScreenActivity.this, app.voskhod.MainActivity.class);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(i);
                } catch (Exception ignored) {
                }
            }
            finish();
        });
    }

    @Override
    public void onBackPressed() {
        // blocked on purpose
    }
}