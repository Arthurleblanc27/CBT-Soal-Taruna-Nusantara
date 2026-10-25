import { useEffect, useRef, useState } from 'preact/hooks';

export function useMonotonicTimer(active: boolean, intervalMs = 250) {
  const startRef = useRef(performance.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    startRef.current = performance.now();
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      if (active) raf = requestAnimationFrame(loop);
    };
    // Throttle render to intervalMs
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return { tick, elapsedMs: () => performance.now() - startRef.current };
}

export function formatDetik(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = Math.floor(detik % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatMenitDetik(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = Math.floor(detik % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
