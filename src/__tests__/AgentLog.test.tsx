import React from 'react';
import { Platform, Text } from 'react-native';
import { act, render, renderHook } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import {
  AGENT_LOG_BRANCH,
  AGENT_LOG_UNIT_MOTION,
  AgentLogGuideBridge,
  AgentLogReveal,
  AgentLogRow,
  AgentLogShimmerText,
  AgentLogWorkingRow,
  useAgentLogRevealTicker,
} from '../agent-log';
import { resolveButtonRamps } from '../button/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { resolvedStyle } from './support/rendered-style';

jest.mock('../styles/adopt-style-sheet', () => ({ adoptStyleSheet: jest.fn(), dropStyleSheet: jest.fn() }));

function renderLog(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('AgentLog', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the motion numbers', () => {
    expect(AGENT_LOG_UNIT_MOTION).toEqual({
      heightMs: 380,
      revealMs: 420,
      fadeMs: 440,
      liftPx: 4,
      blurPx: 6,
      fadePx: 22,
    });
    expect(AGENT_LOG_BRANCH).toEqual({ y: 14, radius: 6, width: 12 });
  });

  it('a row is a clipped listitem whose content box is relative with a 16px left inset', () => {
    const { getByTestId, getByText } = renderLog(
      <AgentLogRow testID="row" first last={false} reduce>
        <Text>Step</Text>
      </AgentLogRow>,
    );
    const row = getByTestId('row', { includeHiddenElements: true });
    expect(row.props.role).toBe('listitem');
    expect(resolvedStyle(row.props.style).overflow).toBe('hidden');
    expect(getByText('Step')).toBeTruthy();
    const content = row.children[0] as ReactTestInstance;
    expect(resolvedStyle(content.props.style)).toMatchObject({ position: 'relative', paddingLeft: 16 });
  });

  it('a caller overrides the inset by longhand (Web Search uses 14)', () => {
    const { getByTestId } = renderLog(
      <AgentLogRow testID="row" first last reduce style={{ paddingLeft: 14 }}>
        <Text>Step</Text>
      </AgentLogRow>,
    );
    const content = getByTestId('row', { includeHiddenElements: true }).children[0] as ReactTestInstance;
    expect(resolvedStyle(content.props.style).paddingLeft).toBe(14);
  });

  it('draws the trunk below every row but the last, 1px wide from the elbow down, in icon-quaternary', () => {
    const theme = buildTheme('teal', 'light');
    const { getByTestId, queryByTestId, unmount } = renderLog(
      <AgentLogRow first last={false} reduce>
        <Text>a</Text>
      </AgentLogRow>,
    );
    const trunk = resolvedStyle(getByTestId('agent-log-row-trunk', { includeHiddenElements: true }).props.style);
    expect(trunk).toMatchObject({ width: 1, top: 8, bottom: 0, left: 0, transformOrigin: 'top' });
    expect(trunk.backgroundColor).toBe(resolveButtonRamps(theme).neutral[300]);
    unmount();

    const last = renderLog(
      <AgentLogRow first last reduce>
        <Text>b</Text>
      </AgentLogRow>,
    );
    expect(last.queryByTestId('agent-log-row-trunk', { includeHiddenElements: true })).toBeNull();
    expect(queryByTestId).toBeDefined();
  });

  it('uses neutral-700 for the guide in dark mode', () => {
    const theme = buildTheme('teal', 'dark');
    const { getByTestId } = renderLog(<AgentLogGuideBridge height={6} offset={7} reduce />, 'dark');
    const bridge = resolvedStyle(getByTestId('agent-log-guide-bridge', { includeHiddenElements: true }).props.style);
    expect(bridge).toMatchObject({ top: -6, height: 6, left: 7, width: 1 });
    expect(bridge.backgroundColor).toBe(resolveButtonRamps(theme).neutral[700]);
  });

  it('settles a reveal and reports it once', () => {
    const onRevealed = jest.fn();
    const { getByTestId } = renderLog(
      <AgentLogReveal testID="unit" onRevealed={onRevealed}>
        <Text>unit</Text>
      </AgentLogReveal>,
    );
    // The jest reanimated mock completes timings synchronously.
    expect(onRevealed).toHaveBeenCalledTimes(1);
    expect(resolvedStyle(getByTestId('unit', { includeHiddenElements: true }).props.style)).toMatchObject({ opacity: 1, height: 'auto' });
  });

  it('a working row is the stars thinking state, 4px above and below', () => {
    const { getByTestId, getByText, UNSAFE_root } = renderLog(
      <AgentLogWorkingRow label="Searching" reduce />,
    );
    expect(getByTestId('agent-thinking-stars', { includeHiddenElements: true })).toBeTruthy();
    expect(getByText('Searching')).toBeTruthy();
    const padded = UNSAFE_root.findAll((node) => {
      const style = resolvedStyle(node.props.style);
      return style.paddingTop === 4 && style.paddingBottom === 4;
    });
    expect(padded.length).toBeGreaterThan(0);
  });

  it('shimmer text is a nestable text in text-secondary', () => {
    const theme = buildTheme('teal', 'light');
    const { getByText } = renderLog(
      <Text>
        <AgentLogShimmerText>Reading files</AgentLogShimmerText>
      </Text>,
    );
    expect(resolvedStyle(getByText('Reading files').props.style).color).toBe(
      resolveButtonRamps(theme).neutral[500],
    );
  });

  describe('useAgentLogRevealTicker', () => {
    it('waits startDelay for the first unit, stepInterval after, and completes once', () => {
      jest.useFakeTimers();
      const onComplete = jest.fn();
      const { result } = renderHook(() => useAgentLogRevealTicker({ total: 3, onComplete }));
      expect(result.current).toBe(0);
      act(() => {
        jest.advanceTimersByTime(319);
      });
      expect(result.current).toBe(0);
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe(1);
      act(() => {
        jest.advanceTimersByTime(850);
      });
      expect(result.current).toBe(2);
      act(() => {
        jest.advanceTimersByTime(850);
      });
      expect(result.current).toBe(3);
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('is clamped and timer-free when controlled; delayFor paces per unit', () => {
      jest.useFakeTimers();
      const controlled = renderHook(() => useAgentLogRevealTicker({ total: 2, revealed: 9 }));
      expect(controlled.result.current).toBe(2);

      const delayFor = jest.fn((index: number) => (index + 1) * 100);
      const paced = renderHook(() => useAgentLogRevealTicker({ total: 2, delayFor }));
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(paced.result.current).toBe(1);
      act(() => {
        jest.advanceTimersByTime(199);
      });
      expect(paced.result.current).toBe(1);
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(paced.result.current).toBe(2);
    });

    it('pauses while run is false', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useAgentLogRevealTicker({ total: 2, run: false }));
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current).toBe(0);
    });
  });

  it('adopts the shimmer sheet on web: secondary → primary highlight, 3.4s', () => {
    const previous = Platform.OS;
    Platform.OS = 'web';
    try {
      const { getByText } = renderLog(<AgentLogShimmerText>Working</AgentLogShimmerText>);
      expect(getByText('Working').props.dataSet).toEqual({ bloomAgentLogShimmer: '' });
      expect(adoptStyleSheet).toHaveBeenCalledWith(
        'bloom-agent-log-web-css',
        expect.stringContaining('animation: bloom-agent-log-shimmer 3.4s linear infinite'),
      );
      const css = jest.mocked(adoptStyleSheet).mock.calls.find(([id]) => id === 'bloom-agent-log-web-css')![1];
      expect(css).toContain('color: transparent !important');
      expect(css).toContain('prefers-reduced-motion: reduce');
    } finally {
      Platform.OS = previous;
    }
  });
});
