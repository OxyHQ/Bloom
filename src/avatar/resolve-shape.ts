import { SQUIRCLE_PATH } from './squircle-path';
import { AVATAR_SHAPE_PATHS, NAMED_SHAPE_VIEW_BOX } from './shape-paths';
import type { AvatarShape, AvatarShapePath } from './types';

/**
 * A shape reduced to what the renderers need: either nothing (a circle, drawn
 * with `borderRadius` and no SVG at all) or one outline plus the size of the
 * square space it is drawn in.
 */
export type ResolvedAvatarShape = AvatarShapePath | null;

/**
 * Turns the public `shape` prop into an outline.
 *
 * Returns `null` for a circle so callers can keep the cheap `borderRadius`
 * path — the common case never touches `react-native-svg`. An unknown string
 * also returns `null`: a shape name that does not resolve should degrade to a
 * plain circular avatar, never to a blank hole where a face should be.
 */
export function resolveAvatarShape(shape: AvatarShape | AvatarShapePath | undefined): ResolvedAvatarShape {
  if (!shape || shape === 'circle') return null;

  if (typeof shape !== 'string') {
    return { d: shape.d, viewBox: shape.viewBox ?? 1 };
  }

  if (shape === 'squircle') {
    return { d: SQUIRCLE_PATH, viewBox: 1 };
  }

  const named = AVATAR_SHAPE_PATHS[shape];
  return named ? { d: named, viewBox: NAMED_SHAPE_VIEW_BOX } : null;
}
