import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { todayKey } from '../lib/utils';

/** Re-hydrate when the day flips (passes midnight) or when tab becomes visible. */
export function useDayRollover() {
  const hydrate = useAppStore((s) => s.hydrate);
  const today = useAppStore((s) => s.today);

  useEffect(() => {
    const check = () => {
      const real = todayKey();
      if (today && today.date !== real) {
        void hydrate();
      }
    };
    const visHandler = () => {
      if (document.visibilityState === 'visible') check();
    };
    const interval = window.setInterval(check, 60_000);
    document.addEventListener('visibilitychange', visHandler);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }, [today, hydrate]);
}
