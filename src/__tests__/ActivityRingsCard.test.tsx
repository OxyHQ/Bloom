import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { ActivityRingsCard, type ActivityRing } from '../chart-cards/ActivityRingsCard';
import { chartHueTone, resolveChartCardPalette } from '../chart-cards/palette';

// The no-selection defaults.
const RINGS: ActivityRing[] = [
  { label: 'Move', value: '1,592 kcal', goalPct: 82 },
  { label: 'Exercise', value: '1h 45m', goalPct: 60 },
  { label: 'Running', value: '5.2 km', goalPct: 75 },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The card at 480 wide: a 460 × 200 ring area. */
function layout(getByTestId: (id: string) => unknown, width = 460, height = 200) {
  act(() => {
    fireEvent(getByTestId('activity-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('ActivityRingsCard', () => {
  it('keeps the card geometry: 330 tall, radius 20, padding 10, tiles 57 tall with radius 10', () => {
    const { getByTestId, getByText } = renderCard(<ActivityRingsCard testID="activity" rings={RINGS} />);
    expect(resolvedStyle(getByTestId('activity').props.style)).toMatchObject({
      height: 330,
      borderRadius: 20,
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 10,
      paddingLeft: 10,
      gap: 16,
    });
    expect(resolvedStyle(getByTestId('activity-title').props.style)).toMatchObject({ paddingTop: 6, paddingLeft: 6, paddingRight: 6 });
    expect(resolvedStyle(getByTestId('activity-tile-0').props.style)).toMatchObject({
      borderRadius: 10,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 10,
      paddingRight: 10,
      justifyContent: 'flex-end',
    });
    for (const text of ['Activity', 'Move', '1,592 kcal', 'Exercise', '1h 45m', 'Running', '5.2 km']) {
      expect(getByText(text)).toBeTruthy();
    }
  });

  it('draws three 18-wide rings from twelve o’clock over a 16% track, in chart-3 / 2 / 4', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<ActivityRingsCard testID="activity" rings={RINGS} />);
    layout(getByTestId);
    const circles = UNSAFE_getAllByType('Circle' as never) as unknown as Node[];
    expect(circles).toHaveLength(6);
    const tracks = circles.filter((c) => c.props.opacity === 0.16);
    expect(tracks.map((c) => c.props.r)).toEqual([82, 58, 34]);
    const move = getByTestId('activity-ring-0');
    const c = 2 * Math.PI * 82;
    expect(move.props.strokeDasharray).toBe(`${(c * 82) / 100} ${c - (c * 82) / 100}`);
    expect(move.props.strokeLinecap).toBe('round');
    expect(move.props.strokeWidth).toBe(18);
    const theme = buildTheme('teal', 'light');
    expect(move.props.stroke).toBe(chartHueTone(theme, 3).color);
    expect(getByTestId('activity-ring-1').props.stroke).toBe(chartHueTone(theme, 2).color);
    expect(getByTestId('activity-ring-2').props.stroke).toBe(chartHueTone(theme, 4).color);
  });

  it('hovers a ring band: darkens it, dims the other rings, tracks and tiles; the gap keeps it', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, UNSAFE_getAllByType } = renderCard(
      <ActivityRingsCard testID="activity" rings={RINGS} onActiveIndexChange={onActiveIndexChange} />,
    );
    layout(getByTestId);
    const surface = getByTestId('activity-plot-surface');
    expect(surface.props.role).toBe('img');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 230 + 58, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    const theme = buildTheme('teal', 'light');
    expect(getByTestId('activity-ring-1').props.stroke).toBe(chartHueTone(theme, 2).activeColor);
    expect(getByTestId('activity-ring-0').props.opacity).toBe(0.5);
    const tracks = (UNSAFE_getAllByType('Circle' as never) as unknown as Node[]).filter((c) => c.props.strokeDasharray === undefined);
    expect(tracks.map((c) => c.props.opacity)).toEqual([0.06, 0.16, 0.06]);
    expect(resolvedStyle(getByTestId('activity-tile-0').props.style).opacity).toBe(0.5);
    expect(resolvedStyle(getByTestId('activity-tile-1').props.style).opacity).toBe(1);

    // 70px from the centre sits between the Move and Exercise bands.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 230 + 70, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('caps the drawing at 210 tall and centres it in a taller area', () => {
    const { getByTestId, UNSAFE_getByType } = renderCard(<ActivityRingsCard testID="activity" rings={RINGS} height={420} />);
    layout(getByTestId, 460, 290);
    const svg = UNSAFE_getByType('Svg' as never) as unknown as Node;
    expect(svg.props.height).toBe(210);
    expect(resolvedStyle(svg.props.style as never).top).toBe(40);
  });

  it('paints the dark tiles in background-inner', () => {
    const { getByTestId } = renderCard(<ActivityRingsCard testID="activity" rings={RINGS} />, 'dark');
    const palette = resolveChartCardPalette(buildTheme('teal', 'dark'));
    expect(resolvedStyle(getByTestId('activity-tile-0').props.style).backgroundColor).toBe(palette.inner);
  });
});
