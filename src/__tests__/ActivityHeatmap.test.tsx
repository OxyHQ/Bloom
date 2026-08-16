/**
 * The heatmap's whole job is a MAPPING — days to counts, counts to colors — and
 * both halves fail silently. A grid of squares looks correct whatever colour
 * each square ended up; a day bucketed into the wrong UTC date shifts a whole
 * contribution graph by one column and nothing errors.
 *
 * So the assertions here are all about which cell got which colour, addressed by
 * the accessibility label the component already gives every populated cell
 * (`YYYY-MM-DD: N`), and about `bucketByDay`, which is the pure half a consumer
 * calls before the component ever renders.
 *
 * TWO PROPERTIES ARE NOT WHAT A READER EXPECTS, and both are asserted on
 * purpose:
 *   - the scale is ABSOLUTE, not normalised over the series, so a single-value
 *     series does not paint itself the darkest shade;
 *   - a date-prefixed STRING is sliced rather than parsed, so it never shifts
 *     timezone, while a `Date` for the same instant is read in UTC and can land
 *     on the next day. The two are asserted against each other, so the test can
 *     tell them apart rather than agreeing with whichever it is handed.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { ActivityHeatmap, bucketByDay } from '../activity-heatmap';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { withAlpha } from '../theme/color-utils';
import type { ActivityHeatmapProps } from '../activity-heatmap';
import type { ThemeColors } from '../theme/types';
import { hostNodes, resolvedStyle } from './support/rendered-style';

/** Sentinel colours: five distinguishable strings, so a level is unambiguous. */
const SCALE = ['L0', 'L1', 'L2', 'L3', 'L4'];
const EMPTY = 'EMPTY';

/** A day the grid ends on, so nothing here depends on the system clock. */
const END = '2026-03-14';

interface Cell {
  date: string;
  count: number;
  color: unknown;
}

/**
 * Every populated cell the grid rendered, read back off its own label.
 *
 * `onPressDay` is supplied here rather than per test because it is what makes a
 * cell a `Pressable` carrying `"<date>: <count>"` — without it the grid is a
 * wall of anonymous `View`s and there is no way to address one at all.
 */
function cells(props: ActivityHeatmapProps): Cell[] {
  const tree = render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <ActivityHeatmap {...props} onPressDay={() => undefined} />
    </BloomThemeProvider>,
  ).toJSON();
  const out: Cell[] = [];
  for (const node of hostNodes(tree)) {
    const label = node.props.accessibilityLabel;
    if (typeof label !== 'string') continue;
    const match = /^(\d{4}-\d{2}-\d{2}): (\d+)$/.exec(label);
    if (match === null) continue;
    out.push({
      date: match[1] ?? '',
      count: Number(match[2]),
      color: resolvedStyle(node.props.style).backgroundColor,
    });
  }
  return out;
}

function colorOf(rendered: Cell[], date: string): unknown {
  const cell = rendered.find((entry) => entry.date === date);
  if (cell === undefined) throw new Error(`no cell rendered for ${date}`);
  return cell.color;
}

/** The counts used by the level assertions, one per interesting threshold. */
const DATA = [
  { date: '2026-03-08', count: 1 },
  { date: '2026-03-09', count: 2 },
  { date: '2026-03-10', count: 3 },
  { date: '2026-03-11', count: 6 },
  { date: '2026-03-12', count: 10 },
  { date: '2026-03-13', count: 99 },
  // 2026-03-14 is deliberately absent: a day with no entry is count 0.
];

describe('bucketByDay', () => {
  it('counts items per UTC day and returns them in date order', () => {
    const items = [
      { at: '2026-03-09T10:00:00Z' },
      { at: '2026-03-07T23:00:00Z' },
      { at: '2026-03-09T23:59:59Z' },
      { at: '2026-03-08T00:00:00Z' },
    ];
    expect(bucketByDay(items, (item) => item.at)).toEqual([
      { date: '2026-03-07', count: 1 },
      { date: '2026-03-08', count: 1 },
      { date: '2026-03-09', count: 2 },
    ]);
  });

  it('slices a date-prefixed string instead of parsing it, so it cannot shift a day', () => {
    // The same instant, two ways in. The STRING keeps the date its author wrote;
    // the `Date` is read in UTC and lands on the next day. Asserting both is what
    // makes this a measurement rather than a restatement: a slice that silently
    // became a parse would make the two agree.
    const instant = '2026-03-01T23:30:00-05:00';
    expect(bucketByDay([{ at: instant }], (item) => item.at)).toEqual([
      { date: '2026-03-01', count: 1 },
    ]);
    expect(bucketByDay([{ at: new Date(instant) }], (item) => item.at)).toEqual([
      { date: '2026-03-02', count: 1 },
    ]);
  });

  it('skips what it cannot parse, and answers an empty series with an empty list', () => {
    expect(
      bucketByDay(
        [{ at: 'not a date' }, { at: new Date(Number.NaN) }, { at: '2026-03-09T10:00:00Z' }],
        (item) => item.at,
      ),
    ).toEqual([{ date: '2026-03-09', count: 1 }]);
    expect(bucketByDay([], (item: { at: string }) => item.at)).toEqual([]);
  });
});

describe('ActivityHeatmap bucketing', () => {
  it('colours a day by how many thresholds its count meets', () => {
    const rendered = cells({
      data: DATA,
      endDate: END,
      numDays: 7,
      levels: [1, 3, 6, 10],
      colorScale: SCALE,
      emptyColor: EMPTY,
    });
    // Zero is not level 0 — it is the empty colour, which is why the scale can
    // be read as "activity" rather than "the faintest activity".
    expect(colorOf(rendered, '2026-03-14')).toBe(EMPTY);
    expect(colorOf(rendered, '2026-03-08')).toBe('L1');
    // Between two thresholds: still the lower level.
    expect(colorOf(rendered, '2026-03-09')).toBe('L1');
    expect(colorOf(rendered, '2026-03-10')).toBe('L2');
    expect(colorOf(rendered, '2026-03-11')).toBe('L3');
    expect(colorOf(rendered, '2026-03-12')).toBe('L4');
    // Past the top threshold: still the last level, not a level 5 that does not
    // exist.
    expect(colorOf(rendered, '2026-03-13')).toBe('L4');
  });

  it('clamps a level the colour scale is too short for, instead of drawing a blank', () => {
    // More thresholds than colours is the caller's business — three shades over
    // four thresholds is a legitimate palette. Unclamped, `scale[4]` is
    // `undefined` and the `?? empty` fallback then paints the BUSIEST days with
    // the zero-activity colour: the graph reads as inactivity exactly where the
    // activity is.
    const rendered = cells({
      data: DATA,
      endDate: END,
      numDays: 7,
      levels: [1, 3, 6, 10],
      colorScale: ['L0', 'L1', 'L2'],
      emptyColor: EMPTY,
    });
    expect(colorOf(rendered, '2026-03-10')).toBe('L2');
    expect(colorOf(rendered, '2026-03-12')).toBe('L2');
    expect(colorOf(rendered, '2026-03-13')).toBe('L2');
  });

  it('sorts the thresholds it was given, so an unordered `levels` still maps correctly', () => {
    const rendered = cells({
      data: DATA,
      endDate: END,
      numDays: 7,
      levels: [10, 1, 6, 3],
      colorScale: SCALE,
      emptyColor: EMPTY,
    });
    expect(colorOf(rendered, '2026-03-08')).toBe('L1');
    expect(colorOf(rendered, '2026-03-10')).toBe('L2');
    expect(colorOf(rendered, '2026-03-11')).toBe('L3');
    expect(colorOf(rendered, '2026-03-12')).toBe('L4');
  });

  it('sums several entries for one day rather than keeping the last', () => {
    const rendered = cells({
      data: [
        { date: '2026-03-10', count: 1 },
        { date: '2026-03-10', count: 2 },
      ],
      endDate: END,
      numDays: 7,
      levels: [1, 3, 6, 10],
      colorScale: SCALE,
      emptyColor: EMPTY,
    });
    const singleEntry = cells({
      data: [{ date: '2026-03-10', count: 3 }],
      endDate: END,
      numDays: 7,
      levels: [1, 3, 6, 10],
      colorScale: SCALE,
      emptyColor: EMPTY,
    });
    // 1 + 2 crosses the second threshold; the last-write-wins bug would leave it
    // at 2 and one level down.
    expect(rendered.find((entry) => entry.date === '2026-03-10')?.count).toBe(3);
    expect(colorOf(rendered, '2026-03-10')).toBe('L2');
    expect(colorOf(singleEntry, '2026-03-10')).toBe('L2');
  });

  it('does not normalise a single-value series — the scale is absolute', () => {
    // The interesting degenerate case: one day, so min === max. A relative scale
    // would paint that day the darkest shade in the palette by construction,
    // which reads as "your busiest day ever" for a single event. This one asks
    // only which thresholds a count of 2 meets.
    const rendered = cells({
      data: [{ date: '2026-03-10', count: 2 }],
      levels: [1, 3, 6, 10],
      numDays: 7,
      colorScale: SCALE,
      emptyColor: EMPTY,
    });
    expect(colorOf(rendered, '2026-03-10')).toBe('L1');
    // With no `endDate` the grid anchors on the latest day in the data — the
    // component never reads the system clock — so nothing after it is drawn.
    expect(rendered.every((entry) => entry.date <= '2026-03-10')).toBe(true);
    expect(rendered.some((entry) => entry.date === '2026-03-10')).toBe(true);
  });

  it('draws nothing for an empty series, and that zero is not the query failing', () => {
    // An empty series with no `endDate` has no anchor at all, so there is no grid
    // to draw. The control beside it is in the same currency: the same empty
    // series WITH an anchor renders a full window of zero-count cells, so "no
    // cells" above means the component drew none, not that the walk found none.
    expect(cells({ data: [], numDays: 7 })).toHaveLength(0);

    const anchored = cells({
      data: [],
      endDate: END,
      numDays: 7,
      colorScale: SCALE,
      emptyColor: EMPTY,
    });
    expect(anchored.length).toBeGreaterThanOrEqual(7);
    expect(anchored.every((entry) => entry.count === 0 && entry.color === EMPTY)).toBe(true);
    // The grid ends where it was told to, never later.
    const dates = anchored.map((entry) => entry.date).sort();
    expect(dates[dates.length - 1]).toBe(END);
  });

  it('paints every step of its default palette, and no step it cannot reach', () => {
    // The palette and the thresholds are ONE decision in two lists: a level is
    // the number of thresholds a count meets, so N thresholds address indices
    // `0..N` and the scale needs `N + 1` colours. The faintest colour is the one
    // that goes dead when they drift apart — it means "positive, but below the
    // first threshold", so a first threshold of 1 makes it unreachable, which is
    // what the defaults did while `DEFAULT_ALPHAS` had a fifth step at 0.16.
    //
    // Asserted as an EQUALITY of the whole set rather than a floor, because both
    // failure directions are silent: a colour nothing can reach and a threshold
    // whose bucket has been merged into its neighbour both render a heatmap that
    // looks perfectly fine.
    const colors = captureThemeColors();
    const rendered = cells({ data: DATA, endDate: END, numDays: 7 });
    const used = new Set(rendered.filter((entry) => entry.count > 0).map((entry) => entry.color));
    expect(used).toEqual(
      new Set([0.32, 0.52, 0.75, 1].map((alpha) => withAlpha(colors.primary, alpha))),
    );

    // …and the counts land in the buckets those four colours are FOR, which is
    // the half the set alone cannot see: four colours all still appear if two
    // thresholds swap. `DATA` carries one day per boundary (1, 2, 3, 6, 10, 99).
    expect(colorOf(rendered, '2026-03-08')).toBe(withAlpha(colors.primary, 0.32)); // 1
    expect(colorOf(rendered, '2026-03-09')).toBe(withAlpha(colors.primary, 0.32)); // 2
    expect(colorOf(rendered, '2026-03-10')).toBe(withAlpha(colors.primary, 0.52)); // 3
    expect(colorOf(rendered, '2026-03-11')).toBe(withAlpha(colors.primary, 0.75)); // 6
    expect(colorOf(rendered, '2026-03-12')).toBe(withAlpha(colors.primary, 1)); // 10
    expect(colorOf(rendered, '2026-03-13')).toBe(withAlpha(colors.primary, 1)); // 99
    // Zero is still the empty colour, not the faintest step.
    expect(colorOf(rendered, '2026-03-14')).toBe(colors.backgroundSecondary);
  });
});

/** The resolved palette the component renders against, read from the provider. */
function captureThemeColors(): ThemeColors {
  let captured: ThemeColors | null = null;
  function Probe(): null {
    captured = useTheme().colors;
    return null;
  }
  render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <Probe />
    </BloomThemeProvider>,
  );
  if (captured === null) throw new Error('theme probe never rendered');
  return captured;
}
