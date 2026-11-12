/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 1440,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const { StyleSheet } = jest.requireActual('react-native-web');
  const host = (tag: string) =>
    React.forwardRef(({ style, ...props }: { style?: unknown }, ref: unknown) =>
      React.createElement(tag, { ...props, ref, style: StyleSheet.flatten(style) }),
    );
  const Svg = host('svg');
  return {
    ...Object.fromEntries(
      [
        'Path',
        'Circle',
        'Rect',
        'G',
        'Defs',
        'LinearGradient',
        'RadialGradient',
        'Stop',
        'ClipPath',
        'Pattern',
        'Mask',
        'Line',
        'Polygon',
        'Polyline',
        'Ellipse',
        'Text',
        'TSpan',
        'Image',
        'Filter',
        'FeGaussianBlur',
      ].map((name) => [name, host(name.charAt(0).toLowerCase() + name.slice(1))]),
    ),
    __esModule: true,
    default: Svg,
    Svg,
  };
});

import { AgentChat } from '../agent-chat/AgentChat.web';
import type { AgentChatMessageData } from '../agent-chat/types';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const messages: AgentChatMessageData[] = [{ id: 'one', role: 'user', text: 'Question' }];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const chat = <AgentChat testID="chat" messages={messages} />;
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{chat}</BloomScope> : chat}
    </BloomThemeProvider>
  );
}

it('preserves the inherited size through AppShell, Screen and PageHeader to chat actions on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const control = () => {
      const node = host.querySelector<HTMLElement>('[data-testid="chat-actions-share"]');
      if (!node) throw new Error('AgentChat did not render its header share action');
      const style = getComputedStyle(node);
      return { width: style.width, height: style.height };
    };
    renderSubject();
    expect(control()).toEqual({ width: '34px', height: '34px' });
    renderSubject('xs');
    expect(control()).toEqual({ width: '24px', height: '24px' });
    renderSubject('lg');
    expect(control()).toEqual({ width: '34px', height: '34px' });
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
