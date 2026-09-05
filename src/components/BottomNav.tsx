import { BarChart3, Home, Settings as SettingsIcon, Utensils, Wallet } from 'lucide-react';

export type Tab = 'today' | 'stats' | 'nutrition' | 'finance' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'finance', label: 'Keuangan', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 safe-bottom border-t border-neutral-200/60 bg-white/90 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-colors ${
                isActive
                  ? 'text-brand-500'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
