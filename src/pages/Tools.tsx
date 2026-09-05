import { useState } from 'react';
import { ArrowLeft, ChevronRight, LayoutGrid, Target, Utensils, Wallet } from 'lucide-react';
import { Finance } from './Finance';
import { Nutrition } from './Nutrition';
import { Projects } from './Projects';

type Tool = 'menu' | 'nutrition' | 'finance' | 'projects';

const TOOLS: { id: Exclude<Tool, 'menu'>; name: string; desc: string; icon: typeof Target }[] = [
  { id: 'nutrition', name: 'Nutrition', desc: 'Jadwal & prinsip makan harian', icon: Utensils },
  { id: 'finance', name: 'Keuangan', desc: 'Alokasi pendapatan otomatis', icon: Wallet },
  { id: 'projects', name: 'Projects', desc: 'Prioritas bisnis yang mau disuksesin', icon: Target },
];

export function Tools() {
  const [view, setView] = useState<Tool>('menu');

  return (
    <>
      {view === 'menu' && (
        <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
          <header className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
              Semua menu
            </p>
            <div className="flex items-center gap-2">
              <LayoutGrid size={28} className="text-brand-500" />
              <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Tools</h1>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Pilih satu untuk dibuka</p>
          </header>

          <div className="space-y-3">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setView(t.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-200/80 bg-white/70 p-4 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800/70 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900 dark:text-neutral-100">{t.name}</span>
                    <span className="block text-sm text-neutral-500 dark:text-neutral-400">{t.desc}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-neutral-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {view !== 'menu' && (
        <div className="mx-auto max-w-lg px-4">
          <button
            type="button"
            onClick={() => setView('menu')}
            className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
          >
            <ArrowLeft size={16} />
            Kembali ke Tools
          </button>
        </div>
      )}

      <div className={view === 'nutrition' ? '' : 'hidden'}>
        <Nutrition />
      </div>
      <div className={view === 'finance' ? '' : 'hidden'}>
        <Finance />
      </div>
      <div className={view === 'projects' ? '' : 'hidden'}>
        <Projects />
      </div>
    </>
  );
}