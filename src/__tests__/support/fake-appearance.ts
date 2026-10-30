import type {
  PlatformAppearance,
  PlatformAppearanceState,
  PlatformSurfaceAdapter,
} from '../../platform-surface/types';

export interface FakeAppearance extends PlatformAppearance {
  /** What the platform would tell every application next. */
  set(next: Partial<PlatformAppearanceState>): void;
  /** How many listeners are subscribed now. */
  listenerCount(): number;
}

/**
 * A platform with the `appearance` capability, its state an external store
 * that hands out a FRESH object on every read, as a host bridge does.
 */
export function fakeAppearance(state: Partial<PlatformAppearanceState> = {}): {
  appearance: FakeAppearance;
  adapter: PlatformSurfaceAdapter;
} {
  let current: PlatformAppearanceState = { accent: null, reduceTransparency: false, ...state };
  const listeners = new Set<() => void>();
  const appearance: FakeAppearance = {
    getState: () => ({ ...current }),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      current = { ...current, ...next };
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
  return {
    appearance,
    adapter: { platform: 'test', capabilities: new Set(['appearance']), appearance },
  };
}
