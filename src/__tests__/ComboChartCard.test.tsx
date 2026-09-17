import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { ComboChartCard, formatPercent } from '../chart-cards/ComboChartCard';
import type { ComboPoint, ComboRange, ComboSeries } from '../chart-cards/ComboChartCard';
import { PulsingDot } from '../chart-cards/primitives/PulsingDot';
import { multiAxisPlotBox } from '../chart-cards/primitives/MultiAxisPlot';
import { niceTicks } from '../chart-cards/geometry';
import { resolveChartCardPalette, resolveChartTones } from '../chart-cards/palette';
import { formatNumber } from '../chart-cards/primitives/format';
import { roundedBarPath, singleBarSlot } from '../chart-cards/rounded-bar-geometry';

// The demo year. Expected pixels read off
// recharts 3.10's SVG at 480 wide (448 × 229 plot).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SESSIONS = [4200, 4800, 5600, 5200, 6400, 7100, 6800, 7600, 8400, 8100, 9200, 9800];
const RATE = [2.4, 2.6, 3.1, 2.9, 3.4, 3.8, 3.6, 4.1, 4.4, 4.2, 4.8, 5.2];
const DATA: ComboPoint[] = MONTHS.map((label, i) => ({ label, sessions: SESSIONS[i]!, rate: RATE[i]! }));
const BAR: ComboSeries = { key: 'sessions', label: 'Sessions', format: formatNumber };
const LINE: ComboSeries = { key: 'rate', label: 'Conversion', format: formatPercent };

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown, id: string, width = 448, height = 229) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('combo chart geometry matches recharts', () => {
  it('lays the plot between a 44 left and a 40 right axis, margin right 0', () => {
    expect(multiAxisPlotBox(448, 229, 44, 40, { top: 4, right: 0, bottom: 0, left: 0 })).toEqual({
      left: 44,
      top: 4,
      right: 408,
      bottom: 199,
    });
  });

  it('picks nice ticks for both axes', () => {
    expect(niceTicks(0, 9800, 4)).toEqual([0, 3500, 7000, 10500]);
    expect(niceTicks(0, 5.2, 4)).toEqual([0, 2, 4, 6]);
  });

  it('sizes bars at 22% category gap, whole pixels, fully rounded', () => {
    const slot = singleBarSlot(364 / 12, 0.22, 34);
    expect(slot.size).toBe(17);
    expect(44 + slot.offset).toBeCloseTo(50.6733, 3);
    expect(roundedBarPath(50.6733, 121, 17, 78, 8)).toBe(
      'M50.6733,129A8,8,0,0,1,58.6733,121L59.6733,121A8,8,0,0,1,67.6733,129L67.6733,191A8,8,0,0,1,59.6733,199L58.6733,199A8,8,0,0,1,50.6733,191Z',
    );
    // A wide band caps at maxBarSize and centres the bar where the uncapped one sat.
    expect(singleBarSlot(100, 0.22, 34)).toEqual({ offset: 33, size: 34 });
    expect(roundedBarPath(0, 0, 10, 4, 8)).toContain('A2,2');
  });
});

describe('ComboChartCard', () => {
  it('reads "<title> · <line> <average>", the bar total and the delta', () => {
    const { getByTestId, getByText } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} data={DATA} delta={0.094} range="This year" />,
    );
    expect(getByText('Sessions · Conversion 3.7%')).toBeTruthy();
    expect(getByTestId('combo-headline').props.children).toBe('83,200');
    expect(getByText('+9.4%')).toBeTruthy();
    expect(getByText('This year')).toBeTruthy();
    expect(resolvedStyle(getByTestId('combo').props.style)).toMatchObject({ height: 329, gap: 16 });
  });

  it('draws both axes, the two edge grid lines, bars, casing, line and dots on recharts pixels', () => {
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    const [barTone, lineTone] = resolveChartTones(theme);
    const { getByTestId, getByText, UNSAFE_getAllByType } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} data={DATA} />,
    );
    layoutPlot(getByTestId, 'combo-plot');
    for (const label of ['0', '3.5K', '7K', '10.5K', '0%', '2%', '4%', '6%']) expect(getByText(label)).toBeTruthy();

    const grid = (UNSAFE_getAllByType('Line' as never) as unknown as Node[]).map((l) => [l.props.x1, l.props.y1, l.props.x2, l.props.strokeDasharray]);
    expect(grid).toEqual([
      [44, 4, 408, '4 4'],
      [44, 199, 408, '4 4'],
    ]);

    const bar0 = getByTestId('combo-bar-0');
    expect(bar0.props.d).toBe(roundedBarPath(44 + singleBarSlot(364 / 12, 0.22, 34).offset, 121, 17, 78, 8));
    expect(bar0.props.fill).toBe(barTone!.color);

    const paths = UNSAFE_getAllByType('Path' as never) as unknown as Node[];
    const casing = paths.find((p) => p.props.strokeWidth === 7);
    const stroke = paths.find((p) => p.props.strokeWidth === 2);
    expect(casing?.props.stroke).toBe(palette.surface);
    expect(stroke?.props.stroke).toBe(lineTone!.activeColor);
    expect(String(stroke?.props.d).startsWith('M59.167,121C69.278,119.646,79.389,118.292,89.5,114.5')).toBe(true);
    expect(stroke?.props.strokeLinecap).toBe('round');

    const dots = UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    expect(dots).toHaveLength(12);
    expect([dots[0]!.props.cx, dots[0]!.props.r, dots[0]!.props.strokeWidth]).toEqual([expect.closeTo(59.167, 3), 3, 2]);
    expect(dots[11]!.props.cy).toBeCloseTo(30, 3);
  });

  it('darkens the hovered bar, dims the rest to 30% and pulses the line dot', () => {
    const [barTone, lineTone] = resolveChartTones(buildTheme('teal', 'light'));
    const { getByTestId, getByText, getAllByText, UNSAFE_getByType } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} data={DATA} activeIndex={6} tiles />,
    );
    layoutPlot(getByTestId, 'combo-plot', 448, 196);
    expect(getByText('Jul · Conversion 3.6%')).toBeTruthy();
    expect(getByTestId('combo-headline').props.children).toBe('6,800');
    expect(getByTestId('combo-bar-6').props).toMatchObject({ fill: barTone!.activeColor, opacity: 1 });
    expect(getByTestId('combo-bar-5').props).toMatchObject({ fill: barTone!.color, opacity: 0.3 });
    const dot = UNSAFE_getByType(PulsingDot);
    expect(dot.props.color).toBe(lineTone!.activeColor);
    expect(dot.props.cx).toBeCloseTo(241.167, 3);
    for (const text of ['Sessions · total', 'Conversion · this month', '3.6%']) expect(getByText(text)).toBeTruthy();
    expect(getAllByText('6,800')).toHaveLength(2);
  });

  it('puts tiles under a 196px plot and lets the card grow', () => {
    const { getByTestId, getByText, getAllByText } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} data={DATA} tiles />,
    );
    expect(resolvedStyle(getByTestId('combo').props.style).height).toBeUndefined();
    let wrap = getByTestId('combo-plot').parent;
    while (wrap && resolvedStyle(wrap.props.style).height === undefined) wrap = wrap.parent;
    expect(resolvedStyle(wrap?.props.style).height).toBe(196);
    for (const text of ['Sessions · total', 'Conversion · average']) expect(getByText(text)).toBeTruthy();
    expect(getAllByText('83,200')).toHaveLength(2);
    expect(getAllByText('3.7%').length).toBeGreaterThan(0);
  });

  it('headlines the line on request, with the bar total in the label', () => {
    const { getByTestId, getByText } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} data={DATA} headlineFrom="line" tiles />,
    );
    expect(getByTestId('combo-headline').props.children).toBe('44.5%');
    expect(getByText('Sessions · Sessions 83,200')).toBeTruthy();
    // The line tile keeps the line's own average, distinct from the headline's bar total shown as a percent.
    expect(getByText('3.7%')).toBeTruthy();
  });

  it('uses a custom caption', () => {
    const { getByText } = renderCard(
      <ComboChartCard bar={BAR} line={LINE} data={DATA} activeIndex={0} caption={(row) => (row ? `${row.rate} rate` : 'rest')} />,
    );
    expect(getByText('Jan · 2.4 rate')).toBeTruthy();
  });

  it('clears over the axes and on leave; ranges override data and delta', () => {
    const onActiveIndexChange = jest.fn();
    const ranges: ComboRange[] = [
      { id: 'year', label: 'This year', data: DATA, delta: 0.094 },
      { id: 'q4', label: 'Last quarter', data: DATA.slice(9), delta: -0.028 },
    ];
    const { getByTestId, getByText } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} ranges={ranges} defaultRange="q4" onActiveIndexChange={onActiveIndexChange} />,
    );
    expect(getByText('-2.8%')).toBeTruthy();
    expect(getByTestId('combo-headline').props.children).toBe('27,100');
    layoutPlot(getByTestId, 'combo-plot');
    const surface = getByTestId('combo-plot-surface');
    expect(surface.props.accessibilityLabel).toBe('Sessions chart: Sessions bars against Conversion line');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 300, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(2);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 420, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 50, offsetY: 90 } });
    });
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('paints the casing in the dark card colour', () => {
    const palette = resolveChartCardPalette(buildTheme('teal', 'dark'));
    const { getByTestId, UNSAFE_getAllByType } = renderCard(
      <ComboChartCard testID="combo" bar={BAR} line={LINE} data={DATA} />,
      'dark',
    );
    layoutPlot(getByTestId, 'combo-plot');
    const casing = (UNSAFE_getAllByType('Path' as never) as unknown as Node[]).find((p) => p.props.strokeWidth === 7);
    expect(casing?.props.stroke).toBe(palette.surface);
    expect(resolvedStyle(getByTestId('combo').props.style).backgroundColor).toBe(palette.surface);
  });
});
