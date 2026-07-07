import { useRef } from "react";
import type { TouchEvent } from "react";

interface SwipeHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const THRESHOLD = 50;

export function useSwipe(handlers: SwipeHandlers) {
  const start = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    if (!start.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    start.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > THRESHOLD) handlers.onSwipeRight?.();
      else if (dx < -THRESHOLD) handlers.onSwipeLeft?.();
    } else {
      if (dy > THRESHOLD) handlers.onSwipeDown?.();
      else if (dy < -THRESHOLD) handlers.onSwipeUp?.();
    }
  }

  return { onTouchStart, onTouchEnd };
}
