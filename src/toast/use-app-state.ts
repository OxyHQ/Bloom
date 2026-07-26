/**
 * Derived from sonner-native v0.26.4 — src/use-app-state.ts
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * Owns the whole "did the app go away" concern in one place so callers never
 * have to guard the platform themselves (W4). Two upstream problems are fixed
 * here rather than at the call sites:
 *
 *   1. `AppState.addEventListener` is unavailable when react-native-web runs
 *      without a document (SSR / prerender / a non-DOM test environment), where
 *      RN reports `AppState.isAvailable === false`. Upstream subscribes
 *      unconditionally and then calls `subscription.remove()` on unmount, which
 *      throws a `TypeError` there. The absence of a subscription is a documented
 *      environment fact, not an error to catch and swallow — so this checks the
 *      flag the platform provides and returns a no-op unsubscribe.
 *   2. Upstream treats every non-`active` transition as "backgrounded", so
 *      `background` → `inactive` fires `onBackground` a second time and re-pauses
 *      an already-paused timer. This compares active-ness on both sides of the
 *      transition and reports only real edges.
 */
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const NOOP = () => {};

const isActive = (status: AppStateStatus) => status === 'active';

/**
 * Subscribe to app-state changes.
 *
 * @returns an unsubscribe function — a no-op when the platform provides no
 *   `AppState` subscription.
 */
export function subscribeToAppState(
  onChange: (status: AppStateStatus) => void,
): () => void {
  if (!AppState.isAvailable) {
    return NOOP;
  }

  const subscription = AppState.addEventListener('change', onChange);
  return () => {
    subscription.remove();
  };
}

/**
 * Call `onBackground` when the app leaves the foreground and `onForeground` when
 * it comes back — once per edge, never on a transition between two inactive
 * states.
 */
export function useAppStateChange({
  onBackground,
  onForeground,
}: {
  onBackground: () => void;
  onForeground: () => void;
}) {
  const previousStatus = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    return subscribeToAppState((nextStatus) => {
      const wasActive = isActive(previousStatus.current);
      previousStatus.current = nextStatus;

      if (isActive(nextStatus)) {
        if (!wasActive) {
          onForeground();
        }
        return;
      }
      if (wasActive) {
        onBackground();
      }
    });
  }, [onBackground, onForeground]);
}
