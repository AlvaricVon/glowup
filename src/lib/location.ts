export interface Coords {
  latitude: number;
  longitude: number;
  city?: string;
  tz?: string;
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
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(toSave));
  } catch {}
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

function gpsCoords(): Promise<Coords> {
  if (!navigator.geolocation) {
    const def: Coords = { latitude: -6.2088, longitude: 106.8456, city: 'Jakarta' };
    return Promise.resolve(def);
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, city: tzToCity() });
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