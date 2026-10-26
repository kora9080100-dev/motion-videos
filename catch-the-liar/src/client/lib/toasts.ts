import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'warn' | 'error' | 'success';
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function toast(text: string, kind: Toast['kind'] = 'info', ms = 3200): void {
  const id = nextId++;
  toasts = [...toasts.slice(-3), { id, text, kind }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, ms);
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
  );
}
