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

import { AgentChatComposer } from '../agent-chat/AgentChat.web';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const composer = <AgentChatComposer testID="composer" onAttach={() => undefined} />;
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{composer}</BloomScope> : composer}
    </BloomThemeProvider>
  );
}

it('keeps its authored pill and controls geometry independent from BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const styleOf = (selector: string) => {
        const node = host.querySelector<HTMLElement>(selector);
        if (!node) throw new Error(`AgentChatComposer did not render ${selector}`);
        return getComputedStyle(node);
      };
      return {
        add: styleOf('[data-testid="composer-pill-add"]').height,
        send: styleOf('[aria-label="Send message"]').height,
        field: styleOf('[data-testid="composer-pill-input"]').height,
      };
    };
    renderSubject();
    const initial = geometry();
    expect(initial).toEqual({ add: '36px', send: '36px', field: '20px' });
    renderSubject('xs');
    expect(geometry()).toEqual(initial);
    renderSubject('lg');
    expect(geometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
