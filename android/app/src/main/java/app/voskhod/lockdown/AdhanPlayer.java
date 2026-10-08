package app.voskhod.lockdown;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.PowerManager;
import android.util.Log;

import app.voskhod.R;

/**
 * Plays the adhan through the ALARM audio stream (like a system alarm) so it
 * rings loudly and reliably even when media/notification volume is low, the ringer
 * is on silent, or the WebView would block autoplay.
 */
public class AdhanPlayer {

    private static final String TAG = "AdhanPlayer";
    private static MediaPlayer player;

    public static synchronized void play(Context context) {
        stop();
        if (context == null) return;
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                am.setStreamVolume(AudioManager.STREAM_ALARM, max, 0);
            }

            MediaPlayer mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mp.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
            mp.setDataSource(context, Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.adhan));
            mp.setLooping(true);
            mp.setOnPreparedListener(MediaPlayer::start);
            mp.setOnErrorListener((p, what, extra) -> {
                Log.w(TAG, "adhan play error what=" + what + " extra=" + extra);
                p.release();
                if (player == p) player = null;
                return true;
            });
            mp.prepareAsync();
            player = mp;
        } catch (Exception e) {
            Log.w(TAG, "adhan play failed", e);
        }
    }

    public static synchronized void stop() {
        try {
            if (player != null) {
                MediaPlayer p = player;
                player = null;
                try {
                    if (p.isPlaying()) {
                        p.stop();
                    }
                } catch (Exception ignored) {
                }
                p.release();
            }
        } catch (Exception ignored) {
        }
    }
}