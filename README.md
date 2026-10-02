# Voskhod

PWA tracker harian buat program self-improvement. Local-first — semua data di IndexedDB device lo, gak ada server, gak ada login. Installable di HP Android kayak app native, offline-ready.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- IndexedDB (via `idb`)
- Zustand (state management)
- Recharts (charts)
- Lucide React (icons)
- date-fns
- vite-plugin-pwa (auto-update, offline caching, manifest)

## Folder structure

```
glowup/
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.svg
│   └── icons/
│       ├── icon-192.svg
│       ├── icon-512.svg
│       └── icon-maskable.svg
├── src/
│   ├── components/      # Reusable UI bits
│   ├── pages/           # Home, Stats, Settings, Onboarding
│   ├── lib/             # types, habits, db, quotes, streak, utils, notifications
│   ├── hooks/           # useTheme, useDayRollover
│   ├── store/           # Zustand store
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── ...config
```

## Run lokal (dev)

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Service worker udah aktif di dev mode jadi PWA-nya bisa lo test langsung.

> **Tip**: kalo mau test di HP, jalanin di network yang sama, terus buka `http://<IP-laptop-lo>:5173` di browser HP. Atau pake `npm run preview` setelah build buat HTTPS-style preview.

## Build production

```bash
npm run build
```

Output ke folder `dist/`. Lo bisa preview hasil build:

```bash
npm run preview
```

## Deploy ke Vercel

Cara paling cepet:

1. Push folder `glowup/` ke GitHub repo lo.
2. Buka [vercel.com/new](https://vercel.com/new), import repo-nya.
3. Vercel auto-detect Vite. Klik **Deploy**. Done.

Atau lewat CLI:

```bash
npm i -g vercel
vercel       # ikutin prompt-nya, pilih default
vercel --prod
```

URL production-nya bakal kayak `https://glowup-xxx.vercel.app`. Buka itu di Chrome HP lo.

## Deploy ke Netlify

1. `npm run build`
2. Drag-drop folder `dist/` ke [app.netlify.com/drop](https://app.netlify.com/drop), atau:

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Install ke HP Android sebagai PWA

1. Buka URL deploy lo (Vercel/Netlify) di **Chrome Android**.
2. Setelah load, ada banner "Install" / icon "+" di address bar — tap.
3. Atau menu titik tiga → **Install app** / **Add to Home screen**.
4. App muncul di home screen sebagai icon Voskhod. Buka tanpa browser bar, persis kayak app native.

> Buat reliability max (terutama notifikasi & offline), pastiin lo install ke home screen — bukan cuma bookmark.

### iOS (Safari)

1. Buka URL di Safari iPhone.
2. Tap **Share** → **Add to Home Screen**.
3. App muncul di home screen.

> iOS ngebatesin notifikasi PWA — kalo penting, pake Android.

## Catatan teknis

- **Notifikasi**: di-fire pake `setInterval` selama app/SW alive. Untuk reminder paling reliable, install ke home screen dan biarin SW jalan. Background scheduling tanpa server butuh Web Push (server) atau Notification Triggers API (experimental).
- **Streak**: lulus = ≥80% habit aktif tercentang hari itu. Bolong sehari (<80%) = streak reset ke 0. Hari ini masih in-progress jadi gak mutus streak.
- **Conditional habits**: cuma muncul di list kalo toggle di Home aktif. Total habit dinamis (24–27 tergantung hari: Senin/Kamis ada puasa, hari lainnya ada workout + minum ekstra).
- **Upload konten**: habit di *Target Harian* buat ngecek upload konten harian (OddlyLab · ML · TikTok & Shorts) + upload konten YouTube (Shorts & video panjang, langsung publish).
- **Upload clipping**: habit di *Target Harian* buat ngecek upload konten clipping ke 3 sosmed langsung (YouTube, IG, TikTok) + submit ke WA kalo udah.
- **Tidur sebelum jam 10**: jam 21.00 lampu mati + posisi rebahan siap tidur, jam 21.00–22.00 sesi refreshing (baca komik / nonton anime / donghua, bukan scroll HP) — tapi cuma boleh tontonan/bacaan yang banyak scene fighting / gore / darah, atau yang udah top tier (banyak orang bilang bagus), atau yang udah masuk watchlist/readlist (kalo udah di-push, lanjut aja). Jam 22.00 taruh HP & langsung tidur. Reminder push: `21:00` (mati lampu, label-nya ikut nyebutin filter di atas) dan `21:50` (10 menit lagi jam 10). Reminder baru/versi lama otomatis kesync ke install lama tanpa nimpa yang udah dikustom manual.
- **Intro quote**: tiap app dibuka, muncul popup quote statis ("Jangan hanya duduk-duduk. Lakukan sesuatu. Jawaban akan muncul") — auto-dismiss 5 detik atau tap buat lanjut. Quotes harian di Home tetap rotasi dari `src/lib/quotes.ts`.
- **Hari baru**: auto-rollover pas tengah malam (hook `useDayRollover` recheck per menit + saat tab visible).
- **Backup**: Settings → Export bikin file JSON. Import bisa restore full state.
- **Privacy**: zero analytics, zero network calls (kecuali load Inter font dari Google Fonts saat first load — bisa lo replace pake font lokal kalo mau full offline).

## Lisensi

Buat lo aja. Bismillah.
