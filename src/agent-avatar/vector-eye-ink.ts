import { contrastRatio } from '../styles/color-contrast';
import type { VectorFrame } from './vector-types';

/** Single-color expressions can change ink without altering iris/highlight artwork. */
export function resolveVectorEyeInk(
  colors: readonly (string | undefined)[],
  bodyColor: string,
): string | undefined {
  const inks = new Set(colors.map((color) => color ?? '#171717'));
  const ink = inks.values().next().value;
  if (inks.size !== 1 || !ink) return undefined;
  const light = '#f6f7f2';
  return contrastRatio(ink, bodyColor) < 3 &&
    contrastRatio(light, bodyColor) > contrastRatio(ink, bodyColor)
    ? light
    : undefined;
}

/** These styles have a dark outer capsule/disc with separate light glints. */
const GLINT_BASE_STYLES = new Set(['sparkle_capsules', 'highlight_capsules', 'double_highlights']);
export function vectorEyeBaseOutline(
  style: string | undefined,
  ink: string | undefined,
  bodyColor: string,
): string | undefined {
  if (!style || !GLINT_BASE_STYLES.has(style) || !ink) return undefined;
  const light = '#f6f7f2';
  return contrastRatio(ink, bodyColor) < 3 &&
    contrastRatio(light, bodyColor) >= 3 &&
    contrastRatio(ink, light) >= 3
    ? light
    : undefined;
}
const paintedEyeFrames = new WeakMap<VectorFrame, Map<string, VectorFrame>>();

/** Eye chips and the live character use the same paint-time contrast rule. */
export function paintVectorEyeFrame(
  frame: VectorFrame,
  bodyColor: string,
  style?: string,
): VectorFrame {
  const eyes = frame.paths.filter((path) => path.role === 'eye');
  const ink = resolveVectorEyeInk(
    eyes.map((path) => path.fill),
    bodyColor,
  );
  const outline = eyes.some((path) => vectorEyeBaseOutline(style, path.fill, bodyColor));
  if (!ink && !outline) return frame;
  let cache = paintedEyeFrames.get(frame);
  if (!cache) {
    cache = new Map();
    paintedEyeFrames.set(frame, cache);
  }
  const key = `${ink ?? ''}:${outline ? style : ''}`;
  const known = cache.get(key);
  if (known) return known;
  const painted = {
    ...frame,
    paths: frame.paths.map((path) => {
      if (path.role !== 'eye') return path;
      const stroke = vectorEyeBaseOutline(style, path.fill, bodyColor);
      return { ...path, fill: ink ?? path.fill, ...(stroke ? { stroke, strokeWidth: 2 } : {}) };
    }),
  };
  cache.set(key, painted);
  return painted;
}
