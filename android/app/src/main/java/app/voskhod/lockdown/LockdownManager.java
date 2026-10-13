package app.voskhod.lockdown;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;

import java.util.Arrays;

import app.voskhod.admin.GlowupDeviceAdmin;

public class LockdownManager {

    private static final String PREFS = "glowup-lockdown";
    private static final String KEY_WHITELIST = "whitelist";
    private static final String KEY_NORMAL_WHITELIST = "normalWhitelist";

    public static final String[] DEFAULT_WHITELIST = new String[] {
        "app.voskhod",
        "com.whatsapp",
        "com.andi.alquran.id"
    };

    public static final String[] NIGHT_WHITELIST = new String[] {
        "app.voskhod",
        "com.whatsapp",
        "com.spotify.music",
        "com.android.deskclock",
        "com.andi.alquran.id"
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
            dpm.setLockTaskPackages(adminComponent, getLockTaskPackages());
        } catch (Exception ignored) {
        }
    }

    /**
     * Whitelist plus the default launcher, so the Home button (when enabled via
     * LOCK_TASK_FEATURE_HOME) actually lands somewhere and the user is never
     * trapped inside a single allowlisted app.
     */
    private String[] getLockTaskPackages() {
        String[] base = getWhitelist();
        String home = getDefaultHomePackage();
        if (home == null || home.isEmpty()) return base;
        for (String p : base) {
            if (home.equals(p)) return base;
        }
        String[] merged = Arrays.copyOf(base, base.length + 1);
        merged[base.length] = home;
        return merged;
    }

    private String getDefaultHomePackage() {
        try {
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            ResolveInfo ri = context.getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            if (ri != null && ri.activityInfo != null) return ri.activityInfo.packageName;
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * Enable the keyguard plus Home/Overview while in lock task mode (API 28+).
     * Without this, lock task disables the keyguard entirely — so turning the
     * screen on jumps straight into the last app (no lock screen) and there is no
     * way back home. Enabling these keeps the phone usable but still allowlisted.
     *
     * @param features extra LOCK_TASK_FEATURE_* bits beyond KEYGUARD.
     */
    public void applyLockTaskFeatures(int features) {
        if (dpm == null || !isDeviceOwner()) return;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return;
        int flags = DevicePolicyManager.LOCK_TASK_FEATURE_KEYGUARD | features;
        try {
            dpm.setLockTaskFeatures(adminComponent, flags);
        } catch (Exception ignored) {
        }
    }

    public static final int FULL_FEATURES =
            DevicePolicyManager.LOCK_TASK_FEATURE_HOME | DevicePolicyManager.LOCK_TASK_FEATURE_OVERVIEW;

    /** Kiosk mode: keyguard only (Home disabled so the user can't dodge the prayer). */
    public void applyKioskFeatures() {
        applyLockTaskFeatures(0);
    }

    /**
     * Move the device to the night whitelist. Saves the current whitelist once
     * (only if it is not already the night list) so it can be restored later.
     */
    public void activateNightLock() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String[] cur = getWhitelist();
        if (!Arrays.equals(cur, NIGHT_WHITELIST)) {
            prefs.edit().putString(KEY_NORMAL_WHITELIST, String.join(",", cur)).apply();
        }
        setWhitelist(NIGHT_WHITELIST);
    }

    /** Restore the pre-night whitelist (or the default) and clear the backup. */
    public void deactivateNightLock() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String normal = prefs.getString(KEY_NORMAL_WHITELIST, null);
        String[] restored = (normal != null && !normal.isEmpty()) ? normal.split(",") : DEFAULT_WHITELIST;
        prefs.edit().remove(KEY_NORMAL_WHITELIST).apply();
        setWhitelist(restored);
    }

    public void enterLockdown(Activity activity) {
        applyLockTaskWhitelist();
        applyLockTaskFeatures(FULL_FEATURES);
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

    /**
     * Suspend/unsuspend a single app (device owner, API 24+). A suspended app
     * stays visible in the launcher but can't be launched until unsuspended —
     * used to lock Mobile Legends for the day once its habit is checked.
     */
    public boolean setAppSuspended(String pkg, boolean suspended) {
        if (dpm == null || !isDeviceOwner()) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false;
        try {
            dpm.setPackagesSuspended(adminComponent, new String[] { pkg }, suspended);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static LockdownManager from(Context context) {
        return new LockdownManager(context);
    }
}