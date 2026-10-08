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

    private static final String PREFS = "glowup-prayer-alarms";
    private static final String KEY_TIMES = "times";
    private static final int REQ_BASE = 5000;
    private static final int MAX_ALARMS = 20;

    /** alarms = [{ t: epochMillis, name: "Dzuhur" }] (only future ones are scheduled). */
    public static void schedule(Context ctx, JSONArray alarms) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        for (int i = 0; i < MAX_ALARMS; i++) {
            Intent cancelIntent = new Intent(ctx, PrayerWakeReceiver.class).setAction(ACTION_PRAYER);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, REQ_BASE + i, cancelIntent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        }

        long now = System.currentTimeMillis();
        int idx = 0;
        for (int i = 0; i < alarms.length() && idx < MAX_ALARMS; i++) {
            try {
                JSONObject o = alarms.getJSONObject(i);
                long t = o.optLong("t");
                String name = o.optString("name", "");
                if (t <= now + 30_000L) continue;

                Intent intent = new Intent(ctx, PrayerWakeReceiver.class).setAction(ACTION_PRAYER);
                intent.putExtra("prayerName", name);
                PendingIntent pi = PendingIntent.getBroadcast(ctx, REQ_BASE + idx, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                try {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, pi);
                } catch (SecurityException se) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, pi);
                }
                idx++;
            } catch (Exception ignored) {
            }
        }

        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_TIMES, alarms.toString()).apply();
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