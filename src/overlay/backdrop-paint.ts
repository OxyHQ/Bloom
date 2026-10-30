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

/** A blur tint Bloom draws: `Backdrop`'s, and `ProgressiveBlur`'s light or dark. */
export type BlurTint = 'light' | 'dark' | 'default';

/**
 * Each tint's grey and how opaque it is at full intensity, as expo-blur paints
 * it over the blur. Android's `TintStyle.toColorInt`, which OxyOS's host draws
 * too, differs from the web's (`getBackgroundColor`, from Apple's iOS 14 kit);
 * iOS's own material has no single colour, so it takes the kit's.
 */
const ANDROID_TINTS: Record<BlurTint, readonly [grey: number, alpha: number]> = {
  dark: [25, 0.69],
  light: [249, 0.78],
  default: [255, 0.44],
};
const KIT_TINTS: Record<BlurTint, readonly [grey: number, alpha: number]> = {
  dark: [25, 0.78],
  light: [249, 0.78],
  default: [255, 0.3],
};

/**
 * The colour a blur view lays over what it blurs, at `intensity` (0–100): what
 * a blur becomes when transparency is reduced, its tint with nothing blurred
 * under it. A dimming backdrop stays a dim, never an opaque sheet over the app.
 */
export function blurTintColor(tint: BlurTint, intensity: number): string {
  const native = Platform.OS !== 'web' && Platform.OS !== 'ios';
  const [grey, alpha] = (native ? ANDROID_TINTS : KIT_TINTS)[tint] ?? KIT_TINTS.dark;
  const level = Math.max(0, Math.min(100, intensity)) / 100;
  // Android packs the alpha into a byte, truncating; the kit's is a fraction.
  const a = native ? Math.trunc(255 * level * alpha) / 255 : level * alpha;
  return `rgba(${grey}, ${grey}, ${grey}, ${Math.round(a * 1000) / 1000})`;
}
