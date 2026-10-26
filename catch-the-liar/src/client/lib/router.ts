import { useSyncExternalStore } from 'react';

export type Route = { name: 'home' } | { name: 'room'; code: string };

function parse(pathname: string): Route {
  const m = pathname.match(/^\/r\/(\d{6})\/?$/);
  if (m) return { name: 'room', code: m[1]! };
  return { name: 'home' };
}

const listeners = new Set<() => void>();
let current = parse(location.pathname);

window.addEventListener('popstate', () => {
  current = parse(location.pathname);
  listeners.forEach((l) => l());
});

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  if (opts.replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  current = parse(path);
  listeners.forEach((l) => l());
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

export function roomUrl(code: string): string {
  return `${location.origin}/r/${code}`;
}
