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

/** Eye chips and the live character use the same paint-time contrast rule. */
export function paintVectorEyeFrame(frame: VectorFrame, bodyColor: string): VectorFrame {
  const eyes = frame.paths.filter((path) => path.role === 'eye');
  const ink = resolveVectorEyeInk(
    eyes.map((path) => path.fill),
    bodyColor,
  );
  return ink
    ? {
        ...frame,
        paths: frame.paths.map((path) => (path.role === 'eye' ? { ...path, fill: ink } : path)),
      }
    : frame;
}
