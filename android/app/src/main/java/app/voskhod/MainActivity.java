package app.voskhod;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

import app.voskhod.admin.GlowupDeviceAdmin;
import app.voskhod.lockdown.NightWakeScheduler;
import app.voskhod.plugin.LockdownPlugin;

public class MainActivity extends BridgeActivity {

    /** Screen-off timeout raised by this app so long tasks don't cut out (1 hour). */
    public static final int SCREEN_OFF_TIMEOUT_MS = 60 * 60 * 1000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LockdownPlugin.class);
        super.onCreate(savedInstanceState);
        // Lock jam 22.00 udah dicabut — batalkan alarm malam kalo masih kepasang.
        NightWakeScheduler.cancel(this);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        extendScreenTimeout();
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