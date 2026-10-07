package app.voskhod.lockdown;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import java.util.Calendar;

/** Re-arms the nightly 22:00 alarm that wakes the app into its night lock. */
public class NightWakeScheduler {

    public static final int NIGHT_HOUR = 22;
    public static final String ACTION_NIGHT_LOCK = "app.voskhod.action.NIGHT_LOCK";

    public static void scheduleNext(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar next = Calendar.getInstance();
        Calendar now = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, NIGHT_HOUR);
        next.set(Calendar.MINUTE, 0);
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (!next.after(now)) {
            next.add(Calendar.DAY_OF_YEAR, 1);
        }
        PendingIntent pi = makePendingIntent(context);
        try {
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(next.getTimeInMillis(), pi), pi);
        } catch (SecurityException ignored) {
            // Exact-alarm permission not granted; fall back to an inexact wake.
            try {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), pi);
            } catch (SecurityException ignored2) {
                // give up — the JS polling loop still guards while the app is open
            }
        }
    }

    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(makePendingIntent(context));
    }

    private static PendingIntent makePendingIntent(Context context) {
        Intent intent = new Intent(context, NightWakeReceiver.class);
        intent.setAction(ACTION_NIGHT_LOCK);
        return PendingIntent.getBroadcast(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}