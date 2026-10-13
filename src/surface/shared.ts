import { parseRgba, withAlpha } from '../theme/color-utils';

/** Backdrop blur of the web material, in CSS px. One pass per surface, no displacement. */
export const SURFACE_BLUR_PX = 8;

const gradient = (stops: ReadonlyArray<readonly [color: string, opacity: number, at: number]>) =>
  `linear-gradient(180deg, ${stops.map(([color, opacity, at]) => `${withAlpha(color, opacity)} ${at}%`).join(', ')})`;

/** Optical light, separate from the tint: a top highlight easing to a faint shade. */
export const SURFACE_SHEEN_CSS = gradient([
  ['rgb(255, 255, 255)', 0.18, 0],
  ['rgb(255, 255, 255)', 0.035, 48],
  ['rgb(0, 0, 0)', 0.045, 100],
]);
export const SURFACE_RIM =
  'inset 2px 2px 1px rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)';

const DARK_SHEEN_CSS = gradient([
  ['rgb(255, 255, 255)', 0.075, 0],
  ['rgb(255, 255, 255)', 0.012, 48],
  ['rgb(0, 0, 0)', 0.06, 100],
]);
const LIGHT_OPTICS = { sheenCss: SURFACE_SHEEN_CSS, rim: SURFACE_RIM };
const DARK_OPTICS = {
  sheenCss: DARK_SHEEN_CSS,
  rim: 'inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 1px 0 0 rgba(255, 255, 255, 0.07), inset 0 -1px 0 rgba(0, 0, 0, 0.28)',
};

/** Preserve the approved light optics; avoid a white double outline in dark. */
export function resolveSurfaceOptics(isDark: boolean) {
  return isDark ? DARK_OPTICS : LIGHT_OPTICS;
}

/** One subtle material: retain explicit alpha; opaque fills transmit ten percent. */
export function resolveSurfaceTint(fill: string): string {
  const parsed = parseRgba(fill);
  return parsed?.a === 1 ? withAlpha(fill, 0.9) : fill;
}

/** Estimate the backing descendants see by compositing tint onto its parent. */
export function resolveSurfaceFill(fill: string, backdrop: string): string {
  if (fill.trim().toLowerCase() === 'transparent') return backdrop;
  const tint = parseRgba(fill);
  const base = parseRgba(backdrop);
  if (!tint || !base || tint.a === 1) return fill;
  const channel = (front: number, back: number) => Math.round(front * tint.a + back * (1 - tint.a));
  return `rgb(${channel(tint.r, base.r)}, ${channel(tint.g, base.g)}, ${channel(tint.b, base.b)})`;
}
