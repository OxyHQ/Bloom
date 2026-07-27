import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton, useTabBarReservedSpace } from '../tab-bar';
import type { TabBarItem } from '../tab-bar/types';

/**
 * `useTabBarReservedSpace()` — the number a screen pads its content by so a
 * list does not end underneath the floating bar.
 *
 * The bar is absolutely positioned, so nothing reserves that space
 * automatically, and the geometry it is built from (expanded height, bottom
 * gap) is private. Without the hook a consumer hardcodes both — which drifts
 * silently the first time the bar changes by a pixel — and, worse, tends to add
 * `insets.bottom` on top, because that is what reserving space for bottom
 * chrome normally requires. The bar already folds the inset into its own gap,
 * so that double-counts the home indicator.
 *
 * The suite therefore asserts three separate things: the absolute pixel values
 * (so a change to the constants must be deliberate), the inset relationship (so
 * the double-count can never creep back in), and equality with the bar's own
 * rendered geometry (so the hook cannot drift from where the bar actually sits).
 */

// Mutated per test; must be `mock`-prefixed for the hoisted factory.
const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => mockInsets,
}));

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
];

/** A device with a home indicator (iPhone-class bottom inset). */
const HOME_INDICATOR_INSET = 34;

function ReservedProbe({ onValue }: { onValue: (space: number) => void }) {
  onValue(useTabBarReservedSpace());
  return null;
}

function withTheme(ui: React.ReactElement) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>
  );
}

/** The space the hook reserves on a device whose bottom inset is `inset`. */
function reservedFor(inset: number): number {
  mockInsets.bottom = inset;
  let space: number | undefined;
  render(withTheme(<ReservedProbe onValue={(value) => (space = value)} />));
  if (space === undefined) throw new Error('ReservedProbe never ran');
  return space;
}

function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.assign(out, value);
  };
  visit(style);
  return out;
}

/**
 * The flattened style of every styled node in the tree.
 *
 * Restricted to HOST nodes: the RN mock renders each component as a composite
 * wrapping a host element of the same name, and both carry the same `style`, so
 * counting all of them would double every match.
 */
function styledNodes(root: ReactTestInstance): Record<string, unknown>[] {
  return root
    .findAll((node) => typeof node.type === 'string' && node.props?.style !== undefined)
    .map((node) => flattenStyle(node.props.style));
}

describe('useTabBarReservedSpace', () => {
  beforeEach(() => {
    mockInsets.bottom = 0;
  });

  it('reserves the bar plus its gap where there is no bottom inset', () => {
    // 58pt bar + the 12pt floor the gap never goes below.
    expect(reservedFor(0)).toBe(70);
  });

  it('reserves more on a device with a home indicator', () => {
    expect(reservedFor(HOME_INDICATOR_INSET)).toBe(76);
  });

  it('already includes the inset — adding insets.bottom would double-count it', () => {
    // The bar absorbs 16pt of the inset into its own gap, so the space grows by
    // the REMAINDER, never by the whole inset. A consumer writing
    // `reserved + insets.bottom` would reserve 110pt for a 76pt bar.
    const grown = reservedFor(HOME_INDICATOR_INSET) - reservedFor(0);
    expect(grown).toBe(6);
    expect(grown).toBeLessThan(HOME_INDICATOR_INSET);
  });

  it('does not shrink below the floor for a small inset', () => {
    // An inset under what the gap absorbs must not pull the bar down toward the
    // window edge — the gap is clamped, and the reserved space with it.
    expect(reservedFor(8)).toBe(reservedFor(0));
  });

  it('equals the space the rendered bar actually occupies', () => {
    // The invariant that makes the hook worth exporting: its number is the bar's
    // own geometry (the gap it holds off the window edge plus its expanded
    // height), not a second copy that can drift.
    mockInsets.bottom = HOME_INDICATOR_INSET;
    let reserved: number | undefined;
    const { UNSAFE_root } = render(
      withTheme(
        <>
          <ReservedProbe onValue={(value) => (reserved = value)} />
          <TabBar activeIndex={0}>
            {ITEMS.map((item, index) => (
              <TabBarButton key={item.name} item={item} index={index} />
            ))}
          </TabBar>
        </>,
      ),
    );

    const styles = styledNodes(UNSAFE_root);
    // The wrapper holding the pill off the bottom edge — the only node with a
    // bottom margin.
    const gaps = styles.filter((style) => typeof style.marginBottom === 'number');
    expect(gaps).toHaveLength(1);
    // The pill itself: the animated capsule sizes BOTH its height and its
    // horizontal inset, which nothing else in the bar does.
    const pills = styles.filter(
      (style) => typeof style.height === 'number' && typeof style.marginHorizontal === 'number',
    );
    expect(pills).toHaveLength(1);

    expect(reserved).toBe(Number(gaps[0]?.marginBottom) + Number(pills[0]?.height));
  });
});
