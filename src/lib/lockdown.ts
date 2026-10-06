import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

interface LockdownPlugin {
  enterLockdown(): Promise<{ deviceOwner: boolean }>;
  exitLockdown(): Promise<void>;
  showLockScreen(opts: { prayerName: string }): Promise<void>;
  isDeviceOwner(): Promise<{ value: boolean }>;
  getWhitelist(): Promise<{ packages: string[] }>;
  setWhitelist(opts: { packages: string[] }): Promise<void>;
  addListener(eventName: 'unlocked', listenerFunc: () => void): Promise<PluginListenerHandle>;
}

const Native = registerPlugin<LockdownPlugin>('Lockdown');

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function enterLockdown(): Promise<{ deviceOwner: boolean } | null> {
  if (!isNative()) return null;
  try {
    return await Native.enterLockdown();
  } catch {
    return null;
  }
}

export async function exitLockdown(): Promise<void> {
  if (!isNative()) return;
  try {
    await Native.exitLockdown();
  } catch {
    // noop
  }
}

export async function showNativeLockScreen(prayerName: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await Native.showLockScreen({ prayerName });
    return true;
  } catch {
    return false;
  }
}

export async function nativeIsDeviceOwner(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const r = await Native.isDeviceOwner();
    return !!r.value;
  } catch {
    return false;
  }
}

export async function onNativeUnlock(cb: () => void): Promise<void> {
  if (!isNative()) return;
  try {
    await Native.addListener('unlocked', cb);
  } catch {
    // noop
  }
}

const DEFAULT_WHITELIST = ['app.voskhod', 'com.whatsapp'];

export async function nativeGetWhitelist(): Promise<string[]> {
  if (!isNative()) return [...DEFAULT_WHITELIST];
  try {
    const r = await Native.getWhitelist();
    return Array.isArray(r.packages) && r.packages.length > 0 ? r.packages : [...DEFAULT_WHITELIST];
  } catch {
    return [...DEFAULT_WHITELIST];
  }
}

export async function nativeSetWhitelist(packages: string[]): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await Native.setWhitelist({ packages });
    return true;
  } catch {
    return false;
  }
}