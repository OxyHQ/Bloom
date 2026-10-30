import type {
  PlatformSurfaceAdapter,
  PlatformWindow,
  PlatformWindowMetrics,
  PlatformWindowState,
} from '../../platform-surface/types';

/**
 * OxyOS's numbers (ADR 0016): three 20 px targets whose 14 px discs are 4 px
 * apart, centres 26 from the top and the first 24 from the leading edge; the
 * room is 52 from the top and 88 from the leading edge.
 */
export const WINDOW_METRICS: PlatformWindowMetrics = {
  controls: { start: 14, top: 16, width: 56, height: 20 },
  room: { top: 52, leading: 88 },
  radius: 16,
};

export interface FakeWindow extends PlatformWindow {
  close: jest.Mock;
  minimize: jest.Mock;
  zoom: jest.Mock;
  startMove: jest.Mock;
  /** What the platform would tell the window next. */
  set(next: Partial<PlatformWindowState>): void;
}

/** A platform with the `window` capability, its window an external store. */
export function fakeWindow(
  options: { controls?: 'bloom' | 'platform'; state?: Partial<PlatformWindowState> } = {},
): { window: FakeWindow; adapter: PlatformSurfaceAdapter } {
  let state: PlatformWindowState = {
    active: true,
    maximized: false,
    fullscreen: false,
    ...options.state,
  };
  const listeners = new Set<() => void>();
  const window: FakeWindow = {
    controls: options.controls ?? 'bloom',
    metrics: WINDOW_METRICS,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    close: jest.fn(),
    minimize: jest.fn(),
    zoom: jest.fn(),
    startMove: jest.fn(),
    set(next) {
      state = { ...state, ...next };
      for (const listener of listeners) listener();
    },
  };
  return {
    window,
    adapter: { platform: 'test', capabilities: new Set(['window']), window },
  };
}
