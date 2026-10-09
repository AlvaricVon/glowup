package app.voskhod.lockdown;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

/**
 * Fires at an upcoming prayer time: applies the lock-task whitelist, opens the
 * native prayer lock screen on top of whatever app is open, and starts the adhan
 * through the ALARM stream. Also re-arms saved alarms after boot.
 */
public class PrayerWakeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            PrayerWakeScheduler.rescheduleAfterBoot(context);
            return;
        }
        if (!PrayerWakeScheduler.ACTION_PRAYER.equals(action)
                && !PrayerWakeScheduler.ACTION_PRAYER_LOCK.equals(action)) return;

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

            if (PrayerWakeScheduler.ACTION_PRAYER.equals(action)) {
                // Stage 1: adhan only. No lock, no overlay — user keeps using apps.
                AdhanPlayer.play(context, subuh);
                return;
            }

            // Stage 2: engage the actual prayer lock screen (kiosk).
            LockdownManager lm = LockdownManager.from(context);
            if (lm.isDeviceOwner()) {
                lm.applyLockTaskWhitelist();
            }
            if (subuh && !AdhanPlayer.isPlaying()) {
                AdhanPlayer.play(context, true);
            }
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