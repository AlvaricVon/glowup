import { useEffect, useState } from 'react';

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  sanitize?: (raw: unknown) => T,
): [T, Setter<T>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item) as unknown;
      return sanitize ? sanitize(parsed) : (parsed as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      // Notif ke komponen/hook lain di tab yang sama (storage event gak nyala di
      // tab yang sama) — dipake buat auto-centang habit "tulis to-do".
      window.dispatchEvent(new CustomEvent('glowup:local-storage', { detail: { key } }));
    } catch {
      console.warn(`Failed to save ${key} to localStorage`);
    }
  }, [key, value]);

  return [value, setValue];
}