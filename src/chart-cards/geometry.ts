/**
 * The chart geometry recharts computes for Bloom's dashboard chart cards,
 * reimplemented as pure functions so the react-native-svg charts land on the
 * same pixels. Every rule here was read off recharts 3.10's source and checked
 * against its rendered SVG (revenue / orders cards at 528×216):
 *
 *   plot box        margin top 4, right 6, bottom 0, left 0; the Y axis takes
 *                   its `width` (44 revenue, 40 orders) off the left, the X
 *                   axis its default 30px height off the bottom → 44..522 × 4..186
 *   Y ticks         `getTickValuesFixedDomain([0, max·1.1], 4)` — an adaptive
 *                   step (5500 / 900), then the domain max itself as the last
 *                   tick; label right edge at plot left − 8 (tickSize 6 +
 *                   tickMargin 2), vertically centred
 *   X ticks         label top-hanging at plot bottom + 18 (tickSize 6 +
 *                   tickMargin 12), centred on the category
 *   tick culling    `preserveEnd` (Y) / `preserveStartEnd` (X), minTickGap 5,
 *                   boundaries the whole surface — which is what pulls the
 *                   last month label in by half its overflow and the top Y
 *                   label down to 9
 *   line / area     category `point` scale, d3 `curveMonotoneX`
 *   bars            category `band` scale, barCategoryGap 28%, barGap 3, bar
 *                   width rounded to an integer, radius [4,4,0,0] clamped to
 *                   half the bar
 */

export interface PlotBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** recharts `XAxis` default height. */
export const X_AXIS_HEIGHT = 30;
/** `margin={{ top: 4, right: 6, bottom: 0, left: 0 }}` on both cards. */
export const CHART_MARGIN = { top: 4, right: 6, bottom: 0, left: 0 } as const;
/** recharts `tickSize` default (the tick line is hidden, the offset stays). */
export const TICK_SIZE = 6;
/** `tickMargin` recharts gives the Y axis by default. */
export const Y_TICK_MARGIN = 2;
/** `tickMargin={12}` on both cards' X axis. */
export const X_TICK_MARGIN = 12;
/** recharts `minTickGap` default. */
export const MIN_TICK_GAP = 5;

export function plotBox(width: number, height: number, yAxisWidth: number): PlotBox {
  return {
    left: CHART_MARGIN.left + yAxisWidth,
    top: CHART_MARGIN.top,
    right: width - CHART_MARGIN.right,
    bottom: height - CHART_MARGIN.bottom - X_AXIS_HEIGHT,
  };
}

// ---------------------------------------------------------------------------
//  Y ticks — recharts-scale `getTickValuesFixedDomain` + `getAdaptiveStep`
// ---------------------------------------------------------------------------

/** `Math.floor(log10(|n|)) + 1`, 0 for 0 — recharts' `getDigitCount`. */
function digitCount(n: number): number {
  return n === 0 ? 1 : Math.floor(Math.log10(Math.abs(n))) + 1;
}

/** Strip floating-point noise (recharts steps in decimal.js). */
function clean(n: number): number {
  return Number(n.toPrecision(12));
}

function adaptiveStep(roughStep: number): number {
  if (roughStep <= 0) return 0;
  const digits = digitCount(roughStep);
  const digitValue = 10 ** digits;
  const ratio = roughStep / digitValue;
  const scale = digits !== 1 ? 0.05 : 0.1;
  return clean(clean(Math.ceil(clean(ratio / scale)) * scale) * digitValue);
}

/** Tick values for a `[min, max]` domain with `tickCount` requested. */
export function fixedDomainTicks(min: number, max: number, tickCount: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const step = adaptiveStep((max - min) / (Math.max(tickCount, 2) - 1));
  if (step <= 0) return [min, max];
  const values: number[] = [];
  // recharts' `rangeStep(min, max, step)` — strictly below `max`.
  for (let i = 0, v = min; v < max && i < 100000; i++, v = clean(min + step * i)) {
    values.push(v);
  }
  values.push(max);
  return values;
}

/** Linear value → pixel over the plot's height, domain `[0, max]`. */
export function yScale(value: number, domainMax: number, box: PlotBox): number {
  if (domainMax <= 0) return box.bottom;
  return box.bottom - (value / domainMax) * (box.bottom - box.top);
}

// ---------------------------------------------------------------------------
//  Categories
// ---------------------------------------------------------------------------

/** `point` scale: first category on the left edge, last on the right. */
export function pointX(index: number, count: number, box: PlotBox): number {
  if (count <= 1) return (box.left + box.right) / 2;
  return box.left + (index * (box.right - box.left)) / (count - 1);
}

/** Index of the category nearest to `x` on a `point` scale. */
export function nearestPointIndex(x: number, count: number, box: PlotBox): number {
  if (count <= 1) return 0;
  const step = (box.right - box.left) / (count - 1);
  return Math.min(count - 1, Math.max(0, Math.round((x - box.left) / step)));
}

/** `band` scale width of one category. */
export function bandSize(count: number, box: PlotBox): number {
  return count > 0 ? (box.right - box.left) / count : 0;
}

/** Index of the band containing `x`. */
export function bandIndex(x: number, count: number, box: PlotBox): number {
  const size = bandSize(count, box);
  if (size <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor((x - box.left) / size)));
}

export function inPlot(x: number, y: number, box: PlotBox): boolean {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

/**
 * recharts `getBarPositions` for `seriesCount` bars sharing a band, with
 * `barCategoryGap` as a fraction and `barGap` in px. Offsets are from the
 * band's left edge.
 */
export function barPositions(
  band: number,
  seriesCount: number,
  categoryGap: number,
  barGap: number,
): { offset: number; size: number }[] {
  const offset = band * categoryGap;
  const gap = band - 2 * offset - (seriesCount - 1) * barGap <= 0 ? 0 : barGap;
  let size = (band - 2 * offset - (seriesCount - 1) * gap) / seriesCount;
  // recharts rounds a bar wider than 1px to whole pixels, and does NOT
  // re-centre what the rounding moved: the first bar stays at the gap.
  if (size > 1) size = Math.round(size);
  size = Math.max(0, size);
  return Array.from({ length: seriesCount }, (_, i) => ({ offset: offset + i * (size + gap), size }));
}

/**
 * recharts `Rectangle` path with a `[r, r, 0, 0]` radius — rounded top corners,
 * square base; the radius is clamped to half the bar's width and height.
 */
export function topRoundedBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (width <= 0 || height <= 0) return '';
  const r = Math.min(radius, width / 2, height / 2);
  const f = (n: number) => clean(n);
  return (
    `M${f(x)},${f(y + r)}` +
    `A${f(r)},${f(r)},0,0,1,${f(x + r)},${f(y)}` +
    `L${f(x + width - r)},${f(y)}` +
    `A${f(r)},${f(r)},0,0,1,${f(x + width)},${f(y + r)}` +
    `L${f(x + width)},${f(y + height)}` +
    `L${f(x)},${f(y + height)}Z`
  );
}

// ---------------------------------------------------------------------------
//  d3 `curveMonotoneX`
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

function sign(x: number): number {
  return x < 0 ? -1 : 1;
}

/**
 * The SVG path d3's `line().curve(curveMonotoneX)` draws through `points` —
 * Fritsch–Carlson monotone cubic interpolation, so the curve never overshoots
 * a data point. Coordinates rounded to 3 decimals like d3's path serialiser.
 */
export function monotoneXPath(points: readonly Point[]): string {
  const n = points.length;
  if (n === 0) return '';
  const first = points[0]!;
  if (n === 1) return `M${r3(first.x)},${r3(first.y)}Z`;
  if (n === 2) {
    const last = points[1]!;
    return `M${r3(first.x)},${r3(first.y)}L${r3(last.x)},${r3(last.y)}`;
  }

  // Secant slopes, then d3's `slope3` tangents at interior points.
  const tangents = new Array<number>(n);
  for (let i = 1; i < n - 1; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const h0 = p1.x - p0.x;
    const h1 = p2.x - p1.x;
    const s0 = (p1.y - p0.y) / (h0 || (h1 < 0 ? -0 : 0));
    const s1 = (p2.y - p1.y) / (h1 || (h0 < 0 ? -0 : 0));
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    tangents[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }
  // d3's `slope2` for the end points.
  const slope2 = (a: Point, b: Point, t: number) => {
    const h = b.x - a.x;
    return h ? (3 * (b.y - a.y) / h - t) / 2 : t;
  };
  tangents[0] = slope2(points[0]!, points[1]!, tangents[1]!);
  tangents[n - 1] = slope2(points[n - 2]!, points[n - 1]!, tangents[n - 2]!);

  let d = `M${r3(first.x)},${r3(first.y)}`;
  for (let i = 1; i < n; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dx = (b.x - a.x) / 3;
    d +=
      `C${r3(a.x + dx)},${r3(a.y + dx * tangents[i - 1]!)},` +
      `${r3(b.x - dx)},${r3(b.y - dx * tangents[i]!)},${r3(b.x)},${r3(b.y)}`;
  }
  return d;
}

/** The area under a monotone line, closed along `baseY`. */
export function monotoneXAreaPath(points: readonly Point[], baseY: number): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${monotoneXPath(points)}L${r3(last.x)},${r3(baseY)}L${r3(first.x)},${r3(baseY)}Z`;
}

// ---------------------------------------------------------------------------
//  Tick culling — recharts `getTicksStart` / `getTicksEnd`
// ---------------------------------------------------------------------------

export interface TickCandidate {
  /** Where the tick belongs along the axis. */
  coordinate: number;
  /** Label extent along the axis (width for X, height for Y). */
  size: number;
}

export interface PlacedTick {
  index: number;
  /** Where the label is drawn — pulled inward when it would overflow. */
  tickCoord: number;
}

function isVisible(sign: number, position: number, size: number, start: number, end: number): boolean {
  if (sign * position < sign * start || sign * position > sign * end) return false;
  return sign * (position - (sign * size) / 2 - start) >= 0 && sign * (position + (sign * size) / 2 - end) <= 0;
}

/**
 * Which tick labels survive, and where they draw. `mode` is the recharts
 * `interval`: `'preserveStartEnd'` walks from the first tick after pinning the
 * last one, `'preserveEnd'` walks backwards from the last. `extent` is the
 * surface's length along the axis (its boundaries are `0..extent`).
 */
export function placeTicks(
  ticks: readonly TickCandidate[],
  extent: number,
  mode: 'preserveStartEnd' | 'preserveEnd',
  minTickGap = MIN_TICK_GAP,
): PlacedTick[] {
  const len = ticks.length;
  if (len === 0) return [];
  const sign = len >= 2 ? Math.sign(ticks[1]!.coordinate - ticks[0]!.coordinate) || 1 : 1;
  let start = sign === 1 ? 0 : extent;
  let end = sign === 1 ? extent : 0;
  const shown: PlacedTick[] = [];

  if (mode === 'preserveEnd') {
    for (let i = len - 1; i >= 0; i--) {
      const { coordinate, size } = ticks[i]!;
      let tickCoord = coordinate;
      if (i === len - 1) {
        const gap = sign * (coordinate + (sign * size) / 2 - end);
        if (gap > 0) tickCoord = coordinate - gap * sign;
      }
      if (isVisible(sign, tickCoord, size, start, end)) {
        end = tickCoord - sign * (size / 2 + minTickGap);
        shown.push({ index: i, tickCoord });
      }
    }
    return shown.reverse();
  }

  // preserveStartEnd
  let tail: PlacedTick | null = null;
  const lastTick = ticks[len - 1]!;
  {
    const gap = sign * (lastTick.coordinate + (sign * lastTick.size) / 2 - end);
    const tickCoord = gap > 0 ? lastTick.coordinate - gap * sign : lastTick.coordinate;
    if (isVisible(sign, tickCoord, lastTick.size, start, end)) {
      end = tickCoord - sign * (lastTick.size / 2 + minTickGap);
      tail = { index: len - 1, tickCoord };
    }
  }
  for (let i = 0; i < len - 1; i++) {
    const { coordinate, size } = ticks[i]!;
    let tickCoord = coordinate;
    if (i === 0) {
      const gap = sign * (coordinate - (sign * size) / 2 - start);
      if (gap < 0) tickCoord = coordinate - gap * sign;
    }
    if (isVisible(sign, tickCoord, size, start, end)) {
      start = tickCoord + sign * (size / 2 + minTickGap);
      shown.push({ index: i, tickCoord });
    }
  }
  if (tail) shown.push(tail);
  return shown;
}

// ---------------------------------------------------------------------------
//  Deltas
// ---------------------------------------------------------------------------

export type ChartDeltaTone = 'positive' | 'negative' | 'neutral';

/**
 * `describeDelta` for the dashboard chart cards: percent change to
 * one decimal, `+` on a rise, `New` with nothing to compare against.
 */
export function describeDelta(current: number, previous: number): { label: string; tone: ChartDeltaTone } {
  if (previous === 0) return { label: 'New', tone: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) return { label: '0%', tone: 'neutral' };
  return { label: `${rounded > 0 ? '+' : ''}${rounded}%`, tone: rounded > 0 ? 'positive' : 'negative' };
}

// ---------------------------------------------------------------------------
//  Auto Y domain — recharts-scale `getNiceTickValues` (allowDecimals)
// ---------------------------------------------------------------------------

/** recharts' `getAdaptiveStep` with a correction factor. */
function niceStep(roughStep: number, correction: number): number {
  if (roughStep <= 0) return 0;
  const digits = digitCount(roughStep);
  const digitValue = 10 ** digits;
  const scale = digits !== 1 ? 0.05 : 0.1;
  return clean(clean((Math.ceil(clean(roughStep / digitValue / scale)) + correction) * scale) * digitValue);
}

function calculateStep(min: number, max: number, tickCount: number, correction: number): { step: number; tickMin: number; tickMax: number } {
  if (!Number.isFinite((max - min) / (tickCount - 1))) return { step: 0, tickMin: 0, tickMax: 0 };
  const step = niceStep((max - min) / (tickCount - 1), correction);
  let middle: number;
  if (min <= 0 && max >= 0) {
    middle = 0;
  } else {
    middle = clean((min + max) / 2);
    middle = clean(middle - (((middle % step) + step) % step));
  }
  let below = Math.ceil(clean((middle - min) / step));
  let up = Math.ceil(clean((max - middle) / step));
  const count = below + up + 1;
  if (count > tickCount) return calculateStep(min, max, tickCount, correction + 1);
  if (count < tickCount) {
    up = max > 0 ? up + (tickCount - count) : up;
    below = max > 0 ? below : below + (tickCount - count);
  }
  return { step, tickMin: clean(middle - below * step), tickMax: clean(middle + up * step) };
}

/**
 * The "nice" ticks recharts picks for an axis whose domain is `auto` — the
 * default `[0, 'auto']` Y axis of an area / line / bar chart. The domain then
 * widens to the first and last tick (`[0, 13500]` for a 12,200 peak at 4 ticks).
 */
export function niceTicks(min: number, max: number, tickCount: number): number[] {
  const count = Math.max(tickCount, 2);
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  if (lo === hi) {
    // recharts `getTickOfSingleValue` (integer / zero case).
    const middle = lo === 0 ? Math.floor((tickCount - 1) / 2) : Math.floor(lo);
    const middleIndex = Math.floor((tickCount - 1) / 2);
    return Array.from({ length: tickCount }, (_, i) => middle + (i - middleIndex));
  }
  const { step, tickMin, tickMax } = calculateStep(lo, hi, count, 0);
  if (step <= 0) return [lo, hi];
  const values: number[] = [];
  const end = tickMax + 0.1 * step;
  for (let i = 0, v = tickMin; v < end && i < 100000; i++, v = clean(tickMin + step * i)) values.push(v);
  return values;
}

/** Linear value → pixel over the plot's height for any `[min, max]` domain. */
export function scaleY(value: number, domain: readonly [number, number], box: PlotBox): number {
  const [min, max] = domain;
  if (max === min) return box.bottom;
  return box.bottom - ((value - min) / (max - min)) * (box.bottom - box.top);
}

// ---------------------------------------------------------------------------
//  Stacking — recharts `stackOffset` "none" / "expand" (d3 stack)
// ---------------------------------------------------------------------------

export type StackOffset = 'none' | 'expand';

/** One series' band per category: `lower` → `upper` in data units. */
export interface StackBand {
  lower: number[];
  upper: number[];
}

/**
 * Stacks `values[series][category]` bottom-up in series order (d3
 * `stackOrderNone`). `expand` normalises every category to a 0–1 total — the
 * 100% chart. A category whose total is 0 stays at 0.
 */
export function stackSeries(values: readonly (readonly number[])[], offset: StackOffset = 'none'): StackBand[] {
  const count = values.reduce((n, s) => Math.max(n, s.length), 0);
  const totals = Array.from({ length: count }, (_, i) => values.reduce((sum, s) => sum + (s[i] ?? 0), 0));
  const running = new Array<number>(count).fill(0);
  return values.map((series) => {
    const lower: number[] = [];
    const upper: number[] = [];
    for (let i = 0; i < count; i++) {
      const raw = series[i] ?? 0;
      const v = offset === 'expand' ? (totals[i]! === 0 ? 0 : raw / totals[i]!) : raw;
      lower.push(running[i]!);
      running[i] = running[i]! + v;
      upper.push(running[i]!);
    }
    return { lower, upper };
  });
}

// ---------------------------------------------------------------------------
//  Curves and area bands
// ---------------------------------------------------------------------------

export type CurveShape = 'monotone' | 'linear';

/** d3 `curveLinear`: straight segments, 3-decimal coordinates. */
export function linearPath(points: readonly Point[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${r3(p.x)},${r3(p.y)}`).join('');
}

export function curvePath(points: readonly Point[], shape: CurveShape = 'monotone'): string {
  return shape === 'linear' ? linearPath(points) : monotoneXPath(points);
}

/**
 * recharts `Area` with a per-point base line (a stacked series): the top
 * curve, a straight drop to the base's last point, then the base curve drawn
 * back to the start and closed. A flat base is the plain `monotoneXAreaPath`.
 */
export function areaBandPath(top: readonly Point[], base: readonly Point[], shape: CurveShape = 'monotone'): string {
  if (top.length === 0) return '';
  const upper = curvePath(top, shape);
  const reversed = [...base].reverse();
  const lower = curvePath(reversed, shape).replace(/^M[^A-Za-z]*/, '').replace(/Z$/, '');
  const last = reversed[0];
  if (!last) return `${upper}Z`;
  return `${upper}L${r3(last.x)},${r3(last.y)}${lower}Z`;
}
