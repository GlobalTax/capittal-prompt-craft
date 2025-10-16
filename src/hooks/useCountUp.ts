import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
  onComplete?: () => void;
}

export function useCountUp({
  end,
  duration = 2000,
  start = 0,
  decimals = 0,
  onComplete
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);
  
  const easeOutQuad = (t: number) => t * (2 - t);

  useEffect(() => {
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = easeOutQuad(frame / totalFrames);
      const currentCount = Math.floor(start + (end - start) * progress);
      
      setCount(currentCount);
      
      if (frame === totalFrames) {
        setCount(end);
        setIsAnimating(false);
        clearInterval(counter);
        if (onComplete) onComplete();
      }
    }, frameRate);

    setIsAnimating(true);
    
    return () => clearInterval(counter);
  }, [end, start, duration]);

  return { count, isAnimating };
}
