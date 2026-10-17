export type VidPlatform = 'tiktok' | 'instagram' | 'youtube' | 'other';

export interface VidEntry {
  id: string;
  platform: VidPlatform;
  link: string;
  targets: string[];
  done: boolean;
  createdAt: string;
}

export interface VidGoalsState {
  target: number;
  entries: VidEntry[];
}

export const DEFAULT_VID_TARGET = 300;

export const VID_PLATFORMS: { id: VidPlatform; label: string }[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'other', label: 'Lainnya' },
];

export function platformLabel(id: VidPlatform): string {
  return VID_PLATFORMS.find((p) => p.id === id)?.label ?? 'Lainnya';
}

export function defaultVidState(): VidGoalsState {
  return { target: 300, entries: [] };
}

export function newVidId(): string {
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Parse target/aspirasi dari input bebas (dipisah enter atau koma). */
export function parseTargets(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Toleran ke bentuk data lama / korup. */
export function sanitizeVidState(raw: unknown): VidGoalsState {
  const base: VidGoalsState = { target: 300, entries: [] };
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const target =
    typeof o.target === 'number' && o.target > 0 ? Math.floor(o.target) : base.target;
  const entries: VidEntry[] = [];
  if (Array.isArray(o.entries)) {
    for (const e of o.entries) {
      if (!e || typeof e !== 'object') continue;
      const r = e as Record<string, unknown>;
      const platform: VidPlatform =
        r.platform === 'tiktok' ||
        r.platform === 'instagram' ||
        r.platform === 'youtube' ||
        r.platform === 'other'
          ? r.platform
          : 'other';
      entries.push({
        id: typeof r.id === 'string' ? r.id : newVidId(),
        platform,
        link: typeof r.link === 'string' ? r.link : '',
        targets: Array.isArray(r.targets)
          ? r.targets.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          : typeof r.targets === 'string'
            ? parseTargets(r.targets)
            : [],
        done: !!r.done,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
      });
    }
  }
  return { target, entries };
}
