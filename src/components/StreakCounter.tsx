import { Flame, Snowflake } from 'lucide-react';

interface Props {
  current: number;
  longest: number;
  freezeUsedThisWeek: boolean;
}

export function StreakCounter({ current, longest, freezeUsedThisWeek }: Props) {
  const live = current > 0;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-lg shadow-brand-500/20">
      <div
        aria-hidden
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
      />
      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur ${
            live ? 'animate-flame-flicker' : ''
          }`}
        >
          <Flame
            size={36}
            strokeWidth={2.5}
            className={live ? 'text-yellow-300' : 'text-white/60'}
            fill={live ? '#fde047' : 'none'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tabular-nums leading-none">{current}</span>
            <span className="text-sm font-semibold opacity-80">hari</span>
          </div>
          <p className="mt-1 text-xs font-medium opacity-80">
            Longest: {longest} hari
            {freezeUsedThisWeek && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <Snowflake size={10} /> freeze pake
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
