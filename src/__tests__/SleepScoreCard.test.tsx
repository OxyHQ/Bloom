import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { resolveButtonRamps } from '../button/shared';
import { SleepScoreCard, defaultSleepScoreLabel, type SleepMetric } from '../chart-cards/SleepScoreCard';
import { pieSectorAngles, sectorPath } from '../chart-cards/polar-geometry';

// Demo metrics; paths from recharts 3.10's
// SVG at 480 wide (a 460 × 104 ring area).
const METRICS: SleepMetric[] = [
  { label: 'Duration', detail: '7h 50m', score: 49, max: 50 },
  { label: 'Bedtime', detail: '20m earlier', score: 29, max: 30 },
  { label: 'Interruptions', detail: '5m wake up', score: 20, max: 20 },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layout(getByTestId: (id: string) => unknown) {
  act(() => {
    fireEvent(getByTestId('sleep-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 460, height: 104 } } });
  });
}

describe('sleep ring geometry matches recharts', () => {
  const ring = { cx: 230, cy: 52, innerRadius: 37, outerRadius: 52, cornerRadius: 99 };
  const arcs = pieSectorAngles([49, 29, 20, 2], 90, -270, 4);

  it('spaces every slice 4° apart round the full circle', () => {
    expect(sectorPath({ ...ring, ...arcs[0]! })).toBe(
      'M 230,8.1366 A7.5,7.5,0,0,1,238.764,0.7439 A52,52,0,0,1,248.7562,100.4996 A7.5,7.5,0,0,1,238.6999,94.992 L238.6999,94.992 A7.5,7.5,0,0,1,243.3457,86.5093 A37,37,0,0,0,236.236,15.5293 A7.5,7.5,0,0,1,230,8.1366Z',
    );
    expect(sectorPath({ ...ring, ...arcs[2]! })).toBe(
      'M 186.4032,47.1715 A7.5,7.5,0,0,1,180.0201,37.6469 A52,52,0,0,1,208.3675,4.7133 A7.5,7.5,0,0,1,218.7361,9.6075 L218.7361,9.6075 A7.5,7.5,0,0,1,214.6076,18.3537 A37,37,0,0,0,194.4374,41.7872 A7.5,7.5,0,0,1,186.4032,47.1715Z',
    );
    // Too short to round both ends: a plain wedge, as recharts falls back to.
    expect(sectorPath({ ...ring, ...arcs[3]! })).toBe(
      'M 220.1849,0.9347 A 52,52,0, 0,1, 226.3727,0.1267 L 227.419,15.0901 A 37,37,0, 0,0, 223.0162,15.6651 Z',
    );
  });

  it('draws the full track without corners', () => {
    expect(sectorPath({ ...ring, cornerRadius: 0, startAngle: 0, endAngle: 360 })).toBe(
      'M 282,52 A 52,52,0, 1,0, 282,52.0009 L 267,52.0006 A 37,37,0, 1,1, 267,52 Z',
    );
  });
});

describe('SleepScoreCard', () => {
  it('reads the verdict, the total and every sub-score row', () => {
    const { getByTestId, getByText } = renderCard(<SleepScoreCard testID="sleep" metrics={METRICS} range="29 Jun - 5 Jul" />);
    expect(getByTestId('sleep-verdict').props.children).toBe('Excellent');
    expect(getByTestId('sleep-score').props.children).toBe(98);
    expect(getByText('29 Jun - 5 Jul')).toBeTruthy();
    expect(resolvedStyle(getByTestId('sleep-range').props.style)).toMatchObject({ width: 151, height: 32, borderRadius: 10, borderWidth: 1 });
    for (const text of ['Duration: 7h 50m', 'Bedtime: 20m earlier', 'Interruptions: 5m wake up', '49/50', '29/30', '20/20']) {
      expect(getByText(text)).toBeTruthy();
    }
    expect(defaultSleepScoreLabel(75)).toBe('Good');
    expect(defaultSleepScoreLabel(49)).toBe('Poor');
  });

  it('rules every row but the last, inset left and running to the right edge', () => {
    const { getByTestId } = renderCard(<SleepScoreCard testID="sleep" metrics={METRICS} />);
    expect(resolvedStyle(getByTestId('sleep-metrics').props.style)).toMatchObject({ borderRadius: 10, paddingLeft: 10 });
    const first = resolvedStyle(getByTestId('sleep-metric-0').props.style);
    expect(first).toMatchObject({ borderBottomWidth: 1, paddingRight: 10, paddingTop: 8, paddingBottom: 8, flex: 1 });
    expect(first.borderBottomColor).toBe(resolveButtonRamps(buildTheme('teal', 'light')).neutral[200]);
    expect(resolvedStyle(getByTestId('sleep-metric-2').props.style).borderBottomWidth).toBe(0);
  });

  it('draws an arc per sub-score over the track and swaps the centre for a hovered arc', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId } = renderCard(
      <SleepScoreCard testID="sleep" metrics={METRICS} onActiveIndexChange={onActiveIndexChange} />,
    );
    layout(getByTestId);
    const surface = getByTestId('sleep-plot-surface');
    expect(surface.props.role).toBe('img');
    // Bedtime sits at the lower left of the ring.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 200, offsetY: 85 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    expect(getByTestId('sleep-score').props.children).toBe(29);
    expect(getByTestId('sleep-arc-0').props.opacity).toBe(0.7);
    expect(getByTestId('sleep-arc-1').props.opacity).toBe(1);
    // The unearned sliver near twelve o'clock focuses nothing.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 224, offsetY: 7 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    expect(getByTestId('sleep-score').props.children).toBe(98);
  });
});
