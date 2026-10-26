import { useEffect, useRef, useState } from 'react';
import { serverNow } from './store';

/** Seconds remaining until a server timestamp (null when there is no deadline). */
export function useCountdown(endsAt: number | null): { seconds: number; fraction: number } | null {
  const [, force] = useState(0);
  const startRef = useRef<{ endsAt: number; total: number } | null>(null);

  if (endsAt !== null && startRef.current?.endsAt !== endsAt) {
    startRef.current = { endsAt, total: Math.max(1000, endsAt - serverNow()) };
  }

  useEffect(() => {
    if (endsAt === null) return;
    const t = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [endsAt]);

  if (endsAt === null || !startRef.current) return null;
  const left = Math.max(0, endsAt - serverNow());
  return { seconds: Math.ceil(left / 1000), fraction: Math.min(1, left / startRef.current.total) };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}

/** Runs `fn` when `value` changes (skips the first render). */
export function useOnChange<T>(value: T, fn: (value: T, prev: T) => void): void {
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      const p = prev.current;
      prev.current = value;
      fn(value, p);
    }
  });
}
