import {
  dismissAll,
  dismissToRoot,
  dismissTop,
  present,
  requestDismiss,
} from './surfaceStore';
import { alert, confirm, prompt } from './prompts';
import type { PresentOptions, SurfaceRenderFn } from './types';

/**
 * Dismiss the TOP surface, resolving its `present()` promise with `result`.
 * The public counterpart of the store's `dismissTop`.
 */
function dismiss(result?: unknown): void {
  dismissTop(result);
}

/**
 * Dismiss a SPECIFIC surface by id, resolving its `present()` promise with
 * `result`. Rarely needed — most call sites use `dismiss()` (top) or the
 * per-surface `SurfaceControls.dismiss`.
 */
function dismissById(id: string, result?: unknown): void {
  requestDismiss(id, result);
}

/**
 * The shared imperative surface-stack API — a module singleton, so any consumer,
 * in the SDK or an app, presents into the SAME coordinated Bloom stack from
 * anywhere without threading a provider.
 *
 * It is the ONLY imperative overlay API in the package. `alert()` and
 * `confirm()` used to be two further module-scope FIFO queues with hosts of
 * their own (`dialog/alert-store` + `BloomDialogProvider`,
 * `alert-dialog/confirm-store` + `AlertDialogHost`); both are gone and both now
 * present here.
 *
 * Exposed at the package root as `surfaces`, and — for `alert`/`confirm` — as
 * bare names too; every member is also a named export of
 * `@oxyhq/bloom/surfaces` for direct import.
 */
export const surfaces = {
  /** Present a new surface on top. Resolves with the dismissal result. */
  present: <Result = unknown>(render: SurfaceRenderFn, opts?: PresentOptions) =>
    present<Result>(render, opts),
  /** Dismiss the top surface. */
  dismiss,
  /** Dismiss a specific surface by id. */
  dismissById,
  /** Dismiss everything above the root surface. */
  dismissToRoot,
  /** Dismiss the entire stack (resolves pending awaiters with `undefined`). */
  dismissAll,
  /** Present an alert surface (React Native's `Alert.alert` signature). */
  alert,
  /** Present a confirm surface; resolves `true`/`false`. */
  confirm,
  /** Present a prompt surface; resolves the string or `null`. */
  prompt,
} as const;

export { alert, confirm, dismiss, dismissAll, dismissById, dismissToRoot, present, prompt };
