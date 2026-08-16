import { useSyncExternalStore } from 'react';

/**
 * The current ambient theme override. When `seed` is non-null the whole app is
 * themed from this dynamic seed (same colour engine the `seed` prop uses),
 * overriding the active preset / static `seed` prop. `secondary`/`tertiary` pin
 * this seed's accent families (e.g. the 2nd/3rd colours extracted from artwork).
 */
export interface AmbientThemeState {
  readonly seed: string | null;
  readonly secondary: string | null;
  readonly tertiary: string | null;
}

export interface AmbientAccents {
  secondary?: string | null;
  tertiary?: string | null;
}

export interface AmbientThemeApi {
  /**
   * Set the ambient seed (and optional accents). Coalesced through an internal
   * debounce so rapid hover/scroll doesn't thrash the theme. The debounce lives
   * HERE — apps never own one.
   */
  setAmbient: (seed: string, accents?: AmbientAccents) => void;
  /** Clear the ambient override, restoring the preset (or the static `seed` prop). */
  clearAmbient: () => void;
}

/** Options for {@link useAmbientTheme}. */
export interface UseAmbientThemeOptions {
  /**
   * Debounce, in ms, applied to `setAmbient`/`clearAmbient` before the store
   * commits. Default `120`. Pass `0` to apply synchronously.
   */
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 120;

// A single frozen "no override" snapshot. `getSnapshot` returns this EXACT
// reference whenever nothing is set, so `useSyncExternalStore` sees a stable
// identity across renders (React-Compiler-safe: the memoized value never
// silently goes stale because the snapshot ref only changes on a real commit).
const EMPTY_STATE: AmbientThemeState = Object.freeze({
  seed: null,
  secondary: null,
  tertiary: null,
});

let state: AmbientThemeState = EMPTY_STATE;
const listeners = new Set<() => void>();

// Pending debounced commit. `null` operation means "clear".
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCommit: (() => void) | null = null;

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(next: AmbientThemeState): void {
  // Skip a no-op commit so subscribers don't re-render for an identical value.
  if (
    next.seed === state.seed &&
    next.secondary === state.secondary &&
    next.tertiary === state.tertiary
  ) {
    return;
  }
  state = next;
  emit();
}

function schedule(next: AmbientThemeState, debounceMs: number): void {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  const run = () => {
    pendingTimer = null;
    pendingCommit = null;
    commit(next);
  };
  if (debounceMs <= 0) {
    run();
    return;
  }
  pendingCommit = run;
  pendingTimer = setTimeout(run, debounceMs);
  // Release the handle where the host has one to release, so a pending debounce
  // never holds a jest worker or an SSR process open. Only Node's timer handle
  // is an object with `unref`; React Native and the browser return an opaque
  // `number`, which has no such property AT ALL.
  //
  // This has to test the PROPERTY, not optional-call it: `pendingTimer.unref?.()`
  // guards the CALL and still requires `unref` to exist on the declared type, so
  // it is a hard TS2339 in every consumer's program, where `setTimeout` returns
  // `number`. It compiled inside Bloom only because Bloom's own tsconfig pulls
  // in @types/node. Widening through `unknown` is what makes the narrowing
  // structural, and therefore valid under both programs.
  // Gate: scripts/verify-consumer-typecheck.mjs.
  const handle: unknown = pendingTimer;
  if (
    typeof handle === 'object' &&
    handle !== null &&
    'unref' in handle &&
    typeof handle.unref === 'function'
  ) {
    handle.unref();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AmbientThemeState {
  return state;
}

/** Internal setter used by the debounced hook API. */
function setAmbientInternal(seed: string, accents: AmbientAccents | undefined, debounceMs: number): void {
  schedule(
    {
      seed,
      secondary: accents?.secondary ?? null,
      tertiary: accents?.tertiary ?? null,
    },
    debounceMs,
  );
}

/** Internal clear used by the debounced hook API. */
function clearAmbientInternal(debounceMs: number): void {
  schedule(EMPTY_STATE, debounceMs);
}

/**
 * Read + drive the app-wide ambient theme. Reading returns the current override
 * (via `useSyncExternalStore` — stable snapshot ref while unchanged); the
 * returned `setAmbient`/`clearAmbient` are debounced imperative controls.
 *
 * `BloomThemeProvider` consumes the SAME store internally, so calling
 * `setAmbient(...)` from anywhere themes the whole app through the provider's
 * single apply path — no `seed` prop threading, no app-owned theming store.
 */
export function useAmbientTheme(
  options?: UseAmbientThemeOptions,
): AmbientThemeState & AmbientThemeApi {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    seed: current.seed,
    secondary: current.secondary,
    tertiary: current.tertiary,
    setAmbient: (seed, accents) => setAmbientInternal(seed, accents, debounceMs),
    clearAmbient: () => clearAmbientInternal(debounceMs),
  };
}

/**
 * Provider-side subscription. Returns the current ambient state with a stable
 * ref while unchanged. Uses the same store, so it stays in lockstep with any
 * `useAmbientTheme()` caller.
 */
export function useAmbientThemeState(): AmbientThemeState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Non-hook imperative escape hatch (e.g. gesture handlers / worklets bridges /
 * non-React callers). Same debounced store as {@link useAmbientTheme}.
 */
export const ambientTheme: AmbientThemeApi & { getState: () => AmbientThemeState } = {
  setAmbient: (seed, accents) => setAmbientInternal(seed, accents, DEFAULT_DEBOUNCE_MS),
  clearAmbient: () => clearAmbientInternal(DEFAULT_DEBOUNCE_MS),
  getState: getSnapshot,
};

/** Test-only: flush any pending debounced commit synchronously. */
export function __flushAmbientForTests(): void {
  if (pendingCommit) {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    const run = pendingCommit;
    pendingCommit = null;
    run();
  }
}

/** Test-only: reset the store to the empty state without notifying via debounce. */
export function __resetAmbientForTests(): void {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  pendingCommit = null;
  commit(EMPTY_STATE);
}
