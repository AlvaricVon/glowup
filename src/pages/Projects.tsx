import { Check, ChevronDown, ChevronUp, RotateCcw, Target } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  PROJECTS,
  mergeProjectsState,
  type Project,
  type ProjectsState,
} from '../lib/projects';

const STORAGE_KEY = 'glowup-projects';

export function Projects() {
  const [state, setState] = useLocalStorage<ProjectsState>(STORAGE_KEY, mergeProjectsState(undefined));

  const byId = new Map(PROJECTS.map((p) => [p.id, p]));
  const items: Project[] = state.order.map((id) => byId.get(id)).filter((p): p is Project => Boolean(p));
  const focus = items.find((p) => !state.done[p.id]);
  const doneCount = items.filter((p) => state.done[p.id]).length;

  const move = (id: string, dir: -1 | 1) => {
    setState((prev) => {
      const order = [...prev.order];
      const idx = order.indexOf(id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= order.length) return prev;
      [order[idx], order[target]] = [order[target], order[idx]];
      return { ...prev, order };
    });
  };

  const toggleDone = (id: string) => {
    setState((prev) => ({ ...prev, done: { ...prev.done, [id]: !prev.done[id] } }));
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Prioritas Bisnis
        </p>
        <div className="flex items-center gap-2">
          <Target size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Projects</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {doneCount} dari {items.length} project sukses
        </p>
      </header>

      {/* Current focus */}
      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-900/30 dark:bg-brand-900/20">
        <Target size={16} className="mt-0.5 shrink-0 text-brand-500" />
        {focus ? (
          <p className="text-sm text-brand-800 dark:text-brand-200">
            Fokus sekarang: <span className="font-bold">{focus.name}</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Semua project sudah sukses.</p>
        )}
      </div>

      {/* Hint */}
      <p className="px-2 text-xs leading-relaxed text-neutral-400">
        Urutan dari atas = prioritas. Yang nomor 1 = target yang mau disuksesin duluan. Pindahin pakai tombol
        naik/turun. Tandai sukses kalau project udah jalan sendiri walau ditinggal.
      </p>

      <div className="space-y-2">
        {items.map((p, i) => {
          const isDone = Boolean(state.done[p.id]);
          const isFocus = !isDone && focus?.id === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-xl border p-4 transition-colors ${
                isDone
                  ? 'border-neutral-200/60 bg-white/50 opacity-60 dark:border-neutral-800/60 dark:bg-neutral-900/40'
                  : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : isFocus
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</span>
                    {isDone && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        Sukses
                      </span>
                    )}
                    {isFocus && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                        Fokus
                      </span>
                    )}
                  </div>
                  {p.desc && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{p.desc}</p>}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(p.id, -1)}
                  disabled={i === 0}
                  aria-label="Naikkan prioritas"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => move(p.id, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Turunkan prioritas"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleDone(p.id)}
                  className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    isDone
                      ? 'border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {isDone ? <RotateCcw size={13} /> : <Check size={13} />}
                  {isDone ? 'Batalkan' : 'Tandai sukses'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}