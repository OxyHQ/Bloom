import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { AgentThinking } from '../agent-thinking';
import { dotOpacities } from '../agent-thinking/AgentThinking';
import { resolveButtonRamps } from '../button/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { resolvedStyle } from './support/rendered-style';

jest.mock('../styles/adopt-style-sheet', () => ({ adoptStyleSheet: jest.fn(), dropStyleSheet: jest.fn() }));

function renderThinking(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('AgentThinking', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('is a status row: centred, gap 10, label on body-medium', () => {
    const { getByTestId } = renderThinking(<AgentThinking testID="t" label="Searching the docs" />);
    expect(getByTestId('t').props.role).toBe('status');
    expect(resolvedStyle(getByTestId('t', { includeHiddenElements: true }).props.style)).toMatchObject({
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    });
    expect(resolvedStyle(getByTestId('t-label', { includeHiddenElements: true }).props.style)).toMatchObject({
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    });
  });

  it('renders the indicator each variant names', () => {
    const variants = [
      ['wave', 'agent-thinking-dots'],
      ['spin', 'agent-thinking-dots'],
      ['stars', 'agent-thinking-stars'],
      ['infinity', 'agent-thinking-infinity'],
    ] as const;
    for (const [variant, testID] of variants) {
      const { getByTestId, unmount } = renderThinking(<AgentThinking variant={variant} />);
      expect(getByTestId(testID, { includeHiddenElements: true })).toBeTruthy();
      unmount();
    }
  });

  it('lays the dots out as a 16px 3×3 grid of 4px cells, 2px apart', () => {
    const { getByTestId } = renderThinking(<AgentThinking variant="wave" />);
    const grid = getByTestId('agent-thinking-dots', { includeHiddenElements: true });
    expect(resolvedStyle(grid.props.style)).toMatchObject({ width: 16, rowGap: 2, columnGap: 2 });
    expect(grid.children).toHaveLength(9);
  });

  it('keeps the comet maths: head lit to 1, floor 0.12', () => {
    const wave = dotOpacities('wave', 0);
    expect(wave[0]).toBeCloseTo(1);
    expect(Math.min(...wave)).toBeCloseTo(0.12);
    expect(dotOpacities('spin', 0.5)).toHaveLength(9);
  });

  it('pulls the infinity box in 4px per side, with longhand margins', () => {
    const { getByTestId } = renderThinking(<AgentThinking variant="infinity" />);
    const box = resolvedStyle(getByTestId('agent-thinking-infinity', { includeHiddenElements: true }).props.style);
    expect(box).toMatchObject({ width: 32, height: 16, marginLeft: -4, marginRight: -4 });
    expect(box.marginHorizontal).toBeUndefined();
  });

  it('colours by tone: default text-secondary, stars subtle, accent the accent-500', () => {
    const theme = buildTheme('teal', 'light');
    const { neutral, accent } = resolveButtonRamps(theme);
    const color = (ui: React.ReactElement) => {
      const { getByTestId, unmount } = renderThinking(ui);
      const value = resolvedStyle(getByTestId('t-label', { includeHiddenElements: true }).props.style).color;
      unmount();
      return value;
    };
    expect(color(<AgentThinking testID="t" />)).toBe(neutral[500]);
    expect(color(<AgentThinking testID="t" variant="stars" />)).toBe(neutral[400]);
    expect(color(<AgentThinking testID="t" tone="accent" />)).toBe(accent[500]);
    expect(color(<AgentThinking testID="t" tone="primary" />)).toBe(theme.colors.text);
  });

  it('counts elapsed seconds to one decimal, and hides the timer on request', () => {
    jest.useFakeTimers();
    const { getByTestId, queryByTestId, unmount } = renderThinking(<AgentThinking />);
    expect(getByTestId('agent-thinking-timer', { includeHiddenElements: true }).props.children).toBe('0.0s');
    act(() => {
      jest.advanceTimersByTime(1250);
    });
    expect(getByTestId('agent-thinking-timer', { includeHiddenElements: true }).props.children).toBe('1.2s');
    unmount();
    const hidden = renderThinking(<AgentThinking showTimer={false} />);
    expect(hidden.queryByTestId('agent-thinking-timer', { includeHiddenElements: true })).toBeNull();
    expect(queryByTestId).toBeDefined();
  });

  it('adopts the shimmer sheet on web and hooks the label through dataSet', () => {
    const previous = Platform.OS;
    Platform.OS = 'web';
    try {
      const { getByTestId } = renderThinking(<AgentThinking testID="t" />);
      const label = getByTestId('t-label', { includeHiddenElements: true });
      expect(label.props.dataSet).toEqual({ bloomAgentThinkingLabel: '' });
      const style = resolvedStyle(label.props.style);
      expect(style['--bloom-agent-thinking-tone']).toBe(style.color);
      expect(String(style['--bloom-agent-thinking-soft'])).toMatch(/0\.55\)$/);
      expect(adoptStyleSheet).toHaveBeenCalledWith(
        'bloom-agent-thinking-web-css',
        expect.stringContaining('animation: bloom-agent-thinking-shimmer 2.6s linear infinite'),
      );
      const css = jest.mocked(adoptStyleSheet).mock.calls.find(([id]) => id === 'bloom-agent-thinking-web-css')![1];
      expect(css).toContain('color: transparent !important');
      expect(css).toContain('prefers-reduced-motion: reduce');
    } finally {
      Platform.OS = previous;
    }
  });

  it('adopts nothing and keeps a flat label off the web', () => {
    const { getByTestId } = renderThinking(<AgentThinking testID="t" />);
    expect(getByTestId('t-label', { includeHiddenElements: true }).props.dataSet).toBeUndefined();
  });

  it('softens the star glyphs to 75% in light mode only', () => {
    const star = (mode: 'light' | 'dark') => {
      const { UNSAFE_root, unmount } = renderThinking(<AgentThinking variant="stars" />, mode);
      const paths = UNSAFE_root.findAll(
        (node) => typeof node.props.d === 'string' && typeof node.props.fill === 'string',
      );
      const fill = paths[0]!.props.fill as string;
      unmount();
      return fill;
    };
    expect(star('light')).toMatch(/0\.75\)$/);
    expect(star('dark')).not.toMatch(/0\.75\)$/);
  });
});
