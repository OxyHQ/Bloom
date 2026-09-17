import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { resolveButtonRamps } from '../button/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { purpleChip, purpleStop } from '../chart-cards/ai-profile-hues';
import { linearPath } from '../chart-cards/geometry';
import { resolveChartCardPalette } from '../chart-cards/palette';
import {
  TokensChartCard,
  tokensAreaPath,
  tokensPoints,
  tokensSegments,
  type TokensPoint,
} from '../chart-cards/TokensChartCard';

// The demo tokens series (millions, Jun 14 → Jul 13).
const VALUES = [
  34.2, 28.6, 6.1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 31.4, 4.8, 2.2, 1.1, 5.6, 1.4, 0.8, 42.1,
  51.8, 48.3, 33.6, 9.2, 3.4, 18.7, 25.3, 37.9, 30.2, 24.6,
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DATA: TokensPoint[] = VALUES.map((value, day) => {
  const d = new Date(Date.UTC(2026, 5, 14 + day));
  return { label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`, value };
});

// Read off recharts' SVG for the card at 680 wide (a 680 × 200 surface,
// margin top 27, bottom 2).
const RECHARTS = {
  run0: 'M0,100.53L23.448,116.49L46.897,180.615L70.345,198',
  idle3: 'M70.345,198L93.793,198L117.241,198L140.69,198L164.138,198L187.586,198L211.034,198L234.483,198L257.931,198',
  run12:
    'M257.931,198L281.379,108.51L304.828,184.32L328.276,191.73L351.724,194.865L375.172,182.04L398.621,194.01L422.069,195.72L445.517,78.015L468.966,50.37L492.414,60.345L515.862,102.24L539.31,171.78L562.759,188.31L586.207,144.705L609.655,125.895L633.103,89.985L656.552,111.93L680,127.89',
};

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layoutPlot(getByTestId: (id: string) => unknown) {
  act(() => {
    fireEvent(getByTestId('tokens-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 680, height: 200 } } });
  });
}

describe('tokens geometry matches recharts', () => {
  it('cuts the series into solid runs that reach into the idle stretch, and a dashed idle run', () => {
    expect(tokensSegments(VALUES)).toEqual([
      { key: 'run-0', dashed: false, from: 0, to: 3 },
      { key: 'idle-3', dashed: true, from: 3, to: 11 },
      { key: 'run-12', dashed: false, from: 11, to: 29 },
    ]);
    expect(tokensSegments([0, 0, 5])).toEqual([
      { key: 'idle-0', dashed: true, from: 0, to: 1 },
      { key: 'run-2', dashed: false, from: 1, to: 2 },
    ]);
  });

  it('lands every segment on the recharts path: point scale edge to edge, [0, 60] from five nice ticks', () => {
    const points = tokensPoints(VALUES, 680, 27, 198);
    expect(linearPath(points.slice(0, 4))).toBe(RECHARTS.run0);
    expect(linearPath(points.slice(3, 12))).toBe(RECHARTS.idle3);
    expect(linearPath(points.slice(11))).toBe(RECHARTS.run12);
    expect(tokensAreaPath(points, 198).endsWith('L680,127.89L680,198L0,198Z')).toBe(true);
  });
});

describe('TokensChartCard', () => {
  it('keeps the card shell: radius 20, 12 top and bottom only, the header over the plot', () => {
    const { getByTestId } = renderCard(<TokensChartCard testID="tokens" data={DATA} headline={667.7} delta="+9.4%" />);
    const theme = buildTheme('teal', 'light');
    expect(resolvedStyle(getByTestId('tokens').props.style)).toMatchObject({
      borderRadius: 20,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: resolveChartCardPalette(theme).surface,
    });
    expect(resolvedStyle(getByTestId('tokens').props.style).paddingLeft).toBeUndefined();
    expect(resolvedStyle(getByTestId('tokens-plot').props.style)).toMatchObject({ height: 200 });
    expect(getByTestId('tokens-headline').props.children).toBe('667.7M tokens');
    const chip = purpleChip(theme, resolveChartCardPalette(theme).surface);
    expect(resolvedStyle(getByTestId('tokens-delta').props.style).backgroundColor).toBe(chip.background);
    expect(chip).toEqual({ background: purpleStop(theme, 100), foreground: purpleStop(theme, 600) });
  });

  it('draws the area, the purple runs and the grey dashed idle run', () => {
    const theme = buildTheme('teal', 'light');
    const { getByTestId } = renderCard(<TokensChartCard testID="tokens" data={DATA} headline={667.7} />);
    layoutPlot(getByTestId);
    expect(getByTestId('tokens-run-0').props).toMatchObject({ d: RECHARTS.run0, stroke: purpleStop(theme, 400), strokeWidth: 2 });
    expect(getByTestId('tokens-idle-3').props).toMatchObject({
      d: RECHARTS.idle3,
      stroke: resolveButtonRamps(theme).neutral[400],
      strokeDasharray: '5 5',
    });
    expect(getByTestId('tokens-run-12').props.d).toBe(RECHARTS.run12);
    expect(getByTestId('tokens-area').props.stroke).toBe('none');
  });

  it('hovers the nearest day inside the plot: date label, value, dashed cursor and pulsing dot; outside clears', () => {
    const onActiveIndexChange = jest.fn();
    const theme = buildTheme('teal', 'light');
    const { getByTestId, getByText, queryByTestId } = renderCard(
      <TokensChartCard testID="tokens" data={DATA} headline={667.7} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('tokens-plot-surface');
    expect(surface.props.role).toBe('img');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 486, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(21);
    expect(getByText('Jul 5')).toBeTruthy();
    expect(getByTestId('tokens-cursor').props).toMatchObject({ y1: 27, y2: 198, strokeDasharray: '4 4', strokeWidth: 1 });
    expect(getByTestId('tokens-cursor').props.x1).toBeCloseTo(492.414, 3);

    // Above the 27px top margin the day clears, as recharts' inactive tooltip does.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 486, offsetY: 10 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    expect(queryByTestId('tokens-cursor')).toBeNull();

    // An idle day: the dot is neutral-400.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 164, offsetY: 150 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(7);
    expect(getByTestId('tokens-dot')).toBeTruthy();

    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    expect(getByText('Tokens')).toBeTruthy();
    expect(purpleStop(theme, 500)).toMatch(/^rgb/);
  });

  it('sums the data for the resting headline and takes a custom format', () => {
    const { getByTestId, queryByTestId } = renderCard(
      <TokensChartCard testID="tokens" data={DATA.slice(0, 3)} format={(v) => `${v.toFixed(1)}K`} />,
    );
    expect(getByTestId('tokens-headline').props.children).toBe('68.9K');
    expect(queryByTestId('tokens-delta')).toBeNull();
  });

  it('mixes the dark chip over the card: purple-900 at 50% with purple-300 text', () => {
    const theme = buildTheme('teal', 'dark');
    const { getByTestId } = renderCard(<TokensChartCard testID="tokens" data={DATA} delta="+9.4%" />, 'dark');
    const chip = purpleChip(theme, resolveChartCardPalette(theme).surface);
    expect(chip.foreground).toBe(purpleStop(theme, 300));
    expect(resolvedStyle(getByTestId('tokens-delta').props.style).backgroundColor).toBe(chip.background);
  });
});
