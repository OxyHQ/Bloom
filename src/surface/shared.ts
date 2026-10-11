import { parseRgba, withAlpha } from '../theme/color-utils';

/** Optical light, separate from the tint; SVG must receive opacity separately. */
export const SURFACE_SHEEN = [
  { offset: 0, color: 'rgb(255, 255, 255)', opacity: 0.18 },
  { offset: 0.48, color: 'rgb(255, 255, 255)', opacity: 0.035 },
  { offset: 1, color: 'rgb(0, 0, 0)', opacity: 0.045 },
] as const;
export const SURFACE_SHEEN_CSS = `linear-gradient(180deg, ${SURFACE_SHEEN.map((stop) => `${withAlpha(stop.color, stop.opacity)} ${stop.offset * 100}%`).join(', ')})`;
export const SURFACE_RIM =
  'inset 2px 2px 1px rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)';

const DARK_SHEEN = [
  { offset: 0, color: 'rgb(255, 255, 255)', opacity: 0.075 },
  { offset: 0.48, color: 'rgb(255, 255, 255)', opacity: 0.012 },
  { offset: 1, color: 'rgb(0, 0, 0)', opacity: 0.06 },
] as const;
const DARK_SHEEN_CSS = `linear-gradient(180deg, ${DARK_SHEEN.map((stop) => `${withAlpha(stop.color, stop.opacity)} ${stop.offset * 100}%`).join(', ')})`;
const LIGHT_OPTICS = { sheen: SURFACE_SHEEN, sheenCss: SURFACE_SHEEN_CSS, rim: SURFACE_RIM };
const DARK_OPTICS = {
  sheen: DARK_SHEEN,
  sheenCss: DARK_SHEEN_CSS,
  rim: 'inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 1px 0 0 rgba(255, 255, 255, 0.07), inset 0 -1px 0 rgba(0, 0, 0, 0.28)',
};

/** Preserve the approved light optics; avoid a white double outline in dark. */
export function resolveSurfaceOptics(isDark: boolean) {
  return isDark ? DARK_OPTICS : LIGHT_OPTICS;
}

/** Alpha is explicit at the SVG boundary; stopColor alone discards it on native. */
export function surfaceSvgStop(color: string): { color: string; opacity: number } {
  const parsed = parseRgba(color);
  return parsed
    ? { color: `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`, opacity: parsed.a }
    : { color, opacity: 1 };
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
