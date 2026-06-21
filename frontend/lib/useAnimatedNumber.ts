import { useEffect, useState, useRef } from "react";

/**
 * Animates a number from its current value to a new target value.
 * Uses a cubic ease-out curve for a smooth transition.
 *
 * @param targetValue The target number to animate to.
 * @param duration Duration of the animation in milliseconds (default: 800ms).
 */
export function useAnimatedNumber(targetValue: number, duration = 800) {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const displayValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);

  // Keep displayValueRef in sync with the state without triggering re-renders
  useEffect(() => {
    displayValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
    // Only run animation if targetValue actually changed
    if (targetValue === targetValueRef.current) return;

    const startValue = displayValueRef.current;
    const endValue = targetValue;
    targetValueRef.current = targetValue;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // cubic ease-out: f(t) = 1 - (1-t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const nextVal = startValue + (endValue - startValue) * easeProgress;
      setCurrentValue(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue, duration]);

  return currentValue;
}
