/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { AgentLogToolCalls } from '../agent-log';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const list = (
    <AgentLogToolCalls reduce testID="calls" accessibilityLabel="Tool calls">
      <Button testID="action">
        <Text>Open result</Text>
      </Button>
    </AgentLogToolCalls>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{list}</BloomScope> : list}
    </BloomThemeProvider>
  );
}

it('delegates caller control scope through its guide rows', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const action = () => {
      const node = host.querySelector<HTMLElement>('[data-testid="action"]');
      if (!node) throw new Error('AgentLogToolCalls did not render its child action');
      return node;
    };
    renderSubject();
    const md = getComputedStyle(action()).height;
    expect(host.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe('Tool calls');
    renderSubject('xs');
    const xs = getComputedStyle(action()).height;
    expect(xs).not.toBe(md);
    renderSubject('lg');
    expect(getComputedStyle(action()).height).not.toBe(xs);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
