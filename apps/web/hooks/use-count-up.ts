"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms with easeOut.
 * Returns the current animated value (number).
 */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    // easeOutQuart: decelerating near the end
    const easeOut = (t: number): number => 1 - Math.pow(1 - t, 4);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      setValue(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return value;
}
