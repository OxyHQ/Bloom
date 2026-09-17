import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import * as Reanimated from 'react-native-reanimated';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  AgentProgress,
  AgentProgressLoadingText,
  DEFAULT_AGENT_PROGRESS_STEPS,
} from '../agent-progress';
import { agentProgressExpandedHeight } from '../agent-progress/AgentProgress';
import {
  SHIMMER_PERIOD_MS,
  agentProgressShimmerCss,
  shimmerStrength,
} from '../agent-progress/AgentProgressLoadingText';
import { BUTTON_SHADOW, resolveButtonRamps } from '../button/shared';
import { buildTheme } from '../theme/build-theme';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const HIDDEN = { includeHiddenElements: true } as const;
/** Card entrance (650) + first row reveal (450): the clock start. */
const START_MS = 1100;

function renderProgress(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function hex(color: string): string {
  const m = color.match(/\d+(\.\d+)?/g)!.map(Number);
  return `#${m
    .slice(0, 3)
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')}`;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('AgentProgress', () => {
  it('keeps the card geometry: 341 wide, radius 16, 1px border, 45 + 38·n tall', () => {
    // Settled geometry: under reduced motion the height starts where it lands
    // (jest's reanimated mock never re-renders on a shared-value write).
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const { getByTestId } = renderProgress(<AgentProgress />);
    const theme = buildTheme('teal', 'light');
    const { neutral } = resolveButtonRamps(theme);
    const card = resolvedStyle(getByTestId('agent-progress').props.style);
    expect(card).toMatchObject({
      width: 341,
      maxWidth: '100%',
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      height: 235,
      backgroundColor: theme.colors.card,
      borderColor: hex(neutral[200]),
      boxShadow: BUTTON_SHADOW.light,
    });
    expect(agentProgressExpandedHeight(0)).toBe(45);
    expect(agentProgressExpandedHeight(3)).toBe(159);
  });

  it('paints the dark tokens: neutral-800 surface, neutral-700 border, dark shadow', () => {
    const { getByTestId } = renderProgress(<AgentProgress />, 'dark');
    const { neutral } = resolveButtonRamps(buildTheme('teal', 'dark'));
    expect(resolvedStyle(getByTestId('agent-progress').props.style)).toMatchObject({
      backgroundColor: neutral[800],
      borderColor: hex(neutral[700]),
      boxShadow: BUTTON_SHADOW.dark,
    });
  });

  it('lists every step and counts the ones left', () => {
    const { getByText, getAllByText } = renderProgress(<AgentProgress />);
    for (const step of DEFAULT_AGENT_PROGRESS_STEPS) expect(getAllByText(step).length).toBeGreaterThan(0);
    expect(getByText('5 steps left')).toBeTruthy();
  });

  it('advances one step per stepDuration once the reveal finishes, then calls onFinished', () => {
    const onFinished = jest.fn();
    const steps = ['One', 'Two'];
    const { getByText, queryByText } = renderProgress(
      <AgentProgress steps={steps} stepDuration={1000} completionDelay={500} onFinished={onFinished} />,
    );
    expect(getByText('2 steps left')).toBeTruthy();
    // Separate acts: each timer is scheduled by an effect the previous one's
    // state update runs, and effects flush when the act ends.
    act(() => jest.advanceTimersByTime(START_MS));
    act(() => jest.advanceTimersByTime(999));
    expect(getByText('2 steps left')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1));
    expect(getByText('1 step left')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1000));
    expect(getByText('All steps completed')).toBeTruthy();
    expect(queryByText('1 step left')).toBeNull();
    expect(onFinished).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(500));
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('holds everything while paused', () => {
    const onFinished = jest.fn();
    const { getByText } = renderProgress(
      <AgentProgress steps={['One']} stepDuration={100} completionDelay={0} onFinished={onFinished} paused />,
    );
    act(() => jest.advanceTimersByTime(10_000));
    expect(getByText('1 step left')).toBeTruthy();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('follows a controlled completedCount instead of its clock', () => {
    const steps = ['Plan', 'Edit', 'Test'];
    const view = renderProgress(<AgentProgress steps={steps} completedCount={1} stepDuration={100} />);
    act(() => jest.advanceTimersByTime(10_000));
    expect(view.getByText('2 steps left')).toBeTruthy();
    view.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentProgress steps={steps} completedCount={3} stepDuration={100} />
      </BloomThemeProvider>,
    );
    expect(view.getByText('All steps completed')).toBeTruthy();
  });

  it('marks the active row with the pill border and shimmering label, completed rows struck through', () => {
    const { UNSAFE_root } = renderProgress(
      <AgentProgress steps={['Done', 'Doing', 'Todo']} completedCount={1} paused />,
    );
    // Active row: padding 9 / 13 in longhands; others 4 / 4.
    const rows = UNSAFE_root.findAll(
      (n) => typeof n.type === 'string' && n.props.testID?.startsWith?.('agent-progress-step-'),
    );
    expect(rows).toHaveLength(3);
    const pads = rows.map((row) => {
      const innerNode = row.children[0] as unknown as { props: { style: unknown } };
      const s = resolvedStyle(innerNode.props.style);
      return [s.paddingLeft, s.paddingRight];
    });
    expect(pads).toEqual([
      [4, 4],
      [9, 13],
      [4, 4],
    ]);
    // One border, 32 tall, full pill, positioned on row 1 (38px down).
    const borders = UNSAFE_root.findAll(
      (n) =>
        typeof n.type === 'string' &&
        resolvedStyle(n.props.style).borderWidth === 1 &&
        resolvedStyle(n.props.style).height === 32,
    );
    expect(borders).toHaveLength(1);
    expect(resolvedStyle(borders[0]!.props.style)).toMatchObject({ top: 38, borderRadius: 9999 });
  });

  it('minimizes to the 44px bar with the current step, and expands back', () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const onMinimizedChange = jest.fn();
    // A fresh `steps` array per call, so the memoised card re-renders.
    const ui = () => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentProgress
          steps={['Read', 'Write']}
          completedCount={1}
          paused
          onMinimizedChange={onMinimizedChange}
        />
      </BloomThemeProvider>
    );
    const { getByTestId, getByLabelText, queryByTestId, getAllByText, rerender } = render(ui());
    expect(queryByTestId('agent-progress-minimized')).toBeNull();
    const minimize = getByLabelText('Minimize steps');
    expect(minimize.props.accessibilityRole).toBe('button');
    act(() => pressHost(minimize));
    expect(onMinimizedChange).toHaveBeenLastCalledWith(true);
    // Re-render so the mocked animated style re-reads the shared value.
    rerender(ui());
    expect(resolvedStyle(getByTestId('agent-progress').props.style).height).toBe(44);
    const bar = getByTestId('agent-progress-minimized');
    expect(bar.props.accessibilityLabel).toBe('Expand steps');
    expect(getAllByText('Write').length).toBeGreaterThan(0);
    act(() => pressHost(bar));
    expect(onMinimizedChange).toHaveBeenLastCalledWith(false);
    rerender(ui());
    expect(resolvedStyle(getByTestId('agent-progress').props.style).height).toBe(
      agentProgressExpandedHeight(2),
    );
  });

  it('reveals the expand glyph on hover', () => {
    const { getByTestId, UNSAFE_root } = renderProgress(
      <AgentProgress steps={['A', 'B']} defaultMinimized paused />,
    );
    const glyphOpacity = () => {
      const glyph = UNSAFE_root.findAll(
        (n) =>
          typeof n.type === 'string' &&
          resolvedStyle(n.props.style).right === 10 &&
          resolvedStyle(n.props.style).width === 20,
      );
      return resolvedStyle(glyph[0]!.props.style).opacity;
    };
    expect(glyphOpacity()).toBe(0);
    act(() => fireEvent(getByTestId('agent-progress-minimized'), 'hoverIn'));
    expect(glyphOpacity()).toBe(1);
  });

  it('localises its strings', () => {
    const { getByText, getByLabelText } = renderProgress(
      <AgentProgress
        steps={['A', 'B']}
        paused
        labels={{ stepsLeft: (n) => `quedan ${n}`, minimize: 'Minimizar' }}
      />,
    );
    expect(getByText('quedan 2')).toBeTruthy();
    expect(getByLabelText('Minimizar')).toBeTruthy();
  });
});

describe('AgentProgressLoadingText', () => {
  it('draws the shimmer on web: 300% gradient clipped to text, 3.4s sweep, static under reduced motion', () => {
    const css = agentProgressShimmerCss('k', 'rgb(1 2 3)', 'rgb(4 5 6)');
    expect(css).toContain(
      'linear-gradient(100deg, rgb(1 2 3) 16%, rgb(1 2 3) 38%, rgb(4 5 6) 50%, rgb(1 2 3) 62%, rgb(1 2 3) 84%)',
    );
    expect(css).toContain('background-size: 300% 100%;');
    expect(css).toContain('background-clip: text;');
    expect(css).toMatch(/from \{ background-position: 200% center; \}\s*to \{ background-position: -100% center; \}/);
    expect(css).toContain('3.4s linear infinite');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*color: rgb\(1 2 3\) !important;[\s\S]*animation: none;/);
    expect(SHIMMER_PERIOD_MS).toBe(3400);
  });

  it('samples the same gradient per glyph on native: highlight centre full, ±0.36 widths fades out, tiles repeat', () => {
    // phase 0.5 → centre at 0.5 widths
    expect(shimmerStrength(0.5, 0.5)).toBeCloseTo(1, 9);
    expect(shimmerStrength(0.5 + 0.18, 0.5)).toBeCloseTo(0.5, 9);
    expect(shimmerStrength(0.5 + 0.36, 0.5)).toBe(0);
    // phase 0 → centre at -2.5; the next tile's centre (0.5) is on the label
    expect(shimmerStrength(0.5, 0)).toBeCloseTo(1, 9);
  });

  it('names itself with its text and splits into per-glyph spans on native', () => {
    const { getByLabelText } = renderProgress(<AgentProgressLoadingText>Hi</AgentProgressLoadingText>);
    const node = getByLabelText('Hi');
    act(() => jest.advanceTimersByTime(100));
    expect(node.props.numberOfLines).toBe(1);
  });
});
