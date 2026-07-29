import { Platform } from 'react-native';

/**
 * Initialize react-native-css-interop's `darkMode` flag to `'class'` once at
 * module load time so that downstream calls to its color-scheme machinery do
 * not throw.
 *
 * Why this exists
 * ---------------
 * Bloom toggles a `dark` class on `<html>` (see `applyDarkClass`). When the
 * consuming app ships `react-native-css-interop` (directly or via NativeWind),
 * its web runtime installs a MutationObserver on `<head>` that watches for
 * the NativeWind-generated CSS to be injected. Once that CSS lands, the
 * observer reads the `--css-interop-darkMode` CSS variable and calls
 * `colorScheme.set(...)`. If the active value is `'media'` (the Tailwind
 * default when `darkMode` is unset), `colorScheme.set` throws:
 *
 *   "Cannot manually set color scheme, as dark mode is type 'media'.
 *    Please use StyleSheet.setFlag('darkMode', 'class')"
 *
 * Bloom is class-driven by design — `applyDarkClass` toggles `<html>.dark` —
 * so we need to force the flag to `'class'` before that observer fires.
 *
 * How it works
 * ------------
 * - On web we set the documented `--css-interop-darkMode` CSS custom property
 *   on `documentElement`. This is exactly what NativeWind's Tailwind plugin
 *   writes when its config is `darkMode: 'class'`, so we are replicating the
 *   public contract — not poking internals.
 * - We additionally try to call `StyleSheet.setFlag('darkMode', 'class')`
 *   off of `react-native-css-interop`'s exported `StyleSheet`. The function
 *   does not exist in current `react-native-css-interop` (≤0.2.4), but the
 *   error message advertises it and future versions are likely to add it.
 *   Calling it is forward-compatible; missing-function is a no-op.
 *
 * The whole routine is idempotent and runs exactly once per process via
 * a module-scoped guard.
 */

let initialized = false;
let warned = false;

const CSS_VAR_NAME = '--css-interop-darkMode';
const CSS_VAR_VALUE = 'class dark';

interface CssInteropStyleSheet {
  setFlag?: (name: string, value: string) => void;
}

interface CssInteropModule {
  StyleSheet?: CssInteropStyleSheet;
}

function warnOnce(message: string, error?: unknown): void {
  if (warned) return;
  warned = true;
  // Internal Bloom diagnostic. Consumers cannot react to this — it signals
  // a possible compatibility issue between Bloom and the host's css-interop.
  // eslint-disable-next-line no-console
  console.warn(`[Bloom] ${message}`, error ?? '');
}

function setWebCssVariable(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!root) return;
  // Only set if not already explicitly configured by the host (e.g. the host's
  // Tailwind config already emitted this variable). Avoid clobbering an
  // explicit `media` choice from the consumer.
  const current = root.style.getPropertyValue(CSS_VAR_NAME);
  if (current) return;
  root.style.setProperty(CSS_VAR_NAME, CSS_VAR_VALUE);
}

function tryCallSetFlag(): void {
  let mod: CssInteropModule | undefined;
  // `require` does not exist in an ES module, so guard before touching it —
  // an unguarded reference is a ReferenceError, not a resolution failure.
  if (typeof require === 'undefined') return;
  try {
    // Dynamic require: css-interop is neither a Bloom dependency nor a declared
    // peer. The specifier goes through a variable to keep a plain-text
    // `require('react-native-css-interop')` out of the file, so bundlers that
    // scan for one do not try to resolve (and warn about, or fail on) a module
    // Bloom never asked for.
    //
    // Metro is not among them: its dependency collector EVALUATES the argument,
    // folds this `const`, and treats the call exactly as it would a literal —
    // optional, because it is a direct statement of a `try` block. So the
    // indirection buys nothing under Metro and costs nothing either. It is not a
    // pattern to copy: a specifier Metro cannot evaluate (a function parameter,
    // a computed value) collects no dependency at all and is rewritten into a
    // thrower, which is how `lazyRequire` silently killed four subsystems. See
    // `connection-status/netinfo.ts` for the shape a real peer must use.
    const moduleName = 'react-native-css-interop';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(moduleName) as CssInteropModule;
  } catch {
    return;
  }

  const setFlag = mod?.StyleSheet?.setFlag;
  if (typeof setFlag !== 'function') {
    // Current react-native-css-interop (≤0.2.4) does not expose `setFlag`.
    // The CSS variable path above is the actual fix on web; on native the
    // flag is baked in by the Tailwind build. Surface a warning so we
    // notice if a future version adds the method but we miss it.
    return;
  }

  try {
    setFlag.call(mod?.StyleSheet, 'darkMode', 'class');
  } catch (error) {
    warnOnce(
      'react-native-css-interop StyleSheet.setFlag("darkMode", "class") threw. ' +
        'Falling back to CSS variable. This is non-fatal.',
      error,
    );
  }
}

/**
 * Idempotent initializer. Safe to call from multiple modules; only the first
 * invocation performs work.
 */
export function initCssInteropDarkMode(): void {
  if (initialized) return;
  initialized = true;

  if (Platform.OS === 'web') {
    setWebCssVariable();
  }

  tryCallSetFlag();
}

// Run on module import so that the flag is in place before any component
// code (and, critically, before css-interop's MutationObserver fires on web).
// useEffect would be too late — observers can fire during initial render.
initCssInteropDarkMode();
