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

  it('centres the primary for the force-packed counts (4+)', () => {
    for (const count of [4, 5, 8, 12, 20]) {
      const primary = bubbleAt(computeClusterLayout(count), 0);
      expect(primary.cx).toBeCloseTo(0.5, 5);
      expect(primary.cy).toBeCloseTo(0.5, 5);
    }
  });

  it('keeps a uniform, non-overlapping gap for 3+ members', () => {
    // n=2 is the intentional "front + behind" overlap; 3+ pack with a gap.
    for (let count = 3; count <= 20; count++) {
      expect(minEdgeGap(computeClusterLayout(count))).toBeGreaterThan(-1e-3);
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
