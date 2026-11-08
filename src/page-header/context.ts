import { createContext } from 'react';

/** Stable per-header geometry channel. No React state is published per pixel. */
export function createHeaderActionsHost() {
  let width = 0;
  const listeners = new Set<() => void>();
  return {
    getWidth: () => width,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setWidth(next: number) {
      next = Math.max(0, next);
      if (next === width) return;
      width = next;
      listeners.forEach((listener) => listener());
    },
  };
}
export const HeaderActionsHostContext = createContext<ReturnType<
  typeof createHeaderActionsHost
> | null>(null);
