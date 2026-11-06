package app.voskhod;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

import app.voskhod.admin.GlowupDeviceAdmin;
import app.voskhod.plugin.LockdownPlugin;

public class MainActivity extends BridgeActivity {

    /** Screen-off timeout raised by this app so long tasks don't cut out (1 hour). */
    public static final int SCREEN_OFF_TIMEOUT_MS = 60 * 60 * 1000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LockdownPlugin.class);
        super.onCreate(savedInstanceState);
        cancelLegacyWakeAlarms();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        extendScreenTimeout();
    }

    /**
     * Fitur adzan/night-lock udah dicabut. Batalkan sisa alarm lama yang masih
     * nempel di AlarmManager dari versi sebelumnya (receiver-nya udah dihapus).
     */
    private void cancelLegacyWakeAlarms() {
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am == null) return;
        cancelAlarms(am, "app.voskhod.lockdown.PrayerWakeReceiver", "app.voskhod.action.PRAYER", 5000, 20);
        cancelAlarms(am, "app.voskhod.lockdown.PrayerWakeReceiver", "app.voskhod.action.PRAYER_LOCK", 5100, 20);
        cancelAlarms(am, "app.voskhod.lockdown.NightWakeReceiver", "app.voskhod.action.NIGHT_LOCK", 0, 1);
    }

    private void cancelAlarms(AlarmManager am, String className, String action, int base, int count) {
        ComponentName cn = new ComponentName(this, className);
        for (int i = 0; i < count; i++) {
            Intent intent = new Intent();
            intent.setComponent(cn);
            intent.setAction(action);
            PendingIntent pi = PendingIntent.getBroadcast(this, base + i, intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }
    }

    /** As device owner, raise the system screen-off timeout (only ever raises, never lowers). */
    private void extendScreenTimeout() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        try {
            int current = Settings.System.getInt(getContentResolver(), Settings.System.SCREEN_OFF_TIMEOUT, -1);
            if (current >= SCREEN_OFF_TIMEOUT_MS) return;
            try {
                Settings.System.putInt(getContentResolver(), Settings.System.SCREEN_OFF_TIMEOUT, SCREEN_OFF_TIMEOUT_MS);
            } catch (SecurityException se) {
                DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(DEVICE_POLICY_SERVICE);
                ComponentName admin = new ComponentName(this, GlowupDeviceAdmin.class);
                if (dpm != null && dpm.isDeviceOwnerApp(getPackageName())) {
                    dpm.setGlobalSetting(admin, Settings.System.SCREEN_OFF_TIMEOUT, String.valueOf(SCREEN_OFF_TIMEOUT_MS));
                }
            }
        } catch (Exception ignored) {
        }
    }
}