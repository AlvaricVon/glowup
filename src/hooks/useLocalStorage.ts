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
    } catch {
      console.warn(`Failed to save ${key} to localStorage`);
    }
  }, [key, value]);

  return [value, setValue];
}