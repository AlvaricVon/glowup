export interface Project {
  id: string;
  name: string;
  desc?: string;
}

export interface ProjectsState {
  order: string[];
  done: Record<string, boolean>;
}

export const PROJECTS: readonly Project[] = [
  { id: 'halt-co', name: 'Halt.Co', desc: 'Clothing Brand' },
  { id: 'kaalupi', name: 'Kaalupi', desc: 'Course Online' },
  { id: 'creativo', name: 'Creativo Studio', desc: 'Course Online' },
  { id: 'money-protocol', name: 'Money Protocol', desc: 'Financial System' },
  { id: 'zero-trust', name: 'Zero Trust Security', desc: 'Komunitas & Training Cyber' },
  { id: 'elvara', name: 'Elvara', desc: 'Dropshipping' },
  { id: 'oddly-lab', name: 'Oddly Lab', desc: 'YT Shorts' },
  { id: 'nano-tech', name: 'Nano Tech', desc: 'YouTube' },
  { id: 'info-hits', name: 'Info Hits', desc: 'YT Shorts' },
  { id: 'alvaric', name: 'Alvaric', desc: 'TikTok' },
  { id: 'ric-clips', name: 'Ric Clips', desc: 'YT Clips' },
  { id: 'try-buzzer', name: 'Try Buzzer', desc: 'Clippers' },
  { id: 'ternak-clip', name: 'Ternak Clip', desc: 'Clippers' },
  { id: 'big-hero-6', name: 'Big Hero 6 Projects' },
  { id: 'bug-bounty', name: 'Bug Bounty', desc: 'Cyber Income' },
  { id: 'rt-rw-net', name: 'RT/RW Net / ISP' },
  { id: 'hp-rusak', name: 'Bisnis HP Rusak' },
  { id: 'jasa-design', name: 'Jasa Design' },
  { id: 'lay', name: 'Lay' },
];

export const DEFAULT_ORDER: readonly string[] = PROJECTS.map((p) => p.id);

export function defaultProjectsState(): ProjectsState {
  return { order: [...DEFAULT_ORDER], done: {} };
}

export function mergeProjectsState(raw: unknown): ProjectsState {
  const base = defaultProjectsState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<ProjectsState>;
  return {
    order: Array.isArray(o.order) && o.order.length > 0 ? o.order : base.order,
    done: o.done && typeof o.done === 'object' ? o.done : {},
  };
}