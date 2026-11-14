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

import { AgentLogRowConnector } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const connector = <AgentLogRowConnector first last={false} reduce />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{connector}</BloomScope> : connector}
    </BloomThemeProvider>
  );
}

it('keeps structural connector geometry fixed across control scopes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const style = (testID: string) => {
      const node = host.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
      if (!node) throw new Error(`AgentLogRowConnector did not render ${testID}`);
      const computed = getComputedStyle(node);
      return {
        position: computed.position,
        top: computed.top,
        bottom: computed.bottom,
        left: computed.left,
        width: computed.width,
      };
    };
    const assertGeometry = () => {
      expect(style('agent-log-row-connector')).toEqual({
        position: 'absolute',
        top: '0px',
        bottom: '0px',
        left: '0px',
        width: '12px',
      });
      expect(style('agent-log-row-trunk')).toEqual({
        position: 'absolute',
        left: '0px',
        width: '1px',
        top: '8px',
        bottom: '0px',
      });
    };

    renderSubject();
    assertGeometry();
    renderSubject('xs');
    assertGeometry();
    renderSubject('lg');
    assertGeometry();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
