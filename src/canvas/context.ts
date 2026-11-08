import { createContext, useContext, useSyncExternalStore } from 'react';
import { createEdgeStore } from '../layout/edge-store';
import type { CanvasRect, CanvasRegion } from './types';
const ZERO: CanvasRect = { x: 0, y: 0, width: 0, height: 0 };
export function createCanvasStore(active = true) {
  const left = createEdgeStore(),
    right = createEdgeStore();
  const listeners = new Set<() => void>();
  let current: CanvasRegion = {
    bounds: ZERO,
    viewport: ZERO,
    occupied: { top: 0, right: 0, bottom: 0, left: 0 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    active,
  };
  const publish = (next: CanvasRegion) => {
    if (JSON.stringify(current) === JSON.stringify(next)) return;
    current = next;
    for (const listener of listeners) listener();
  };
  const sides = () =>
    publish({
      ...current,
      occupied: { ...current.occupied, left: left.getInset(), right: right.getInset() },
    });
  left.subscribe(sides);
  right.subscribe(sides);
  return {
    left,
    right,
    read: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    frame: (bounds: CanvasRect, viewport: CanvasRect, safeArea = current.safeArea) =>
      publish({ ...current, bounds, viewport, safeArea }),
    edges: (top: number, bottom: number, active: boolean) =>
      publish({ ...current, active, occupied: { ...current.occupied, top, bottom } }),
  };
}
export type CanvasStore = ReturnType<typeof createCanvasStore>;
export const CanvasContext = createContext<CanvasStore | null>(null);
export function useCanvasStore() {
  const store = useContext(CanvasContext);
  if (!store) throw new Error('CanvasPanel and useCanvasRegion require Canvas.');
  return store;
}
/** Settled geometry only. Drag progress is a separate UI-thread signal. */
export function useCanvasRegion() {
  const store = useCanvasStore();
  return useSyncExternalStore(store.subscribe, store.read, store.read);
}
