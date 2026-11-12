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

import { AgentChatActions } from '../agent-chat/AgentChat.web';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const actions = <AgentChatActions testID="actions" transcript="Transcript" />;
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{actions}</BloomScope> : actions}
    </BloomThemeProvider>
  );
}

it('delegates inherited control size to ButtonGroup on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const assertGeometry = (height: string) => {
      for (const id of ['actions-share', 'actions-more']) {
        const node = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
        if (!node) throw new Error(`AgentChatActions did not render ${id}`);
        const style = getComputedStyle(node);
        expect({ width: style.width, height: style.height }).toEqual({ width: height, height });
      }
    };
    renderSubject();
    assertGeometry('34px');
    renderSubject('xs');
    assertGeometry('24px');
    renderSubject('lg');
    assertGeometry('34px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
