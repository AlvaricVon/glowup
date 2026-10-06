package app.voskhod.lockdown;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import app.voskhod.admin.GlowupDeviceAdmin;

public class LockdownManager {

    private static final String PREFS = "glowup-lockdown";
    private static final String KEY_WHITELIST = "whitelist";

    public static final String[] DEFAULT_WHITELIST = new String[] {
        "app.voskhod",
        "com.whatsapp"
    };

    private final Context context;
    private final DevicePolicyManager dpm;
    private final ComponentName adminComponent;

    public LockdownManager(Context context) {
        this.context = context;
        this.dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(context, GlowupDeviceAdmin.class);
    }

    public boolean isDeviceOwner() {
        return dpm != null && dpm.isDeviceOwnerApp(context.getPackageName());
    }

    public String[] getWhitelist() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String csv = prefs.getString(KEY_WHITELIST, null);
        if (csv == null || csv.isEmpty()) return DEFAULT_WHITELIST;
        return csv.split(",");
    }

    public void setWhitelist(String[] packages) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_WHITELIST, String.join(",", packages)).apply();
        applyLockTaskWhitelist();
    }

    public void applyLockTaskWhitelist() {
        if (dpm == null || !isDeviceOwner()) return;
        try {
            dpm.setLockTaskPackages(adminComponent, getWhitelist());
        } catch (Exception ignored) {
        }
    }

    public void enterLockdown(Activity activity) {
        applyLockTaskWhitelist();
        if (isDeviceOwner()) {
            try {
                activity.startLockTask();
            } catch (Exception ignored) {
            }
        }
    }

    public void exitLockdown(Activity activity) {
        try {
            activity.stopLockTask();
        } catch (Exception ignored) {
        }
    }

    public static LockdownManager from(Context context) {
        return new LockdownManager(context);
    }
}