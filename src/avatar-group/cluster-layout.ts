/**
 * Deterministic organic circle-packing for the {@link AvatarGroup} `cluster`
 * layout — the iMessage-style "magnetic bubble cluster" where several avatars of
 * varying sizes nestle together inside a round bounding box (a large primary in
 * the middle/front, smaller members packed around it with a uniform gap).
 *
 * For 4+ members the layout is produced by a small, FULLY DETERMINISTIC
 * force-directed relaxation (no `Math.random`): the primary is pinned at the
 * centre and the remaining members are seeded on a golden-angle spiral, then a
 * fixed number of relaxation passes (a) pull every non-primary circle toward the
 * centre and (b) push any two circles apart until they clear a uniform gap. A
 * fixed iteration count + deterministic seed means the same `count` always
 * yields byte-identical positions, so native and web render the cluster
 * identically with no `onLayout`/DOM measurement. The very small counts (1, 2,
 * 3) — where a relaxation degenerates into a line or a lone pair — use explicit
 * iMessage-style arrangements instead.
 *
 * Output is resolution-independent: each bubble is expressed as a fraction of
 * the group's bounding box (`cx`/`cy` centre, `d` diameter, all 0..1), so the
 * consumer just multiplies by the pixel `size`. Every bubble is guaranteed to
 * sit fully inside the `[0, 1]` box (the packed result is scaled + translated to
 * fit), so the cluster drops in exactly where a single round Avatar would.
 */

/** A single packed bubble, expressed as fractions of the bounding box (0..1). */
export interface ClusterBubble {
  /** Centre X as a fraction of the box width. */
  cx: number;
  /** Centre Y as a fraction of the box height. */
  cy: number;
  /** Diameter as a fraction of the box size. */
  d: number;
}

// Golden angle (~137.5°) — spreads the seed points evenly with no directional
// bias, which is what gives the relaxed result its organic, non-grid feel.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
// Fixed relaxation passes + a final separation-only cleanup so the last thing
// that happens is overlap resolution (gaps end uniform and non-negative).
const ITERATIONS = 500;
const CLEANUP_ITERATIONS = 80;
// How hard each pass pulls every non-primary circle toward the centre. This is
// the only compacting force; separation only ever pushes apart, so any positive
// value packs the cluster fully — this just controls convergence speed.
const CENTERING = 0.05;
// Fraction of an overlap resolved per pass. 1 fully separates each pass; with
// the pinned primary and many passes this stays stable and converges.
const SEPARATION_STRENGTH = 1;
// Uniform gap kept between every touching pair, in primary-radius units
// (primary radius = 1). Reads as consistent spacing everywhere in the cluster.
const LAYOUT_GAP = 0.16;
// Initial spiral spacing. Only affects convergence (the result is re-fitted to
// the box afterwards), not the final scale.
const SEED_SPACING = 1.7;
// Relative radii: the primary is the largest; the remaining members taper from
// SECONDARY_MAX (nearest the primary) down to SECONDARY_MIN (outermost) so size
// decreases outward and later/overflow members are the smallest.
const PRIMARY_RADIUS = 1;
const SECONDARY_MAX = 0.72;
const SECONDARY_MIN = 0.5;
const EPSILON = 1e-6;

/** Relative radius for member `index` of a `count`-member cluster. */
function relativeRadius(index: number, count: number): number {
  if (index === 0) return PRIMARY_RADIUS;
  if (count <= 2) return SECONDARY_MAX;
  const t = (index - 1) / (count - 2);
  return SECONDARY_MAX + (SECONDARY_MIN - SECONDARY_MAX) * t;
}

/**
 * One separation pass: push any pair closer than `(r_i + r_j + gap)` apart. The
 * primary (index 0) is pinned — when a pair involves it, only the other circle
 * moves — which keeps the largest avatar dead-centre and in front.
 */
function separate(xs: number[], ys: number[], radii: number[], count: number): void {
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      let dx = (xs[j] ?? 0) - (xs[i] ?? 0);
      let dy = (ys[j] ?? 0) - (ys[i] ?? 0);
      let dist = Math.hypot(dx, dy);
      const minDist = (radii[i] ?? 0) + (radii[j] ?? 0) + LAYOUT_GAP;
      if (dist >= minDist) continue;
      if (dist < EPSILON) {
        // Coincident points: pick a deterministic direction from the indices so
        // the split is stable (never random).
        const a = (i + 1) * GOLDEN_ANGLE + j;
        dx = Math.cos(a);
        dy = Math.sin(a);
        dist = 1;
      }
      const overlap = (minDist - dist) * SEPARATION_STRENGTH;
      const nx = dx / dist;
      const ny = dy / dist;
      if (i === 0) {
        // Primary pinned: move only the other circle by the full overlap.
        xs[j] = (xs[j] ?? 0) + nx * overlap;
        ys[j] = (ys[j] ?? 0) + ny * overlap;
      } else {
        xs[i] = (xs[i] ?? 0) - (nx * overlap) / 2;
        ys[i] = (ys[i] ?? 0) - (ny * overlap) / 2;
        xs[j] = (xs[j] ?? 0) + (nx * overlap) / 2;
        ys[j] = (ys[j] ?? 0) + (ny * overlap) / 2;
      }
    }
  }
}

/**
 * Deterministic force-directed pack of `count` circles (primary pinned at the
 * centre), returned as box-fraction bubbles. Used for every cluster with 4+
 * members; 1–3 are handled as explicit arrangements in
 * {@link computeClusterLayout}.
 */
function packCluster(count: number): ClusterBubble[] {
  const radii = new Array<number>(count);
  const xs = new Array<number>(count);
  const ys = new Array<number>(count);

  for (let i = 0; i < count; i++) {
    radii[i] = relativeRadius(i, count);
    if (i === 0) {
      xs[i] = 0;
      ys[i] = 0;
    } else {
      // Golden-angle spiral seed around the pinned primary.
      const seedR = SEED_SPACING * Math.sqrt(i);
      const angle = i * GOLDEN_ANGLE;
      xs[i] = seedR * Math.cos(angle);
      ys[i] = seedR * Math.sin(angle);
    }
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // (a) Centering: pull every non-primary circle toward the centre.
    for (let i = 1; i < count; i++) {
      xs[i] = (xs[i] ?? 0) * (1 - CENTERING);
      ys[i] = (ys[i] ?? 0) * (1 - CENTERING);
    }
    // (b) Separation resolves any resulting overlaps (primary stays pinned).
    separate(xs, ys, radii, count);
    xs[0] = 0;
    ys[0] = 0;
  }
  // Final separation-only passes so the cluster ends with clean uniform gaps.
  for (let iter = 0; iter < CLEANUP_ITERATIONS; iter++) {
    separate(xs, ys, radii, count);
    xs[0] = 0;
    ys[0] = 0;
  }

  // Fit to the unit box: the primary is at the origin, so scale so the
  // outermost circle edge lands on the box radius (0.5) and place the primary at
  // the box centre.
  let bound = 0;
  for (let i = 0; i < count; i++) {
    const reach = Math.hypot(xs[i] ?? 0, ys[i] ?? 0) + (radii[i] ?? 0);
    if (reach > bound) bound = reach;
  }
  const scale = bound > EPSILON ? 0.5 / bound : 0.5;

  const bubbles = new Array<ClusterBubble>(count);
  for (let i = 0; i < count; i++) {
    bubbles[i] = {
      cx: 0.5 + (xs[i] ?? 0) * scale,
      cy: 0.5 + (ys[i] ?? 0) * scale,
      d: 2 * (radii[i] ?? 0) * scale,
    };
  }
  return bubbles;
}

/**
 * Deterministic cluster layout for `count` bubbles, as box-fraction bubbles
 * ordered primary-first. `count` includes the `+N` overflow bubble when present
 * (it is simply the last, smallest member of the pack).
 *
 * - `<= 0` → empty.
 * - `1` → a single bubble filling the box.
 * - `2` → the iMessage "one in front, one behind" pair: a larger primary set
 *   low-left with a smaller member tucked behind it to the upper-right.
 * - `3` → an iMessage-style triangle: the larger primary along the bottom with
 *   two smaller members above it.
 * - `4+` → the deterministic force-directed pack (primary centred, the rest
 *   packed magnetically around it, denser as the count grows).
 */
export function computeClusterLayout(count: number): ClusterBubble[] {
  if (count <= 0) return [];
  if (count === 1) return [{ cx: 0.5, cy: 0.5, d: 1 }];
  if (count === 2) {
    return [
      { cx: 0.42, cy: 0.56, d: 0.66 },
      { cx: 0.68, cy: 0.36, d: 0.5 },
    ];
  }
  if (count === 3) {
    return [
      { cx: 0.5, cy: 0.69, d: 0.54 },
      { cx: 0.285, cy: 0.24, d: 0.4 },
      { cx: 0.715, cy: 0.24, d: 0.4 },
    ];
  }
  return packCluster(count);
}
