import { useEffect, useState } from 'react';
import { BottomNav, type Tab } from './components/BottomNav';
import { useDayRollover } from './hooks/useDayRollover';
import { useTheme } from './hooks/useTheme';
import { useTodoHabit } from './hooks/useTodoHabit';
import { Home } from './pages/Home';
import { Onboarding } from './pages/Onboarding';
import { Rehab90 } from './pages/Rehab90';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';
import { Tools } from './pages/Tools';
import { useLaundry } from './lib/laundry';
import { useRehab } from './lib/rehab90';
import { useYtUpload } from './lib/ytUpload';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const meta = useAppStore((s) => s.meta);
  const loading = useAppStore((s) => s.loading);
  const hydrate = useAppStore((s) => s.hydrate);
  const [tab, setTab] = useState<Tab>('today');
  const { state: rehab, disable: disableRehab } = useRehab();

  useTheme();
  useDayRollover();
  useTodoHabit();
  useYtUpload();
  useLaundry();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Auto-unlock rehab setelah 90 hari aman berturut-turut
  useEffect(() => {
    if (rehab.enabled && rehab.streak >= rehab.targetDays) {
      disableRehab();
    }
  }, [rehab.enabled, rehab.streak, rehab.targetDays, disableRehab]);

  if (loading || !meta) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50 dark:bg-neutral-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-500" />
      </div>
    );
  }

  if (!meta.onboarded) return <Onboarding />;

  if (rehab.enabled) {
    return (
      <div className="min-h-dvh bg-cream-50 dark:bg-neutral-950">
        <main>
          <Rehab90 />
        </main>
      </div>
    );
  }

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
