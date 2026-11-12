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

import { AgentReplyIdentity } from '../agent-reply';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const identity = <AgentReplyIdentity character={{ preset: 'blue_beret' }} name="One" />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{identity}</BloomScope> : identity}
    </BloomThemeProvider>
  );
}

it('keeps its authored avatar geometry independent from BloomScope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const widths = Array.from(host.querySelectorAll<HTMLElement>('[style]'))
        .map((node) => getComputedStyle(node).width)
        .filter((width) => width === '20px' || width === '32px');
      return widths;
    };
    renderSubject();
    const initial = geometry();
    expect(initial).toEqual(expect.arrayContaining(['20px', '32px']));
    renderSubject('xs');
    expect(geometry()).toEqual(initial);
    renderSubject('lg');
    expect(geometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
