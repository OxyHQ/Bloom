import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import {
  FunnelChartCard,
  funnelBandPath,
  funnelGeometry,
  funnelPill,
  type FunnelRange,
  type FunnelStage,
} from '../chart-cards/FunnelChartCard';
import { resolveChartTones, resolveMonoTone } from '../chart-cards/palette';

// Demo stages. Every expected path below was read off the rendered
// SVG for the card at 480 wide (448 × 160 plot).
const STAGES: FunnelStage[] = [
  { label: 'Link opened', value: 197 },
  { label: 'Started', value: 110 },
  { label: 'Completed', value: 77 },
  { label: 'Converted', value: 38 },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown, id = 'funnel-plot', width = 448, height = 160) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('funnel geometry', () => {
  it('lays out 3px-apart columns and scales heights inside the 12px bleed', () => {
    const geo = funnelGeometry(448, 160, 4, 197, 'curved');
    expect(geo.colW).toBe(109.75);
    expect(geo.cy).toBe(80);
    expect(geo.columnX(3)).toEqual({ x0: 338.25, x1: 448 });
    expect(geo.heightOf(197)).toBe(136);
    expect(geo.heightOf(0)).toBe(2);
    expect(funnelGeometry(448, 160, 4, 197, 'sharp').heightOf(197)).toBe(160);
  });

  it('draws the curved band: flat 42%, then the S-curve into the next stage', () => {
    const geo = funnelGeometry(448, 160, 4, 197, 'curved');
    expect(funnelBandPath(0, 109.75, 80, geo.heightOf(197), geo.heightOf(110), 'curved')).toBe(
      'M0,12 L46.095,12 C77.9225,12 77.9225,42.03045685279188 109.75,42.03045685279188 L109.75,117.96954314720813 C77.9225,117.96954314720813 77.9225,148 46.095,148 L0,148 Z',
    );
    // The outer edge layer is the same band 12px taller on each side.
    expect(funnelBandPath(0, 109.75, 80, geo.heightOf(197) + 24, geo.heightOf(110) + 24, 'curved')).toBe(
      'M0,0 L46.095,0 C77.9225,0 77.9225,30.03045685279188 109.75,30.03045685279188 L109.75,129.96954314720813 C77.9225,129.96954314720813 77.9225,160 46.095,160 L0,160 Z',
    );
  });

  it('draws the sharp band as a trapezoid', () => {
    const geo = funnelGeometry(448, 160, 4, 197, 'sharp');
    expect(funnelBandPath(112.75, 222.5, 80, geo.heightOf(110), geo.heightOf(77), 'sharp')).toBe(
      'M112.75,35.32994923857868 L222.5,48.73096446700508 L222.5,111.26903553299492 L112.75,124.67005076142132 Z',
    );
  });

  it('sizes the percentage pill by its label and drops it when it outgrows the column', () => {
    expect(funnelPill(197, 197, 109.75)).toEqual({ label: '100%', width: expect.closeTo(44.8, 5) });
    expect(funnelPill(110, 197, 109.75)).toEqual({ label: '56%', width: expect.closeTo(37.6, 5) });
    expect(funnelPill(197, 197, 40)).toBeNull();
  });
});

describe('FunnelChartCard', () => {
  it("keeps the chart card shell and headlines the first stage", () => {
    const { getByTestId, getByText } = renderCard(
      <FunnelChartCard testID="funnel" stages={STAGES} delta={0.052} range="Last 7 days" />,
    );
    expect(resolvedStyle(getByTestId('funnel').props.style)).toMatchObject({ height: 329, borderRadius: 16 });
    expect(getByTestId('funnel-headline').props.children).toBe('197');
    expect(getByText('Sign-up funnel')).toBeTruthy();
    expect(getByText('+5.2%')).toBeTruthy();
  });

  it('draws two edge layers per stage, then the bands, then pills — in palette order', () => {
    const { getByTestId, UNSAFE_getAllByType, getByText } = renderCard(<FunnelChartCard testID="funnel" stages={STAGES} />);
    layoutPlot(getByTestId);
    const paths = UNSAFE_getAllByType('Path' as never) as unknown as Node[];
    const tones = resolveChartTones(buildTheme('teal', 'light'));
    const layers = paths.filter((p) => p.props.fillOpacity !== undefined);
    expect(layers.map((p) => p.props.fillOpacity)).toEqual([0.1, 0.1, 0.1, 0.1, 0.22, 0.22, 0.22, 0.22]);
    const bands = [0, 1, 2, 3].map((i) => getByTestId(`funnel-band-${i}`));
    expect(bands.map((b) => b.props.fill)).toEqual(tones.slice(0, 4).map((t) => t.color));
    for (const label of ['100%', '56%', '39%', '19%']) expect(getByText(label)).toBeTruthy();
    expect(resolvedStyle(getByTestId('funnel-pill-1').props.style)).toMatchObject({ height: 20, borderRadius: 10, top: 70 });
  });

  it('puts a 36px backing band behind every sharp column and no edge layers', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<FunnelChartCard testID="funnel" shape="sharp" stages={STAGES} />);
    layoutPlot(getByTestId);
    const rects = UNSAFE_getAllByType('Rect' as never) as unknown as Node[];
    expect(rects.map((r) => [r.props.y, r.props.height, r.props.fillOpacity])).toEqual(
      Array.from({ length: 4 }, () => [62, 36, 0.14]),
    );
    const paths = UNSAFE_getAllByType('Path' as never) as unknown as Node[];
    expect(paths.every((p) => p.props.fillOpacity === undefined)).toBe(true);
  });

  it('hovers the band under the pointer, keeps it over empty space and clears on leave', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getAllByText } = renderCard(
      <FunnelChartCard testID="funnel" stages={STAGES} delta={0.052} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('funnel-plot-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toBe(
      'Sign-up funnel funnel: Link opened 197 (100%), Started 110 (56%), Completed 77 (39%), Converted 38 (19%)',
    );

    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 170, offsetY: 60 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    expect(getAllByText('Started')).toHaveLength(2);
    expect(getByTestId('funnel-headline').props.children).toBe('110');
    const tones = resolveChartTones(buildTheme('teal', 'light'));
    expect(getByTestId('funnel-band-1').props.fill).toBe(tones[1]!.activeColor);
    expect(getByTestId('funnel-band-0').props.opacity).toBe(0.3);
    expect(resolvedStyle(getByTestId('funnel-tiles-tile-0').props.style).opacity).toBe(0.5);

    // Above the thin last band: nothing there, enter-only handling keeps the stage.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 400, offsetY: 10 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    // In the curve's taper, just outside the band edge — still empty space.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 105, offsetY: 20 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 20, offsetY: 20 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(0);
    // The pill hovers its own stage.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 393, offsetY: 80 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(3);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('reads a range, and tiles focus their stage', () => {
    const ranges: FunnelRange[] = [
      { id: '7d', label: 'Last 7 days', stages: STAGES, delta: 0.052 },
      { id: '30d', label: 'Last 30 days', stages: STAGES.map((s, i) => ({ ...s, value: [842, 463, 301, 152][i]! })), delta: 0.034 },
    ];
    const { getByTestId, getByText } = renderCard(<FunnelChartCard testID="funnel" ranges={ranges} defaultRange="30d" />);
    expect(getByTestId('funnel-headline').props.children).toBe('842');
    expect(getByText('+3.4%')).toBeTruthy();
    fireEvent(getByTestId('funnel-tiles-tile-2'), 'pointerEnter');
    expect(getByTestId('funnel-headline').props.children).toBe('301');
  });

  it('lays tiles two per row below `sm` without stretching', () => {
    const { getByTestId } = renderCard(
      <FunnelChartCard testID="funnel" stages={[...STAGES, { label: 'Retained', value: 12 }]} />,
    );
    // 375-wide test window: two per row, and the short last row keeps an empty
    // track so the fifth tile stays one column wide.
    const rows = getByTestId('funnel-tiles').props.children as React.ReactElement<{ children: unknown[] }>[];
    expect(rows).toHaveLength(3);
    const [tiles, empties] = rows[2]!.props.children as unknown[][];
    expect(tiles).toHaveLength(1);
    expect(empties).toHaveLength(1);
  });

  it('paints every column in the mono ink and hides the swatches', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<FunnelChartCard testID="funnel" mono stages={STAGES} />, 'dark');
    layoutPlot(getByTestId);
    const mono = resolveMonoTone(buildTheme('teal', 'dark'));
    expect([0, 1, 2, 3].map((i) => getByTestId(`funnel-band-${i}`).props.fill)).toEqual(Array(4).fill(mono.color));
    const views = UNSAFE_getAllByType('View' as never) as unknown as Node[];
    const swatches = views.filter((v) => resolvedStyle(v.props.style).width === 12 && resolvedStyle(v.props.style).borderRadius === 4);
    expect(swatches).toHaveLength(0);
  });
});
