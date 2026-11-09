import { POINTS_PER_FRAME, STEPS_PER_SEGMENT, VIEWBOX } from './constants';
import type { Cubic } from './cubic';
import { Morph } from './morph';
import type { RoundedPolygon } from './polygon';
import { cookie4, cookie9, oval, pentagon, pill, softBurst, sunny } from './shapes';
import type { MorphFrames } from './types';

/**
 * The Material 3 loading-indicator loop: each shape morphs into the next and
 * the last back into the first.
 */
const SEQUENCE: ReadonlyArray<() => RoundedPolygon> = [
  softBurst,
  cookie9,
  pentagon,
  pill,
  sunny,
  cookie4,
  oval,
];

/** Material "emphasized" motion curve, `cubic-bezier(0.2, 0, 0, 1)`. */
const EMPHASIZED = [0.2, 0, 0, 1] as const;

const TOP_ANGLE = -Math.PI / 2;
const CUBIC_SAMPLES = 24;

/** Solves a CSS `cubic-bezier(x1, y1, x2, y2)` timing function for `x`. */
function bezierEase(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 24; i++) {
    const sampleX = ((ax * t + bx) * t + cx) * t;
    if (Math.abs(sampleX - x) < 1e-6) break;
    if (sampleX < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

/**
 * Resamples a closed cubic outline into `count` points evenly spaced by arc
 * length, so two frames always have point `k` in corresponding places and can
 * be blended by plain linear interpolation.
 */
function resample(cubics: Cubic[], count: number): number[] {
  const xs: number[] = [];
  const ys: number[] = [];
  const lengths: number[] = [0];
  let total = 0;
  for (const c of cubics) {
    for (let s = 0; s < CUBIC_SAMPLES; s++) {
      const t = s / CUBIC_SAMPLES;
      const u = 1 - t;
      const x =
        u * u * u * c.anchor0X +
        3 * u * u * t * c.control0X +
        3 * u * t * t * c.control1X +
        t * t * t * c.anchor1X;
      const y =
        u * u * u * c.anchor0Y +
        3 * u * u * t * c.control0Y +
        3 * u * t * t * c.control1Y +
        t * t * t * c.anchor1Y;
      if (xs.length > 0) {
        total += Math.hypot(x - xs[xs.length - 1]!, y - ys[ys.length - 1]!);
        lengths.push(total);
      }
      xs.push(x * VIEWBOX);
      ys.push(y * VIEWBOX);
    }
  }
  // Close the loop back to the first sample.
  total += Math.hypot(xs[0]! - xs[xs.length - 1]!, ys[0]! - ys[ys.length - 1]!);
  lengths.push(total);
  xs.push(xs[0]!);
  ys.push(ys[0]!);

  const out = new Array<number>(count * 2);
  let seg = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total;
    while (seg < lengths.length - 2 && lengths[seg + 1]! < target) seg++;
    const span = lengths[seg + 1]! - lengths[seg]!;
    const f = span > 0 ? (target - lengths[seg]!) / span : 0;
    out[i * 2] = xs[seg]! + (xs[seg + 1]! - xs[seg]!) * f;
    out[i * 2 + 1] = ys[seg]! + (ys[seg + 1]! - ys[seg]!) * f;
  }
  return out;
}

/** Rotates the point list so index 0 is the point nearest the top of the shape. */
function anchorToTop(pts: number[], count: number): number[] {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < count; i++) {
    cx += pts[i * 2]!;
    cy += pts[i * 2 + 1]!;
  }
  cx /= count;
  cy /= count;

  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < count; i++) {
    const angle = Math.atan2(pts[i * 2 + 1]! - cy, pts[i * 2]! - cx);
    let delta = Math.abs(angle - TOP_ANGLE);
    if (delta > Math.PI) delta = 2 * Math.PI - delta;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  if (best === 0) return pts;

  const out = new Array<number>(count * 2);
  for (let i = 0; i < count; i++) {
    const j = (best + i) % count;
    out[i * 2] = pts[j * 2]!;
    out[i * 2 + 1] = pts[j * 2 + 1]!;
  }
  return out;
}

let cache: MorphFrames | null = null;

/** Every frame of the loop as one flat `[x0, y0, x1, y1, …]` list, built once. */
export function getMorphFrames(): MorphFrames {
  if (cache) return cache;
  const shapes = SEQUENCE.map((make) => make().normalized());
  const frameCount = shapes.length * STEPS_PER_SEGMENT;
  const flat = new Array<number>(frameCount * POINTS_PER_FRAME * 2);
  let f = 0;
  for (let s = 0; s < shapes.length; s++) {
    const morph = new Morph(shapes[s]!, shapes[(s + 1) % shapes.length]!);
    for (let step = 0; step < STEPS_PER_SEGMENT; step++) {
      const t = bezierEase(...EMPHASIZED, step / STEPS_PER_SEGMENT);
      const pts = anchorToTop(resample(morph.asCubics(t), POINTS_PER_FRAME), POINTS_PER_FRAME);
      const base = f * POINTS_PER_FRAME * 2;
      for (let i = 0; i < pts.length; i++) flat[base + i] = pts[i]!;
      f++;
    }
  }
  cache = { flat, frameCount };
  return cache;
}

/**
 * The outline at `phase` (a fractional frame index) as an SVG path `d`,
 * blending the two surrounding frames. A worklet: reanimated runs it on the UI
 * thread, and the web fork calls it as a plain function.
 */
export function morphPathD(flat: number[], frameCount: number, phase: number): string {
  'worklet';
  const i = Math.floor(phase);
  const t = phase - i;
  const a = i * POINTS_PER_FRAME * 2;
  const b = ((i + 1) % frameCount) * POINTS_PER_FRAME * 2;
  let d = '';
  for (let k = 0; k < POINTS_PER_FRAME; k++) {
    const ix = k * 2;
    const x = flat[a + ix]! + (flat[b + ix]! - flat[a + ix]!) * t;
    const y = flat[a + ix + 1]! + (flat[b + ix + 1]! - flat[a + ix + 1]!) * t;
    d += `${k === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
}
