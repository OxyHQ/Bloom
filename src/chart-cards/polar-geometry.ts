/**
 * recharts 3.10's POLAR maths as pure functions — the radar, radial bar and pie
 * charts the radar / radial / activity / sleep cards draw. Every number
 * here was checked against the SVG recharts renders for those cards (see
 * `src/__tests__/RadarChartCard.test.tsx` and `RadialChartCard.test.tsx`).
 *
 * Angles are recharts' convention: degrees, counter-clockwise, 0 at three
 * o'clock, so 90 is twelve o'clock and a clockwise sweep DECREASES the angle.
 */

export const RADIAN = Math.PI / 180;

export interface PolarPoint {
  x: number;
  y: number;
}

/** recharts `round`: 4 decimals, no `-0`. */
export function round4(value: number): number {
  const rounded = Math.round(value * 10000) / 10000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** recharts `polarToCartesian`. */
export function polarToCartesian(cx: number, cy: number, radius: number, angle: number): PolarPoint {
  return { x: cx + Math.cos(-RADIAN * angle) * radius, y: cy + Math.sin(-RADIAN * angle) * radius };
}

const sign = (n: number) => (n === 0 ? 0 : n > 0 ? 1 : -1);

/** A pointer's distance from the centre and its angle, 0…360 (recharts `getAngleOfPoint`). */
export function angleOfPoint(x: number, y: number, cx: number, cy: number): { radius: number; angle: number } {
  const radius = Math.hypot(x - cx, y - cy);
  if (radius <= 0) return { radius, angle: 0 };
  let angle = Math.acos((x - cx) / radius) / RADIAN;
  if (y > cy) angle = 360 - angle;
  return { radius, angle };
}

/** Whether `angle` (any turn) lies inside the sweep `start → end`, either direction. */
export function angleInSweep(angle: number, startAngle: number, endAngle: number): boolean {
  const lo = Math.min(startAngle, endAngle);
  const hi = Math.max(startAngle, endAngle);
  let a = angle;
  while (a > hi) a -= 360;
  while (a < lo) a += 360;
  return a >= lo && a <= hi;
}

// ---------------------------------------------------------------------------
//  Chart frame
// ---------------------------------------------------------------------------

export interface PolarFrame {
  cx: number;
  cy: number;
  /** Half the smaller side of the area inside the margin (recharts `getMaxRadius`). */
  maxRadius: number;
}

/**
 * recharts' polar chart frame: `cx` / `cy` are fractions of the WHOLE surface
 * (not of the area inside the margin), the max radius is half the smaller side
 * inside the margin.
 */
export function polarFrame(width: number, height: number, cxFraction = 0.5, cyFraction = 0.5, margin = 0): PolarFrame {
  return {
    cx: width * cxFraction,
    cy: height * cyFraction,
    maxRadius: Math.max(0, Math.min(width - 2 * margin, height - 2 * margin)) / 2,
  };
}

// ---------------------------------------------------------------------------
//  Sectors (recharts `Sector`)
// ---------------------------------------------------------------------------

export interface SectorShape {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  /** Clamped to half the ring's thickness, as recharts does (`cornerRadius={99}` = fully round). */
  cornerRadius?: number;
}

const deltaAngleOf = (startAngle: number, endAngle: number) =>
  sign(endAngle - startAngle) * Math.min(Math.abs(endAngle - startAngle), 359.999);

const n = round4;

function plainSectorPath({ cx, cy, innerRadius, outerRadius, startAngle, endAngle }: SectorShape): string {
  const angle = deltaAngleOf(startAngle, endAngle);
  const tempEndAngle = startAngle + angle;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, tempEndAngle);
  let path = `M ${n(outerStart.x)},${n(outerStart.y)} A ${n(outerRadius)},${n(outerRadius)},0, ${+(Math.abs(angle) > 180)},${+(startAngle > tempEndAngle)}, ${n(outerEnd.x)},${n(outerEnd.y)}`;
  if (innerRadius > 0) {
    const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
    const innerEnd = polarToCartesian(cx, cy, innerRadius, tempEndAngle);
    path += ` L ${n(innerEnd.x)},${n(innerEnd.y)} A ${n(innerRadius)},${n(innerRadius)},0, ${+(Math.abs(angle) > 180)},${+(startAngle <= tempEndAngle)}, ${n(innerStart.x)},${n(innerStart.y)} Z`;
  } else {
    path += ` L ${n(cx)},${n(cy)} Z`;
  }
  return path;
}

function tangentCircle(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  sgn: number,
  cornerRadius: number,
  isExternal: boolean,
) {
  const centerRadius = cornerRadius * (isExternal ? 1 : -1) + radius;
  const theta = Math.asin(cornerRadius / centerRadius) / RADIAN;
  const centerAngle = angle + sgn * theta;
  return {
    circleTangency: polarToCartesian(cx, cy, radius, centerAngle),
    lineTangency: polarToCartesian(cx, cy, centerRadius * Math.cos(theta * RADIAN), angle),
    theta,
  };
}

function cornerSectorPath(shape: SectorShape & { cornerRadius: number }): string {
  const { cx, cy, innerRadius, outerRadius, cornerRadius: cr, startAngle, endAngle } = shape;
  const sgn = sign(endAngle - startAngle);
  const so = tangentCircle(cx, cy, outerRadius, startAngle, sgn, cr, false);
  const eo = tangentCircle(cx, cy, outerRadius, endAngle, -sgn, cr, false);
  const outerArcAngle = Math.abs(startAngle - endAngle) - so.theta - eo.theta;
  if (outerArcAngle < 0) return plainSectorPath(shape);
  let path = `M ${n(so.lineTangency.x)},${n(so.lineTangency.y)} A${n(cr)},${n(cr)},0,0,${+(sgn < 0)},${n(so.circleTangency.x)},${n(so.circleTangency.y)} A${n(outerRadius)},${n(outerRadius)},0,${+(outerArcAngle > 180)},${+(sgn < 0)},${n(eo.circleTangency.x)},${n(eo.circleTangency.y)} A${n(cr)},${n(cr)},0,0,${+(sgn < 0)},${n(eo.lineTangency.x)},${n(eo.lineTangency.y)}`;
  if (innerRadius > 0) {
    const si = tangentCircle(cx, cy, innerRadius, startAngle, sgn, cr, true);
    const ei = tangentCircle(cx, cy, innerRadius, endAngle, -sgn, cr, true);
    const innerArcAngle = Math.abs(startAngle - endAngle) - si.theta - ei.theta;
    path += ` L${n(ei.lineTangency.x)},${n(ei.lineTangency.y)} A${n(cr)},${n(cr)},0,0,${+(sgn < 0)},${n(ei.circleTangency.x)},${n(ei.circleTangency.y)} A${n(innerRadius)},${n(innerRadius)},0,${+(innerArcAngle > 180)},${+(sgn > 0)},${n(si.circleTangency.x)},${n(si.circleTangency.y)} A${n(cr)},${n(cr)},0,0,${+(sgn < 0)},${n(si.lineTangency.x)},${n(si.lineTangency.y)}Z`;
  } else {
    path += ` L${n(cx)},${n(cy)}Z`;
  }
  return path;
}

/**
 * recharts `Sector`'s `d`, whitespace collapsed to single spaces. `null` when
 * recharts draws nothing (an empty sweep or inverted radii).
 */
export function sectorPath(shape: SectorShape): string | null {
  const { innerRadius, outerRadius, startAngle, endAngle, cornerRadius = 0 } = shape;
  if (outerRadius < innerRadius || startAngle === endAngle) return null;
  const cr = Math.min(cornerRadius, (outerRadius - innerRadius) / 2);
  if (cr > 0 && Math.abs(startAngle - endAngle) < 360) return cornerSectorPath({ ...shape, cornerRadius: cr });
  return plainSectorPath(shape);
}

// ---------------------------------------------------------------------------
//  Radar
// ---------------------------------------------------------------------------

/** The category axis of a radar: first axis at twelve o'clock, then clockwise. */
export function radarAxisAngle(index: number, count: number): number {
  return 90 - (360 * index) / Math.max(1, count);
}

/** recharts `PolarAngleAxis` tick anchor for an angle. */
export function tickAnchor(angle: number): 'start' | 'middle' | 'end' {
  const cos = Math.cos(-angle * RADIAN);
  return cos > 1e-5 ? 'start' : cos < -1e-5 ? 'end' : 'middle';
}

/** recharts `Polygon`: `M…L…` through every point and back to the first, rounded. */
export function closedPolygonPath(points: readonly PolarPoint[]): string {
  if (points.length === 0) return '';
  const all = [...points, points[0]!];
  return `${all.map((p, i) => `${i === 0 ? 'M' : 'L'}${n(p.x)},${n(p.y)}`).join('')}Z`;
}

/**
 * The category under a pointer, recharts' polar tooltip: nothing outside the
 * outer radius (or dead centre), otherwise the axis nearest by angle.
 */
export function radarIndexAt(
  x: number,
  y: number,
  frame: { cx: number; cy: number; outerRadius: number },
  count: number,
): number | null {
  if (count <= 0) return null;
  const { radius, angle } = angleOfPoint(x, y, frame.cx, frame.cy);
  if (radius === 0 || radius > frame.outerRadius) return null;
  if (count === 1) return 0;
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < count; i++) {
    const d = Math.abs((((angle - radarAxisAngle(i, count)) % 360) + 540) % 360 - 180);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
//  Radial bars
// ---------------------------------------------------------------------------

export interface RingBand {
  innerRadius: number;
  outerRadius: number;
}

/**
 * recharts `RadialBarChart`'s rings: the radius axis is a band scale over
 * `[inner, outer]`, one band per item; each bar keeps `barCategoryGap` of its
 * band on both sides and a size rounded to whole pixels.
 */
export function radialBarBands(count: number, inner: number, outer: number, categoryGap: number): RingBand[] {
  if (count <= 0) return [];
  const band = (outer - inner) / count;
  const offset = band * categoryGap;
  let size = band - 2 * offset;
  if (size > 1) size = Math.round(size);
  return Array.from({ length: count }, (_, i) => {
    const innerRadius = inner + band * i + offset;
    return { innerRadius, outerRadius: innerRadius + size };
  });
}

/** Band centres — where recharts' circular `PolarGrid` draws its rings. */
export function radialBarBandCentres(count: number, inner: number, outer: number): number[] {
  const band = (outer - inner) / Math.max(1, count);
  return Array.from({ length: count }, (_, i) => inner + band * (i + 0.5));
}

/** A value's angle on a `[0, max]` domain swept `start → end`. */
export function valueAngle(value: number, max: number, startAngle = 90, endAngle = -270): number {
  return startAngle + ((endAngle - startAngle) * value) / Math.max(1e-9, max);
}

/**
 * recharts' `LabelList position="insideStart"` for a radial bar: the arc the
 * label is set along, starting `offset` degrees into the bar, at the band's
 * middle radius, clockwise.
 */
export function radialLabelArc(
  cx: number,
  cy: number,
  band: RingBand,
  startAngle: number,
  endAngle: number,
  offset: number,
): string {
  const radius = (band.innerRadius + band.outerRadius) / 2;
  const deltaAngle = deltaAngleOf(startAngle, endAngle);
  const sgn = deltaAngle >= 0 ? 1 : -1;
  const labelAngle = startAngle + sgn * offset;
  const direction = deltaAngle <= 0 ? false : true;
  const start = polarToCartesian(cx, cy, radius, labelAngle);
  const end = polarToCartesian(cx, cy, radius, labelAngle + (direction ? 1 : -1) * 359);
  return `M${start.x},${start.y} A${radius},${radius},0,1,${direction ? 0 : 1}, ${end.x},${end.y}`;
}

// ---------------------------------------------------------------------------
//  Pie
// ---------------------------------------------------------------------------

export interface SectorAngles {
  startAngle: number;
  endAngle: number;
}

/**
 * recharts `computePieSectors` (no `minAngle`): each non-zero slice is
 * `paddingAngle` apart — including between the last and the first on a full
 * circle — and shares what is left of the sweep in proportion to its value.
 */
export function pieSectorAngles(
  values: readonly number[],
  startAngle: number,
  endAngle: number,
  paddingAngle = 0,
): SectorAngles[] {
  const delta = sign(endAngle - startAngle) * Math.min(Math.abs(endAngle - startAngle), 360);
  const abs = Math.abs(delta);
  const padding = values.length <= 1 ? 0 : paddingAngle;
  const notZero = values.filter((v) => v !== 0).length;
  const totalPadding = (abs >= 360 ? notZero : notZero - 1) * padding;
  const sum = values.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  const real = abs - totalPadding;
  if (sum <= 0) return [];
  const out: SectorAngles[] = [];
  values.forEach((v, i) => {
    const start = i ? out[i - 1]!.endAngle + sign(delta) * padding * (v !== 0 ? 1 : 0) : startAngle;
    out.push({ startAngle: start, endAngle: start + sign(delta) * ((v / sum) * real) });
  });
  return out;
}

/** The slice / bar under a pointer: inside its radii and its sweep. */
export function sectorIndexAt(
  x: number,
  y: number,
  cx: number,
  cy: number,
  sectors: readonly (SectorAngles & RingBand)[],
): number | null {
  const { radius, angle } = angleOfPoint(x, y, cx, cy);
  if (radius === 0) return null;
  for (let i = 0; i < sectors.length; i++) {
    const s = sectors[i]!;
    if (s.startAngle === s.endAngle) continue;
    if (radius < s.innerRadius || radius > s.outerRadius) continue;
    if (angleInSweep(angle, s.startAngle, s.endAngle)) return i;
  }
  return null;
}

/**
 * recharts' pie animation at `progress`: from the previous angles when the
 * slice count is unchanged, otherwise the entrance, where each slice grows in
 * turn from where the previous one ends (`paddingAngle` apart).
 */
export function animatedPieAngles(
  values: readonly number[],
  target: readonly SectorAngles[],
  previous: readonly SectorAngles[] | null,
  progress: number,
  paddingAngle: number,
): SectorAngles[] {
  if (progress >= 1) return target.slice();
  if (previous && previous.length === target.length) {
    return target.map((t, i) => ({
      startAngle: previous[i]!.startAngle + (t.startAngle - previous[i]!.startAngle) * progress,
      endAngle: previous[i]!.endAngle + (t.endAngle - previous[i]!.endAngle) * progress,
    }));
  }
  const out: SectorAngles[] = [];
  target.forEach((t, i) => {
    const direction = sign(t.endAngle - t.startAngle) || -1;
    const start = i ? out[i - 1]!.endAngle + direction * paddingAngle * (values[i] !== 0 ? 1 : 0) : t.startAngle;
    out.push({ startAngle: start, endAngle: start + (t.endAngle - t.startAngle) * progress });
  });
  return out;
}
