import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import {
  AGENTS_ZERO_BAR,
  AgentsChartCard,
  agentsBarHeights,
  agentsColumnAt,
  type AgentsPoint,
} from '../chart-cards/AgentsChartCard';
import { purpleStop } from '../chart-cards/ai-profile-hues';
import { resolveChartCardPalette } from '../chart-cards/palette';

// December's bar heights, ~5px per agent.
const DECEMBER = [
  73, 141, 118, 0, 118, 18, 0, 0, 0, 95,
  0, 158, 78, 45, 0, 45, 135, 88, 0, 0,
  107, 21, 45, 105, 87, 66, 19, 128, 98, 34,
];
const DATA: AgentsPoint[] = DECEMBER.map((h, day) => ({ label: `Dec ${day + 1}`, value: h / 5 }));
const MAX = 158 / 5;

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The card at 680 wide: a 660 × 206 track. */
function layoutPlot(getByTestId: (id: string) => unknown, width = 660) {
  act(() => {
    fireEvent(getByTestId('agents-plot') as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 206 } } });
  });
}

describe('agents bar geometry', () => {
  it("draws each day at its target height and an idle day as the 4px stub", () => {
    const heights = agentsBarHeights(DATA.map((d) => d.value), 158, MAX);
    expect(heights[0]).toBeCloseTo(73, 9);
    expect(heights[11]).toBeCloseTo(158, 9);
    expect(heights[3]).toBe(AGENTS_ZERO_BAR);
    // Without `max` the tallest value stands for the full 158.
    expect(agentsBarHeights([5, 10], 158)).toEqual([79, 158]);
  });

  it('finds the column under the pointer: 15.23px bars on a 22.23px pitch, gaps keep the last day', () => {
    // bar 0 at x 0 (w 15.2), bar 11 from 244.57.
    expect(agentsColumnAt(0, 660, 30)).toBe(0);
    expect(agentsColumnAt(15, 660, 30)).toBe(0);
    expect(agentsColumnAt(18, 660, 30)).toBeUndefined();
    expect(agentsColumnAt(251, 660, 30)).toBe(11);
    expect(agentsColumnAt(659, 660, 30)).toBe(29);
    expect(agentsColumnAt(700, 660, 30)).toBeUndefined();
  });
});

describe('AgentsChartCard', () => {
  it('keeps the card shell: radius 20, padding 12 / 10, gap 10, the pill 16 from the top right', () => {
    const { getByTestId } = renderCard(
      <AgentsChartCard testID="agents" data={DATA} headline={32} max={MAX} range="December" onNextRange={() => {}} />,
    );
    const palette = resolveChartCardPalette(buildTheme('teal', 'light'));
    expect(resolvedStyle(getByTestId('agents').props.style)).toMatchObject({
      borderRadius: 20,
      gap: 10,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 10,
      paddingRight: 10,
      backgroundColor: palette.surface,
    });
    expect(resolvedStyle(getByTestId('agents-range').props.style)).toMatchObject({
      position: 'absolute',
      top: 16,
      right: 16,
      width: 128,
      height: 32,
    });
    expect(resolvedStyle(getByTestId('agents-plot').props.style)).toMatchObject({ height: 206, gap: 7, flexDirection: 'row' });
  });

  it('paints purple-300 bars (500 in dark), radius 4, and the idle stubs in chart-track', () => {
    const light = buildTheme('teal', 'light');
    const { getByTestId } = renderCard(<AgentsChartCard testID="agents" data={DATA} headline={32} max={MAX} />);
    const bar = resolvedStyle(getByTestId('agents-bar-11').props.style);
    expect(bar).toMatchObject({ borderRadius: 4, backgroundColor: purpleStop(light, 300) });
    expect(bar.height).toBeCloseTo(158, 9);
    expect(resolvedStyle(getByTestId('agents-bar-3').props.style)).toMatchObject({
      height: 4,
      backgroundColor: resolveChartCardPalette(light).track,
    });

    const dark = buildTheme('teal', 'dark');
    const darkCard = renderCard(<AgentsChartCard testID="agents" data={DATA} headline={32} max={MAX} />, 'dark');
    expect(resolvedStyle(darkCard.getByTestId('agents-bar-0').props.style).backgroundColor).toBe(purpleStop(dark, 500));
  });

  it('headlines the resting count and names the plot', () => {
    const { getByTestId, getByText } = renderCard(<AgentsChartCard testID="agents" data={DATA} headline={32} max={MAX} />);
    expect(getByText('Agents')).toBeTruthy();
    expect(getByTestId('agents-headline').props.children).toBe('32 agents');
    const surface = getByTestId('agents-plot-surface');
    expect(surface.props.role).toBe('img');
    expect(surface.props.accessibilityLabel).toMatch(/^Agents bar chart: Dec 1 15 agents, Dec 2 28 agents/);
    expect(getByText('Jun 14')).toBeTruthy();
    expect(getByText('Today')).toBeTruthy();
  });

  it('hovers the day under the pointer: its label, its rounded count, the -active colour; leaving clears', () => {
    const onActiveIndexChange = jest.fn();
    const theme = buildTheme('teal', 'light');
    const { getByTestId, getByText } = renderCard(
      <AgentsChartCard
        testID="agents"
        data={DATA}
        headline={32}
        max={MAX}
        onActiveIndexChange={onActiveIndexChange}
      />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('agents-plot-surface');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 26, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    expect(getByText('Dec 2')).toBeTruthy();
    expect(resolvedStyle(getByTestId('agents-bar-1').props.style).backgroundColor).toBe(purpleStop(theme, 400));

    // A gap between columns keeps the day.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 40, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenCalledTimes(1);

    // An idle day's stub takes the cursor colour.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 70, offsetY: 100 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(3);
    expect(resolvedStyle(getByTestId('agents-bar-3').props.style).backgroundColor).toBe(
      resolveChartCardPalette(theme).cursor,
    );

    act(() => {
      fireEvent(surface, 'pointerLeave');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    expect(getByText('Agents')).toBeTruthy();
  });

  it('scrubs with a finger on native and lets go to clear', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId } = renderCard(
      <AgentsChartCard testID="agents" data={DATA} headline={32} max={MAX} onActiveIndexChange={onActiveIndexChange} />,
    );
    layoutPlot(getByTestId);
    const surface = getByTestId('agents-plot-surface');
    // jest runs as iOS: the responder is wired.
    expect(typeof surface.props.onResponderGrant).toBe('function');
    act(() => {
      fireEvent(surface, 'responderGrant', { nativeEvent: { locationX: 251, locationY: 50 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(11);
    act(() => {
      fireEvent(surface, 'responderRelease');
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('turns the month pill chevrons into buttons', () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    const { getByTestId } = renderCard(
      <AgentsChartCard
        testID="agents"
        data={DATA}
        headline={32}
        range="December"
        onPrevRange={onPrev}
        onNextRange={onNext}
        prevRangeLabel="Previous month"
      />,
    );
    const prev = getByTestId('agents-range-prev');
    expect(prev.props.accessibilityLabel).toBe('Previous month');
    fireEvent.press(prev);
    fireEvent.press(getByTestId('agents-range-next'));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('takes a controlled day, a custom format and colours', () => {
    const { getByTestId, getByText } = renderCard(
      <AgentsChartCard
        testID="agents"
        data={DATA}
        headline={32}
        activeIndex={0}
        format={(v) => `${v} runs`}
        color="#fdba74"
        activeColor="#f97316"
        getPointTitle={(p) => `Day ${p.label}`}
      />,
    );
    expect(getByText('Day Dec 1')).toBeTruthy();
    expect(resolvedStyle(getByTestId('agents-bar-0').props.style).backgroundColor).toBe('#f97316');
    expect(resolvedStyle(getByTestId('agents-bar-1').props.style).backgroundColor).toBe('#fdba74');
  });
});
