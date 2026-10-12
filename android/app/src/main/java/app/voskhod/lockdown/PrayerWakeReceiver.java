package app.voskhod.lockdown;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

/**
 * Fires at an upcoming prayer time: applies the lock-task whitelist, starts the
 * adhan (once; loops for Subuh) and opens the native prayer lock screen kiosk on
 * top of whatever app is open. Also re-arms saved alarms after boot.
 */
public class PrayerWakeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            PrayerWakeScheduler.rescheduleAfterBoot(context);
            return;
        }
        if (!PrayerWakeScheduler.ACTION_PRAYER.equals(action)) return;

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = null;
        if (pm != null) {
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "voskhod:prayer");
            wl.acquire(20000);
        }
        try {
            String name = intent.getStringExtra("prayerName");
            if (name == null || name.isEmpty()) name = "Waktunya Sholat";
            boolean subuh = "Subuh".equalsIgnoreCase(name);

            LockdownManager lm = LockdownManager.from(context);
            if (lm.isDeviceOwner()) {
                lm.applyLockTaskWhitelist();
            }
            AdhanPlayer.play(context, subuh);
            Intent i = new Intent(context, LockScreenActivity.class);
            i.putExtra(LockScreenActivity.EXTRA_PRAYER_NAME, name);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(i);
        } catch (Exception ignored) {
        } finally {
            if (wl != null && wl.isHeld()) {
                try {
                    wl.release();
                } catch (Exception ignored) {
                }
            }
        }
    }
}