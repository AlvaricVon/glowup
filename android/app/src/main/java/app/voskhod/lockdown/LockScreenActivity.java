package app.voskhod.lockdown;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

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

        btnUnlock.setOnClickListener(v -> {
            try {
                stopLockTask();
            } catch (Exception ignored) {
            }
            AdhanPlayer.stop();
            LockdownPlugin.notifyUnlocked();
            finish();
        });
    }

    @Override
    public void onBackPressed() {
        // blocked on purpose
    }
}