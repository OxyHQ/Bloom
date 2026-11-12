/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AgentReplyBubble } from '../agent-reply';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const bubble = (
    <AgentReplyBubble>
      <Button testID="action">
        <Text>Reply action</Text>
      </Button>
    </AgentReplyBubble>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{bubble}</BloomScope> : bubble}
    </BloomThemeProvider>
  );
}

it('keeps its balanced text padding and delegates child control sizing', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const action = () => {
      const node = host.querySelector<HTMLElement>('[data-testid="action"]');
      if (!node) throw new Error('AgentReplyBubble did not render its child action');
      return node;
    };
    const padding = () => {
      const node = action().parentElement;
      if (!node) throw new Error('AgentReplyBubble wrapper was not found');
      const style = getComputedStyle(node);
      return [style.paddingTop, style.paddingBottom];
    };
    const height = () => getComputedStyle(action()).height;
    renderSubject();
    expect(padding()).toEqual(['9px', '9px']);
    const md = height();
    renderSubject('xs');
    expect(padding()).toEqual(['9px', '9px']);
    const xs = height();
    expect(xs).not.toBe(md);
    renderSubject('lg');
    expect(padding()).toEqual(['9px', '9px']);
    expect(height()).not.toBe(xs);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
