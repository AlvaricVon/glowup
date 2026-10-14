package app.voskhod.lockdown;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.core.content.FileProvider;

import java.io.File;
import java.util.Arrays;

import app.voskhod.R;
import app.voskhod.plugin.LockdownPlugin;

public class LockScreenActivity extends Activity implements SensorEventListener {

    public static final String EXTRA_PRAYER_NAME = "prayer_name";

    private static final int REQ_PHOTO = 4211;

    /** Jarak yang harus ditempuh biar dianggap bangun. */
    private static final float TARGET_METERS = 30f;
    /** Perkiraan 1 langkah = 0.7 m. */
    private static final float STEP_METERS = 0.7f;
    private static final float STEP_THRESHOLD = 1.4f;
    private static final long MIN_STEP_MS = 300L;
    /** Kalau sensor gak gerak sama sekali sekian lama, kasih tombol skip. */
    private static final long WALK_SKIP_AFTER_MS = 75_000L;
    /** Kalau kamera gak jalan (misal vendor galak), kasih tombol skip. */
    private static final long PHOTO_SKIP_AFTER_MS = 180_000L;

    private enum Step { WALK, PHOTO, DONE }

    private LockdownManager lm;
    private boolean isSubuh = false;

    private TextView tvMessage;
    private LinearLayoutHolder ui = new LinearLayoutHolder();

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private float gravity = 9.81f;
    private boolean walkAbove = false;
    private long lastStepAt = 0L;
    private float walkedMeters = 0f;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private File photoFile;

    private final Runnable revealWalkSkip = () -> ui.btnWalkSkip.setVisibility(View.VISIBLE);
    private final Runnable revealPhotoSkip = () -> ui.btnPhotoSkip.setVisibility(View.VISIBLE);

    private static final class LinearLayoutHolder {
        View walkStep;
        View photoStep;
        View finalStep;
        TextView tvWalkCount;
        ProgressBar walkProgress;
        Button btnWalkSkip;
        Button btnTakePhoto;
        Button btnPhotoSkip;
        TextView tvPhotoStatus;
        ImageView imgProof;
        TextView tvProofLabel;
        Button btnUnlock;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_lock_screen);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                        | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);

        lm = LockdownManager.from(this);
        if (lm.isDeviceOwner()) {
            lm.applyLockTaskWhitelist();
            // Kiosk: keep the keyguard on but disable Home so the user can't dodge
            // the prayer by jumping to the launcher.
            lm.applyKioskFeatures();
            try {
                startLockTask();
            } catch (Exception ignored) {
            }
        }

        String prayerName = getIntent().getStringExtra(EXTRA_PRAYER_NAME);
        if (prayerName == null) prayerName = "Sholat";
        isSubuh = "Subuh".equalsIgnoreCase(prayerName);

        TextView tvPrayer = findViewById(R.id.tvPrayerName);
        tvMessage = findViewById(R.id.tvMessage);
        tvPrayer.setText(prayerName);

        ui.walkStep = findViewById(R.id.walkStep);
        ui.photoStep = findViewById(R.id.photoStep);
        ui.finalStep = findViewById(R.id.finalStep);
        ui.tvWalkCount = findViewById(R.id.tvWalkCount);
        ui.walkProgress = findViewById(R.id.walkProgress);
        ui.btnWalkSkip = findViewById(R.id.btnWalkSkip);
        ui.btnTakePhoto = findViewById(R.id.btnTakePhoto);
        ui.btnPhotoSkip = findViewById(R.id.btnPhotoSkip);
        ui.tvPhotoStatus = findViewById(R.id.tvPhotoStatus);
        ui.imgProof = findViewById(R.id.imgProof);
        ui.tvProofLabel = findViewById(R.id.tvProofLabel);
        ui.btnUnlock = findViewById(R.id.btnUnlock);

        ui.btnWalkSkip.setOnClickListener(v -> completeWalk());
        ui.btnTakePhoto.setOnClickListener(v -> takeFaucetPhoto());
        ui.btnPhotoSkip.setOnClickListener(v -> setStep(Step.DONE));
        ui.btnUnlock.setOnClickListener(v -> confirmPrayer());

        tvMessage.setText("Waktu " + prayerName + ". Belum konfirmasi = HP tetap terkunci.");
        ui.finalStep.setVisibility(View.VISIBLE);

        if (isSubuh) {
            // Subuh: harus lewatin bangun dulu (jalan) + foto keran sebelum tombol konfirmasi.
            tvMessage.setText("Subuh. Ikutin dulu langkah-langkahnya — ini biar lo beneran bangun, bukan cuma ngeklik.");
            setStep(Step.WALK);
        } else {
            setStep(Step.DONE);
        }
    }

    private void setStep(Step step) {
        handler.removeCallbacks(revealWalkSkip);
        handler.removeCallbacks(revealPhotoSkip);
        ui.walkStep.setVisibility(step == Step.WALK ? View.VISIBLE : View.GONE);
        ui.photoStep.setVisibility(step == Step.PHOTO ? View.VISIBLE : View.GONE);
        ui.finalStep.setVisibility(step == Step.DONE ? View.VISIBLE : View.GONE);
        if (step == Step.WALK) {
            startWalkSensor();
            handler.postDelayed(revealWalkSkip, WALK_SKIP_AFTER_MS);
        } else if (step == Step.PHOTO) {
            stopWalkSensor();
            handler.postDelayed(revealPhotoSkip, PHOTO_SKIP_AFTER_MS);
        } else {
            stopWalkSensor();
        }
    }

    private void startWalkSensor() {
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager == null) return;
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (accelerometer == null) {
            ui.btnWalkSkip.setVisibility(View.VISIBLE);
            return;
        }
        sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
    }

    private void stopWalkSensor() {
        if (sensorManager != null) {
            try {
                sensorManager.unregisterListener(this);
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];
        float mag = (float) Math.sqrt(x * x + y * y + z * z);
        gravity = gravity + 0.15f * (mag - gravity);
        float acc = mag - gravity;
        long now = System.currentTimeMillis();
        if (acc > STEP_THRESHOLD && !walkAbove && now - lastStepAt > MIN_STEP_MS) {
            walkAbove = true;
            lastStepAt = now;
            addWalked(STEP_METERS);
        } else if (acc < STEP_THRESHOLD * 0.4f) {
            walkAbove = false;
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // no-op
    }

    private void addWalked(float meters) {
        if (walkedMeters >= TARGET_METERS) return;
        walkedMeters = Math.min(TARGET_METERS, walkedMeters + meters);
        int rounded = Math.round(walkedMeters);
        ui.tvWalkCount.setText(rounded + " / " + (int) TARGET_METERS + " meter");
        ui.walkProgress.setProgress(rounded);
        if (walkedMeters >= TARGET_METERS) {
            completeWalk();
        }
    }

    private void completeWalk() {
        stopWalkSensor();
        handler.removeCallbacks(revealWalkSkip);
        setStep(Step.PHOTO);
    }

    private void takeFaucetPhoto() {
        ui.tvPhotoStatus.setText("");
        Intent ci = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        ResolveInfo ri = getPackageManager().resolveActivity(ci, 0);
        if (ri == null || ri.activityInfo == null) {
            // Gak ada app kamera — jangan sampe nyangkut, lanjut aja.
            ui.tvPhotoStatus.setText("Kamera gak kedetek. Lanjut aja.");
            setStep(Step.DONE);
            return;
        }
        String cameraPkg = ri.activityInfo.packageName;
        try {
            File dir = new File(getCacheDir(), "subuh");
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
            photoFile = new File(dir, "keran_" + System.currentTimeMillis() + ".jpg");
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photoFile);
            ci.putExtra(MediaStore.EXTRA_OUTPUT, uri);
            ci.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            // Camera bukan app whitelist, jadi masukin sementara biar bisa dibuka walau kiosk.
            lm.addLockTaskPackage(cameraPkg);
            startActivityForResult(ci, REQ_PHOTO);
        } catch (Exception e) {
            ui.tvPhotoStatus.setText("Gagal buka kamera. Coba lagi.");
            lm.applyLockTaskWhitelist();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_PHOTO) return;
        // Balikin whitelist kiosk (buang app kamera).
        lm.applyLockTaskWhitelist();

        boolean saved = photoFile != null && photoFile.exists() && photoFile.length() > 0;
        Bitmap thumb = null;
        if (data != null) {
            try {
                Object extra = data.getParcelableExtra("data");
                if (extra instanceof Bitmap) thumb = (Bitmap) extra;
            } catch (Exception ignored) {
            }
        }
        boolean ok = resultCode == RESULT_OK && (saved || thumb != null);
        if (ok) {
            Bitmap bmp = saved ? decodeSampledBitmap(photoFile, 480, 480) : thumb;
            if (bmp != null) {
                ui.imgProof.setImageBitmap(bmp);
                ui.imgProof.setVisibility(View.VISIBLE);
            }
            ui.tvProofLabel.setVisibility(View.VISIBLE);
            setStep(Step.DONE);
        } else {
            ui.tvPhotoStatus.setText("Fotonya belum keambil. Coba lagi ya.");
        }
    }

    private static Bitmap decodeSampledBitmap(File file, int reqW, int reqH) {
        try {
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(file.getAbsolutePath(), bounds);
            int sample = 1;
            while (bounds.outWidth / sample > reqW * 2 || bounds.outHeight / sample > reqH * 2) {
                sample *= 2;
            }
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inSampleSize = Math.max(1, sample);
            return BitmapFactory.decodeFile(file.getAbsolutePath(), opts);
        } catch (Exception e) {
            return null;
        }
    }

    private void confirmPrayer() {
        try {
            stopLockTask();
        } catch (Exception ignored) {
        }
        AdhanPlayer.stop();
        LockdownPlugin.notifyUnlocked();
        // Bring the app back so the JS gate can re-engage and keep the phone
        // locked while the period's habits are still unfinished. Also do it for
        // maghrib/isya when a period gate is currently holding the lock, since
        // stopping this kiosk also exits lock task mode device-wide.
        boolean dayGate = "Subuh".equalsIgnoreCase(getIntent().getStringExtra(EXTRA_PRAYER_NAME))
                || "Dzuhur".equalsIgnoreCase(getIntent().getStringExtra(EXTRA_PRAYER_NAME))
                || "Ashar".equalsIgnoreCase(getIntent().getStringExtra(EXTRA_PRAYER_NAME));
        boolean gateActive = Arrays.equals(lm.getWhitelist(), LockdownManager.NIGHT_WHITELIST);
        if (dayGate || gateActive) {
            try {
                Intent i = new Intent(LockScreenActivity.this, app.voskhod.MainActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(i);
            } catch (Exception ignored) {
            }
        }
        finish();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(revealWalkSkip);
        handler.removeCallbacks(revealPhotoSkip);
        stopWalkSensor();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // blocked on purpose
    }
}
