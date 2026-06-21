import { useEffect, useState, useRef } from "react";

export function useAnimatedNumber(targetValue: number, duration = 800) {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const displayValueRef = useRef(targetValue);
  const targetValueRef = useRef(targetValue);

  useEffect(() => {
    displayValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
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
