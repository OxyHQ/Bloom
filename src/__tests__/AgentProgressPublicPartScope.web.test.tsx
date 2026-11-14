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
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Path: host('path'),
    Circle: host('circle'),
    Rect: host('rect'),
  };
});

import { AgentProgress, AgentProgressLoadingText, AgentProgressPlan } from '../agent-progress';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const parts = (
    <>
      <AgentProgress steps={['One']} defaultMinimized paused testID="progress" />
      <AgentProgressPlan title="Plan" steps={['One']} testID="plan" />
      {/* biome-ignore lint/correctness/noReactNativeRawText: The component requires a plain string for its shimmer. */}
      <AgentProgressLoadingText testID="loading">Working</AgentProgressLoadingText>
    </>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{parts}</BloomScope> : parts}
    </BloomThemeProvider>
  );
}

it('keeps progress cards and loading typography independent from control scope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const required = (testID: string) => {
      const node = host.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
      if (!node) throw new Error(`AgentProgress family did not render ${testID}`);
      return node;
    };
    const recipe = () => {
      expect(getComputedStyle(required('progress')).width).toBe('341px');
      expect(getComputedStyle(required('plan')).width).toBe('341px');
      expect(getComputedStyle(required('plan-approve')).height).toBe('32px');
      const text = [
        required('loading'),
        ...Array.from(required('loading').querySelectorAll<HTMLElement>('*')),
      ].find((node) => node.textContent === 'Working' && node.children.length === 0);
      if (!text) throw new Error('AgentProgressLoadingText did not render its label');
      expect(getComputedStyle(text).fontSize).toBe('14px');
    };
    renderSubject();
    recipe();
    renderSubject('xs');
    recipe();
    renderSubject('lg');
    recipe();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
