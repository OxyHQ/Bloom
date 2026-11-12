/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { AgentReply } from '../agent-reply';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const reply = (
    <AgentReply>
      <Button testID="action">
        <Text>Reply action</Text>
      </Button>
    </AgentReply>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{reply}</BloomScope> : reply}
    </BloomThemeProvider>
  );
}

it('passes caller content size through while keeping reply layout owned', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const action = () => {
      const node = host.querySelector<HTMLElement>('[data-testid="action"]');
      if (!node) throw new Error('AgentReply did not render caller action');
      return node;
    };
    const reply = () => {
      const node = host
        .querySelector<HTMLElement>('[data-testid="action"]')
        ?.closest('.group\\/reply');
      if (!node) throw new Error('AgentReply wrapper was not found');
      return node;
    };
    renderSubject();
    const md = getComputedStyle(action()).height;
    expect(getComputedStyle(reply()).marginTop).toBe('12px');
    renderSubject('xs');
    const xs = getComputedStyle(action()).height;
    expect(xs).not.toBe(md);
    expect(getComputedStyle(reply()).marginTop).toBe('12px');
    renderSubject('lg');
    expect(getComputedStyle(action()).height).not.toBe(xs);
    expect(getComputedStyle(reply()).marginTop).toBe('12px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
