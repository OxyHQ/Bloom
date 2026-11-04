import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Whether the viewer asked the OS for reduced motion — Bloom's ONE reading of
 * it, live, and the same answer for every component.
 *
 * Reanimated's `useReducedMotion` reads the setting once, when the app starts,
 * and never again: a viewer who turns Reduce Motion on mid-session kept every
 * Bloom animation. This follows the OS (`reduceMotionChanged` on native, the
 * `prefers-reduced-motion` media query on the web) without loading an animation
 * runtime.
 *
 * Native's query is asynchronous, so the answer is asked for when this module
 * loads — long before the first component renders — and shared from then on:
 * a component mounting later reads the known answer synchronously instead of
 * starting still and moving a frame later. Until the very first answer it reads
 * `true`: motion stays still rather than animating for someone who asked it not
 * to. The server snapshot is `true` too.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const QUERY = '(prefers-reduced-motion: reduce)';

const listeners = new Set<() => void>();
/** Native's last answer; `true` until the OS has given one. */
let nativeReduced = true;
/** Bumped by every OS event, so an older query's answer never overwrites a newer event. */
let nativeVersion = 0;
let nativeSubscription: { remove: () => void } | null = null;
/** Set while nothing listens: an event may have been missed. */
let nativeStale = false;

function setNative(value: boolean): void {
  if (value === nativeReduced) return;
  nativeReduced = value;
  for (const listener of listeners) listener();
}

function queryNative(): void {
  // A host without the accessibility module answers nothing; stay conservative.
  if (typeof AccessibilityInfo?.isReduceMotionEnabled !== 'function') return;
  const version = nativeVersion;
  AccessibilityInfo.isReduceMotionEnabled()
    .then((value) => {
      if (version === nativeVersion) setNative(value);
    })
    .catch(() => {
      /* Keep the conservative preference if the OS query fails. */
    });
}

function webMedia(): MediaQueryList | null {
  return typeof window === 'undefined' || !window.matchMedia ? null : window.matchMedia(QUERY);
}

function getSnapshot(): boolean {
  if (Platform.OS !== 'web') return nativeReduced;
  // A browser always has `matchMedia`; without one nothing says the viewer
  // asked for stillness.
  return webMedia()?.matches ?? false;
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (Platform.OS === 'web') {
    const media = webMedia();
    media?.addEventListener('change', listener);
    return () => {
      listeners.delete(listener);
      media?.removeEventListener('change', listener);
    };
  }
  if (!nativeSubscription) {
    nativeSubscription =
      AccessibilityInfo?.addEventListener?.('reduceMotionChanged', (value) => {
        nativeVersion++;
        setNative(value);
      }) ?? null;
    if (nativeStale) {
      // Unwatched for a while, the answer may have gone stale; ask again.
      nativeStale = false;
      queryNative();
    }
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0 || !nativeSubscription) return;
    nativeSubscription.remove();
    nativeSubscription = null;
    nativeStale = true;
  };
}

if (Platform.OS !== 'web') queryNative();
