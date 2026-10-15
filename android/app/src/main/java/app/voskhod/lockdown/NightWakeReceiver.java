package app.voskhod.lockdown;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Dulu ngunci HP tiap jam 22:00. Fitur lock malam udah dicabut, jadi receiver ini
 * cuma beresin: kalo masih ada alarm malam kepasang dari versi lama, dibatalkan.
 */
public class NightWakeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            NightWakeScheduler.cancel(context);
            return;
        }
        if (!NightWakeScheduler.ACTION_NIGHT_LOCK.equals(action)) return;
        // Fitur lock jam 22.00 udah gak dipake — jangan lock apa-apa, jangan re-arm.
        NightWakeScheduler.cancel(context);
    }
}