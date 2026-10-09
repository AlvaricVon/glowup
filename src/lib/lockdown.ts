import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

interface LockdownPlugin {
  enterLockdown(): Promise<{ deviceOwner: boolean }>;
  exitLockdown(): Promise<void>;
  showLockScreen(opts: { prayerName: string }): Promise<void>;
  isDeviceOwner(): Promise<{ value: boolean }>;
  getWhitelist(): Promise<{ packages: string[] }>;
  setWhitelist(opts: { packages: string[] }): Promise<void>;
  authenticate(opts: { reason: string }): Promise<{
    available: boolean;
    success: boolean;
    cancelled: boolean;
    needEnroll: boolean;
    code: number;
    message: string;
  }>;
  openBiometricEnrollment(): Promise<void>;
  activateNightLock(): Promise<void>;
  deactivateNightLock(): Promise<void>;
  scheduleNightAlarm(): Promise<void>;
  playAdhan(opts: { loop: boolean }): Promise<void>;
  stopAdhan(): Promise<void>;
  schedulePrayerAlarms(opts: { alarms: { t: number; name: string }[] }): Promise<void>;
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

declare global {
  interface Window {
    __glowup?: {
      enterLockdown?: () => Promise<{ deviceOwner: boolean } | null>;
      exitLockdown?: () => Promise<void>;
      showLockScreen?: (prayerName: string) => Promise<boolean>;
      isDeviceOwner?: () => Promise<boolean>;
      getWhitelist?: () => Promise<string[]>;
      authenticate?: (reason: string) => Promise<NativeAuthResult | null>;
      nightApply?: () => Promise<boolean>;
      nightRelease?: () => Promise<boolean>;
      nightCompleteAllPagi?: () => Promise<number>;
      scheduleNightAlarm?: () => Promise<void>;
      playAdhan?: () => Promise<void>;
      stopAdhan?: () => Promise<void>;
      getNightState?: () => { active: boolean; date: string; pagiRemaining: number };
    };
  }
}

export interface NativeAuthResult {
  available: boolean;
  success: boolean;
  cancelled: boolean;
  needEnroll: boolean;
}

export async function nativeAuthenticate(reason: string): Promise<NativeAuthResult | null> {
  if (!isNative()) return null;
  try {
    const r = await Native.authenticate({ reason });
    return {
      available: !!r.available,
      success: !!r.success,
      cancelled: !!r.cancelled,
      needEnroll: !!r.needEnroll,
    };
  } catch {
    return null;
  }
}

export async function nativeOpenBiometricEnrollment(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await Native.openBiometricEnrollment();
    return true;
  } catch {
    return false;
  }
}

export async function nativeActivateNightLock(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await Native.activateNightLock();
    return true;
  } catch {
    return false;
  }
}

export async function nativeDeactivateNightLock(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await Native.deactivateNightLock();
    return true;
  } catch {
    return false;
  }
}

export async function nativeScheduleNightAlarm(): Promise<void> {
  if (!isNative()) return;
  try {
    await Native.scheduleNightAlarm();
  } catch {
    // noop
  }
}

export async function nativePlayAdhan(loop = false): Promise<void> {
  if (!isNative()) return;
  try {
    await Native.playAdhan({ loop });
  } catch {
    // noop
  }
}

export async function nativeStopAdhan(): Promise<void> {
  if (!isNative()) return;
  try {
    await Native.stopAdhan();
  } catch {
    // noop
  }
}

export async function nativeSchedulePrayerAlarms(alarms: { t: number; name: string }[]): Promise<void> {
  if (!isNative() || alarms.length === 0) return;
  try {
    await Native.schedulePrayerAlarms({ alarms });
  } catch {
    // noop
  }
}

if (isNative()) {
  window.__glowup = {
    enterLockdown,
    exitLockdown,
    showLockScreen: showNativeLockScreen,
    isDeviceOwner: nativeIsDeviceOwner,
    getWhitelist: nativeGetWhitelist,
    authenticate: nativeAuthenticate,
    playAdhan: nativePlayAdhan,
    stopAdhan: nativeStopAdhan,
  };
}