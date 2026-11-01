/**
 * Whether the running target is a touch-capable WEB browser (coarse pointer).
 *
 * Two affordances key off it in opposite directions, which is why it is one
 * constant rather than a rule stated twice:
 *
 * - A press-SCALE only makes sense where a finger obscures the element. With a
 *   mouse it reads as jitter, so it is suppressed on non-touch web
 *   (`usePressAnimation`, `PressableScale`).
 * - A HOVER wash only makes sense with a hovering pointer, so it is suppressed
 *   ON touch web, matching native, which has no hover at all (`SubtleHover`).
 *
 * These existing animation flags are snapshots. Geometry and swipe availability
 * use useTouchInput below, which tracks changes in attached input devices.
 */
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import { usePlatformSurfaces } from '../platform-surface/context';

export const IS_WEB_TOUCH_DEVICE =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(pointer: coarse)').matches;

/**
 * Whether a press-scale affordance should run at all on this target. True on
 * native always, and on web only with a coarse pointer.
 *
 * This is the POINTER half of the decision — the OS "reduce motion" setting is
 * the other half and is read per-component (it is a subscription, not a
 * constant). Both are applied together inside `usePressAnimation`.
 */
export const SUPPORTS_PRESS_SCALE = Platform.OS !== 'web' || IS_WEB_TOUCH_DEVICE;

function coarsePointerQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
  try {
    return window.matchMedia('(pointer: coarse)');
  } catch {
    return undefined;
  }
}
function readCoarsePointer() {
  return coarsePointer?.matches ?? coarsePointerQuery()?.matches ?? false;
}
const coarsePointerListeners = new Set<() => void>();
let coarsePointer: MediaQueryList | undefined;
let stopCoarsePointer: (() => void) | undefined;

function notifyCoarsePointerListeners() {
  for (const listener of [...coarsePointerListeners]) {
    if (coarsePointerListeners.has(listener)) listener();
  }
}

function subscribeCoarsePointer(notify: () => void) {
  coarsePointerListeners.add(notify);
  if (!coarsePointer) {
    const query = coarsePointerQuery();
    if (query) {
      try {
        if (typeof query.addEventListener === 'function') {
          query.addEventListener('change', notifyCoarsePointerListeners);
          stopCoarsePointer = () =>
            query.removeEventListener('change', notifyCoarsePointerListeners);
        } else {
          query.addListener(notifyCoarsePointerListeners);
          stopCoarsePointer = () => query.removeListener(notifyCoarsePointerListeners);
        }
        coarsePointer = query;
      } catch (error) {
        coarsePointerListeners.delete(notify);
        throw error;
      }
    }
  }
  return () => {
    coarsePointerListeners.delete(notify);
    if (coarsePointerListeners.size === 0) {
      const stop = stopCoarsePointer;
      stopCoarsePointer = undefined;
      coarsePointer = undefined;
      stop?.();
    }
  };
}
/**
 * Whether controls take a finger's geometry (44pt rows, swipe affordances).
 * Geometry and swipe affordances react when a mounted app changes input device.
 *
 * Native is touch, except in a desktop window: a platform that reports the
 * `window` capability (an OxyOS window) runs the application in a window a
 * pointer drives, so its menus, lists and controls take a desktop's compact
 * geometry, as they do on the web with a fine pointer. Without this, an OxyOS
 * window drew a phone's menus: every context menu row 44pt tall. A platform
 * that reports `pointer` (a desktop's shell, which is in no window) is the
 * same desktop.
 */
export function useTouchInput() {
  const coarse = useSyncExternalStore(subscribeCoarsePointer, readCoarsePointer, () => false);
  const capabilities = usePlatformSurfaces()?.capabilities;
  if (capabilities?.has('window') || capabilities?.has('pointer')) return false;
  return Platform.OS !== 'web' || coarse;
}
