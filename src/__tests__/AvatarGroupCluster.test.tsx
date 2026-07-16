import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AvatarGroup } from '../avatar-group';
import type { AvatarGroupItem } from '../avatar-group';
import {
  computeClusterLayout,
  type ClusterBubble,
} from '../avatar-group/cluster-layout';

/** Returns bubble at `index` or throws — keeps the tests `!`/`as`-free under
 * `noUncheckedIndexedAccess`. */
function bubbleAt(bubbles: readonly ClusterBubble[], index: number): ClusterBubble {
  const bubble = bubbles[index];
  if (!bubble) throw new Error(`expected a bubble at index ${index}`);
  return bubble;
}

/** Nearest-neighbour edge gap for every bubble (negative = overlap). */
function minEdgeGap(bubbles: readonly ClusterBubble[]): number {
  let worst = Infinity;
  for (const a of bubbles) {
    for (const b of bubbles) {
      if (a === b) continue;
      const centerDist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      const gap = centerDist - (a.d / 2 + b.d / 2);
      if (gap < worst) worst = gap;
    }
  }
  return worst;
}

describe('computeClusterLayout', () => {
  it('returns an empty layout for non-positive counts', () => {
    expect(computeClusterLayout(0)).toEqual([]);
    expect(computeClusterLayout(-3)).toEqual([]);
  });

  it('returns exactly `count` bubbles', () => {
    for (let count = 1; count <= 20; count++) {
      expect(computeClusterLayout(count)).toHaveLength(count);
    }
  });

  it('is fully deterministic (no Math.random)', () => {
    for (const count of [2, 3, 4, 8, 20]) {
      expect(computeClusterLayout(count)).toEqual(computeClusterLayout(count));
    }
  });

  it('keeps every bubble inside the unit box with no NaN', () => {
    for (let count = 1; count <= 20; count++) {
      const bubbles = computeClusterLayout(count);
      for (const bubble of bubbles) {
        expect(Number.isNaN(bubble.cx)).toBe(false);
        expect(Number.isNaN(bubble.cy)).toBe(false);
        expect(Number.isNaN(bubble.d)).toBe(false);
        expect(bubble.cx - bubble.d / 2).toBeGreaterThanOrEqual(-1e-6);
        expect(bubble.cx + bubble.d / 2).toBeLessThanOrEqual(1 + 1e-6);
        expect(bubble.cy - bubble.d / 2).toBeGreaterThanOrEqual(-1e-6);
        expect(bubble.cy + bubble.d / 2).toBeLessThanOrEqual(1 + 1e-6);
      }
    }
  });

  it('makes the primary (index 0) the largest bubble', () => {
    for (let count = 2; count <= 20; count++) {
      const bubbles = computeClusterLayout(count);
      const primary = bubbleAt(bubbles, 0);
      for (const bubble of bubbles) {
        expect(primary.d).toBeGreaterThanOrEqual(bubble.d - 1e-9);
      }
    }
  });

  it('fills the round box edge-to-edge for the force-packed counts (5+)', () => {
    // After the recentre + scale, the outermost bubble edge lands on the box
    // radius (0.5 from the box centre) — the blob fills the round box densely
    // with no big empty margin — and the whole cluster stays roughly centred.
    // (count=4 is the explicit 2×2 grid, covered separately below.)
    for (const count of [5, 8, 12, 20]) {
      const bubbles = computeClusterLayout(count);
      let reach = 0;
      for (const bubble of bubbles) {
        const r = Math.hypot(bubble.cx - 0.5, bubble.cy - 0.5) + bubble.d / 2;
        if (r > reach) reach = r;
      }
      expect(reach).toBeCloseTo(0.5, 6);
      const primary = bubbleAt(bubbles, 0);
      expect(primary.cx).toBeGreaterThan(0.4);
      expect(primary.cx).toBeLessThan(0.6);
      expect(primary.cy).toBeGreaterThan(0.4);
      expect(primary.cy).toBeLessThan(0.6);
    }
  });

  it('keeps the force-packed bubbles near-equal in size (mild taper)', () => {
    // The pack should read as near-equal magnetic bubbles: a modestly larger
    // primary, everyone else only slightly smaller — not a big primary ringed by
    // tiny dots. The smallest bubble stays at least ~75% of the largest.
    // (count=4 is the explicit 2×2 grid, covered separately below.)
    for (const count of [5, 6, 8, 12, 20]) {
      const diameters = computeClusterLayout(count).map((bubble) => bubble.d);
      const maxD = Math.max(...diameters);
      const minD = Math.min(...diameters);
      expect(minD / maxD).toBeGreaterThan(0.75);
    }
  });

  it('keeps a uniform, non-overlapping gap for 3+ members', () => {
    // n=2 is the intentional "front + behind" overlap; 3+ pack with a gap.
    for (let count = 3; count <= 20; count++) {
      expect(minEdgeGap(computeClusterLayout(count))).toBeGreaterThan(-1e-3);
    }
  });

  it('arranges the four-member cluster as an equal-size 2×2 grid', () => {
    // The iMessage 4-person layout: four EQUAL-diameter bubbles at the corners of
    // a 2×2 grid centred in the box, with a clean uniform gap (no overlap), sized
    // so the outermost edges reach the box edge like the other counts.
    const bubbles = computeClusterLayout(4);
    expect(bubbles).toHaveLength(4);

    // All four share one diameter.
    const d = bubbleAt(bubbles, 0).d;
    for (const bubble of bubbles) {
      expect(bubble.d).toBeCloseTo(d, 10);
    }

    // Exactly two distinct rows (cy) and two distinct columns (cx), each shared by
    // two bubbles — a true 2×2 grid, centred on the box (rows/cols symmetric
    // about 0.5).
    const round = (v: number) => Math.round(v * 1e6) / 1e6;
    const cols = [...new Set(bubbles.map((b) => round(b.cx)))].sort((a, b) => a - b);
    const rows = [...new Set(bubbles.map((b) => round(b.cy)))].sort((a, b) => a - b);
    expect(cols).toHaveLength(2);
    expect(rows).toHaveLength(2);
    const col0 = cols[0];
    const col1 = cols[1];
    const row0 = rows[0];
    const row1 = rows[1];
    if (col0 === undefined || col1 === undefined || row0 === undefined || row1 === undefined) {
      throw new Error('expected two distinct rows and columns');
    }
    expect((col0 + col1) / 2).toBeCloseTo(0.5, 9);
    expect((row0 + row1) / 2).toBeCloseTo(0.5, 9);
    // Square grid: the row and column spacings match.
    expect(col1 - col0).toBeCloseTo(row1 - row0, 9);

    // Clean uniform gap between neighbours — no overlap.
    expect(minEdgeGap(bubbles)).toBeGreaterThan(0);

    // Outermost edge reaches the box radius (fills the round box like the others).
    let reach = 0;
    for (const bubble of bubbles) {
      const r = Math.hypot(bubble.cx - 0.5, bubble.cy - 0.5) + bubble.d / 2;
      if (r > reach) reach = r;
    }
    expect(reach).toBeCloseTo(0.5, 6);

    // Fully inside the unit box, and deterministic.
    for (const bubble of bubbles) {
      expect(bubble.cx - bubble.d / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(bubble.cx + bubble.d / 2).toBeLessThanOrEqual(1 + 1e-6);
      expect(bubble.cy - bubble.d / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(bubble.cy + bubble.d / 2).toBeLessThanOrEqual(1 + 1e-6);
    }
    expect(computeClusterLayout(4)).toEqual(bubbles);
  });

  it('gives the two-member cluster equal-diameter, overlapping bubbles', () => {
    const bubbles = computeClusterLayout(2);
    expect(bubbles).toHaveLength(2);
    const front = bubbleAt(bubbles, 0);
    const behind = bubbleAt(bubbles, 1);
    // The fix: both bubbles share the SAME diameter — the one drawn behind is no
    // longer rendered too small.
    expect(front.d).toBeCloseTo(behind.d, 10);
    // Still the intentional iMessage "front + behind" overlap (negative gap).
    expect(minEdgeGap(bubbles)).toBeLessThan(0);
    // Deterministic (no Math.random).
    expect(computeClusterLayout(2)).toEqual(bubbles);
    // Both bubbles sit fully inside the unit box.
    for (const bubble of bubbles) {
      expect(bubble.cx - bubble.d / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(bubble.cx + bubble.d / 2).toBeLessThanOrEqual(1 + 1e-6);
      expect(bubble.cy - bubble.d / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(bubble.cy + bubble.d / 2).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});

const CLUSTER_ITEMS: AvatarGroupItem[] = Array.from({ length: 25 }, (_, i) => ({
  id: `c${i}`,
  displayName: `Member ${i}`,
  username: `member${i}`,
}));

function renderCluster(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
}

describe('AvatarGroup cluster layout', () => {
  it('renders a "+N" overflow bubble past the cap', () => {
    // 25 members, cap 20 → 19 avatars + a "+6" bubble.
    const { getByText } = renderCluster(
      <AvatarGroup layout="cluster" items={CLUSTER_ITEMS} size={140} max={20} showInitials />,
    );
    expect(getByText('+6')).toBeTruthy();
  });

  it('shows no overflow bubble when members fit under the cap', () => {
    const { queryByText } = renderCluster(
      <AvatarGroup
        layout="cluster"
        items={CLUSTER_ITEMS.slice(0, 4)}
        size={64}
        showInitials
      />,
    );
    expect(queryByText(/^\+/)).toBeNull();
  });
});
