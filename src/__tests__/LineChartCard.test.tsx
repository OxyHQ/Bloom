import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { LineChartCard, closedAreaPath, formatDollarsK, monthTitle } from '../chart-cards/LineChartCard';
import type { LinePoint, LineRange } from '../chart-cards/LineChartCard';
import { PulsingDot } from '../chart-cards/primitives/PulsingDot';
import { fixedDomainTicks, plotBox, pointX, scaleY } from '../chart-cards/geometry';
import { chartHueTone, resolveChartCardPalette } from '../chart-cards/palette';

// The "weekly" demo period. Every expected pixel below was read off
// recharts 3.10's SVG for that card at 480 wide (448 × 221 plot).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const zip = (values: number[]): LinePoint[] => values.map((value, i) => ({ label: MONTHS[i]!, value }));
const WEEKLY = zip([1400, 1900, 2600, 2300, 3400, 3100, 2700, 3800, 4600, 4200, 3600, 5200]);
const RANGES: LineRange[] = [
  { id: 'weekly', label: 'Weekly', headline: 18240, delta: 0.094, data: WEEKLY },
  { id: 'monthly', label: 'Monthly', headline: 64820, delta: 0.126, data: zip([3200, 4100, 3800, 5200, 6400, 5900, 5100, 6800, 8100, 7600, 8400, 9600]) },
  { id: 'yearly', label: 'Yearly', headline: 512400, delta: -0.032, data: zip([28000, 34000, 46000, 41000, 52000, 49000, 61000, 55000, 68000, 72000, 64000, 83000]) },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown, id: string, width = 448, height = 221) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('line chart geometry matches recharts', () => {
  const box = plotBox(448, 221, 44);
  const domain = [0, 5200 * 1.1] as const;
  const pts = WEEKLY.map((p, i) => ({ x: pointX(i, 12, box), y: scaleY(p.value, domain, box) }));

  it('fixes the domain at max × 1.1 and labels it $0 / $2K / $4K / $6K', () => {
    const ticks = fixedDomainTicks(0, 5720, 4);
    expect(ticks).toEqual([0, 2000, 4000, 5720]);
    expect(ticks.map(formatDollarsK)).toEqual(['$0', '$2K', '$4K', '$6K']);
    expect(scaleY(2000, domain, box)).toBeCloseTo(125.615, 3);
  });

  it('closes the monotone area on the plot base', () => {
    const d = closedAreaPath(pts, box.bottom, 'monotone');
    expect(d.startsWith('M44,145.231C56.061,140.327,68.121,135.423,80.182,128.885C92.242,122.346,104.303,106,116.364,106')).toBe(true);
    expect(d.endsWith('L442,191L44,191Z')).toBe(true);
    expect(closedAreaPath(pts.slice(0, 2), 191, 'linear')).toBe('M44,145.231L80.182,128.885L80.182,191L44,191Z');
  });

  it('names months in full', () => {
    expect(monthTitle('Jul')).toBe('July');
    expect(monthTitle('W12')).toBe('W12');
  });
});

describe('LineChartCard', () => {
  it('keeps the card geometry: 329 tall, radius 16, padding 16/16/12, gap 24', () => {
    const { getByTestId } = renderCard(<LineChartCard testID="line" ranges={RANGES} />);
    expect(resolvedStyle(getByTestId('line').props.style)).toMatchObject({
      height: 329,
      borderRadius: 16,
      gap: 24,
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 12,
    });
  });

  it('reads the period headline, the delta chip and a Weekly / Monthly / Yearly radio group', () => {
    const { getByTestId, getByText, getByLabelText } = renderCard(<LineChartCard testID="line" ranges={RANGES} />);
    expect(getByText('Revenue')).toBeTruthy();
    expect(getByTestId('line-headline').props.children).toBe('$18,240');
    expect(getByText('+9.4%')).toBeTruthy();
    expect(getByLabelText('Revenue period').props.role).toBe('radiogroup');
    expect(getByTestId('line-range-weekly').props['aria-checked']).toBe(true);
  });

  it('switches period from the segmented control', () => {
    const onRangeChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <LineChartCard testID="line" ranges={RANGES} onRangeChange={onRangeChange} />,
    );
    fireEvent.press(getByTestId('line-range-yearly'));
    expect(onRangeChange).toHaveBeenCalledWith('yearly');
    expect(getByText('-3.2%')).toBeTruthy();
    expect(getByTestId('line-range-yearly').props['aria-checked']).toBe(true);
  });

  it('follows the hovered point: full month, its value, cursor and pulsing dot; the chip hides', () => {
    const { getByTestId, getByText, UNSAFE_getAllByType, UNSAFE_getByType } = renderCard(
      <LineChartCard testID="line" ranges={RANGES} activeIndex={6} />,
    );
    layoutPlot(getByTestId, 'line-plot');
    expect(getByText('July')).toBeTruthy();
    expect(getByTestId('line-headline').props.children).toBe('$2,700');
    let wrap = getByTestId('line-delta', { includeHiddenElements: true }).parent;
    while (wrap && wrap.props.accessibilityElementsHidden === undefined) wrap = wrap.parent;
    expect(wrap?.props.accessibilityElementsHidden).toBe(true);

    for (const label of ['$0', '$2K', '$4K', '$6K']) expect(getByText(label)).toBeTruthy();
    const cursor = (UNSAFE_getAllByType('Line' as never) as unknown as Node[]).find((l) => l.props.y1 === 4);
    expect(cursor?.props.x1).toBeCloseTo(261.091, 3);
    expect(cursor?.props.y2).toBe(191);
    expect(cursor?.props.strokeDasharray).toBe('4 4');

    const dot = UNSAFE_getByType(PulsingDot);
    expect(dot.props.cx).toBeCloseTo(261.091, 3);
    expect(dot.props.cy).toBeCloseTo(102.731, 3);
    const circles = UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    const solid = circles.find((c) => c.props.strokeWidth === 3);
    expect(solid?.props.r).toBe(5);
    expect(solid?.props.stroke).toBe(resolveChartCardPalette(buildTheme('teal', 'light')).surface);
  });

  it('draws the line 2.5px in chart-2-active over a 35% → 0% chart-2 gradient', () => {
    const theme = buildTheme('teal', 'light');
    const tone = chartHueTone(theme, 2);
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<LineChartCard testID="line" data={WEEKLY} />);
    layoutPlot(getByTestId, 'line-plot');
    const paths = UNSAFE_getAllByType('Path' as never) as unknown as Node[];
    const stroke = paths.find((p) => p.props.strokeWidth === 2.5);
    expect(stroke?.props.stroke).toBe(tone.activeColor);
    const stops = UNSAFE_getAllByType('Stop' as never) as unknown as Node[];
    expect(stops.map((s) => [s.props.stopColor, s.props.stopOpacity])).toEqual([
      [tone.color, 0.35],
      [tone.color, 0],
    ]);
  });

  it('keeps the point over the axes (only sets there), clears on leave', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId } = renderCard(
      <LineChartCard testID="line" data={WEEKLY} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId, 'line-plot');
    const surface = getByTestId('line-plot-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toBe('Revenue line chart');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 258, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(6);
    expect(getByTestId('line-headline').props.children).toBe('$2,700');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 10, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('headlines the sum without ranges and hides the switcher', () => {
    const { getByTestId, queryByLabelText } = renderCard(<LineChartCard testID="line" data={WEEKLY} />);
    expect(getByTestId('line-headline').props.children).toBe('$38,800');
    expect(queryByLabelText('Revenue period')).toBeNull();
  });

  it('paints the dark card from the neutral ramp', () => {
    const { getByTestId } = renderCard(<LineChartCard testID="line" data={WEEKLY} />, 'dark');
    const palette = resolveChartCardPalette(buildTheme('teal', 'dark'));
    expect(resolvedStyle(getByTestId('line').props.style).backgroundColor).toBe(palette.surface);
  });
});
