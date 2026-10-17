import { useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, Film, Plus, Target, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  DEFAULT_VID_TARGET,
  defaultVidState,
  newVidId,
  parseTargets,
  platformLabel,
  sanitizeVidState,
  VID_PLATFORMS,
  type VidGoalsState,
  type VidPlatform,
} from '../lib/vidGoals';

export function VideoGoals() {
  const [state, setState] = useLocalStorage<VidGoalsState>(
    'glowup-vid-goals',
    defaultVidState(),
    sanitizeVidState,
  );

  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<VidPlatform>('instagram');
  const [link, setLink] = useState('');
  const [targetsInput, setTargetsInput] = useState('');
  const [filter, setFilter] = useState<'all' | VidPlatform>('all');
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState('');
  const [copied, setCopied] = useState('');

  const target = state.target || DEFAULT_VID_TARGET;
  const total = state.entries.length;
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const counts = useMemo(() => {
    const c: Record<VidPlatform, number> = { tiktok: 0, instagram: 0, youtube: 0, other: 0 };
    for (const e of state.entries) c[e.platform] += 1;
    return c;
  }, [state.entries]);

  const filtered = filter === 'all' ? state.entries : state.entries.filter((e) => e.platform === filter);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const targets = parseTargets(targetsInput);
    if (!link.trim() && targets.length === 0) return;
    setState((prev) => ({
      ...prev,
      entries: [
        {
          id: newVidId(),
          platform,
          link: link.trim(),
          targets,
          done: false,
          createdAt: new Date().toISOString(),
        },
        ...prev.entries,
      ],
    }));
    setLink('');
    setTargetsInput('');
  };

  const toggleDone = (id: string) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
    }));
  };

  const removeEntry = (id: string) => {
    setState((prev) => ({ ...prev, entries: prev.entries.filter((x) => x.id !== id) }));
  };

  const copyLink = async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied((c) => (c === url ? '' : c)), 1500);
    } catch {
      // ignore
    }
  };

  const saveTarget = () => {
    const n = parseInt(targetDraft.replace(/[^0-9]/g, ''), 10);
    const value = Number.isFinite(n) && n > 0 ? n : DEFAULT_VID_TARGET;
    setState((prev) => ({ ...prev, target: value }));
    setEditingTarget(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Koleksi & Target
        </p>
        <div className="flex items-center gap-2">
          <Film size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Vid Goals</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Simpan video dari TikTok/IG/YouTube + target yang mau lo capai dari tiap video.
        </p>
      </header>

      {/* Progress card */}
      <section className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brand-500" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Progress target</span>
          </div>
          {editingTarget ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-500">{total} /</span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={saveTarget}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTarget(); }}
                className="w-20 rounded-lg border border-neutral-200 bg-cream-50 px-2 py-1 text-right text-sm font-bold text-neutral-900 focus:border-brand-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={saveTarget}
                className="rounded-lg bg-brand-500 p-1.5 text-white"
                aria-label="Simpan target"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setTargetDraft(String(target)); setEditingTarget(true); }}
              className="text-lg font-extrabold text-brand-600 dark:text-brand-400"
            >
              {total} / {target}
            </button>
          )}
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{pct}% dari target</span>
          <span>{state.entries.filter((v) => v.done).length} kelar</span>
        </div>
      </section>

      {/* Add form */}
      <section className="rounded-xl border border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            <Plus size={16} className="text-brand-500" />
            Tambah video
          </span>
          <ChevronDown size={16} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-neutral-200/80 px-4 py-4 dark:border-neutral-800/70">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-300">Platform</span>
              <div className="flex flex-wrap gap-2">
                {VID_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      platform === p.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="vid-link" className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Link
              </label>
              <input
                id="vid-link"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
              />
            </div>

            <div>
              <label htmlFor="vid-targets" className="mb-1.5 block text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Target / aspirasi
              </label>
              <textarea
                id="vid-targets"
                value={targetsInput}
                onChange={(e) => setTargetsInput(e.target.value)}
                rows={3}
                placeholder="pisah pakai enter atau koma"
                className="w-full resize-none rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
              />
              {parseTargets(targetsInput).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parseTargets(targetsInput).map((t, i) => (
                    <span key={i} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
            >
              <Plus size={16} />
              Simpan video
            </button>
          </form>
        )}
      </section>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip label="Semua" count={total} active={filter === 'all'} onClick={() => setFilter('all')} />
        {VID_PLATFORMS.map((p) => (
          <FilterChip
            key={p.id}
            label={p.label}
            count={counts[p.id]}
            active={filter === p.id}
            onClick={() => setFilter(p.id)}
          />
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center dark:border-neutral-700">
          <Film size={28} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Belum ada video. Tambahin mulai sekarang.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((v) => (
            <li
              key={v.id}
              className={`rounded-xl border p-3 transition-colors ${
                v.done
                  ? 'border-brand-200 bg-brand-50/60 dark:border-brand-900/40 dark:bg-brand-900/20'
                  : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleDone(v.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    v.done ? 'border-brand-500 bg-brand-500 text-white' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  aria-label={v.done ? 'Tandai belum' : 'Tandai kelar'}
                >
                  {v.done && <Check size={12} strokeWidth={3} />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass(v.platform)}`}>
                      {platformLabel(v.platform)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {v.targets.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {v.targets.map((t, i) => (
                        <span key={i} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {v.link && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-neutral-500 dark:text-neutral-400">{v.link}</span>
                      <button
                        type="button"
                        onClick={() => copyLink(v.link)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          copied === v.link
                            ? 'bg-brand-500 text-white'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {copied === v.link ? <Check size={12} /> : <Copy size={12} />}
                        {copied === v.link ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeEntry(v.id)}
                  className="mt-0.5 shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function badgeClass(platform: VidPlatform): string {
  switch (platform) {
    case 'tiktok':
      return 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900';
    case 'instagram':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
    case 'youtube':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
  }
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
      }`}
    >
      {label} <span className={active ? 'text-white/80' : 'text-neutral-400'}>{count}</span>
    </button>
  );
}
