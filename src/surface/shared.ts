import { parseRgba, withAlpha } from '../theme/color-utils';

/** Optical light, separate from the tint; SVG must receive opacity separately. */
export const SURFACE_SHEEN = [
  { offset: 0, color: 'rgb(255, 255, 255)', opacity: 0.18 },
  { offset: 0.48, color: 'rgb(255, 255, 255)', opacity: 0.035 },
  { offset: 1, color: 'rgb(0, 0, 0)', opacity: 0.045 },
] as const;
export const SURFACE_SHEEN_CSS = `linear-gradient(180deg, ${SURFACE_SHEEN.map(stop => `${withAlpha(stop.color, stop.opacity)} ${stop.offset * 100}%`).join(', ')})`;
export const SURFACE_RIM = 'inset 2px 2px 1px rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)';

/** Alpha is explicit at the SVG boundary; stopColor alone discards it on native. */
export function surfaceSvgStop(color: string): { color: string; opacity: number } {
  const parsed = parseRgba(color);
  return parsed
    ? { color: `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`, opacity: parsed.a }
    : { color, opacity: 1 };
}

