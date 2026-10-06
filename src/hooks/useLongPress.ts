import { useCallback, useRef } from 'react';

export function useLongPress(onLongPress: (e: React.PointerEvent) => void, delay = 1000) {
  const timerRef = useRef<number | null>(null);
  const isPressedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPressedRef.current = false;
  }, []);

  const start = useCallback(
    (e: React.PointerEvent) => {
      isPressedRef.current = true;
      timerRef.current = window.setTimeout(() => {
        if (isPressedRef.current) {
          onLongPress(e);
        }
        clear();
      }, delay);
    },
    [onLongPress, delay, clear]
  );

  const cancel = useCallback(() => {
    clear();
  }, [clear]);

  return { onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel };
}

