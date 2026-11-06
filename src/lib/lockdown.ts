import { Capacitor, registerPlugin } from '@capacitor/core';

interface LockdownPlugin {
  authenticate(opts: { reason: string }): Promise<{
    available: boolean;
    success: boolean;
    cancelled: boolean;
    needEnroll: boolean;
    code: number;
    message: string;
  }>;
  openApp(opts: { package: string }): Promise<{ ok: boolean }>;
  uninstallApp(opts: { package: string }): Promise<{ ok: boolean }>;
  getInstalledApps(): Promise<{ apps: { package: string; label: string }[] }>;
}

const Native = registerPlugin<LockdownPlugin>('Lockdown');

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
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

export interface InstalledApp {
  package: string;
  label: string;
}

export async function nativeGetInstalledApps(): Promise<InstalledApp[]> {
  if (!isNative()) return [];
  try {
    const r = await Native.getInstalledApps();
    return Array.isArray(r.apps) ? r.apps : [];
  } catch {
    return [];
  }
}

export async function nativeOpenApp(pkg: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const r = await Native.openApp({ package: pkg });
    return !!r.ok;
  } catch {
    return false;
  }
}

export async function nativeUninstallApp(pkg: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const r = await Native.uninstallApp({ package: pkg });
    return !!r.ok;
  } catch {
    return false;
  }
}
