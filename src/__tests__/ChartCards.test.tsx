import React from 'react';
import { quietText, quietTextOver } from '../styles/color-contrast';
import { AA_TEXT, AA_TEXT_STRONG } from '../styles/surface-levels';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { OrdersChartCard, RevenueChartCard } from '../chart-cards';
import type { ChartCardPoint } from '../chart-cards';
import {
  barPositions,
  bandSize,
  describeDelta,
  fixedDomainTicks,
  monotoneXPath,
  placeTicks,
  plotBox,
  pointX,
  topRoundedBarPath,
  yScale,
} from '../chart-cards/geometry';
import { resolveChartCardPalette } from '../chart-cards/palette';
import { mixColor, resolveButtonRamps } from '../button/shared';

const REVENUE: ChartCardPoint[] = [
  { label: 'Jan', current: 9840, previous: 8210 },
  { label: 'Feb', current: 10120, previous: 8460 },
  { label: 'Mar', current: 11380, previous: 9950 },
  { label: 'Apr', current: 10960, previous: 10240 },
  { label: 'May', current: 12210, previous: 10880 },
  { label: 'Jun', current: 12740, previous: 11020 },
  { label: 'Jul', current: 13980, previous: 11760 },
  { label: 'Aug', current: 13120, previous: 12030 },
  { label: 'Sep', current: 14210, previous: 12190 },
  { label: 'Oct', current: 14690, previous: 12480 },
  { label: 'Nov', current: 14360, previous: 12160 },
  { label: 'Dec', current: 14703.92, previous: 11924 },
];

const ORDERS: ChartCardPoint[] = [
  { label: 'Jan', current: 1680, previous: 1510 },
  { label: 'Feb', current: 1740, previous: 1480 },
  { label: 'Mar', current: 1920, previous: 1650 },
  { label: 'Apr', current: 1850, previous: 1620 },
  { label: 'May', current: 2040, previous: 1710 },
  { label: 'Jun', current: 2110, previous: 1760 },
  { label: 'Jul', current: 2290, previous: 1840 },
  { label: 'Aug', current: 2180, previous: 1890 },
  { label: 'Sep', current: 2320, previous: 1930 },
  { label: 'Oct', current: 2410, previous: 1970 },
  { label: 'Nov', current: 2280, previous: 1810 },
  { label: 'Dec', current: 2342, previous: 1798 },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The chart only draws once it has a size — recharts' `ResponsiveContainer`. */
function layoutPlot(getByTestId: (id: string) => unknown, id: string, width = 528, height = 216) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

describe('chart-cards geometry matches what recharts drew', () => {
  // Every expected number below was read off recharts 3.10's SVG for the
  // revenue / orders cards at 528×216 (the card's 344 height at 560 wide).
  const box = plotBox(528, 216, 44);

  it('lays the plot inside margin 4/6/0/0, a 44px Y axis and a 30px X axis', () => {
    expect(box).toEqual({ left: 44, top: 4, right: 522, bottom: 186 });
  });

  it('picks Y ticks with the adaptive step, then the domain max', () => {
    const max = 14703.92 * 1.1;
    const ticks = fixedDomainTicks(0, max, 4);
    expect(ticks.slice(0, 3)).toEqual([0, 5500, 11000]);
    expect(ticks[3]).toBeCloseTo(16174.312, 3);
    expect(ticks.map((t) => yScale(t, max, box))).toEqual([186, expect.closeTo(124.1117, 3), expect.closeTo(62.2235, 3), 4]);
    expect(fixedDomainTicks(0, 2410 * 1.1, 4)).toEqual([0, 900, 1800, 2651]);
  });

  it('pulls the edge labels inside the surface, like recharts', () => {
    const max = 14703.92 * 1.1;
    const y = placeTicks(
      fixedDomainTicks(0, max, 4).map((v) => ({ coordinate: yScale(v, max, box), size: 18 })),
      216,
      'preserveEnd',
    );
    expect(y.map((t) => t.tickCoord)).toEqual([186, expect.closeTo(124.1117, 3), expect.closeTo(62.2235, 3), 9]);

    const x = placeTicks(
      REVENUE.map((_, i) => ({ coordinate: pointX(i, 12, box), size: 25.16 })),
      528,
      'preserveStartEnd',
    );
    expect(x).toHaveLength(12);
    expect(x[0]!.tickCoord).toBe(44);
    expect(x[11]!.tickCoord).toBeCloseTo(515.42, 2);

    // At a phone's width, labels that would collide are dropped — the first and
    // the last always survive.
    const narrow = plotBox(288, 146, 44);
    const thinned = placeTicks(
      REVENUE.map((_, i) => ({ coordinate: pointX(i, 12, narrow), size: 25 })),
      288,
      'preserveStartEnd',
    );
    expect(thinned.length).toBeLessThan(12);
    expect(thinned[0]!.index).toBe(0);
    expect(thinned[thinned.length - 1]!.index).toBe(11);
  });

  it("draws d3's monotone-X curve, point for point", () => {
    const max = 14703.92 * 1.1;
    const d = monotoneXPath(REVENUE.map((p, i) => ({ x: pointX(i, 12, box), y: yScale(p.current, max, box) })));
    expect(d.startsWith(
      'M44,75.276C58.485,74.751,72.97,74.226,87.455,72.126C101.939,70.025,116.424,57.948,130.909,57.948' +
        'C145.394,57.948,159.879,62.674,174.364,62.674C188.848,62.674,203.333,51.946,217.818,48.608' +
        'C232.303,45.27,246.788,45.964,261.273,42.644C275.758,39.325,290.242,28.691,304.727,28.691',
    )).toBe(true);
  });

  it('sizes paired bars like recharts: 28% category gap, 3px apart, whole-pixel width', () => {
    const orders = plotBox(528, 216, 40);
    const band = bandSize(12, orders);
    expect(band).toBeCloseTo(40.1667, 4);
    const [prev, curr] = barPositions(band, 2, 0.28, 3);
    expect(prev!.offset).toBeCloseTo(11.2467, 4);
    expect(prev!.size).toBe(7);
    expect(curr!.offset).toBeCloseTo(21.2467, 4);
    // radius 4 is clamped to half the 7px bar.
    expect(topRoundedBarPath(51.2467, 82.3335, 7, 103.6665, 4)).toBe(
      'M51.2467,85.8335A3.5,3.5,0,0,1,54.7467,82.3335L54.7467,82.3335A3.5,3.5,0,0,1,58.2467,85.8335L58.2467,186L51.2467,186Z',
    );
  });

  it('formats the delta: one decimal, a plus on a rise, New without a baseline', () => {
    expect(describeDelta(13980, 11760)).toEqual({ label: '+18.9%', tone: 'positive' });
    expect(describeDelta(11760, 13980)).toEqual({ label: '-15.9%', tone: 'negative' });
    expect(describeDelta(10, 10)).toEqual({ label: '0%', tone: 'neutral' });
    expect(describeDelta(10, 0)).toEqual({ label: 'New', tone: 'neutral' });
  });
});

describe('RevenueChartCard', () => {
  it('keeps the card at 344 tall, radius 16, padding 16/16/12 in longhands, gap 24', () => {
    const { getByTestId } = renderCard(<RevenueChartCard testID="rev" data={REVENUE} />);
    const card = resolvedStyle(getByTestId('rev').props.style);
    expect(card).toMatchObject({
      height: 344,
      borderRadius: 16,
      gap: 24,
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 12,
    });
    expect(card.paddingHorizontal).toBeUndefined();
  });

  it('reads the year total, its delta and last year, with the legend', () => {
    const { getByText, getByTestId } = renderCard(<RevenueChartCard testID="rev" data={REVENUE} />);
    expect(getByText('Revenue')).toBeTruthy();
    expect(getByTestId('rev-headline').props.children).toBe('$152,314');
    expect(getByText('+16%')).toBeTruthy();
    expect(getByText('$131,304 last year')).toBeTruthy();
    expect(getByText('This year')).toBeTruthy();
    expect(getByText('Last year')).toBeTruthy();
  });

  it('swaps the headline for a hovered month (controlled)', () => {
    const { getByText, getByTestId } = renderCard(<RevenueChartCard testID="rev" data={REVENUE} activeIndex={6} />);
    expect(getByText('July')).toBeTruthy();
    expect(getByTestId('rev-headline').props.children).toBe('$13,980');
    expect(getByText('+18.9%')).toBeTruthy();
    expect(getByText('$11,760 a year earlier')).toBeTruthy();
  });

  it('tracks the nearest month under the pointer inside the plot, and clears on leave', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <RevenueChartCard testID="rev" data={REVENUE} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId, 'rev-plot');
    const surface = getByTestId('rev-plot-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toBe('Revenue chart: this year against last year');

    // Jul sits at x 304.7; 300 is nearest to it.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 300, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(6);
    expect(getByText('July')).toBeTruthy();

    // Over the Y axis (outside the plot) the last month stays, as in recharts.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 10, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    expect(getByText('Revenue')).toBeTruthy();
  });

  it('scrubs with a finger on native and clears on release', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId } = renderCard(
      <RevenueChartCard testID="rev" data={REVENUE} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId, 'rev-plot');
    const surface = getByTestId('rev-plot-surface');
    act(() => {
      fireEvent(surface, 'responderGrant', { nativeEvent: { locationX: 44, locationY: 50 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(0);
    act(() => {
      fireEvent(surface, 'responderMove', { nativeEvent: { locationX: 520, locationY: 50 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(11);
    act(() => {
      fireEvent(surface, 'responderRelease');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('draws the Y ticks through the axis formatter', () => {
    const { getByTestId, getByText } = renderCard(<RevenueChartCard testID="rev" data={REVENUE} />);
    layoutPlot(getByTestId, 'rev-plot');
    for (const label of ['$0', '$6k', '$11k', '$16k']) expect(getByText(label)).toBeTruthy();
  });

  it('paints a falling year with the rose status pair and a flat one neutral', () => {
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    const declining = REVENUE.map((p) => ({ label: p.label, current: p.previous, previous: p.current }));
    const { getByTestId, getByText, rerender } = renderCard(<RevenueChartCard testID="rev" data={declining} />);
    expect(getByText('-13.8%')).toBeTruthy();
    expect(resolvedStyle(getByTestId('rev-delta').props.style).backgroundColor).toBe(palette.negative.background);

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <RevenueChartCard testID="rev" data={REVENUE.map((p) => ({ ...p, previous: p.current }))} />
      </BloomThemeProvider>,
    );
    expect(getByText('0%')).toBeTruthy();
    expect(resolvedStyle(getByTestId('rev-delta').props.style).backgroundColor).toBe(palette.neutral.background);
  });
});

describe('OrdersChartCard', () => {
  it('reads the orders total with count formatting', () => {
    const { getByTestId, getByText } = renderCard(<OrdersChartCard testID="ord" data={ORDERS} />);
    expect(getByText('Orders')).toBeTruthy();
    expect(getByTestId('ord-headline').props.children).toBe('25,162');
    expect(getByText('+20%')).toBeTruthy();
    expect(getByText('20,968 last year')).toBeTruthy();
  });

  it('picks the band under the pointer and formats counts on the axis', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <OrdersChartCard testID="ord" data={ORDERS} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId, 'ord-plot');
    for (const label of ['0', '900', '1.8k', '2.7k']) expect(getByText(label)).toBeTruthy();
    // Band 6 (Jul) spans 281..321.2 at 528 wide.
    act(() => {
      fireEvent(getByTestId('ord-plot-surface'), 'pointerMove', { nativeEvent: { offsetX: 320, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(6);
    expect(getByText('July')).toBeTruthy();
    expect(getByText('1,840 a year earlier')).toBeTruthy();
  });
});

describe('chart card palette', () => {
  it('maps the chart tokens onto the neutral ramp in both modes', () => {
    const light = buildTheme('teal', 'light');
    const dark = buildTheme('teal', 'dark');
    const nl = resolveButtonRamps(light).neutral;
    const nd = resolveButtonRamps(dark).neutral;
    expect(resolveChartCardPalette(light)).toMatchObject({
      surface: nl[100],
      neutralSeries: nl[300],
      cursor: nl[300],
      track: nl[200],
    });
    const p = resolveChartCardPalette(dark);
    expect(p).toMatchObject({
      surface: nd[900],
      neutralSeries: nd[800],
      cursor: nd[700],
      track: nd[800],
      neutral: { background: nd[800] },
    });
    // The two quiet TEXT rungs are not ramp stops any more: they are read off the
    // card's own fill, because a stop chosen against the page measured 2.42:1
    // here. `chart-card-contrast.test.ts` walks every preset; this pins the
    // mechanism — the rung moves when the SURFACE moves.
    for (const [theme, palette] of [[light, resolveChartCardPalette(light)], [dark, p]] as const) {
      // Floored over the card AND the stat tiles inset into it — in dark those
      // two sit on opposite sides of the text, so one of them is not enough.
      const fills = [palette.surface, palette.inner];
      expect(palette.textSecondary).toBe(quietTextOver(fills, theme.colors.text, AA_TEXT_STRONG));
      expect(palette.textTertiary).toBe(quietTextOver(fills, theme.colors.text, AA_TEXT));
      expect(palette.neutral.foreground).toBe(
        quietText(palette.neutral.background, theme.colors.text, AA_TEXT),
      );
    }

    // Dark status fills are the 950 stop at 60% over the card, not a translucent string.
    expect(p.positive.background).toMatch(/^rgb\(/);
    expect(p.positive.background).not.toBe(mixColor(p.surface, p.surface, 0.6));
  });
});
