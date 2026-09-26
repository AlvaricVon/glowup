import { ShieldCheck } from 'lucide-react';

type Rule = {
  title: string;
  description: string;
};

const RULES: Rule[] = [
  {
    title: 'Postur bagus',
    description:
      'Selalu pasang postur yang bagus: bahu lurus dan duduk tegap, jaga setiap saat. Kalo duduk usahain selalu senderan biar punggung gak bungkuk.',
  },
  {
    title: 'Selalu tenang',
    description: 'Hindari emosi berlebihan, tetep kalem di kondisi apa pun.',
  },
  {
    title: 'Earbuds/headphone nyala terus',
    description:
      'Tiap ngapa-ngapain selalu pakai earbuds atau headphone biar lebih tenang, sambil dengerin musik. Kecuali kalo situasinya emang gak bisa pakai.',
  },
  {
    title: 'Talk less, do more',
    description: 'Kurangi omongan, perbanyak action. Biar hasil yang bicara.',
  },
  {
    title: 'Baca Quran harus tartil',
    description:
      'Baca Quran jangan asal lantun: perhatiin panjang pendek, harokat, makhraj, dan tajwidnya. Intinya tartil, bener dan gak buru-buru.',
  },
  {
    title: 'Baca buku kaya lagi ngalamin',
    description:
      'Baca buku kaya lagi ngalamin sendiri apa yang ada di dalamnya: rasain, bayangin, dan masuk ke dalem ceritanya — bukan cuma baca teksnya doang.',
  },
  {
    title: 'Bulu dicukur',
    description: 'Jenggot, jambang, kumis, dan jembut dicukur kalau udah terlalu kelihatan atau berantakan.',
  },
  {
    title: 'Bulu ketek dicabut',
    description: 'Cabut rutin biar tetap wangi dan rapi.',
  },
  {
    title: 'Buka baju kalo lagi sendirian',
    description:
      'Kalo lagi sendirian, lagi di rumah, atau lagi di kamar: buka baju aja — telanjang dada, tetep pake celana. Biar badan kelihatan terus, jadi lebih gampang nge-manifest bentuk badan yang lagi dibentuk.',
  },
  {
    title: 'Minum air putih',
    description: 'Selalu minum air putih sebelum dan sesudah makan apa pun.',
  },
  {
    title: 'Baju sobek dijahit',
    description:
      'Sebelum mandi, cek dulu baju yang mau dipakai. Kalau sobek atau koyak, jahit dulu. Kalau gak sobek, lanjut aja.',
  },
  {
    title: 'Laptop selalu dibersihin',
    description:
      'Tiap buka dan tutup laptop wajib dilap dan dibersihin dulu. Gak ada laptop kotor — mulai dan selesai pakai harus selalu bersih.',
  },
  {
    title: 'Barang abis dipake balik ke tempatnya',
    description:
      'Tiap abis selesai pakai barang, langsung balikin ke tempatnya masing-masing. Jangan numpuk di meja atau dibiarin di lantai.',
  },
  {
    title: 'Panasin motor & genset tiap pagi',
    description: 'Tiap pagi panasin dulu motor dan genset kalo ada, biar mesinnya sehat dan siap dipakai.',
  },
  {
    title: 'Jalan kaki kalo bisa',
    description:
      'Ke mana-mana usahain jalan kaki dulu. Cek jaraknya di Google Maps: kalau masih 1 jam atau kurang, jalan kaki. Kalau udah lebih dari 1 jam, naik sepeda.',
  },
  {
    title: 'Gabut = pantengin market',
    description: 'Tiap gabut, pantengin aja market. Jangan ngabisin waktu buat hal yang gak jelas.',
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

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">Voskhod Self Rules · Terapkan setiap hari</p>
    </div>
  );
}