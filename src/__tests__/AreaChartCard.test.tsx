import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { AreaChartCard, ChartLegend, ChartStatTiles } from '../chart-cards';
import type { AreaPoint, AreaRange, AreaSeries } from '../chart-cards';
import { areaBandPath, niceTicks, plotBox, pointX, scaleY, stackSeries } from '../chart-cards/geometry';
import { chartHueTone, resolveChartCardPalette, resolveTone } from '../chart-cards/palette';
import { compactNumber, describeDeltaRatio, formatNumber, percentTick } from '../chart-cards/primitives/format';
import { resolveButtonRamps } from '../button/shared';
import type { Theme } from '../theme/types';

// The demo year used for these fixtures. Every expected pixel below was
// read off recharts 3.10's SVG for that card at 480 wide (448 × 189 plot).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ORGANIC = [2400, 2800, 3200, 3000, 3600, 4200, 4600, 4400, 5100, 5600, 5400, 6200];
const REFERRAL = [1200, 1400, 1300, 1700, 1900, 1800, 2200, 2500, 2400, 2900, 3200, 3400];
const PAID = [800, 700, 1100, 900, 1300, 1500, 1400, 1800, 2000, 1900, 2300, 2600];
const DATA: AreaPoint[] = MONTHS.map((label, i) => ({
  label,
  organic: ORGANIC[i]!,
  referral: REFERRAL[i]!,
  paid: PAID[i]!,
}));
const SERIES: AreaSeries[] = [
  { key: 'organic', label: 'Organic' },
  { key: 'referral', label: 'Referral' },
  { key: 'paid', label: 'Paid' },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown, id: string, width = 448, height = 189) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

describe('area chart geometry matches recharts', () => {
  const box = plotBox(448, 189, 44);

  it("picks recharts' nice ticks for an auto domain", () => {
    expect(niceTicks(0, 12200, 4)).toEqual([0, 4500, 9000, 13500]);
    expect(niceTicks(0, 6200, 4)).toEqual([0, 2500, 5000, 7500]);
    expect(niceTicks(0, 432, 4)).toEqual([0, 150, 300, 450]);
    expect(niceTicks(0, 0, 4)).toEqual([0, 1, 2, 3]);
  });

  it('stacks bottom-up, and expands to shares for the 100% chart', () => {
    const [organic, referral, paid] = stackSeries([ORGANIC, REFERRAL, PAID]);
    expect(organic!.lower[11]).toBe(0);
    expect(referral!.lower[11]).toBe(6200);
    expect(paid!.upper[11]).toBe(12200);
    const expanded = stackSeries([ORGANIC, REFERRAL, PAID], 'expand');
    expect(expanded[2]!.upper.every((v) => Math.abs(v - 1) < 1e-9)).toBe(true);
    expect(stackSeries([[0], [0]], 'expand')[1]!.upper).toEqual([0]);
  });

  it('draws a stacked band exactly as recharts: top curve, drop, base curve back', () => {
    const domain = [0, 13500] as const;
    const [, referral] = stackSeries([ORGANIC, REFERRAL, PAID]);
    const pts = (values: number[]) => values.map((v, i) => ({ x: pointX(i, 12, box), y: scaleY(v, domain, box) }));
    expect(areaBandPath(pts(referral!.upper), pts(referral!.lower))).toBe(
      'M44,117.667C56.061,115.083,68.121,112.5,80.182,110.778C92.242,109.056,104.303,108.29,116.364,107.333C128.424,106.377,140.485,106.568,152.545,105.037C164.606,103.506,176.667,98.34,188.727,95.852C200.788,93.364,212.848,92.599,224.909,90.111C236.97,87.623,249.03,81.691,261.091,80.926C273.152,80.16,285.212,80.543,297.273,79.778C309.333,79.012,321.394,75.951,333.455,72.889C345.515,69.827,357.576,62.173,369.636,61.407C381.697,60.642,393.758,61.025,405.818,60.259C417.879,59.494,429.939,54.136,442,48.778' +
        'L442,87.815C429.939,92.407,417.879,97,405.818,97C393.758,97,381.697,94.704,369.636,94.704C357.576,94.704,345.515,98.148,333.455,100.444C321.394,102.741,309.333,108.481,297.273,108.481C285.212,108.481,273.152,106.185,261.091,106.185C249.03,106.185,236.97,108.864,224.909,110.778C212.848,112.691,200.788,115.37,188.727,117.667C176.667,119.963,164.606,124.556,152.545,124.556C140.485,124.556,128.424,122.259,116.364,122.259C104.303,122.259,92.242,125.321,80.182,126.852C68.121,128.383,56.061,129.914,44,131.444Z',
    );
  });

  it('draws the sharp 100% band with straight segments', () => {
    const [, , paid] = stackSeries([ORGANIC, REFERRAL, PAID], 'expand');
    const pts = (values: number[]) => values.map((v, i) => ({ x: pointX(i, 12, box), y: scaleY(v, [0, 1], box) }));
    expect(areaBandPath(pts(paid!.upper), pts(paid!.lower), 'linear')).toBe(
      'M44,4L80.182,4L116.364,4L152.545,4L188.727,4L224.909,4L261.091,4L297.273,4L333.455,4L369.636,4L405.818,4L442,4' +
        'L442,37.033L405.818,36.706L369.636,32.317L333.455,36.632L297.273,36.069L261.091,30.463L224.909,35L188.727,33.632L152.545,28.911L116.364,34.446L80.182,26.143L44,32.182Z',
    );
  });
});

describe('chart card formatting', () => {
  it('formats chart-card values consistently', () => {
    expect(describeDeltaRatio(0.082)).toEqual({ label: '+8.2%', tone: 'positive' });
    expect(describeDeltaRatio(-0.036)).toEqual({ label: '-3.6%', tone: 'negative' });
    expect(describeDeltaRatio(0.0001)).toEqual({ label: '0.0%', tone: 'neutral' });
    expect(compactNumber(4500)).toBe('4.5K');
    expect(compactNumber(9000)).toBe('9K');
    expect(compactNumber(450)).toBe('450');
    expect(percentTick(0.75)).toBe('75%');
    expect(formatNumber(94700)).toBe('94,700');
    expect(formatNumber(48.8)).toBe('48.8');
    expect(formatNumber(-1234.5)).toBe('-1,234.5');
  });
});

describe('chart series tones', () => {
  const withPrimary = (primary: string): Theme => {
    const theme = buildTheme('teal', 'light');
    return { ...theme, colors: { ...theme.colors, primary } };
  };
  const channels = (rgb: string) => (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);

  it('reproduces the expected hues exactly on a Tailwind blue-500 primary', () => {
    // blue-500 #2b7fff → lime-400 #9ae600, blue-400 #51a2ff, purple-400 #c27aff.
    const theme = withPrimary('rgb(43, 127, 255)');
    const near = (actual: string, expected: number[]) =>
      channels(actual).forEach((c, i) => expect(Math.abs(c - expected[i]!)).toBeLessThanOrEqual(6));
    near(chartHueTone(theme, 2).color, [154, 230, 0]);
    near(chartHueTone(theme, 6).color, [81, 162, 255]);
    near(chartHueTone(theme, 5).color, [194, 122, 255]);
  });

  it('lets an explicit colour win, darkening it for the hover step', () => {
    const tones = [{ color: 'rgb(1 2 3)', activeColor: 'rgb(4 5 6)' }];
    expect(resolveTone(tones, 3)).toBe(tones[0]);
    expect(resolveTone(tones, 0, 'rgb(200 100 50)')).toEqual({ color: 'rgb(200 100 50)', activeColor: 'rgb(164 82 41)' });
    expect(resolveTone(tones, 0, 'rgb(200 100 50)', 'red')).toEqual({ color: 'rgb(200 100 50)', activeColor: 'red' });
  });
});

describe('AreaChartCard', () => {
  it('keeps the card: 329 tall, radius 16, padding 16/16/12 in longhands, gap 16', () => {
    const { getByTestId } = renderCard(<AreaChartCard testID="area" data={DATA} series={SERIES} />);
    expect(resolvedStyle(getByTestId('area').props.style)).toMatchObject({
      height: 329,
      borderRadius: 16,
      gap: 16,
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 12,
    });
  });

  it('reads the stacked total, the delta chip and each series total in the legend', () => {
    const { getByTestId, getByText } = renderCard(
      <AreaChartCard testID="area" data={DATA} series={SERIES} delta={0.082} range="Jan – Dec 2024" />,
    );
    expect(getByTestId('area-headline').props.children).toBe('94,700');
    expect(getByText('+8.2%')).toBeTruthy();
    expect(getByText('Visitors')).toBeTruthy();
    expect(getByText('Jan – Dec 2024')).toBeTruthy();
    for (const text of ['Organic', '50,500', 'Referral', '25,900', 'Paid', '18,300']) expect(getByText(text)).toBeTruthy();
  });

  it('headlines the first series in overlap, and an explicit headline everywhere', () => {
    const overlap = renderCard(<AreaChartCard testID="area" variant="overlap" data={DATA} series={SERIES} />);
    expect(overlap.getByTestId('area-headline').props.children).toBe('50,500');
    overlap.unmount();
    const fixed = renderCard(<AreaChartCard testID="area" data={DATA} series={SERIES} headline={1234} />);
    expect(fixed.getByTestId('area-headline').props.children).toBe('1,234');
  });

  it('swaps header, legend and hides the chip for a hovered month (controlled)', () => {
    const { getByTestId, getByText } = renderCard(
      <AreaChartCard testID="area" data={DATA} series={SERIES} delta={0.082} activeIndex={6} />,
    );
    expect(getByText('Jul')).toBeTruthy();
    expect(getByTestId('area-headline').props.children).toBe('8,200');
    for (const text of ['4,600', '2,200', '1,400']) expect(getByText(text)).toBeTruthy();
    // Hidden but still laid out, so the header does not reflow under the pointer.
    let wrap = getByTestId('area-delta', { includeHiddenElements: true }).parent;
    while (wrap && wrap.props.accessibilityElementsHidden === undefined) wrap = wrap.parent;
    expect(wrap?.props.accessibilityElementsHidden).toBe(true);
    expect(resolvedStyle(wrap?.props.style).opacity).toBe(0);
  });

  it('draws the nice Y ticks, the grid, the cursor and one active dot per series', () => {
    const { getByTestId, getByText, UNSAFE_getAllByType } = renderCard(
      <AreaChartCard testID="area" data={DATA} series={SERIES} activeIndex={6} />,
    );
    layoutPlot(getByTestId, 'area-plot');
    for (const label of ['0', '4.5K', '9K', '13.5K']) expect(getByText(label)).toBeTruthy();
    const all = UNSAFE_getAllByType('Line' as never) as unknown as { props: Record<string, unknown> }[];
    const grid = all.filter((l) => l.props.x1 === 44 && l.props.x2 === 442);
    expect(grid.map((l) => l.props.y1)).toEqual([159, expect.closeTo(107.333, 3), expect.closeTo(55.667, 3), 4]);
    expect(grid.every((l) => l.props.strokeDasharray === '4 4')).toBe(true);
    const cursor = all.find((l) => l.props.y1 === 4 && l.props.y2 === 159);
    expect(cursor?.props.x1).toBeCloseTo(261.091, 3);
    const dots = UNSAFE_getAllByType('Circle' as never) as unknown as { props: Record<string, unknown> }[];
    expect(dots.map((d) => [d.props.r, Math.round(Number(d.props.cy) * 1000) / 1000])).toEqual([
      [4, 106.185],
      [4, 80.926],
      [4, 64.852],
    ]);
  });

  it('pins 0%–100% for the percent variant', () => {
    const { getByTestId, getByText } = renderCard(
      <AreaChartCard testID="area" variant="percent" data={DATA} series={SERIES} />,
    );
    layoutPlot(getByTestId, 'area-plot');
    for (const label of ['0%', '25%', '50%', '75%', '100%']) expect(getByText(label)).toBeTruthy();
  });

  it('tracks the month under the pointer, clears over the axes and on leave', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId } = renderCard(
      <AreaChartCard testID="area" data={DATA} series={SERIES} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId, 'area-plot');
    const surface = getByTestId('area-plot-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toBe('Visitors stacked area chart: Organic, Referral, Paid');

    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 258, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(6);
    expect(getByTestId('area-headline').props.children).toBe('8,200');

    // Clears whenever recharts reports no active tooltip.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 10, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);

    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 440, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(11);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('reads a range: its data, delta and pill label override the props', () => {
    const ranges: AreaRange[] = [
      { id: 'year', label: 'This year', data: DATA, delta: 0.082 },
      { id: 'q', label: 'Last quarter', data: DATA.slice(9), delta: -0.036 },
    ];
    const onRangeChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <AreaChartCard testID="area" series={SERIES} ranges={ranges} defaultRange="q" onRangeChange={onRangeChange} />,
    );
    expect(getByText('Last quarter')).toBeTruthy();
    expect(getByText('-3.6%')).toBeTruthy();
    // Oct–Dec: 5600+5400+6200 + 2900+3200+3400 + 1900+2300+2600.
    expect(getByTestId('area-headline').props.children).toBe('33,500');
    expect(getByTestId('area-range').props.accessibilityLabel).toBe('Change period');
  });

  it('puts stat tiles under the chart and lets the card grow', () => {
    const { getByTestId, queryByTestId } = renderCard(
      <AreaChartCard testID="area" data={DATA} series={SERIES} tiles />,
    );
    expect(resolvedStyle(getByTestId('area').props.style).height).toBeUndefined();
    expect(queryByTestId('area-legend')).toBeNull();
    const tile = resolvedStyle(getByTestId('area-tiles-tile-0').props.style);
    expect(tile).toMatchObject({ borderRadius: 10, paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10 });
  });

  it('paints the dark card from the neutral ramp', () => {
    const { getByTestId } = renderCard(<AreaChartCard testID="area" data={DATA} series={SERIES} tiles />, 'dark');
    const theme = buildTheme('teal', 'dark');
    const palette = resolveChartCardPalette(theme);
    expect(resolvedStyle(getByTestId('area').props.style).backgroundColor).toBe(resolveButtonRamps(theme).neutral[900]);
    expect(resolvedStyle(getByTestId('area-tiles-tile-0').props.style).backgroundColor).toBe(palette.inner);
  });
});

describe('chart card primitives', () => {
  it('dims every legend item but the active one', () => {
    const { getByTestId } = renderCard(
      <ChartLegend
        testID="legend"
        activeIndex={1}
        items={[
          { label: 'A', color: 'red', value: '1' },
          { label: 'B', color: 'blue', value: '2' },
        ]}
      />,
    );
    expect(resolvedStyle(getByTestId('legend-item-0').props.style).opacity).toBe(0.5);
    expect(resolvedStyle(getByTestId('legend-item-1').props.style).opacity).toBe(1);
  });

  it('fades inactive tiles to 40% and reports pointer focus', () => {
    const onActiveChange = jest.fn();
    const { getByTestId } = renderCard(
      <ChartStatTiles
        testID="tiles"
        activeIndex={0}
        onActiveChange={onActiveChange}
        items={[
          { label: 'A', value: '1', color: 'red', activeColor: 'darkred' },
          { label: 'B', value: '2', color: 'blue' },
        ]}
      />,
    );
    expect(resolvedStyle(getByTestId('tiles-tile-1').props.style).opacity).toBe(0.4);
    fireEvent(getByTestId('tiles-tile-1'), 'pointerEnter');
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
  });
});
