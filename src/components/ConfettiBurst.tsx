import { useEffect, useState } from 'react';

interface Props {
  trigger: number;
  origin?: { x: number; y: number };
}

const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#06b6d4'];

interface Dot {
  id: number;
  tx: number;
  ty: number;
  color: string;
}

/** Tiny inline confetti — renders fixed dots that fly outward from `origin`. */
export function ConfettiBurst({ trigger, origin }: Props) {
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const next: Dot[] = Array.from({ length: 10 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const dist = 40 + Math.random() * 30;
      return {
        id: trigger * 100 + i,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 10,
        color: COLORS[i % COLORS.length],
      };
    });
    setDots(next);
    const t = window.setTimeout(() => setDots([]), 750);
    return () => window.clearTimeout(t);
  }, [trigger]);

  if (dots.length === 0 || !origin) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{ overflow: 'hidden' }}
      aria-hidden
    >
      {dots.map((d) => (
        <span
          key={d.id}
          className="confetti-dot"
          style={
            {
              left: origin.x,
              top: origin.y,
              background: d.color,
              ['--tx' as string]: `${d.tx}px`,
              ['--ty' as string]: `${d.ty}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
