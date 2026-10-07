package app.voskhod.lockdown;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

/**
 * Fires at ~22:00: applies the night whitelist up front (defense in depth),
 * wakes the phone to the app so the JS layer engages LockTask, then re-arms
 * the next night. Also re-arms on boot.
 */
public class NightWakeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            NightWakeScheduler.scheduleNext(context);
            return;
        }
        if (!NightWakeScheduler.ACTION_NIGHT_LOCK.equals(action)) return;

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = null;
        if (pm != null) {
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "voskhod:nightlock");
            wl.acquire(15000);
        }
        try {
            LockdownManager lm = LockdownManager.from(context);
            if (lm.isDeviceOwner()) {
                lm.activateNightLock();
            }
            Intent i = new Intent(context, app.voskhod.MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
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
        NightWakeScheduler.scheduleNext(context);
    }
}