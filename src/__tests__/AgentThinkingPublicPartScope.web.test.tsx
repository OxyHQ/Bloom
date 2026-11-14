/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const host = (tag: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { children, animatedProps: _animatedProps, ...rest } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  const Svg = host('svg');
  return { __esModule: true, default: Svg, Svg, Path: host('path') };
});

import { AgentThinking, ThinkingReasoning } from '../agent-thinking';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const reasonText = 'Because';
  const content = (
    <>
      <AgentThinking testID="thinking" showTimer={false} />
      <ThinkingReasoning open testID="reasoning">
        {reasonText}
      </ThinkingReasoning>
    </>
  );
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{content}</BloomScope> : content}
    </BloomThemeProvider>
  );
}

it('keeps thinking status and reasoning geometry independent from BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const row = host.querySelector<HTMLElement>('[data-testid="thinking"]');
      const dots = host.querySelector<HTMLElement>('[data-testid="agent-thinking-dots"]');
      const label = host.querySelector<HTMLElement>('[data-testid="thinking-label"]');
      const reasoning = host.querySelector<HTMLElement>('[data-testid="reasoning"]');
      if (!row || !dots || !label || !reasoning) throw new Error('Thinking geometry is missing');
      const rowStyle = getComputedStyle(row);
      const dotsStyle = getComputedStyle(dots);
      const labelStyle = getComputedStyle(label);
      const rule = reasoning.querySelector<HTMLElement>(':scope > div > div');
      if (!rule) throw new Error('ThinkingReasoning did not render its rule');
      const ruleStyle = getComputedStyle(rule);
      return {
        row: [rowStyle.gap, rowStyle.flexDirection],
        dots: [dotsStyle.width, dotsStyle.rowGap, dotsStyle.columnGap],
        label: [labelStyle.fontSize, labelStyle.lineHeight],
        rule: [ruleStyle.paddingTop, ruleStyle.paddingBottom],
      };
    };
    renderSubject();
    const initial = geometry();
    expect(initial.row).toEqual(['10px', 'row']);
    expect(initial.dots).toEqual(['16px', '2px', '2px']);
    expect(initial.label).toEqual(['14px', '20px']);
    expect(initial.rule).toEqual(['4px', '4px']);
    renderSubject('xs');
    expect(geometry()).toEqual(initial);
    renderSubject('lg');
    expect(geometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
