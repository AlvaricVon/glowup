package app.voskhod.plugin;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.ref.WeakReference;
import java.util.concurrent.Executor;

import app.voskhod.lockdown.AdhanPlayer;
import app.voskhod.lockdown.LockScreenActivity;
import app.voskhod.lockdown.LockdownManager;
import app.voskhod.lockdown.NightWakeScheduler;
import app.voskhod.lockdown.PrayerWakeScheduler;

@CapacitorPlugin(name = "Lockdown")
public class LockdownPlugin extends Plugin {

    private static WeakReference<LockdownPlugin> instance;

    @Override
    public void load() {
        super.load();
        instance = new WeakReference<>(this);
    }

    public static void notifyUnlocked() {
        LockdownPlugin p = instance != null ? instance.get() : null;
        if (p != null) {
            p.notifyListeners("unlocked", new JSObject());
        }
    }

    @PluginMethod
    public void enterLockdown(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) { call.reject("no activity"); return; }
        LockdownManager m = LockdownManager.from(getContext());
        m.enterLockdown(activity);
        JSObject ret = new JSObject();
        ret.put("deviceOwner", m.isDeviceOwner());
        call.resolve(ret);
    }

    @PluginMethod
    public void exitLockdown(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) { call.reject("no activity"); return; }
        LockdownManager.from(getContext()).exitLockdown(activity);
        call.resolve();
    }

    @PluginMethod
    public void showLockScreen(PluginCall call) {
        String prayerName = call.getString("prayerName", "Sholat");
        Context ctx = getContext();
        Intent intent = new Intent(ctx, LockScreenActivity.class);
        intent.putExtra(LockScreenActivity.EXTRA_PRAYER_NAME, prayerName);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        ctx.startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void isDeviceOwner(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", LockdownManager.from(getContext()).isDeviceOwner());
        call.resolve(ret);
    }

    @PluginMethod
    public void getWhitelist(PluginCall call) {
        JSObject ret = new JSObject();
        com.getcapacitor.JSArray arr = new com.getcapacitor.JSArray();
        for (String pkg : LockdownManager.from(getContext()).getWhitelist()) arr.put(pkg);
        ret.put("packages", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void setWhitelist(PluginCall call) {
        com.getcapacitor.JSArray arr = call.getArray("packages");
        if (arr == null) { call.reject("packages required"); return; }
        try {
            String[] pkgs = new String[arr.length()];
            for (int i = 0; i < arr.length(); i++) pkgs[i] = arr.getString(i);
            LockdownManager.from(getContext()).setWhitelist(pkgs);
            call.resolve();
        } catch (Exception e) {
            call.reject("bad packages", e);
        }
    }

@PluginMethod
    public void authenticate(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) { call.reject("no activity"); return; }
        if (!(activity instanceof FragmentActivity)) { call.reject("need fragment activity"); return; }
FragmentActivity fa = (FragmentActivity) activity;
        BiometricManager bm = BiometricManager.from(getContext());
        // WEAK-only so MIUI offers the FACE sensor (no DEVICE_CREDENTIAL fallback).
        int result = bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK);
        if (result != BiometricManager.BIOMETRIC_SUCCESS) {
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("success", false);
            ret.put("cancelled", false);
            ret.put("needEnroll", result == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED);
            call.resolve(ret);
            return;
        }
        Executor executor = ContextCompat.getMainExecutor(fa);
        BiometricPrompt prompt = new BiometricPrompt(fa, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                JSObject ok = new JSObject();
                ok.put("available", true);
                ok.put("success", true);
                ok.put("cancelled", false);
                ok.put("needEnroll", false);
                call.resolve(ok);
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                JSObject err = new JSObject();
                err.put("available", true);
                err.put("success", false);
                err.put("cancelled", errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON || errorCode == BiometricPrompt.ERROR_USER_CANCELED);
                err.put("needEnroll", false);
                err.put("code", errorCode);
                err.put("message", errString != null ? errString.toString() : "");
                call.resolve(err);
            }
        });
        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Buka Panel Tersembunyi")
                .setSubtitle("Scan wajah buat masuk")
                .setNegativeButtonText("Batal")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK)
                .build();
        fa.runOnUiThread(() -> prompt.authenticate(info));
    }

@PluginMethod
    public void activateNightLock(PluginCall call) {
        LockdownManager.from(getContext()).activateNightLock();
        call.resolve();
    }

    @PluginMethod
    public void deactivateNightLock(PluginCall call) {
        LockdownManager.from(getContext()).deactivateNightLock();
        call.resolve();
    }

    @PluginMethod
    public void scheduleNightAlarm(PluginCall call) {
        NightWakeScheduler.scheduleNext(getContext());
        call.resolve();
    }

@PluginMethod
    public void openBiometricEnrollment(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent enroll = new Intent(Settings.ACTION_BIOMETRIC_ENROLL);
            enroll.putExtra(Settings.EXTRA_BIOMETRIC_AUTHENTICATORS_ALLOWED,
                    BiometricManager.Authenticators.BIOMETRIC_STRONG);
            enroll.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(enroll);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent sec = new Intent(Settings.ACTION_SECURITY_SETTINGS);
                sec.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(sec);
                call.resolve();
            } catch (Exception e2) {
                call.reject("no enrollment settings");
            }
        }
    }

    @PluginMethod
    public void playAdhan(PluginCall call) {
        AdhanPlayer.play(getContext());
        call.resolve();
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        AdhanPlayer.stop();
        call.resolve();
    }

    @PluginMethod
    public void schedulePrayerAlarms(PluginCall call) {
        com.getcapacitor.JSArray arr = call.getArray("alarms");
        if (arr == null) {
            call.reject("alarms required");
            return;
        }
        try {
            org.json.JSONArray json = new org.json.JSONArray();
            for (int i = 0; i < arr.length(); i++) {
                org.json.JSONObject o = arr.getJSONObject(i);
                org.json.JSONObject j = new org.json.JSONObject();
                j.put("t", o.optLong("t"));
                j.put("name", o.optString("name"));
                json.put(j);
            }
            PrayerWakeScheduler.schedule(getContext(), json);
            call.resolve();
        } catch (Exception e) {
            call.reject("bad alarms", e);
        }
    }
}

