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

import { AgentChatHistory } from '../agent-chat/AgentChat.web';
import type { AgentChatThread } from '../agent-chat/types';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const threads: AgentChatThread[] = [{ id: 'one', title: 'One thread', updatedAt: 1 }];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const history = <AgentChatHistory testID="history" threads={threads} formatAge={() => 'now'} />;
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{history}</BloomScope> : history}
    </BloomThemeProvider>
  );
}

it('keeps its rail, thread row and trailing slot geometry independent from BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const rail = host.querySelector<HTMLElement>('[data-testid="history"]');
      const selection = host.querySelector<HTMLElement>(
        '[data-testid="history-thread-one-select"]',
      );
      const slot = host.querySelector<HTMLElement>('[data-bloom-agent-chat-slot]');
      if (!rail || !selection || !slot) throw new Error('AgentChatHistory geometry is missing');
      const railStyle = getComputedStyle(rail);
      const selectionStyle = getComputedStyle(selection);
      const slotStyle = getComputedStyle(slot);
      return {
        rail: railStyle.width,
        selection: [
          selectionStyle.paddingTop,
          selectionStyle.paddingBottom,
          selectionStyle.paddingLeft,
        ],
        slot: [slotStyle.width, slotStyle.height],
      };
    };
    renderSubject();
    const initial = geometry();
    expect(initial).toEqual({
      rail: '260px',
      selection: ['6px', '6px', '8px'],
      slot: ['28px', '28px'],
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
