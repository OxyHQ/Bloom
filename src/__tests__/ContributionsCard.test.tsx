import React from 'react';
import * as ReactNative from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { resolveButtonRamps } from '../button/shared';
import { ContributionsCard, ContributionsGrid } from '../chart-cards/ContributionsCard';
import {
  contributionCellIndex,
  contributionCellsFromDays,
  contributionLabel,
  contributionTier,
  hashContributionCell,
} from '../chart-cards/contributions-cells';
import { resolveChartCardPalette } from '../chart-cards/palette';

const STATS = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562.7M', label: 'Peak tokens' },
  { value: '12h 54m', label: 'Longest task' },
  { value: '62 days', label: 'Top streak' },
];
const CELLS = Array.from({ length: 37 * 7 }, (_, i) => ({ count: i % 30, date: `Day ${i}` }));

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('contribution cells', () => {
  it("bands counts into tiers: 0 · 1–4 · 5–9 · 10–15 · 16–24 · 25+", () => {
    expect([0, 1, 4, 5, 9, 10, 15, 16, 24, 25, 99].map((count) => contributionTier({ count }))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(contributionTier({ count: 0, tier: 4 })).toBe(4);
  });

  it("writes the tooltip copy", () => {
    expect(contributionLabel({ count: 0, date: 'Apr 26' })).toBe('No contributions on Apr 26');
    expect(contributionLabel({ count: 1, date: 'Apr 26' })).toBe('1 contribution on Apr 26');
    expect(contributionLabel({ count: 12 })).toBe('12 contributions');
  });

  it("keeps the cell hash, so the demo scatters identically", () => {
    // Seed buckets <6 · <11 · <15 · <18 · <19 · else → tiers 0–5. The real grid's first row starts 0, 0, 4 (violet-600).
    const tier = (row: number, col: number) => {
      const seed = hashContributionCell(row, col) % 20;
      return seed < 6 ? 0 : seed < 11 ? 1 : seed < 15 ? 2 : seed < 18 ? 3 : seed < 19 ? 4 : 5;
    };
    expect([tier(0, 0), tier(0, 1), tier(0, 2)]).toEqual([0, 0, 4]);
  });

  it('folds days into column-major slots over the year, Jan 1 first and Dec 31 last', () => {
    expect(contributionCellIndex(0, 37)).toBe(0);
    expect(contributionCellIndex(364, 37)).toBe(258);
    const cells = contributionCellsFromDays(
      [
        { date: '2025-01-01', count: 3 },
        { date: '2025-12-31', count: 2 },
        { date: '2024-06-01', count: 9 },
      ],
      2025,
    );
    expect(cells).toHaveLength(259);
    expect(cells[0]).toEqual({ count: 3, date: 'Jan 1' });
    expect(cells[258]).toEqual({ count: 2, date: 'Dec 31' });
    expect(cells.reduce((s, c) => s + c.count, 0)).toBe(5);
  });
});

describe('ContributionsCard', () => {
  beforeEach(() => {
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 1024, height: 768, scale: 2, fontScale: 1 });
  });
  afterEach(() => jest.restoreAllMocks());

  it("keeps the card: 337 tall, padding 16, radius 16, clipped", () => {
    const { getByTestId } = renderCard(<ContributionsCard testID="c" total={958} delta={0.148} stats={STATS} cells={CELLS} />);
    expect(resolvedStyle(getByTestId('c').props.style)).toMatchObject({
      height: 337,
      borderRadius: 16,
      overflow: 'hidden',
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
    });
  });

  it('goes auto-height with 13px cells in a horizontal scroller below sm', () => {
    (ReactNative.useWindowDimensions as jest.Mock).mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
    const { getByTestId } = renderCard(<ContributionsCard testID="c" total={958} stats={STATS} cells={CELLS} />);
    expect(resolvedStyle(getByTestId('c').props.style).height).toBeUndefined();
    expect(resolvedStyle(getByTestId('c-grid-cell-0').props.style)).toMatchObject({ width: 13, height: 13 });
  });

  it('reads the header, the chip, the stat cards, the period control and the months', () => {
    const { getByTestId, getByText } = renderCard(<ContributionsCard testID="c" total={958} delta={0.148} stats={STATS} cells={CELLS} />);
    expect(getByTestId('c-headline').props.children).toBe('958');
    for (const t of ['Contributions this year', '+14.8%', '9B', 'Top streak', 'Activity', 'Weekly', 'Monthly', 'Yearly', 'Jan', 'Dec']) {
      expect(getByText(t)).toBeTruthy();
    }
    expect(resolvedStyle(getByTestId('c-stat-0').props.style)).toMatchObject({
      borderRadius: 10,
      paddingTop: 10,
      paddingLeft: 10,
      boxShadow: '0 1px 1px 0 rgb(0 0 0 / 0.05)',
    });
    expect(resolvedStyle(getByTestId('c-stats').props.style)).toMatchObject({ marginLeft: -8, marginRight: -8 });
  });

  it('defaults the headline to the sum of the counts and lets a period override it', () => {
    const periods = [
      { id: 'weekly', label: 'Weekly' },
      { id: 'yearly', label: 'Yearly', total: 12000, delta: -0.05 },
    ];
    const onPeriodChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <ContributionsCard testID="c" cells={[{ count: 3 }, { count: 4 }]} periods={periods} onPeriodChange={onPeriodChange} />,
    );
    expect(getByTestId('c-headline').props.children).toBe('7');
    act(() => {
      fireEvent.press(getByTestId('c-period-yearly'));
    });
    expect(onPeriodChange).toHaveBeenCalledWith('yearly');
    expect(getByText('-5%')).toBeTruthy();
  });

  it('paints tiers from chart-neutral and the accent ramp — 200→700 light, 950→500 dark', () => {
    const cells = [0, 1, 5, 10, 16, 25].map((count) => ({ count }));
    const light = renderCard(<ContributionsGrid testID="g" cells={cells} columns={1} />);
    const lt = buildTheme('teal', 'light');
    const lr = resolveButtonRamps(lt).accent;
    expect([0, 1, 2, 3, 4, 5].map((i) => resolvedStyle(light.getByTestId(`g-cell-${i}`).props.style).backgroundColor)).toEqual([
      resolveChartCardPalette(lt).track, lr[200], lr[400], lr[500], lr[600], lr[700],
    ]);
    expect(resolvedStyle(light.getByTestId('g-cell-0').props.style)).toMatchObject({ borderRadius: 3, aspectRatio: 1 });
    light.unmount();
    const dark = renderCard(<ContributionsGrid testID="g" cells={cells} columns={1} />, 'dark');
    const dt = buildTheme('teal', 'dark');
    const dr = resolveButtonRamps(dt).accent;
    expect([1, 5].map((i) => resolvedStyle(dark.getByTestId(`g-cell-${i}`).props.style).backgroundColor)).toEqual([dr[950], dr[500]]);
  });

  it('names every cell and reports the hovered one', () => {
    const onActiveCellChange = jest.fn();
    const { getByTestId } = renderCard(<ContributionsGrid testID="g" cells={CELLS} onActiveCellChange={onActiveCellChange} />);
    const cell = getByTestId('g-cell-23');
    expect(cell.props.role).toBe('img');
    expect(cell.props.accessibilityLabel).toBe('23 contributions on Day 23');
    act(() => {
      fireEvent(cell, 'pointerEnter');
    });
    expect(onActiveCellChange).toHaveBeenLastCalledWith(23);
  });
});
