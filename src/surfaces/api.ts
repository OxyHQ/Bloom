import {
  dismissAll,
  dismissToRoot,
  dismissTop,
  present,
  requestDismiss,
} from './surfaceStore';
import { confirm, prompt } from './prompts';
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
 * The shared imperative surface-stack API — a module singleton (mirrors
 * `alert()`'s shape) so any consumer, in the SDK or an app, presents into the
 * SAME coordinated Bloom stack from anywhere without threading a provider.
 *
 * Exposed at the package root as `surfaces` (avoids a bare `present`/`confirm`
 * name clash with the existing `alert-dialog` `confirm`); the individual
 * functions are also named exports of `@oxyhq/bloom/surfaces` for direct import.
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
  /** Present a confirm surface; resolves `true`/`false`. */
  confirm,
  /** Present a prompt surface; resolves the string or `null`. */
  prompt,
} as const;

export { confirm, dismiss, dismissAll, dismissById, dismissToRoot, present, prompt };
