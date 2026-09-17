import { parseRgba } from '../theme/color-utils';
import type { ComposerLoaderColors } from './types';

/**
 * The geometry both `ComposerLoader` forks draw. One module so the web fork (CSS keyframes on
 * a DOM `<svg>`) and the native fork (react-native-svg + a frame clock) cannot
 * drift apart on where each layer sits along the lap.
 *
 * The band is dash segments on a stroke of the pill's rounded-rect outline,
 * normalised to a path length of 100, drawn at three scales:
 *
 *   layer   stroke width   blur (stdDeviation)   opacity         dash length   head pulled back
 *   bloom   bloom × 2      14                    bloomStrength   band × 0.9    bloom + 16 px
 *   glow    line × 3.2     6                     0.8             band × 0.95   10 px
 *   line    line           0.5 (taper: ≥ .5)     1               band          0
 *
 * where `band = arc / 360 × 100`. The crisp line leads; every soft layer's head
 * trails it. A `taper` stacks each layer as 14 shorter, centred copies.
 */

export const DEFAULT_COMPOSER_LOADER_COLORS: ComposerLoaderColors = [
  '#5eead4',
  '#46baec',
  '#e633a4',
  '#00faa7',
];

/** The light fades in/out over this long when `active` flips. */
export const COMPOSER_LOADER_FADE_MS = 450;

/** Copies per layer when tapering. */
export const TAPER_STEPS = 14;

/** Radius used for the default full pill (`9999`). */
export const PILL_RADIUS = 9999;

/** One dash-stroke copy of one layer. */
export interface ComposerLoaderStroke {
  key: string;
  strokeWidth: number;
  /** `feGaussianBlur` stdDeviation; `0` = none. */
  blur: number;
  opacity: number;
  /** Dash length, path units (of 100). */
  dash: number;
  /**
   * Phase in path units. As a CSS `animation-delay` it is `phase × speed / 100`
   * seconds: negative is a head start, positive holds the dash at offset 0 for
   * that long before it starts lapping.
   */
  phase: number;
}

export interface ComposerLoaderGeometryInput {
  width: number;
  height: number;
  arc: number;
  line: number;
  bloom: number;
  bloomStrength: number;
  bloomOnly: boolean;
  taper: number;
  reverse: boolean;
  offset: number;
  radius?: number;
}

export interface ComposerLoaderGeometry {
  /** Rect `rx`: the radius, or half the height for a pill. */
  rx: number;
  /** Rounded-rect perimeter, px. */
  perimeter: number;
  /** Every blur radius a stroke uses, one filter each. */
  blurs: number[];
  strokes: ComposerLoaderStroke[];
}

export function composerLoaderGeometry(input: ComposerLoaderGeometryInput): ComposerLoaderGeometry {
  const { width: w, height: h, arc, line, bloom, bloomStrength, bloomOnly, taper, reverse, offset } = input;
  const band = (arc / 360) * 100;
  const rx = input.radius ?? h / 2;

  // Straight runs plus the four corner arcs (for the default pill, rx = h/2
  // and this reduces to 2(w − h) + πh).
  const cornerR = Math.min(rx, w / 2, h / 2);
  const perimeter = Math.max(1, 2 * (w + h) - 8 * cornerR + 2 * Math.PI * cornerR);
  const pxUnits = (px: number) => (px * 100) / perimeter;
  // A layer's phase: the larger, the further BACK along the lap the band sits.
  // Moving a band forward, `offset` included, means subtracting.
  const dashPhase = (len: number, backPx: number) =>
    (reverse ? pxUnits(backPx) : len - band + pxUnits(backPx)) - offset * 100;

  const crispBlur = taper > 0 ? Math.max(0.5, line * 0.8) : 0.5;
  const strokes: ComposerLoaderStroke[] = [];
  const layer = (
    name: string,
    width: number,
    blur: number,
    opacity: number,
    dashLen: number,
    backPx: number,
  ) => {
    const copies = taper > 0 ? TAPER_STEPS : 1;
    for (let index = 0; index < copies; index++) {
      // Copy 0 is the full band; each next one is shorter and moved forward by
      // half the difference, so all of them share one midpoint.
      const len = dashLen * (1 - (taper * index) / copies);
      strokes.push({
        key: `${name}-${index}`,
        strokeWidth: width,
        blur,
        opacity: opacity / copies,
        dash: len,
        phase: dashPhase(dashLen, backPx) - (dashLen - len) / 2,
      });
    }
  };

  // wide bloom bleeding inward (outer half clipped by the pill)
  if (bloom > 0) layer('bloom', bloom * 2, 14, bloomStrength, band * 0.9, bloom + 16);
  // tight glow
  if (!bloomOnly) layer('glow', line * 3.2, 6, 0.8, band * 0.95, 10);
  // crisp refraction line, tip leading
  if (!bloomOnly) layer('line', line, crispBlur, 1, band, 0);

  return { rx, perimeter, blurs: [14, 6, crispBlur], strokes };
}

/**
 * The gradient's centre stop: a pure blend of the two middle colours, so the
 * band never washes out to white. Accepts any colour `parseRgba` reads.
 */
export function gradientMidColor(a: string, b: string): string {
  const x = parseRgba(a);
  const y = parseRgba(b);
  if (!x || !y) return a;
  const ch = (p: number, q: number) => Math.round((p + q) / 2);
  return `rgb(${ch(x.r, y.r)},${ch(x.g, y.g)},${ch(x.b, y.b)})`;
}

/** Filter id suffix for a blur radius (`0.5` → `b0_5`). */
export function blurFilterId(base: string, radius: number): string {
  return `${base}-b${String(radius).replace('.', '_')}`;
}

/**
 * CSS `stroke-dashoffset` of one stroke at `t` seconds, reproducing
 * `animation: dash <speed>s linear <delay>s infinite <direction>` with
 * keyframes `0 → -100`. Before a positive delay elapses the dash rests at 0.
 */
export function dashOffsetAt(t: number, phase: number, speed: number, reverse: boolean): number {
  'worklet';
  const delay = (phase * speed) / 100;
  const elapsed = t - delay;
  if (elapsed < 0 || speed <= 0) return 0;
  const frac = (elapsed / speed) % 1;
  return reverse ? -100 * (1 - frac) : -100 * frac;
}
