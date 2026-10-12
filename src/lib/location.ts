export interface Coords {
  latitude: number;
  longitude: number;
  city?: string;
  tz?: string;
  updatedAt?: number;
}

const CACHE_KEY = 'glowup-prayer-coords';

export function getCachedCoords(): Coords | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (typeof c.latitude === 'number' && typeof c.longitude === 'number') return c;
  } catch {}
  return null;
}

export function setCachedCoords(c: Coords) {
  const toSave: Coords = {
    latitude: c.latitude,
    longitude: c.longitude,
    city: c.city,
    tz: c.tz ?? getTimeZone(),
    updatedAt: c.updatedAt ?? Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(toSave));
  } catch {}
}

export function isCoordsStale(c: Coords | null, maxAgeMs = 6 * 60 * 60 * 1000): boolean {
  if (!c) return true;
  if (!c.updatedAt) return true;
  if (c.tz && c.tz !== getTimeZone()) return true;
  return Date.now() - c.updatedAt > maxAgeMs;
}

export function getTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function tzToCity(): string | undefined {
  const tz = getTimeZone();
  if (!tz) return undefined;
  const parts = tz.split('/');
  return parts[parts.length - 1].replace(/_/g, ' ');
}

// Major Indonesian regencies keyed to approx coordinates, used to label the
// computed prayer location (tz labels like "Asia/Jakarta" can't tell us the
// actual city the user is in).
const CITY_POINTS: Array<[string, number, number]> = [
  ['Banda Aceh', 5.55, 95.32],
  ['Medan', 3.59, 98.67],
  ['Binjai', 3.61, 98.49],
  ['Pekanbaru', 0.51, 101.45],
  ['Dumai', 1.67, 101.45],
  ['Padang', -0.95, 100.35],
  ['Bukittinggi', -0.31, 100.37],
  ['Palembang', -2.99, 104.76],
  ['Jambi', -1.59, 103.61],
  ['Bengkulu', -3.79, 102.26],
  ['Bandar Lampung', -5.45, 105.26],
  ['Jakarta', -6.21, 106.85],
  ['Bogor', -6.6, 106.8],
  ['Bekasi', -6.24, 106.99],
  ['Depok', -6.4, 106.82],
  ['Tangerang', -6.18, 106.63],
  ['Bandung', -6.92, 107.61],
  ['Cirebon', -6.73, 108.55],
  ['Semarang', -6.97, 110.42],
  ['Tegal', -6.87, 109.14],
  ['Surakarta', -7.57, 110.82],
  ['Yogyakarta', -7.8, 110.36],
  ['Surabaya', -7.26, 112.75],
  ['Malang', -7.98, 112.63],
  ['Probolinggo', -7.76, 113.22],
  ['Denpasar', -8.65, 115.22],
  ['Mataram', -8.58, 116.12],
  ['Kupang', -10.18, 123.6],
  ['Pontianak', -0.03, 109.34],
  ['Palangkaraya', -2.21, 113.91],
  ['Banjarmasin', -3.32, 114.59],
  ['Samarinda', -0.5, 117.15],
  ['Balikpapan', -1.26, 116.83],
  ['Makassar', -5.15, 119.43],
  ['Parepare', -4.02, 119.63],
  ['Manado', 1.47, 124.84],
  ['Tomohon', 1.32, 124.83],
  ['Palu', -0.9, 119.84],
  ['Kendari', -3.97, 122.52],
  ['Gorontalo', 0.54, 123.06],
  ['Ambon', -3.7, 128.17],
  ['Ternate', 0.79, 127.38],
  ['Sorong', -0.86, 131.25],
  ['Jayapura', -2.54, 140.72],
];

function reverseLookupCity(lat: number, lng: number): string | undefined {
  let best: string | undefined;
  let bestDist = 80; // km; only label when reasonably close to a known city
  for (const [name, clat, clng] of CITY_POINTS) {
    const dKm = haversineKm(lat, lng, clat, clng);
    if (dKm < bestDist) {
      bestDist = dKm;
      best = name;
    }
  }
  return best;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function gpsCoords(): Promise<Coords> {
  if (!navigator.geolocation) {
    const def: Coords = { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta' };
    return Promise.resolve(def);
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          city: reverseLookupCity(pos.coords.latitude, pos.coords.longitude) ?? tzToCity(),
        });
      },
      (err) => reject(err),
      { timeout: 10000, enableHighAccuracy: false },
    );
  });
}

export async function requestCoords(): Promise<Coords> {
  const c = await gpsCoords();
  setCachedCoords(c);
  return c;
}