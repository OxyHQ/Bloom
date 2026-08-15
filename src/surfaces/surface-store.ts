import type {
  PresentOptions,
  SurfaceEntry,
  SurfaceRenderFn,
} from './types';

/**
 * The shared, content-agnostic SURFACE STACK.
 *
 * A module-singleton store (same pattern as `theme/ambient-store.ts` and
 * `dialog/alert-store.ts`) holding an ordered stack of surfaces presented ON TOP
 * of each other — bottom→top, the last entry is the top. One coordinated stack
 * that the whole ecosystem (the SDK AND consumer apps) presents into, so
 * overlays never clash: per-layer z, top-only interactivity, backdrop/Escape/
 * back routed to the TOP surface, lower layers dimmed.
 *
 * It is CONTENT-AGNOSTIC: `present` takes a render function, not a route name.
 * Bloom must never know about routes; the SDK layers its route registry on top.
 *
 * `getSnapshot` returns a STABLE reference while unchanged (the array identity
 * only changes on a real mutation), so `useSyncExternalStore` — and the React
 * Compiler — never see a silently-stale value.
 */

let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `bloom-surface-${idCounter}`;
}

/** A single frozen "empty stack" snapshot returned by `getSnapshot` when idle. */
const EMPTY: readonly SurfaceEntry[] = Object.freeze([]);

let surfaces: readonly SurfaceEntry[] = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Subscribe to stack changes. Returns an unsubscribe fn. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current stack snapshot (stable ref while unchanged). Bottom→top. */
export function getSnapshot(): readonly SurfaceEntry[] {
  return surfaces;
}

/**
 * Present a new surface on TOP of the stack. Returns a promise that resolves
 * with the value passed to `dismiss(result)` (or `undefined` when the surface is
 * dismissed without a result / by a stack-wide clear).
 */
export function present<Result = unknown>(
  render: SurfaceRenderFn,
  opts?: PresentOptions,
): Promise<Result> {
  return new Promise<Result>((resolve) => {
    const entry: SurfaceEntry = {
      id: genId(),
      render,
      presentation: opts ?? {},
      status: 'open',
      resolve: resolve as (result: unknown) => void,
      settled: false,
      generation: 0,
    };
    surfaces = [...surfaces, entry];
    emit();
  });
}

/**
 * Request dismissal of a surface. RESOLVES THE PROMISE IMMEDIATELY (the exit
 * animation that follows is cosmetic) and flips the entry to `'closing'` so the
 * host runs its exit animation. Resolution is resolve-once via the `settled`
 * guard — a second request (or the host's post-exit `onClose`) never re-resolves
 * with a different value. Bumps the entry `generation` so a completion callback
 * from a superseded cycle is inert.
 */
export function requestDismiss(id: string, result?: unknown): void {
  const entry = surfaces.find((e) => e.id === id);
  if (!entry) return;

  // Resolve-once. The mapped replacement below carries `settled: true`, so a
  // later `requestDismiss(id)` reads the settled entry and skips this branch —
  // no in-place mutation of the live entry is needed.
  if (!entry.settled) {
    entry.resolve(result);
  }

  if (entry.status === 'closing') return;

  surfaces = surfaces.map((e) =>
    e.id === id
      ? { ...e, settled: true, status: 'closing', generation: e.generation + 1 }
      : e,
  );
  emit();
}

/**
 * Splice a surface out of the stack once its exit animation has settled. Called
 * by the host from the `Dialog`'s post-exit `onClose`. Idempotent and gated on
 * `'closing'` status: a stale/duplicate call — or one for an entry that is not
 * actually closing — is a no-op, which (together with unique entry ids) is the
 * stale-callback hygiene `BottomSheetBase`'s generation guard provides for its
 * reused instance.
 */
export function finalizeClose(id: string): void {
  const entry = surfaces.find((e) => e.id === id);
  if (!entry || entry.status !== 'closing') return;
  const next = surfaces.filter((e) => e.id !== id);
  surfaces = next.length === 0 ? EMPTY : next;
  emit();
}

/** Dismiss the TOP surface, resolving its promise with `result`. */
export function dismissTop(result?: unknown): void {
  const top = surfaces[surfaces.length - 1];
  if (top) requestDismiss(top.id, result);
}

/**
 * Dismiss every surface ABOVE the bottom-most one, keeping the root surface
 * open. Pending awaiters of the dismissed surfaces resolve with `undefined` so
 * they never hang. No-op with 0 or 1 surfaces.
 */
export function dismissToRoot(): void {
  if (surfaces.length <= 1) return;
  const above = surfaces.slice(1).map((e) => e.id);
  for (const id of above) requestDismiss(id, undefined);
}

/**
 * Dismiss the ENTIRE stack. Every pending awaiter resolves with `undefined` so
 * none hang.
 */
export function dismissAll(): void {
  const ids = surfaces.map((e) => e.id);
  for (const id of ids) requestDismiss(id, undefined);
}

/**
 * Hard-reset the stack synchronously (no exit animation), resolving all pending
 * awaiters with `undefined`. Used when the host provider unmounts so no
 * `present()` promise is stranded.
 */
export function resetSurfaces(): void {
  if (surfaces.length === 0) return;
  const pending = surfaces;
  surfaces = EMPTY;
  for (const entry of pending) {
    if (!entry.settled) entry.resolve(undefined);
  }
  emit();
}

/** Test-only: hard-reset without notifying (drops listeners' work). */
export function __resetSurfacesForTests(): void {
  surfaces = EMPTY;
  idCounter = 0;
}
