export interface Project {
  id: string;
  name: string;
  desc?: string;
}

export interface ProjectsState {
  order: string[];
  done: Record<string, boolean>;
}

// Project id lama -> id sekarang. Dipake biar order & status "sukses" yang udah
// kesimpen di localStorage tetep kebaca walau project-nya di-rename.
const LEGACY_IDS: Record<string, string> = {
  'ric-clips': 'clipnest',
};

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
  { id: 'alvaric-ml-live-konten', name: 'Alvaric ML Live & Konten' },
  { id: 'clipnest', name: 'ClipNest', desc: 'YT Clips' },
  { id: 'try-buzzer', name: 'Try Buzzer', desc: 'Clippers' },
  { id: 'ternak-clip', name: 'Ternak Clip', desc: 'Clippers' },
  { id: 'big-hero-6', name: 'Big Hero 6 Projects' },
  { id: 'bug-bounty', name: 'Bug Bounty', desc: 'Cyber Income' },
  { id: 'rt-rw-net', name: 'RT/RW Net' },
  { id: 'wifi-voucheran', name: 'Wifi Voucheran' },
  { id: 'hp-rusak', name: 'Bisnis HP Rusak' },
  { id: 'jasa-design', name: 'Jasa Design' },
  { id: 'lay', name: 'Lay' },
];

export const DEFAULT_ORDER: readonly string[] = PROJECTS.map((p) => p.id);

const PROJECT_ID_SET = new Set<string>(DEFAULT_ORDER);

export function defaultProjectsState(): ProjectsState {
  return { order: [...DEFAULT_ORDER], done: {} };
}

function migrateDone(done: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(done)) {
    out[LEGACY_IDS[id] ?? id] = Boolean(value);
  }
  return out;
}

export function mergeProjectsState(raw: unknown): ProjectsState {
  const base = defaultProjectsState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<ProjectsState>;

  const saved = Array.isArray(o.order) ? o.order : [];
  const known: string[] = [];
  for (const id of saved) {
    const current = typeof id === 'string' ? (LEGACY_IDS[id] ?? id) : '';
    if (PROJECT_ID_SET.has(current) && !known.includes(current)) known.push(current);
  }
  // Project yang ditambahin belakangan ditaruh di bawah biar user lama tetep liat.
  const added = DEFAULT_ORDER.filter((id) => !known.includes(id));

  return {
    order: [...known, ...added],
    done: o.done && typeof o.done === 'object' ? migrateDone(o.done) : {},
  };
}
