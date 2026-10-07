import { useCallback, useEffect, useState } from 'react';
import { Crosshair, MapPin, Play, RefreshCw, ScanFace, Shield, ShieldAlert, X } from 'lucide-react';
import { PRAYER_METHODS, calculateDayPrayers, type PrayerTime } from '../lib/prayer';
import { getCachedCoords, requestCoords, setCachedCoords, type Coords } from '../lib/location';
import {
  isNative,
  nativeAuthenticate,
  nativeGetWhitelist,
  nativeIsDeviceOwner,
  nativeOpenBiometricEnrollment,
  nativeSetWhitelist,
} from '../lib/lockdown';
import { playAdhan, stopAdhan, unlockAudio } from '../lib/adhanAudio';
import { DEFAULT_SETTINGS, usePrayerSettings } from '../lib/prayerSettings';

interface Props {
  onClose: () => void;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-left dark:border-neutral-800/80 dark:bg-neutral-900/60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand-500' : 'bg-neutral-300 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function PrayerPanel({ onClose }: Props) {
  const settings = usePrayerSettings();
  const [coords, setCoords] = useState<Coords | null>(getCachedCoords());
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [deviceOwner, setDeviceOwner] = useState<boolean | null>(null);
  const [whitelistText, setWhitelistText] = useState('');
  const [whitelistMsg, setWhitelistMsg] = useState('');
  const [locMsg, setLocMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState<'checking' | 'auth' | 'open'>('checking');
  const [authMsg, setAuthMsg] = useState('');
  const [needEnroll, setNeedEnroll] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isNative()) {
        if (!cancelled) setAuth('open');
        return;
      }
      setAuth('checking');
      const r = await nativeAuthenticate('Buka Panel Tersembunyi');
      if (cancelled) return;
      if (r?.success) {
        setAuth('open');
      } else if (r?.needEnroll) {
        setNeedEnroll(true);
        setAuthMsg('Wajah/sidik jari belum didaftarin di HP. Daftarin dulu biar bisa buka.');
        setAuth('auth');
      } else if (r?.available) {
        setNeedEnroll(false);
        setAuthMsg(r.cancelled ? 'Batal. Scan lagi pas lo siap.' : 'Gagal scan, coba lagi.');
        setAuth('auth');
      } else {
        setAuth('open');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const retryAuth = useCallback(async () => {
    setScanning(true);
    setAuthMsg('');
    const r = await nativeAuthenticate('Buka Panel Tersembunyi');
    setScanning(false);
    if (r?.success) {
      setAuth('open');
    } else if (r?.needEnroll) {
      setNeedEnroll(true);
      setAuthMsg('Wajah/sidik jari belum didaftarin di HP. Daftarin dulu biar bisa buka.');
    } else if (r?.available) {
      setNeedEnroll(false);
      setAuthMsg(r.cancelled ? 'Batal. Scan lagi pas lo siap.' : 'Gagal scan, coba lagi.');
    } else {
      setAuth('open');
    }
  }, []);

  useEffect(() => {
    void nativeGetWhitelist().then((pkgs) => setWhitelistText(pkgs.join('\n')));
    if (isNative()) {
      void nativeIsDeviceOwner().then(setDeviceOwner);
    } else {
      setDeviceOwner(null);
    }
  }, []);

  useEffect(() => {
    if (!coords) {
      setPrayers([]);
      return;
    }
    try {
      setPrayers(
        calculateDayPrayers({ latitude: coords.latitude, longitude: coords.longitude, method: settings.method }),
      );
    } catch {
      setPrayers([]);
    }
  }, [coords, settings.method]);

  const refreshLocation = useCallback(async () => {
    setBusy(true);
    setLocMsg('');
    try {
      const c = await requestCoords();
      setCoords(c);
      setLocMsg('Lokasi ke-update.');
    } catch {
      setLocMsg('Gagal ambil lokasi. Isi manual lat/lng di bawah.');
    } finally {
      setBusy(false);
    }
  }, []);

  const applyManualCoords = useCallback((rawLat: string, rawLng: string) => {
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setLocMsg('Lat/lng gak valid.');
      return;
    }
    const next: Coords = { latitude: lat, longitude: lng, city: coords?.city };
    setCachedCoords(next);
    setCoords(next);
    setLocMsg('Koordinat disimpan.');
  }, [coords]);

  const saveWhitelist = useCallback(async () => {
    const pkgs = whitelistText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (pkgs.length === 0) {
      setWhitelistMsg('Minimal 1 package.');
      return;
    }
    if (!pkgs.includes('app.voskhod')) pkgs.unshift('app.voskhod');
    const ok = await nativeSetWhitelist(pkgs);
    setWhitelistMsg(ok ? 'Whitelist tersimpan & diterapkan.' : 'Cuma bisa di aplikasi Android (bukan browser).');
    setWhitelistText(pkgs.join('\n'));
  }, [whitelistText]);

  const testAdhan = useCallback(async () => {
    await unlockAudio();
    stopAdhan();
    playAdhan();
  }, []);

  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  if (auth !== 'open') {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-neutral-950/95 backdrop-blur">
        <div className="w-full max-w-sm space-y-8 px-6 py-10 text-center">
          <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
            <div
              className="absolute inset-0 animate-spin rounded-full opacity-90"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, #a855f7 120deg, transparent 130deg, transparent 180deg, #22d3ee 300deg, transparent 310deg)',
                animationDuration: '1.2s',
              }}
            />
            <div
              className="absolute inset-2 animate-spin rounded-full opacity-70"
              style={{
                background: 'conic-gradient(from 180deg, transparent 0deg, #6366f1 140deg, transparent 150deg)',
                animationDuration: '1.8s',
                animationDirection: 'reverse',
              }}
            />
            <div className="absolute inset-5 rounded-full border border-neutral-800 bg-neutral-900" />
            <div className="relative flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-dashed border-brand-500/70">
              <ScanFace size={46} className="text-brand-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Panel Tersembunyi</p>
            <h1 className="text-2xl font-extrabold text-neutral-100">Kunci Biometrik</h1>
            <p className="mx-auto max-w-xs text-sm text-neutral-400">
              {scanning ? 'Scan berjalan, tahan wajah lo di depan HP…' : authMsg || 'Scan wajah atau sidik jari lo buat masuk.'}
            </p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void retryAuth()}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              <ScanFace size={16} /> {scanning ? 'Minta izin…' : 'Coba scan'}
            </button>
            {needEnroll && (
              <button
                type="button"
                onClick={() => void nativeOpenBiometricEnrollment()}
                className="w-full rounded-2xl border border-neutral-700 px-6 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
              >
                Daftarin wajah / sidik jari
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-neutral-800 px-6 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-900"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-neutral-950/95 backdrop-blur">
      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-6 pb-24">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Panel Tersembunyi</p>
            <h1 className="text-xl font-extrabold text-neutral-100">Pengaturan Sholat</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </header>

        {/* Status */}
        <section className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-200">
            <MapPin size={15} className="text-brand-400" /> Lokasi
          </div>
          {coords ? (
            <p className="font-mono text-xs text-neutral-400">
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              {coords.city ? ` · ${coords.city}` : ''}
            </p>
          ) : (
            <p className="text-xs text-neutral-500">Belum ada lokasi — jadwal sholat gak bisa dihitung.</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refreshLocation()}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <Crosshair size={14} /> {busy ? 'Minta izin…' : 'Update lokasi'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Latitude"
              inputMode="decimal"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600"
            />
            <input
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="Longitude"
              inputMode="decimal"
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600"
            />
            <button
              type="button"
              onClick={() => applyManualCoords(manualLat, manualLng)}
              className="shrink-0 rounded-xl border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800"
            >
              Simpan
            </button>
          </div>
          {locMsg && <p className="text-xs text-brand-400">{locMsg}</p>}
        </section>

        {/* Jadwal hari ini */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4">
          <p className="mb-3 text-sm font-bold text-neutral-200">Jadwal hari ini</p>
          {prayers.length === 0 ? (
            <p className="text-xs text-neutral-500">Setel lokasi dulu.</p>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {prayers.map((p) => (
                <li key={p.key} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-semibold text-neutral-200">{p.name}</span>
                  <span className="font-mono text-xs text-neutral-400">
                    {p.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Perilaku */}
        <section className="space-y-2">
          <Toggle
            label="Aktifkan gerbang sholat"
            hint="Matikan kalo lagi gak mau dikunci sama sekali"
            checked={settings.enabled}
            onChange={(v) => settings.set({ enabled: v })}
          />
          <Toggle
            label="Kunci penuh (native LockTask)"
            hint="Cuma works kalo app jadi Device Owner. Matiin = cukup overlay di dalem app"
            checked={settings.lockEnabled}
            onChange={(v) => settings.set({ lockEnabled: v })}
          />
          <Toggle
            label="Auto-centang habit sholat"
            hint="Begitu lo konfirmasi, habitnya langsung dicentang"
            checked={settings.autoCheckHabits}
            onChange={(v) => settings.set({ autoCheckHabits: v })}
          />
        </section>

        {/* Metode */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4">
          <label htmlFor="method" className="mb-2 block text-sm font-bold text-neutral-200">
            Metode perhitungan
          </label>
          <select
            id="method"
            value={settings.method}
            onChange={(e) => settings.set({ method: e.target.value as typeof settings.method })}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-200"
          >
            {PRAYER_METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </section>

        {/* Whitelist */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-neutral-200">
            {deviceOwner ? (
              <Shield size={15} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={15} className="text-amber-400" />
            )}
            Whitelist aplikasi
          </div>
          <p className="mb-2 text-xs text-neutral-500">
            {isNative()
              ? deviceOwner
                ? 'App udah Device Owner — kunci penuh aktif.'
                : 'Belum Device Owner. Provision dulu lewat ADB: dpm set-device-owner'
              : 'Running di browser — whitelist gak berlaku.'}
          </p>
          <textarea
            value={whitelistText}
            onChange={(e) => setWhitelistText(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-200"
          />
          <button
            type="button"
            onClick={() => void saveWhitelist()}
            className="mt-2 w-full rounded-xl bg-brand-500 px-3 py-2.5 text-xs font-semibold text-white hover:bg-brand-600"
          >
            Simpan whitelist
          </button>
          {whitelistMsg && <p className="mt-2 text-xs text-brand-400">{whitelistMsg}</p>}
        </section>

        {/* Test adhan */}
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => void testAdhan()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
          >
            <Play size={15} /> Test adhan
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => stopAdhan()}
              className="flex-1 rounded-2xl border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-800"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={() => {
                settings.set({ ...DEFAULT_SETTINGS });
                setLocMsg('Pengaturan di-reset.');
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-700 px-4 py-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-800"
            >
              <RefreshCw size={14} /> Reset
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}