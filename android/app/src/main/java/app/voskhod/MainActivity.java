package app.voskhod;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import app.voskhod.plugin.LockdownPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LockdownPlugin.class);
        super.onCreate(savedInstanceState);
    }
}