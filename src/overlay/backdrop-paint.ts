import { Platform } from 'react-native';
import type { WebCssStyle } from '../styles/web-view-style';
import type { BackdropGradient } from './types';

/** Invalid/non-finite numbers preserve the owner's default; valid numbers clamp. */
export function clampBackdropNumber(value: number, fallback: number, max: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback;
}

/** The gradient lives on the dim layer, never the interactive backdrop host. */
export function backdropDimStyle(
  color: string,
  gradient: BackdropGradient | undefined,
  rtl: boolean,
): WebCssStyle {
  if (
    !gradient ||
    !['start-to-end', 'end-to-start', 'top-to-bottom', 'bottom-to-top'].includes(
      gradient.direction,
    ) ||
    !Array.isArray(gradient.stops) ||
    gradient.stops.length < 2 ||
    gradient.stops.some(
      (stop) =>
        !Number.isFinite(stop.offset) || typeof stop.color !== 'string' || !stop.color.trim(),
    )
  ) {
    return { backgroundColor: color };
  }
  const angle =
    gradient.direction === 'top-to-bottom'
      ? 180
      : gradient.direction === 'bottom-to-top'
        ? 0
        : (gradient.direction === 'start-to-end') !== rtl
          ? 90
          : 270;
  let previous = 0;
  const stops = gradient.stops
    .map((stop) => {
      previous = Math.max(previous, Math.min(1, Math.max(0, stop.offset)));
      return `${stop.color} ${previous * 100}%`;
    })
    .join(', ');
  const image = `linear-gradient(${angle}deg, ${stops})`;
  return Platform.OS === 'web'
    ? { backgroundImage: image }
    : { experimental_backgroundImage: image };
}
