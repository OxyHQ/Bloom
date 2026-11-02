/**
 * The controlled `anchor` prop, read once for both forks.
 *
 * A caller hands a fresh object literal on every render (`anchor={{ x, y }}`),
 * so the anchor is compared BY VALUE: an identical position keeps the same
 * `FloatingAnchor`, and the panel neither re-places nor re-takes focus.
 */
import { useMemo } from 'react';

import type { FloatingAnchor } from '../floating/types';
import type { ContextMenuAnchor } from './types';

export function toFloatingAnchor(anchor: ContextMenuAnchor): FloatingAnchor {
  if ('x' in anchor) {
    return { top: anchor.y, bottom: anchor.y, left: anchor.x, right: anchor.x };
  }
  return { top: anchor.top, bottom: anchor.bottom, left: anchor.left, right: anchor.right };
}

/**
 * The anchor as a caller is told it: a point where it has no size (a press),
 * else the box (the frame a trigger's accessibility action opens it at).
 */
export function pointAnchor(anchor: FloatingAnchor): ContextMenuAnchor {
  if (anchor.left === anchor.right && anchor.top === anchor.bottom) {
    return { x: anchor.left, y: anchor.top };
  }
  return { top: anchor.top, right: anchor.right, bottom: anchor.bottom, left: anchor.left };
}

/**
 * `undefined` when uncontrolled, `null` when controlled and closed, otherwise
 * the anchor as a value-stable `FloatingAnchor`.
 */
export function useControlledAnchor(
  anchor: ContextMenuAnchor | null | undefined,
): FloatingAnchor | null | undefined {
  const floating = anchor ? toFloatingAnchor(anchor) : anchor;
  const top = floating?.top ?? 0;
  const bottom = floating?.bottom ?? 0;
  const left = floating?.left ?? 0;
  const right = floating?.right ?? 0;
  const state = floating === undefined ? 'uncontrolled' : floating === null ? 'closed' : 'open';
  return useMemo(() => {
    if (state === 'uncontrolled') return undefined;
    if (state === 'closed') return null;
    return { top, bottom, left, right };
  }, [state, top, bottom, left, right]);
}
