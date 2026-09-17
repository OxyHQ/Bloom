import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RadarChartCard, defaultRadarScoreCaption, type RadarPoint, type RadarSeries } from '../chart-cards/RadarChartCard';
import { fixedDomainTicks } from '../chart-cards/geometry';
import {
  closedPolygonPath,
  polarFrame,
  polarToCartesian,
  radarAxisAngle,
  radarIndexAt,
  tickAnchor,
} from '../chart-cards/polar-geometry';

// Demo data. Expected pixels were read off recharts 3.10's SVG for that
// card at 480 wide (448 × 229 chart area).
const DATA: RadarPoint[] = [
  { label: 'January', desktop: 186, mobile: 80 },
  { label: 'February', desktop: 305, mobile: 200 },
  { label: 'March', desktop: 237, mobile: 120 },
  { label: 'April', desktop: 273, mobile: 190 },
  { label: 'May', desktop: 209, mobile: 130 },
  { label: 'June', desktop: 214, mobile: 140 },
];
const DESKTOP: RadarSeries[] = [{ key: 'desktop', label: 'Desktop' }];
const BOTH: RadarSeries[] = [...DESKTOP, { key: 'mobile', label: 'Mobile' }];
const SCORE: RadarPoint[] = ['Focus', 'Consistency', 'Target', 'Balance', 'Deep work'].map((label, i) => ({
  label,
  score: [100, 9, 100, 100, 97][i]!,
}));

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layout(getByTestId: (id: string) => unknown, id: string, width = 448, height = 229) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('radar geometry matches recharts', () => {
  it('frames the chart: centre on the whole surface, radius inside the 4px margin', () => {
    const f = polarFrame(448, 229, 0.5, 0.5, 4);
    expect([f.cx, f.cy, f.maxRadius * 0.74]).toEqual([224, 114.5, expect.closeTo(81.77, 6)]);
    // The overlay legend lifts the centre to 44% of the WHOLE height.
    expect(polarFrame(448, 229, 0.5, 0.44, 4).cy).toBeCloseTo(100.76, 6);
    // `score`: 62% of a 253-tall area.
    expect(polarFrame(448, 253, 0.5, 0.5, 4).maxRadius * 0.62).toBeCloseTo(75.95, 6);
  });

  it('rings the grid at the fixed-domain radius ticks', () => {
    expect(fixedDomainTicks(0, 305, 5)).toEqual([0, 80, 160, 240, 305]);
    expect(fixedDomainTicks(0, 100, 5)).toEqual([0, 25, 50, 75, 100]);
  });

  it("draws the desktop polygon exactly as recharts' Radar", () => {
    const r = (v: number) => (81.77 * v) / 305;
    const points = DATA.map((row, i) => polarToCartesian(224, 114.5, r(Number(row.desktop)), radarAxisAngle(i, 6)));
    expect(closedPolygonPath(points)).toBe(
      'M224,64.6337L294.8149,73.615L279.0267,146.2697L224,187.6909L175.4744,142.5163L174.3135,85.8135L224,64.6337Z',
    );
  });

  it('anchors the axis labels 8px out by side', () => {
    const at = polarToCartesian(224, 114.5, 89.77, radarAxisAngle(1, 6));
    expect([at.x, at.y]).toEqual([expect.closeTo(301.743, 3), expect.closeTo(69.615, 3)]);
    expect([0, 1, 2, 3, 4, 5].map((i) => tickAnchor(radarAxisAngle(i, 6)))).toEqual([
      'middle',
      'start',
      'start',
      'middle',
      'end',
      'end',
    ]);
  });

  it('picks the nearest axis inside the outer radius, nothing outside it', () => {
    const frame = { cx: 224, cy: 114.5, outerRadius: 81.77 };
    expect(radarIndexAt(270, 90, frame, 6)).toBe(1);
    expect(radarIndexAt(224, 180, frame, 6)).toBe(3);
    expect(radarIndexAt(170, 90, frame, 6)).toBe(5);
    expect(radarIndexAt(20, 10, frame, 6)).toBeNull();
    expect(radarIndexAt(224, 114.5, frame, 6)).toBeNull();
  });
});

describe('RadarChartCard', () => {
  it('headlines the first series total with its delta, and names the chart', () => {
    const { getByTestId, getByText } = renderCard(
      <RadarChartCard testID="radar" data={DATA} series={DESKTOP} delta={0.052} range="Jan – Jun 2024" />,
    );
    expect(getByTestId('radar-headline').props.children).toBe('1,424');
    expect(getByText('+5.2%')).toBeTruthy();
    layout(getByTestId, 'radar-plot');
    const surface = getByTestId('radar-plot-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toBe('Visitors radar chart: January, February, March, April, May, June');
  });

  it('draws the grid, the filled polygon and no dots for `filled`', () => {
    const { getByTestId, UNSAFE_getAllByType, UNSAFE_queryAllByType } = renderCard(
      <RadarChartCard testID="radar" data={DATA} series={DESKTOP} />,
    );
    layout(getByTestId, 'radar-plot');
    const paths = UNSAFE_getAllByType('Path' as never) as unknown as Node[];
    // Five grid rings, then the series polygon.
    const polygon = paths.find((p) => p.props.fillOpacity === 0.28);
    expect(polygon?.props.d).toBe(
      'M224,64.6337L294.8149,73.615L279.0267,146.2697L224,187.6909L175.4744,142.5163L174.3135,85.8135L224,64.6337Z',
    );
    expect(polygon?.props.strokeWidth).toBe(2);
    expect(paths.filter((p) => p.props.fill === 'none' && p.props.strokeWidth === 1)).toHaveLength(5);
    expect(UNSAFE_getAllByType('Line' as never)).toHaveLength(6);
    expect(UNSAFE_queryAllByType('Circle' as never)).toHaveLength(0);
  });

  it('adds r 3.5 vertex dots for `dots`, and draws outlines only for `lines`', () => {
    const dots = renderCard(<RadarChartCard testID="radar" variant="dots" data={DATA} series={DESKTOP} />);
    layout(dots.getByTestId, 'radar-plot');
    const circles = dots.UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    expect(circles.map((c) => c.props.r)).toEqual([3.5, 3.5, 3.5, 3.5, 3.5, 3.5]);
    expect(circles[0]!.props.strokeWidth).toBe(2);
    dots.unmount();

    const lines = renderCard(<RadarChartCard testID="radar" variant="lines" data={DATA} series={BOTH} />);
    layout(lines.getByTestId, 'radar-plot', 448, 189);
    const outlines = (lines.UNSAFE_getAllByType('Path' as never) as unknown as Node[]).filter(
      (p) => p.props.strokeWidth === 2,
    );
    expect(outlines.map((p) => p.props.fill)).toEqual(['none', 'none']);
    expect(outlines[1]!.props.d).toBe(
      'M224,76.9341L262.0313,72.5426L246.8188,107.6744L224,136.219L199.2797,108.7723L197.3781,79.1298L224,76.9341Z',
    );
    // Multi-series: a legend with each series' total.
    for (const text of ['Desktop', 'Mobile', '860']) expect(lines.getByText(text)).toBeTruthy();
    expect(lines.getAllByText('1,424')).toHaveLength(2);
  });

  it('tracks the axis under the pointer and clears outside the radar and on leave', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText, getAllByText, UNSAFE_getAllByType } = renderCard(
      <RadarChartCard testID="radar" data={DATA} series={BOTH} onActiveIndexChange={onActiveIndexChange} />,
    );
    layout(getByTestId, 'radar-plot', 448, 189);
    const surface = getByTestId('radar-plot-surface');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 262, offsetY: 75 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    // Header label + axis label.
    expect(getAllByText('February')).toHaveLength(2);
    expect(getByTestId('radar-headline').props.children).toBe('305');
    // Legend values follow the hovered axis; a pulsing dot per series.
    expect(getByText('200')).toBeTruthy();
    const halos = (UNSAFE_getAllByType('Circle' as never) as unknown as Node[]).filter((c) => c.props.strokeWidth === 3);
    expect(halos).toHaveLength(2);

    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 10, offsetY: 10 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 224, offsetY: 140 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(3);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('scores: no headline number, values on the labels, rose under `alertBelow`, the average in a disc', () => {
    const { getByTestId, getByText, queryByTestId } = renderCard(
      <RadarChartCard testID="radar" variant="score" data={SCORE} series={[{ key: 'score', label: 'Score' }]} alertBelow={50} />,
    );
    expect(getByText('Weekly score')).toBeTruthy();
    expect(queryByTestId('radar-headline')).toBeNull();
    layout(getByTestId, 'radar-plot', 448, 253);
    expect(getByText('81')).toBeTruthy();
    expect(getByText('Strong')).toBeTruthy();
    const disc = resolvedStyle(getByTestId('radar-score').props.style);
    expect(disc).toMatchObject({ width: 84, height: 84, borderRadius: 42 });
    const normal = resolvedStyle(getByTestId('radar-score-0').props.style).color;
    const alert = resolvedStyle(getByTestId('radar-score-1').props.style).color;
    expect(alert).not.toBe(normal);
    expect(defaultRadarScoreCaption(90)).toBe('Excellent');
    expect(defaultRadarScoreCaption(49)).toBe('Needs work');
  });

  it('puts the legend in the header for `top`, and tiles under the chart', () => {
    const top = renderCard(<RadarChartCard testID="radar" data={DATA} series={BOTH} legend="top" />);
    expect(resolvedStyle(top.getByTestId('radar-legend').props.style)).toMatchObject({ height: 32, columnGap: 12 });
    top.unmount();

    const tiles = renderCard(<RadarChartCard testID="radar" data={DATA} series={DESKTOP} tiles activeIndex={1} />);
    expect(resolvedStyle(tiles.getByTestId('radar').props.style).height).toBeUndefined();
    expect(resolvedStyle(tiles.getByTestId('radar-tiles-tile-0').props.style).opacity).toBe(0.4);
    expect(resolvedStyle(tiles.getByTestId('radar-tiles-tile-1').props.style).opacity).toBe(1);
  });
});
