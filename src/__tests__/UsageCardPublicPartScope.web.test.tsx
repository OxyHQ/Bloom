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
  return { __esModule: true, default: host('svg'), Svg: host('svg'), Path: host('path') };
});

import { AgentLimitsCard } from '../agent-limits-card';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { UsageCard } from '../usage-card';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const cards = (
    <>
      <UsageCard
        testID="usage"
        title="Usage"
        usage={{ max: 100, segments: [{ label: 'Used', value: 25 }] }}
      />
      <AgentLimitsCard
        testID="limits"
        context={{ max: 100, segments: [{ label: 'Used', tokens: 25 }] }}
      />
    </>
  );
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{cards}</BloomScope> : cards}
    </BloomThemeProvider>
  );
}

it('keeps UsageCard and its deprecated AgentLimitsCard adapter geometry fixed under BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const usage = host.querySelector<HTMLElement>('[data-testid="usage"]');
      const limits = host.querySelector<HTMLElement>('[data-testid="limits"]');
      const title = host.querySelector<HTMLElement>('[data-testid="usage"] [dir]');
      if (!usage || !limits || !title) {
        throw new Error('Usage card geometry is missing');
      }
      return {
        usage: [getComputedStyle(usage).paddingTop],
        limits: [getComputedStyle(limits).paddingTop],
        bars: [usage, limits].map((card) => {
          const bar = card.querySelector<HTMLElement>('[role="progressbar"]');
          return bar ? getComputedStyle(bar).height : 'missing';
        }),
        title: [getComputedStyle(title).fontSize, getComputedStyle(title).lineHeight],
      };
    };
    renderSubject();
    const initial = geometry();
    expect(initial.usage).toEqual(['10px']);
    expect(initial.limits).toEqual(['10px']);
    expect(initial.bars).toEqual(['6px', '6px']);
    expect(initial.title).toEqual(['14px', '20px']);
    renderSubject('xs');
    expect(geometry()).toEqual(initial);
    renderSubject('lg');
    expect(geometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
