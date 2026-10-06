export interface Coords {
  latitude: number;
  longitude: number;
  city?: string;
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
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

function tzToCity(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return undefined;
    const parts = tz.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  } catch {
    return undefined;
  }
}

export async function requestCoords(): Promise<Coords> {
  const cached = getCachedCoords();
  if (cached) return cached;
  if (!navigator.geolocation) {
    const def = { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta' };
    setCachedCoords(def);
    return def;
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: Coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, city: tzToCity() };
        setCachedCoords(c);
        resolve(c);
      },
      (err) => {
        reject(err);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

