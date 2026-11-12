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

import { AgentChatMessage } from '../agent-chat/AgentChatMessage';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const messages = (
    <>
      {/* biome-ignore lint/a11y/useValidAriaRole: role is AgentChatMessage's domain enum, not a host ARIA role. */}
      <AgentChatMessage role="user" text="Question" testID="user-message" />
      {/* biome-ignore lint/a11y/useValidAriaRole: role is AgentChatMessage's domain enum, not a host ARIA role. */}
      <AgentChatMessage
        role="assistant"
        text="Answer"
        testID="assistant-message"
        onCopy={() => undefined}
      />
    </>
  );
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{messages}</BloomScope> : messages}
    </BloomThemeProvider>
  );
}

it('keeps authored bubble insets and fixed reply actions independent from BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const bubble = host.querySelector<HTMLElement>('[data-testid="user-message"]');
      const action = host.querySelector<HTMLElement>('[aria-label="Copy message"]');
      if (!bubble || !action) throw new Error('AgentChatMessage geometry is missing');
      const bubbleStyle = getComputedStyle(bubble);
      const actionStyle = getComputedStyle(action);
      return {
        bubble: [
          bubbleStyle.maxWidth,
          bubbleStyle.paddingLeft,
          bubbleStyle.paddingRight,
          bubbleStyle.paddingTop,
          bubbleStyle.paddingBottom,
        ],
        action: [actionStyle.width, actionStyle.height],
      };
    };
    renderSubject();
    const initial = geometry();
    expect(initial).toEqual({
      bubble: ['75%', '12px', '12px', '11px', '11px'],
      action: ['28px', '28px'],
    });
    renderSubject('xs');
    expect(geometry()).toEqual(initial);
    renderSubject('lg');
    expect(geometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
