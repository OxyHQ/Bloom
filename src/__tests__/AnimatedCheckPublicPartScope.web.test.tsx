/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return { ...base, __esModule: true };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const host = (tag: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { children, animatedProps: _animatedProps, ...rest } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  return {
    __esModule: true,
    default: host('svg'),
    Svg: host('svg'),
    Path: host('path'),
    Circle: host('circle'),
  };
});

import { AnimatedCheck } from '../animated-check';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps authored SVG dimensions independent from BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderCheck = (scope?: 'xs' | 'lg', size?: number) =>
      act(() =>
        root.render(
          <BloomThemeProvider mode="light" fonts={false}>
            {scope ? (
              <BloomScope size={scope}>
                <AnimatedCheck size={size} />
              </BloomScope>
            ) : (
              <AnimatedCheck size={size} />
            )}
          </BloomThemeProvider>,
        ),
      );
    const dimensions = () => {
      const svg = host.querySelector('svg');
      if (!svg) throw new Error('AnimatedCheck SVG is missing');
      return [svg.getAttribute('width'), svg.getAttribute('height')];
    };
    renderCheck();
    expect(dimensions()).toEqual(['24', '24']);
    renderCheck('xs');
    expect(dimensions()).toEqual(['24', '24']);
    renderCheck('lg');
    expect(dimensions()).toEqual(['24', '24']);
    renderCheck('xs', 48);
    expect(dimensions()).toEqual(['48', '48']);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
