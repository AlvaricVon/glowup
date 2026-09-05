import { ShieldCheck } from 'lucide-react';

type Rule = {
  title: string;
  description: string;
};

const RULES: Rule[] = [
  {
    title: 'Postur bagus',
    description: 'Selalu pasang postur yang baik: bahu lurus, duduk tegap. Jaga setiap saat.',
  },
  {
    title: 'Talk less, do more',
    description: 'Kurangi omongan, perbanyak action. Biar hasil yang bicara.',
  },
  {
    title: 'Selalu tenang',
    description: 'Hindari emosi berlebihan, tetap kalem di kondisi apa pun.',
  },
  {
    title: 'Bulu wajah dicukur',
    description: 'Jenggot, jambang, kumis, dan jembit dicukur kalau udah terlalu kelihatan atau berantakan.',
  },
  {
    title: 'Bulu ketek dicabut',
    description: 'Cabut rutin biar tetap wangi dan rapi.',
  },
  {
    title: 'Minum air putih',
    description: 'Selalu minum air putih sebelum dan sesudah makan apa pun.',
  },
  {
    title: 'Baju sobek dijahit',
    description: 'Tiap mau mandi, jait dulu baju yang mau dipakai kalau sobek atau koyak.',
  },
];

export function SelfRules() {
  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          SOP Harian
        </p>
        <div className="flex items-center gap-2">
          <ShieldCheck size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">Self Rules</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Aturan pribadi yang selalu dipegang</p>
      </header>

      <div className="space-y-3">
        {RULES.map((rule, i) => (
          <div
            key={rule.title}
            className="rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{rule.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {rule.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">GlowUp Self Rules · Terapkan setiap hari</p>
    </div>
  );
}