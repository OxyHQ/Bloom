import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ScatterChartCard, bubbleRadius, scatterPlotBox, scatterTicks } from '../chart-cards/ScatterChartCard';
import type { ScatterPoint, ScatterSeries } from '../chart-cards/ScatterChartCard';

// Demo accounts. Expected pixels read off recharts 3.10's SVG at 480 wide (448 × 189 plot).
const pts = (pairs: [number, number, number?][], labels: string[]): ScatterPoint[] =>
  pairs.map(([x, y, z], i) => ({ x, y, z, label: labels[i] }));
const SERIES: ScatterSeries[] = [
  { label: 'Starter', points: pts([[12, 180, 40], [18, 240, 60], [24, 210, 30], [31, 320, 80], [38, 290, 50], [45, 380, 70]], ['Acme', 'Bolt', 'Corvus', 'Delta', 'Ember', 'Flux']) },
  { label: 'Growth', points: pts([[42, 620, 90], [55, 740, 120], [61, 690, 70], [68, 880, 150], [74, 810, 100], [83, 960, 130]], ['Gale', 'Helio', 'Ionic', 'Juno', 'Kite', 'Lumen']) },
  { label: 'Scale', points: pts([[78, 1240, 180], [86, 1420, 220], [92, 1310, 160], [97, 1580, 260]], ['Meridian', 'Nova', 'Orbit', 'Prism']) },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}
const layoutPlot = (getByTestId: (id: string) => unknown) =>
  act(() => {
    fireEvent(getByTestId('scatter-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 448, height: 189 } } });
  });
type Node = { props: Record<string, unknown> };

describe('scatter geometry matches recharts', () => {
  it('lays the plot inside margin 8 / 8, a 48-wide Y axis and a 30px X axis', () => {
    expect(scatterPlotBox(448, 189)).toEqual({ left: 48, top: 8, right: 440, bottom: 159 });
  });

  it("picks recharts' nice ticks from zero", () => {
    expect(scatterTicks([12, 97], 5)).toEqual([0, 25, 50, 75, 100]);
    expect(scatterTicks([180, 1580], 4)).toEqual([0, 550, 1100, 1650]);
  });

  it('sizes bubbles over [0, zMax] onto 90–620px²', () => {
    expect(bubbleRadius(40, 260)).toBeCloseTo(7.389, 3);
    expect(bubbleRadius(150, 260)).toBeCloseTo(11.224, 3);
    expect(bubbleRadius(260, 260)).toBeCloseTo(14.048, 3);
  });
});

describe('ScatterChartCard', () => {
  it('headlines the rounded average and lists series averages in the legend', () => {
    const { getByTestId, getByText } = renderCard(<ScatterChartCard testID="scatter" series={SERIES} delta={0.068} range="This quarter" />);
    expect(resolvedStyle(getByTestId('scatter').props.style)).toMatchObject({ height: 329 });
    expect(getByTestId('scatter-headline').props.children).toBe('742');
    for (const t of ['+6.8%', 'Starter', '270', 'Growth', '783', 'Scale', '1,388']) expect(getByText(t)).toBeTruthy();
  });

  it('draws both grids, the ticks and the symbols at recharts positions', () => {
    const { getByTestId, getAllByText, UNSAFE_getAllByType } = renderCard(<ScatterChartCard testID="scatter" series={SERIES} />);
    layoutPlot(getByTestId);
    for (const t of ['0', '550', '1.1K', '1.7K', '25', '50', '75', '100']) expect(getAllByText(t).length).toBeGreaterThan(0);
    const lines = UNSAFE_getAllByType('Line' as never) as unknown as Node[];
    expect(lines.map((l) => [l.props.x1, l.props.y1, l.props.x2, l.props.y2].map((v) => Math.round(Number(v) * 100) / 100))).toEqual([
      [48, 159, 440, 159], [48, 108.67, 440, 108.67], [48, 58.33, 440, 58.33], [48, 8, 440, 8],
      [48, 8, 48, 159], [146, 8, 146, 159], [244, 8, 244, 159], [342, 8, 342, 159], [440, 8, 440, 159],
    ]);
    const circles = UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    expect(circles).toHaveLength(16);
    // Jest has no requestAnimationFrame timing here: symbols settle at their final size.
    const juno = circles[9]!.props;
    expect(Number(juno.cx)).toBeCloseTo(314.56, 2);
    expect(Number(juno.cy)).toBeCloseTo(159 - (880 / 1650) * 151, 2);
    expect(juno).toMatchObject({ fillOpacity: 0.85, strokeWidth: 1.5 });
  });

  it('uses 64px² dots without z', () => {
    const plain = SERIES.map((s) => ({ ...s, points: s.points.map(({ z: _z, ...p }) => p) }));
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<ScatterChartCard testID="scatter" series={plain} />);
    layoutPlot(getByTestId);
    const circles = UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    expect(Number(circles[0]!.props.r)).toBeCloseTo(Math.sqrt(64 / Math.PI), 6);
  });

  it('hovers a point: header "Label · x", its y, other series dimmed to 25%', () => {
    const onActivePointChange = jest.fn();
    const { getByTestId, getByText, UNSAFE_getAllByType } = renderCard(
      <ScatterChartCard testID="scatter" series={SERIES} onActivePointChange={onActivePointChange} />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('scatter-surface');
    expect(surface.props.accessibilityLabel).toBe('Revenue per account bubble chart: Starter, Growth, Scale');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 315, offsetY: 79 } });
    });
    expect(onActivePointChange).toHaveBeenLastCalledWith({ series: 1, index: 3 });
    expect(getByText('Juno · 68')).toBeTruthy();
    expect(getByTestId('scatter-headline').props.children).toBe('880');
    const circles = UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    expect(circles[0]!.props).toMatchObject({ fillOpacity: 0.25, strokeOpacity: 0.25 });
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 60, offsetY: 20 } });
    });
    expect(onActivePointChange).toHaveBeenLastCalledWith(null);
  });

  it('puts axis captions (y left, x right) and tiles under a 196px plot', () => {
    const { getByTestId, getByText, queryByTestId } = renderCard(
      <ScatterChartCard testID="scatter" series={SERIES} tiles axisLabels={['Seats', 'MRR']} activePoint={{ series: 2, index: 0 }} />,
    );
    expect(resolvedStyle(getByTestId('scatter').props.style).height).toBeUndefined();
    expect(queryByTestId('scatter-legend')).toBeNull();
    const captions = getByTestId('scatter-axis-labels');
    expect(captions.children.map((c) => (c as unknown as { props: { children: string } }).props.children)).toEqual(['MRR', 'Seats']);
    expect(getByText('Scale · avg')).toBeTruthy();
    expect(resolvedStyle(getByTestId('scatter-tiles-tile-0').props.style).opacity).toBe(0.4);
    expect(getByText('Meridian · 78')).toBeTruthy();
  });
});
