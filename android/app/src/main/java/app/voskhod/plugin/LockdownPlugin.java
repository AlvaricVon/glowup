package app.voskhod.plugin;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.lang.ref.WeakReference;

import app.voskhod.lockdown.LockScreenActivity;
import app.voskhod.lockdown.LockdownManager;

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
}