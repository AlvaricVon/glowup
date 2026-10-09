package app.voskhod.lockdown;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Schedules exact alarms for each upcoming prayer time. When one fires,
 * {@link PrayerWakeReceiver} shows the native prayer lock screen (and the JS
 * layer can be frozen in the background, the alarm still fires).
 */
public class PrayerWakeScheduler {

    public static final String ACTION_PRAYER = "app.voskhod.action.PRAYER";
    public static final String ACTION_PRAYER_LOCK = "app.voskhod.action.PRAYER_LOCK";

    /** Grace after the adhan starts before the prayer lock screen kiosk engages. */
    public static final long GRACE_MS = 10L * 60 * 1000;

    private static final String PREFS = "glowup-prayer-alarms";
    private static final String KEY_TIMES = "times";
    private static final int REQ_BASE = 5000;
    private static final int REQ_GRACE_BASE = 5100;
    private static final int MAX_ALARMS = 20;

    /** alarms = [{ t: epochMillis, name: "Dzuhur" }] (only future ones are scheduled). */
    public static void schedule(Context ctx, JSONArray alarms) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        cancelAll(ctx);

        long now = System.currentTimeMillis();
        int idx = 0;
        for (int i = 0; i < alarms.length() && idx < MAX_ALARMS; i++) {
            try {
                JSONObject o = alarms.getJSONObject(i);
                long t = o.optLong("t");
                String name = o.optString("name", "");
                if (t <= now + 30_000L) continue;

                // Stage 1: at prayer time, only the adhan rings (no lock yet).
                Intent adhan = new Intent(ctx, PrayerWakeReceiver.class).setAction(ACTION_PRAYER);
                adhan.putExtra("prayerName", name);
                PendingIntent piAdhan = PendingIntent.getBroadcast(ctx, REQ_BASE + idx, adhan,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                try {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, piAdhan);
                } catch (SecurityException se) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, piAdhan);
                }

                // Stage 2: after the grace period, engage the prayer lock screen.
                Intent lock = new Intent(ctx, PrayerWakeReceiver.class).setAction(ACTION_PRAYER_LOCK);
                lock.putExtra("prayerName", name);
                PendingIntent piLock = PendingIntent.getBroadcast(ctx, REQ_GRACE_BASE + idx, lock,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                try {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t + GRACE_MS, piLock);
                } catch (SecurityException se) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t + GRACE_MS, piLock);
                }

                idx++;
            } catch (Exception ignored) {
            }
        }

        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_TIMES, alarms.toString()).apply();
    }

    public static void cancelAll(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (int i = 0; i < MAX_ALARMS; i++) {
            Intent adhan = new Intent(ctx, PrayerWakeReceiver.class).setAction(ACTION_PRAYER);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, REQ_BASE + i, adhan,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
            Intent lock = new Intent(ctx, PrayerWakeReceiver.class).setAction(ACTION_PRAYER_LOCK);
            PendingIntent p2 = PendingIntent.getBroadcast(ctx, REQ_GRACE_BASE + i, lock,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (p2 != null) {
                am.cancel(p2);
                p2.cancel();
            }
        }
    }

    public static void rescheduleAfterBoot(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_TIMES, null);
        if (raw == null || raw.isEmpty()) return;
        try {
            schedule(ctx, new JSONArray(raw));
        } catch (Exception ignored) {
        }
    }
}