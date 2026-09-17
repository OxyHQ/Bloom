import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { EarningsChartCard, formatEarningsK } from '../chart-cards/EarningsChartCard';
import type { EarningsPoint, EarningsRange } from '../chart-cards/EarningsChartCard';
import { chartHueTone, resolveChartCardPalette } from '../chart-cards/palette';
import { singleBarSlot } from '../chart-cards/rounded-bar-geometry';

// Demo periods and fixed Y ticks. Expected pixels read off recharts 3.10's
// SVG at 480 wide (448 × 221 plot).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const zip = (values: number[]): EarningsPoint[] => values.map((value, i) => ({ label: MONTHS[i]!, value }));
const WEEKLY = zip([3240, 7420, 9650, 7130, 3670, 2300, 3820, 5040, 6840, 4540, 11520, 8210]);
const RANGES: EarningsRange[] = [
  { id: 'weekly', label: 'Weekly', headline: 7462, delta: 0.148, data: WEEKLY },
  { id: 'monthly', label: 'Monthly', headline: 32180, delta: 0.082, data: zip([5200, 6100, 7300, 8900, 9600, 10800, 11200, 9800, 8600, 7400, 6900, 8100]) },
];
const Y_TICKS = [0, 3000, 5000, 10000];

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

describe('earnings chart geometry matches recharts', () => {
  it('sizes bars at 18% category gap, rounded to whole pixels', () => {
    const slot = singleBarSlot(404 / 12, 0.18, 40);
    expect(slot.size).toBe(22);
    expect(44 + slot.offset).toBeCloseTo(50.06, 2);
  });

  it("formats fixed ticks without rounding", () => {
    expect(Y_TICKS.map(formatEarningsK)).toEqual(['$0', '$3K', '$5K', '$10K']);
    expect(formatEarningsK(2500)).toBe('$2.5K');
  });
});

describe('EarningsChartCard', () => {
  it("keeps the card and reads the period headline", () => {
    const { getByTestId, getByText, getByLabelText } = renderCard(
      <EarningsChartCard testID="earn" ranges={RANGES} yTicks={Y_TICKS} yMax={12000} />,
    );
    expect(resolvedStyle(getByTestId('earn').props.style)).toMatchObject({ height: 329, gap: 24, borderRadius: 16 });
    expect(getByText('Earned so far')).toBeTruthy();
    expect(getByTestId('earn-headline').props.children).toBe('$7,462');
    expect(getByText('+14.8%')).toBeTruthy();
    expect(getByLabelText('Earnings period').props.role).toBe('radiogroup');
  });

  it('draws tracks, hidden outlines and bars on recharts pixels', () => {
    const theme = buildTheme('teal', 'light');
    const palette = resolveChartCardPalette(theme);
    const tone = chartHueTone(theme, 2);
    const { getByTestId, getByText, UNSAFE_getAllByType } = renderCard(
      <EarningsChartCard testID="earn" data={WEEKLY} yTicks={Y_TICKS} yMax={12000} />,
    );
    layoutPlot(getByTestId, 'earn-plot');
    for (const label of ['$0', '$3K', '$5K', '$10K']) expect(getByText(label)).toBeTruthy();
    const rects = UNSAFE_getAllByType('Rect' as never) as unknown as Node[];
    const track = rects[0]!.props;
    expect([track.x, track.y, track.width, track.height, track.rx, track.fill]).toEqual([
      expect.closeTo(50.06, 2),
      4,
      22,
      187,
      10,
      palette.track,
    ]);
    const outline = getByTestId('earn-outline-0').props;
    expect([outline.x, outline.y, outline.width, outline.height, outline.rx, outline.stroke, outline.strokeWidth, outline.opacity]).toEqual([
      expect.closeTo(47.06, 2),
      1,
      28,
      193,
      13,
      palette.cursor,
      2,
      0,
    ]);
    const bar = getByTestId('earn-bar-0').props;
    expect(bar.fill).toBe(tone.color);
    // 3240 of 12000 over 187px: top at 140.51, radius 10 on every corner.
    expect(bar.d).toMatch(/^M50\.06,150\.51A10,10,0,0,1,60\.06,140\.51L62\.06,140\.51/);
    expect(bar.d).toMatch(/A10,10,0,0,1,50\.06,181Z$/);
  });

  it('outlines and darkens the hovered bar, shows its month', () => {
    const tone = chartHueTone(buildTheme('teal', 'light'), 2);
    const { getByTestId, getByText } = renderCard(
      <EarningsChartCard testID="earn" ranges={RANGES} yTicks={Y_TICKS} yMax={12000} activeIndex={5} />,
    );
    layoutPlot(getByTestId, 'earn-plot');
    expect(getByText('June')).toBeTruthy();
    expect(getByTestId('earn-headline').props.children).toBe('$2,300');
    expect(getByTestId('earn-outline-5').props.opacity).toBe(1);
    expect(getByTestId('earn-outline-4').props.opacity).toBe(0);
    expect(getByTestId('earn-bar-5').props.fill).toBe(tone.activeColor);
  });

  it('tracks bands, clears over the axis and on leave, switches period', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <EarningsChartCard testID="earn" ranges={RANGES} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId, 'earn-plot');
    const surface = getByTestId('earn-plot-surface');
    expect(surface.props.accessibilityLabel).toBe('Earned so far bar chart');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 240, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(5);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 252, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(6);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 20, offsetY: 90 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    fireEvent.press(getByTestId('earn-range-monthly'));
    expect(getByTestId('earn-headline').props.children).toBe('$32,180');
    expect(getByText('+8.2%')).toBeTruthy();
  });

  it('falls back to nice ticks without Figma ticks', () => {
    const { getByTestId, getByText } = renderCard(<EarningsChartCard testID="earn" data={WEEKLY} />);
    layoutPlot(getByTestId, 'earn-plot');
    for (const label of ['$0', '$4K', '$8K', '$12K']) expect(getByText(label)).toBeTruthy();
  });

  it('paints the dark tracks from the neutral ramp', () => {
    const palette = resolveChartCardPalette(buildTheme('teal', 'dark'));
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<EarningsChartCard testID="earn" data={WEEKLY} />, 'dark');
    layoutPlot(getByTestId, 'earn-plot');
    const rects = UNSAFE_getAllByType('Rect' as never) as unknown as Node[];
    expect(rects[0]!.props.fill).toBe(palette.track);
    expect(resolvedStyle(getByTestId('earn').props.style).backgroundColor).toBe(palette.surface);
  });
});
