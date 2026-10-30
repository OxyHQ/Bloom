import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

import { usePlatformWindow } from '../platform-surface/context';
import { useWindowChrome } from './context';
import type { PlatformWindowState } from '../platform-surface/types';
import type { WindowControlsRoom, WindowHandle } from './types';

const NO_ROOM: WindowControlsRoom = { top: 0, leading: 0 };

function unsubscribed() {}

/**
 * The application's window: its state (active, maximized, full screen) and
 * the actions on it, or `null` when the platform reports no `window`
 * capability (a browser tab, a phone). Re-renders when the state changes.
 */
export function useWindow(): WindowHandle | null {
  const platform = usePlatformWindow();
  // `useSyncExternalStore` compares snapshots by identity, so an adapter that
  // builds a fresh object on every `getState()` must not read as a change.
  const last = useRef<PlatformWindowState | null>(null);
  const subscribe = useCallback(
    (listener: () => void) => (platform ? platform.subscribe(listener) : unsubscribed),
    [platform],
  );
  const getSnapshot = useCallback((): PlatformWindowState | null => {
    if (!platform) return null;
    const next = platform.getState();
    const previous = last.current;
    if (
      previous &&
      previous.active === next.active &&
      previous.maximized === next.maximized &&
      previous.fullscreen === next.fullscreen
    )
      return previous;
    last.current = {
      active: next.active,
      maximized: next.maximized,
      fullscreen: next.fullscreen,
    };
    return last.current;
  }, [platform]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return useMemo(
    () =>
      platform && state
        ? {
            ...state,
            controls: platform.controls,
            metrics: platform.metrics,
            close: () => platform.close(),
            minimize: () => platform.minimize(),
            zoom: () => platform.zoom(),
            startMove: () => platform.startMove(),
          }
        : null,
    [platform, state],
  );
}

/**
 * Whether the window is full screen, re-rendering only when that changes (not
 * on every activation, as `useWindow()` does): for the many regions that only
 * need to know whether the window's chrome shows. False without the capability.
 */
export function useWindowFullscreen(): boolean {
  const platform = usePlatformWindow();
  const subscribe = useCallback(
    (listener: () => void) => (platform ? platform.subscribe(listener) : unsubscribed),
    [platform],
  );
  const getSnapshot = useCallback(() => platform?.getState().fullscreen === true, [platform]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * The room to keep clear for the window's controls, whoever draws them. Zero
 * without the `window` capability and while the window is full screen.
 */
export function useWindowControlsRoom(): WindowControlsRoom {
  const appWindow = useWindow();
  return appWindow && !appWindow.fullscreen ? appWindow.metrics.room : NO_ROOM;
}

/**
 * In the region that is the window's chrome (the header of a `Screen` along
 * the window's top edge, or a panel's content with no `Screen` of its own),
 * the room its top bar keeps clear at its leading edge for the window's
 * controls. Zero everywhere else, without the `window` capability and while
 * the window is full screen. `PageHeader` keeps it itself; a header of an
 * application's own keeps it with `paddingInlineStart`.
 */
export function useWindowHeaderRoom(): number {
  return useWindowChrome()?.leading ?? 0;
}
