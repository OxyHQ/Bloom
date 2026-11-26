import type { VectorDrawPath, VectorFrame } from './vector-types';
import { avatarViewBox } from './vector-viewbox';

/** A gap cut around a character's silhouette: painted in `color` (the surface), `width` pixels wide. */
export type VectorHalo = { color: string; width: number };

/** The id of the one path that carries a frame's halo. Not a part index, so no paint is looked up for it. */
export const HALO_PATH_ID = 'halo';

/**
 * The frame with a gap around its silhouette: one extra path drawn first, that is every unclipped
 * outline of the frame stroked and filled in the surface colour, and a viewBox widened so the gap
 * is not cropped. It is part of the frame, so it moves with the character on every pose, is cached
 * with it and is drawn by whichever renderer draws the frame (SVG, or the native surface for a
 * single frame and for a loop alike). One path, whatever the character is made of, keeps a frame
 * as cheap as it was.
 */
export function withHalo(frame: VectorFrame, size: number, halo: VectorHalo): VectorFrame {
  const [x = 0, y = 0, w = 1] = avatarViewBox(frame.viewBox)
    .split(/[\s,]+/)
    .map(Number);
  // Units of the viewBox per pixel, so the gap is `width` pixels at any size.
  const gap = (halo.width * w) / size;
  let d = '';
  for (const path of frame.paths) if (path.clip === undefined) d += path.d;
  const outline: VectorDrawPath = {
    id: HALO_PATH_ID,
    d,
    fill: halo.color,
    opacity: 1,
    fillOpacity: 1,
    stroke: halo.color,
    strokeWidth: gap * 2,
  };
  return {
    viewBox: `${x - gap} ${y - gap} ${w + gap * 2} ${w + gap * 2}`,
    paths: [outline, ...frame.paths],
  };
}

/** The style of a drawing's surface: the avatar's box, or that box grown by the halo on every side. */
export function haloSurfaceStyle(size: number, halo: VectorHalo | undefined) {
  return halo && halo.width > 0
    ? ({
        position: 'absolute',
        left: -halo.width,
        top: -halo.width,
        width: size + halo.width * 2,
        height: size + halo.width * 2,
      } as const)
    : ({ width: '100%', height: '100%' } as const);
}
