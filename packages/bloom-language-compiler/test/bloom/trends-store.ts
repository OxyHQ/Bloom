// A store hook as zustand 5 declares one: callable with no argument or with a selector, with
// members beside (`getState`). Backed by React state so a write re-renders its readers.
import { useSyncExternalStore } from 'react';

export interface Trend {
  id: string;
  title: string;
}
export interface TrendsState {
  trends: Trend[];
  loaded: boolean;
}
type UseBoundStore<S> = {
  (): S;
  <U>(selector: (state: S) => U): U;
  getState(): S;
  setState(next: S): void;
};

let state: TrendsState = { trends: [], loaded: false };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function useStore(): TrendsState;
function useStore<U>(selector: (state: TrendsState) => U): U;
function useStore<U>(selector?: (state: TrendsState) => U): TrendsState | U {
  const current = useSyncExternalStore(subscribe, () => state);
  return selector ? selector(current) : current;
}
export const useTrendsStore: UseBoundStore<TrendsState> = Object.assign(useStore, {
  getState: () => state,
  setState: (next: TrendsState) => {
    state = next;
    for (const listener of listeners) listener();
  },
});
