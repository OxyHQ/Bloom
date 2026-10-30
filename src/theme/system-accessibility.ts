import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * What the system's own accessibility settings ask of every blurred material.
 *
 * - `reduceTransparency`: iOS Reduce Transparency; the browser's
 *   `prefers-reduced-transparency: reduce`.
 * - `increaseContrast`: iOS Increase Contrast (React Native's "darker system
 *   colors"), Android's high-contrast text, the browser's
 *   `prefers-contrast: more` or `forced-colors: active`.
 *
 * `BloomThemeProvider` reads it once and ORs it with its own props and the
 * platform adapter's appearance; components read `useReducedTransparency()` and
 * `useIncreasedContrast()`, never this.
 */
export interface SystemAccessibility {
  readonly reduceTransparency: boolean;
  readonly increaseContrast: boolean;
}

const NONE: SystemAccessibility = { reduceTransparency: false, increaseContrast: false };

export const REDUCED_TRANSPARENCY_QUERY = '(prefers-reduced-transparency: reduce)';
export const INCREASED_CONTRAST_QUERIES = ['(prefers-contrast: more)', '(forced-colors: active)'];

let state: SystemAccessibility = NONE;
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;

function publish(next: Partial<SystemAccessibility>) {
  const merged = { ...state, ...next };
  if (
    merged.reduceTransparency === state.reduceTransparency &&
    merged.increaseContrast === state.increaseContrast
  )
    return;
  state = merged;
  for (const listener of listeners) listener();
}

function matches(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** The browser's media queries, read now and on every change. */
function startWeb(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const read = () => publish(readWeb());
  const lists = [REDUCED_TRANSPARENCY_QUERY, ...INCREASED_CONTRAST_QUERIES].map((query) =>
    window.matchMedia(query),
  );
  for (const list of lists) list.addEventListener?.('change', read);
  read();
  return () => {
    for (const list of lists) list.removeEventListener?.('change', read);
  };
}

type Query = () => Promise<boolean>;

/**
 * One native setting: its current value, then its change event. A host that
 * does not implement the query (it rejects, or the method is missing) leaves it
 * false, as React Native's own platform branches do.
 */
function follow(
  key: keyof SystemAccessibility,
  query: Query | undefined,
  event: string,
): () => void {
  let live = true;
  query
    ?.call(AccessibilityInfo)
    .then((value) => {
      if (live) publish({ [key]: value === true });
    })
    .catch(() => {});
  let subscription: { remove(): void } | undefined;
  try {
    subscription = (
      AccessibilityInfo.addEventListener as (
        name: string,
        handler: (value: boolean) => void,
      ) => { remove(): void } | undefined
    )(event, (value) => publish({ [key]: value === true }));
  } catch {
    subscription = undefined;
  }
  return () => {
    live = false;
    subscription?.remove();
  };
}

/** iOS: Reduce Transparency and Increase Contrast. Android: high-contrast text. */
function startNative(): () => void {
  const info = AccessibilityInfo as typeof AccessibilityInfo & {
    isReduceTransparencyEnabled?: Query;
    isDarkerSystemColorsEnabled?: Query;
    isHighTextContrastEnabled?: Query;
  };
  if (Platform.OS === 'ios') {
    const a = follow(
      'reduceTransparency',
      info.isReduceTransparencyEnabled,
      'reduceTransparencyChanged',
    );
    const b = follow(
      'increaseContrast',
      info.isDarkerSystemColorsEnabled,
      'darkerSystemColorsChanged',
    );
    return () => {
      a();
      b();
    };
  }
  if (Platform.OS === 'android') {
    return follow('increaseContrast', info.isHighTextContrastEnabled, 'highTextContrastChanged');
  }
  return () => {};
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Platform.OS is read per subscription, not at module load, so a test can
  // reach every branch without reloading the module (and a second React).
  if (!stop) stop = Platform.OS === 'web' ? startWeb() : startNative();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stop) {
      stop();
      stop = null;
      state = NONE;
    }
  };
}

function readWeb(): SystemAccessibility {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return NONE;
  return {
    reduceTransparency: matches(REDUCED_TRANSPARENCY_QUERY),
    increaseContrast: INCREASED_CONTRAST_QUERIES.some(matches),
  };
}

// Before the first subscription the web's answer is already known: read it, so
// the first client render does not draw a blur the browser has turned down.
const snapshot = () => {
  if (!stop && Platform.OS === 'web') publish(readWeb());
  return state;
};
// The server cannot know the reader's settings: it renders the default, and
// React re-renders with the client's snapshot after hydration.
const serverSnapshot = () => NONE;

/** The system's accessibility settings that change how materials are drawn. */
export function useSystemAccessibility(): SystemAccessibility {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
