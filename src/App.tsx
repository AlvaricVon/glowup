import { useEffect, useState } from 'react';
import { BottomNav, type Tab } from './components/BottomNav';
import { useDayRollover } from './hooks/useDayRollover';
import { useTheme } from './hooks/useTheme';
import { useTodoHabit } from './hooks/useTodoHabit';
import {
  exitLockdown,
  isNative,
  nativeSchedulePrayerAlarms,
  nativeSetAppLocked,
  nativeStopAdhan,
} from './lib/lockdown';
import { useLaundry } from './lib/laundry';
import { useYtUpload } from './lib/ytUpload';
import { Home } from './pages/Home';
import { Onboarding } from './pages/Onboarding';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';
import { Tools } from './pages/Tools';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const meta = useAppStore((s) => s.meta);
  const loading = useAppStore((s) => s.loading);
  const hydrate = useAppStore((s) => s.hydrate);
  const [tab, setTab] = useState<Tab>('today');

  useTheme();
  useDayRollover();
  useTodoHabit();
  useYtUpload();
  useLaundry();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Matikan total sistem adzan & lock app. Bersihin sisa alarm/adhan/LockTask
  // yang mungkin masih nyangkut dari versi sebelumnya.
  useEffect(() => {
    if (!isNative()) return;
    const cleanup = async () => {
      try {
        await nativeStopAdhan();
        await nativeSchedulePrayerAlarms([]);
        await nativeSetAppLocked('com.mobile.legends', false);
        await exitLockdown();
      } catch {
        // noop
      }
    };
    void cleanup();
  }, []);

  if (loading || !meta) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  if (!meta.onboarded) return <Onboarding />;

  return (
    <div className="min-h-dvh bg-cream-50 dark:bg-neutral-950">
      <main>
        {tab === 'today' && <Home />}
        {tab === 'stats' && <Stats />}
        {tab === 'tools' && <Tools />}
        {tab === 'settings' && <Settings />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
