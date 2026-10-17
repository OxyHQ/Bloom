import { useMemo, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

const ZERO: EdgeInsets = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

/**
 * The safe-area insets a component was given, raised on web to CSS
 * `env(safe-area-inset-*)`. Every Bloom inset read goes through it:
 * `useCssSafeAreaInsets(useSafeAreaInsets())`, or the context form where a
 * provider is optional.
 *
 * From Expo SDK 58, Expo Router's web root provides ZERO insets through
 * react-native-safe-area-context (measuring them could discard streamed content
 * during hydration), and Expo's guidance is to use `env()` instead. Without this,
 * every Bloom bar and sheet that pads for the home indicator or the notch loses
 * that padding in an installed iOS web app — silently, since zero is a perfectly
 * valid inset.
 *
 * `env()` is read from one shared off-screen probe AFTER mount, so server
 * rendering and hydration see the provider's value and nothing re-renders until
 * the browser has a real answer. The per-edge max (not a sum) keeps an app that
 * mounts its own measuring provider from padding twice. Native returns its input
 * untouched.
 */
export function useCssSafeAreaInsets(provided: EdgeInsets): EdgeInsets {
  const css = useSyncExternalStore(subscribeCssInsets, readCssInsets, readServerInsets);
  const raised = Platform.OS === 'web' && css !== ZERO;
  const top = raised ? Math.max(provided.top, css.top) : provided.top;
  const right = raised ? Math.max(provided.right, css.right) : provided.right;
  const bottom = raised ? Math.max(provided.bottom, css.bottom) : provided.bottom;
  const left = raised ? Math.max(provided.left, css.left) : provided.left;
  // One identity per value, so a caller's effect keyed on the insets runs when
  // an inset CHANGES, not on every render.
  const merged = useMemo(() => ({ top, right, bottom, left }), [top, right, bottom, left]);
  return raised ? merged : provided;
}

/** No provider and no measurement: what a context read falls back to. */
export const NO_SAFE_AREA_INSETS: EdgeInsets = ZERO;

let probe: HTMLElement | null = null;
let snapshot: EdgeInsets = ZERO;
const listeners = new Set<() => void>();

function readServerInsets(): EdgeInsets {
  return ZERO;
}

function readCssInsets(): EdgeInsets {
  return snapshot;
}

function measure(): void {
  if (!probe) return;
  const style = getComputedStyle(probe);
  const next = {
    top: Number.parseFloat(style.paddingTop) || 0,
    right: Number.parseFloat(style.paddingRight) || 0,
    bottom: Number.parseFloat(style.paddingBottom) || 0,
    left: Number.parseFloat(style.paddingLeft) || 0,
  };
  const same =
    next.top === snapshot.top &&
    next.right === snapshot.right &&
    next.bottom === snapshot.bottom &&
    next.left === snapshot.left;
  if (same) return;
  snapshot = next.top || next.right || next.bottom || next.left ? next : ZERO;
  for (const listener of listeners) listener();
}

function subscribeCssInsets(listener: () => void): () => void {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || !document.body) {
    return () => {};
  }
  listeners.add(listener);
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    // Set through the CSSOM (`element.style`), which CSP `style-src` does not
    // block — unlike a `<style>` element or a `style` attribute string.
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.top = '0';
    probe.style.left = '0';
    probe.style.setProperty('padding-top', 'env(safe-area-inset-top, 0px)');
    probe.style.setProperty('padding-right', 'env(safe-area-inset-right, 0px)');
    probe.style.setProperty('padding-bottom', 'env(safe-area-inset-bottom, 0px)');
    probe.style.setProperty('padding-left', 'env(safe-area-inset-left, 0px)');
    document.body.appendChild(probe);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
  }
  measure();
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0 || !probe) return;
    window.removeEventListener('resize', measure);
    window.removeEventListener('orientationchange', measure);
    probe.remove();
    probe = null;
    snapshot = ZERO;
  };
}
