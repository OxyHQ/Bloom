import { PATHS, PATH_VIEW_BOX } from './paths';
import { SQUIRCLE_PATH } from './squircle-path';
import type { Path, Shape } from './types';

/** Null selects the native circular fast path; unknown persisted names also resolve to a circle. */
export function resolve(shape: Shape = 'circle'): Required<Path> | null {
  if (shape === 'circle') return null;
  if (typeof shape !== 'string') {
    const viewBox = shape.viewBox ?? 1;
    if (!Number.isFinite(viewBox) || viewBox <= 0 || !shape.d.trim()) {
      throw new Error('[Bloom] Shapes: a path needs non-empty d and a positive finite viewBox.');
    }
    return { d: shape.d, viewBox };
  }
  if (shape === 'squircle') return { d: SQUIRCLE_PATH, viewBox: 1 };
  const d = Object.prototype.hasOwnProperty.call(PATHS, shape)
    ? PATHS[shape as keyof typeof PATHS]
    : undefined;
  return d ? { d, viewBox: PATH_VIEW_BOX } : null;
}
