export interface Quote {
  text: string;
  source?: string;
}

export const QUOTES: Quote[] = [
  { text: 'Sesungguhnya Allah tidak akan mengubah keadaan suatu kaum sehingga mereka mengubah keadaan yang ada pada diri mereka sendiri.', source: 'QS. Ar-Ra\'d: 11' },
  { text: 'Hanya kepada Allah-lah kembalinya semua urusan.', source: 'QS. Al-Hadid: 5' },
  { text: 'Maka apabila kamu telah selesai (dari sesuatu urusan), kerjakanlah dengan sungguh-sungguh urusan yang lain.', source: 'QS. Al-Insyirah: 7' },
  { text: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lain.', source: 'HR. Ahmad' },
  { text: 'Bersungguh-sungguhlah pada hal yang bermanfaat untukmu, mintalah pertolongan kepada Allah, dan jangan merasa lemah.', source: 'HR. Muslim' },
  { text: 'Barangsiapa yang harinya lebih baik dari hari kemarin, maka ia beruntung.', source: 'HR. Hakim' },

  { text: 'Kamu gak harus jadi yang terhebat. Cukup hari ini lebih baik dari kemarin.' },
  { text: 'Disiplin adalah jembatan antara tujuan dan pencapaian.', source: 'Jim Rohn' },
  { text: 'Kebiasaan kecil yang dilakukan tiap hari akan ngalahin motivasi besar yang cuma sesekali.' },
  { text: 'Lo bukan apa yang lo bilang. Lo adalah apa yang lo lakuin berulang-ulang.' },
  { text: 'Self-improvement bukan tentang jadi orang lain. Tapi tentang jadi versi terbaik dari diri lo sendiri.' },
  { text: 'Konsistensi ngalahin intensitas. 1% tiap hari = 37x lebih baik dalam setahun.' },
  { text: 'Lo gak bakal kalah dari hawa nafsu yang lo lawan tiap hari, lo cuma kalah dari yang lo manjain.' },
  { text: 'Pagi yang produktif dimulai dari malam yang disiplin.' },
  { text: 'Sholat itu bukan beban, itu reset button buat hari lo.' },
  { text: 'Streak hari ini adalah hadiah dari pilihan kecil kemarin.' },
  { text: 'Tubuh lo nyatet semua yang lo masukin. Mind lo nyatet semua yang lo izinin lewat.' },
  { text: 'Capek itu sementara, nyesel itu permanen.' },
  { text: 'Lo bukan procrastinator. Lo cuma belum mulai. Mulai aja, 5 menit.' },
  { text: 'Niat dan ikhtiar itu kewajiban lo. Hasil itu hak Allah.' },
  { text: 'Ada saatnya lo harus jadi orang yang paling kasar ke diri lo sendiri — buat masa depan lo.' },
  { text: 'Setiap kali lo kalah dari nafsu, lo nge-train diri lo buat kalah lagi besok.' },
  { text: 'Kamar yang rapi, pikiran yang rapi.' },
  { text: 'Lo gak butuh suasana sempurna buat mulai. Lo butuh mulai aja dulu.' },
  { text: 'Tidur cepat hari ini = produktif besok. Itu deal yang gak boleh ditolak.' },
];

/** Pick a deterministic quote for the given date so it stays the same all day. */
export function quoteForDate(date: string): Quote {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % QUOTES.length;
  return QUOTES[idx];
}
