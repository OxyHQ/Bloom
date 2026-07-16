/**
 * Deterministic organic circle-packing for the {@link AvatarGroup} `cluster`
 * layout — the iMessage-style "magnetic bubble cluster" where several avatars of
 * NEAR-EQUAL size nestle tightly together and fill a round bounding box (a
 * modestly larger primary with the rest only slightly smaller, packed against
 * each other with a small uniform gap — not a big primary ringed by tiny dots).
 *
 * For 4+ members the layout is produced by a small, FULLY DETERMINISTIC
 * force-directed relaxation (no `Math.random`): the primary is pinned at the
 * centre and the remaining members are seeded on a golden-angle spiral, then a
 * fixed number of relaxation passes (a) pull every non-primary circle toward the
 * centre and (b) push any two circles apart until they clear a uniform gap. A
 * fixed iteration count + deterministic seed means the same `count` always
 * yields byte-identical positions, so native and web render the cluster
 * identically with no `onLayout`/DOM measurement. The small counts (1, 2, 3, 4)
 * use explicit iMessage-style arrangements instead — 1–3 because a relaxation
 * there degenerates into a line or a lone pair, and 4 because the iconic
 * 4-person layout is a clean 2×2 grid of equal circles rather than a pack.
 *
 * Output is resolution-independent: each bubble is expressed as a fraction of
 * the group's bounding box (`cx`/`cy` centre, `d` diameter, all 0..1), so the
 * consumer just multiplies by the pixel `size`. The relaxed blob is recentred on
 * its own centre and scaled so the outermost bubble edge lands on the box edge,
 * so it fills the round box densely with minimal empty margin while every bubble
 * is guaranteed to sit fully inside the `[0, 1]` box — the cluster drops in
 * exactly where a single round Avatar would.
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
// (primary radius = 1). Small, so near-equal bubbles nestle tightly like
// magnets rather than floating apart with visible margins.
const LAYOUT_GAP = 0.12;
// Initial spiral spacing. Only affects convergence (the result is re-fitted to
// the box afterwards), not the final scale.
const SEED_SPACING = 1.7;
// Relative radii: the primary is only MODESTLY the largest; every other member
// tapers gently from SECONDARY_MAX (nearest the primary) down to SECONDARY_MIN
// (outermost). The spread is deliberately narrow so the cluster reads as a pack
// of near-equal magnetic bubbles — a slightly larger primary, not a big primary
// ringed by tiny dots.
const PRIMARY_RADIUS = 1;
const SECONDARY_MAX = 0.9;
const SECONDARY_MIN = 0.8;
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
 * centre), returned as box-fraction bubbles. Used for every cluster with 5+
 * members; 1–4 are handled as explicit arrangements in
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

  // Fit to the unit box so the pack FILLS the round box edge-to-edge with
  // minimal empty margin. The primary was pinned at the origin during
  // relaxation, but the relaxed blob is not centred on it, so we recentre on the
  // cluster's OWN centre (its bounding-box midpoint) rather than the primary:
  // enclose every bubble in a circle around that centre, then scale so the
  // outermost bubble edge lands exactly on the box radius (0.5). Centring the
  // enclosing circle at the box centre keeps every bubble inside the [0, 1] box
  // (the enclosing circle is inscribed in the square) while packing the blob
  // tightly against the edge instead of floating with a gap.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = xs[i] ?? 0;
    const y = ys[i] ?? 0;
    const r = radii[i] ?? 0;
    if (x - r < minX) minX = x - r;
    if (x + r > maxX) maxX = x + r;
    if (y - r < minY) minY = y - r;
    if (y + r > maxY) maxY = y + r;
  }
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  let bound = 0;
  for (let i = 0; i < count; i++) {
    const reach =
      Math.hypot((xs[i] ?? 0) - centerX, (ys[i] ?? 0) - centerY) + (radii[i] ?? 0);
    if (reach > bound) bound = reach;
  }
  const scale = bound > EPSILON ? 0.5 / bound : 0.5;

  const bubbles = new Array<ClusterBubble>(count);
  for (let i = 0; i < count; i++) {
    bubbles[i] = {
      cx: 0.5 + ((xs[i] ?? 0) - centerX) * scale,
      cy: 0.5 + ((ys[i] ?? 0) - centerY) * scale,
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
 * - `2` → the iMessage "one in front, one behind" pair: two EQUAL-diameter
 *   bubbles offset on a diagonal — the front set low-left, the other tucked
 *   behind it to the upper-right. Same radius, so neither member reads as
 *   secondary; the overlap + separator ring alone convey the stacking.
 * - `3` → an iMessage-style triangle: the larger primary along the bottom with
 *   two smaller members above it.
 * - `4` → the iMessage 4-person layout: a 2×2 grid of EQUAL-diameter bubbles,
 *   centred in the box with a uniform gap, sized so the outermost edges reach the
 *   box edge like the other counts.
 * - `5+` → the deterministic force-directed pack of near-equal bubbles, recentred
 *   and scaled to fill the round box edge-to-edge (a modestly larger primary near
 *   the centre, the rest packed magnetically around it, denser as the count
 *   grows).
 */
export function computeClusterLayout(count: number): ClusterBubble[] {
  if (count <= 0) return [];
  if (count === 1) return [{ cx: 0.5, cy: 0.5, d: 1 }];
  if (count === 2) {
    // Two EQUAL-diameter bubbles, offset symmetrically on the diagonal: the
    // front (index 0, highest zIndex) sits low-left, the other tucks behind it
    // to the upper-right. They overlap (the intentional "front + behind" pair);
    // the separator ring — not a size difference — reads the stacking.
    return [
      { cx: 0.35, cy: 0.65, d: 0.64 },
      { cx: 0.65, cy: 0.35, d: 0.64 },
    ];
  }
  if (count === 3) {
    return [
      { cx: 0.5, cy: 0.69, d: 0.54 },
      { cx: 0.285, cy: 0.24, d: 0.4 },
      { cx: 0.715, cy: 0.24, d: 0.4 },
    ];
  }
  if (count === 4) {
    // The iMessage 4-person layout: a 2×2 grid of EQUAL-diameter bubbles,
    // centred in the box with the same uniform neighbour gap the rest of the
    // cluster keeps (LAYOUT_GAP, in circle-radius units), sized so the outermost
    // bubble edge reaches the box radius (0.5 from the centre) — exactly as the
    // force-packed counts do — so the four circles fill the round box
    // edge-to-edge with a clean uniform gap and no overlap.
    //
    // With diameter `d` and radius `r = d/2`, the neighbour gap `g = LAYOUT_GAP·r`,
    // so the centre-to-centre spacing is `s = d + g = d·(1 + LAYOUT_GAP/2)`. Each
    // centre sits `(s/2, s/2)` from the box centre, so its farthest point lies
    // `(s/2)·√2 + r` away; setting that to `0.5` and solving for `d`:
    const spacingFactor = 1 + LAYOUT_GAP / 2;
    const d = 0.5 / ((spacingFactor * Math.SQRT2) / 2 + 0.5);
    const half = (d * spacingFactor) / 2;
    return [
      { cx: 0.5 - half, cy: 0.5 - half, d },
      { cx: 0.5 + half, cy: 0.5 - half, d },
      { cx: 0.5 - half, cy: 0.5 + half, d },
      { cx: 0.5 + half, cy: 0.5 + half, d },
    ];
  }
  return packCluster(count);
}
