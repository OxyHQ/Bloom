import React from 'react';
import { act, render } from '@testing-library/react-native';

import { Fab } from '../fab';
import {
  BottomEdgeProvider,
  useBottomEdgeInset,
  useBottomEdgeLiveInset,
  useClaimBottomEdge,
} from '../layout/bottom-edge';
import { EDGE_GAP, windowEdgeGap } from '../layout/edge';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TabBar, TabBarButton, TabBarMinimizeProvider, setMinimized, useMinimizeState } from '../tab-bar';
import type { MinimizeState } from '../tab-bar/context';
import { EXPANDED_HEIGHT, MINIMIZED_HEIGHT } from '../tab-bar/shared';
import type { TabBarItem } from '../tab-bar/types';

/**
 * The bottom edge: how far a floating surface sits from it, and how two
 * surfaces that both want it stay off each other.
 *
 * Both halves exist because of the same shipped bug. Bloom answered "how far
 * from the edge" three different ways, and the tab bar's answer SUBTRACTED from
 * the safe-area inset — which parked it inside the band Android draws its
 * gesture handle in. Nothing answered "what is already there" at all, so the
 * `Fab` anchored itself 16px off the edge and landed behind that same bar, and
 * the app patched around Bloom instead (web only, leaving native broken).
 */

// Mutated per test; must be `mock`-prefixed for the hoisted factory.
const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => mockInsets,
}));

/** An Android device navigating by gestures — the band the handle is drawn in. */
const GESTURE_HANDLE_INSET = 24;
/** A device with a home indicator (iPhone-class bottom inset). */
const HOME_INDICATOR_INSET = 34;

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
];

describe('windowEdgeGap', () => {
  beforeEach(() => {
    mockInsets.bottom = 0;
  });

  it('clears the OS reserved band in full, never sitting inside it', () => {
    // The whole point. A surface inside the inset is a surface on top of a
    // system control — the gesture handle, the home indicator.
    expect(windowEdgeGap(GESTURE_HANDLE_INSET)).toBeGreaterThanOrEqual(GESTURE_HANDLE_INSET);
    expect(windowEdgeGap(HOME_INDICATOR_INSET)).toBeGreaterThanOrEqual(HOME_INDICATOR_INSET);
  });

  it('never lets a small inset pull a surface closer than a zero inset would', () => {
    // A device reporting 4dp must not end up TIGHTER than a browser reporting
    // nothing. `EDGE_GAP` is a floor for every caller, not a zero-inset special
    // case.
    expect(windowEdgeGap(0)).toBe(EDGE_GAP);
    expect(windowEdgeGap(4)).toBe(EDGE_GAP);
    expect(windowEdgeGap(EDGE_GAP)).toBe(EDGE_GAP);
  });

  it('treats gap as breathing room ON TOP of the band, never an allowance inside it', () => {
    // The inverted reading is exactly the bug: the tab bar used to spend its
    // number INSIDE the inset. A larger gap must move a surface further from the
    // affordance, monotonically — never closer.
    expect(windowEdgeGap(HOME_INDICATOR_INSET, 16)).toBe(HOME_INDICATOR_INSET + 16);
    expect(windowEdgeGap(HOME_INDICATOR_INSET, 8)).toBeGreaterThan(
      windowEdgeGap(HOME_INDICATOR_INSET, 0),
    );
  });

  it('reproduces the sheet and the toast it replaced, so only the tab bar moved', () => {
    // Detached sheet was `inset + 16`; the toast stack `inset > 0 ? inset + 8 : 16`.
    for (const inset of [0, GESTURE_HANDLE_INSET, HOME_INDICATOR_INSET]) {
      expect(windowEdgeGap(inset, 16)).toBe(inset + 16);
      expect(windowEdgeGap(inset, 8)).toBe(inset > 0 ? inset + 8 : 16);
    }
  });
});

function Probe({ onValue }: { onValue: (inset: number) => void }) {
  onValue(useBottomEdgeInset());
  return null;
}

function Claimant({ height, current }: { height: number; current?: number }) {
  useClaimBottomEdge(height, current);
  return null;
}

function BothProbe({ onValue }: { onValue: (v: { reserved: number; live: number }) => void }) {
  onValue({ reserved: useBottomEdgeInset(), live: useBottomEdgeLiveInset() });
  return null;
}

describe('the bottom-edge registry', () => {
  it('reports nothing claimed outside a provider', () => {
    // A surface must stay usable standalone rather than throwing.
    let seen: number | undefined;
    render(<Probe onValue={(v) => (seen = v)} />);
    expect(seen).toBe(0);
  });

  it('reports what a mounted surface claims', () => {
    const values: number[] = [];
    render(
      <BottomEdgeProvider>
        <Claimant height={74} />
        <Probe onValue={(v) => values.push(v)} />
      </BottomEdgeProvider>,
    );
    expect(values[values.length - 1]).toBe(74);
  });

  it('frees the edge when the surface unmounts', () => {
    const values: number[] = [];
    const ui = (withBar: boolean) => (
      <BottomEdgeProvider>
        {withBar ? <Claimant height={74} /> : null}
        <Probe onValue={(v) => values.push(v)} />
      </BottomEdgeProvider>
    );
    const { rerender } = render(ui(true));
    expect(values[values.length - 1]).toBe(74);
    rerender(ui(false));
    expect(values[values.length - 1]).toBe(0);
  });

  it('combines claims with MAX, not sum', () => {
    // Every claim is measured from the SAME window edge, so two surfaces there
    // overlap rather than stack. Summing would strand a reader at twice the
    // height, floating in the middle of the screen.
    const values: number[] = [];
    render(
      <BottomEdgeProvider>
        <Claimant height={74} />
        <Claimant height={40} />
        <Probe onValue={(v) => values.push(v)} />
      </BottomEdgeProvider>,
    );
    expect(values[values.length - 1]).toBe(74);
  });
});

describe('reserved vs live', () => {
  it('reports the same number for a surface that does not collapse', () => {
    const seen: { reserved: number; live: number }[] = [];
    render(
      <BottomEdgeProvider>
        <Claimant height={74} />
        <BothProbe onValue={(v) => seen.push(v)} />
      </BottomEdgeProvider>,
    );
    expect(seen[seen.length - 1]).toEqual({ reserved: 74, live: 74 });
  });

  it('keeps RESERVED at full size while LIVE follows the collapse', () => {
    // The distinction the two channels exist for. A list's bottom padding and a
    // toast read RESERVED, so neither jitters or jumps while the user scrolls;
    // only a surface sitting ON the edge reads LIVE.
    const seen: { reserved: number; live: number }[] = [];
    render(
      <BottomEdgeProvider>
        <Claimant height={74} current={60} />
        <BothProbe onValue={(v) => seen.push(v)} />
      </BottomEdgeProvider>,
    );
    expect(seen[seen.length - 1]).toEqual({ reserved: 74, live: 60 });
  });

  it('maxes the two channels independently', () => {
    // A tall collapsed surface and a short static one: each channel takes its own
    // maximum. Reading one max for both would report a live inset no surface has.
    const seen: { reserved: number; live: number }[] = [];
    render(
      <BottomEdgeProvider>
        <Claimant height={90} current={40} />
        <Claimant height={50} />
        <BothProbe onValue={(v) => seen.push(v)} />
      </BottomEdgeProvider>,
    );
    expect(seen[seen.length - 1]).toEqual({ reserved: 90, live: 50 });
  });
});

function flattenStyle(style: unknown): Record<string, number> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  return (style ?? {}) as Record<string, number>;
}

describe('a Fab beside a floating TabBar', () => {
  beforeEach(() => {
    mockInsets.bottom = GESTURE_HANDLE_INSET;
  });

  it('sits above the bar rather than behind it', () => {
    // THE REPORTED BUG. The bar's host is the last sibling of the app shell and
    // paints over every descendant, so no z-index could rescue the FAB — it has
    // to be somewhere ELSE. Asserted against the bar's real footprint rather
    // than a literal, so the two can never drift apart.
    const { getByTestId } = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <BottomEdgeProvider>
          <TabBar activeIndex={0} onIndexChange={() => {}}>
            {ITEMS.map((item, index) => (
              <TabBarButton key={item.name} item={item} index={index} />
            ))}
          </TabBar>
          <Fab testID="fab" onPress={() => {}} accessibilityLabel="Compose" icon={null} />
        </BottomEdgeProvider>
      </BloomThemeProvider>,
    );

    const barFootprint = windowEdgeGap(GESTURE_HANDLE_INSET) + EXPANDED_HEIGHT;
    const { bottom } = flattenStyle(getByTestId('fab').props.style);
    expect(bottom).toBeGreaterThanOrEqual(barFootprint);
  });
});

function MinimizeDriver({ onState }: { onState: (state: MinimizeState) => void }) {
  onState(useMinimizeState());
  return null;
}

describe('a collapsing TabBar', () => {
  beforeEach(() => {
    mockInsets.bottom = GESTURE_HANDLE_INSET;
  });

  it('shrinks what it occupies without giving up what it reserves', () => {
    // The bar minimizes 58 -> 44 on scroll, so a surface sitting on the edge
    // should ride down with it — while anything RESERVING space must keep room
    // for the full pill, because the bar re-expands the moment the user scrolls
    // back up. One number could not answer both.
    const seen: { reserved: number; live: number }[] = [];
    let state: MinimizeState | undefined;

    const { rerender } = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TabBarMinimizeProvider>
          <BottomEdgeProvider>
            <MinimizeDriver onState={(s) => (state = s)} />
            <TabBar activeIndex={0} onIndexChange={() => {}}>
              {ITEMS.map((item, index) => (
                <TabBarButton key={item.name} item={item} index={index} />
              ))}
            </TabBar>
            <BothProbe onValue={(v) => seen.push(v)} />
          </BottomEdgeProvider>
        </TabBarMinimizeProvider>
      </BloomThemeProvider>,
    );

    const gap = windowEdgeGap(GESTURE_HANDLE_INSET);
    expect(seen[seen.length - 1]).toEqual({
      reserved: gap + EXPANDED_HEIGHT,
      live: gap + EXPANDED_HEIGHT,
    });

    act(() => {
      setMinimized(state!, 1);
    });
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TabBarMinimizeProvider>
          <BottomEdgeProvider>
            <MinimizeDriver onState={(s) => (state = s)} />
            <TabBar activeIndex={0} onIndexChange={() => {}}>
              {ITEMS.map((item, index) => (
                <TabBarButton key={item.name} item={item} index={index} />
              ))}
            </TabBar>
            <BothProbe onValue={(v) => seen.push(v)} />
          </BottomEdgeProvider>
        </TabBarMinimizeProvider>
      </BloomThemeProvider>,
    );

    expect(seen[seen.length - 1]).toEqual({
      reserved: gap + EXPANDED_HEIGHT,
      live: gap + MINIMIZED_HEIGHT,
    });
    // The follow is exactly the pill's own shrink, so the FAB above it neither
    // lags behind nor overshoots into the bar.
    const last = seen[seen.length - 1]!;
    expect(last.reserved - last.live).toBe(EXPANDED_HEIGHT - MINIMIZED_HEIGHT);
  });
});
