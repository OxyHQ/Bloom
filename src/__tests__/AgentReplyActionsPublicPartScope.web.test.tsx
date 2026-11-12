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

import { AgentReplyActions } from '../agent-reply';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const row = (
    <AgentReplyActions onCopy={() => {}}>
      <Button testID="extra">
        <Text>Extra action</Text>
      </Button>
    </AgentReplyActions>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{row}</BloomScope> : row}
    </BloomThemeProvider>
  );
}

it('keeps built-in actions small and delegates size scope to caller actions', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const fixed = () =>
      ['Helpful response', 'Unhelpful response', 'Copy response'].map((label) => {
        const button = host.querySelector<HTMLElement>(`[aria-label="${label}"]`);
        if (!button) throw new Error(`AgentReplyActions did not render ${label}`);
        return getComputedStyle(button).height;
      });
    const extra = () => {
      const button = host.querySelector<HTMLElement>('[data-testid="extra"]');
      if (!button) throw new Error('AgentReplyActions did not render caller action');
      return getComputedStyle(button).height;
    };
    renderSubject();
    expect(fixed()).toEqual(['32px', '32px', '32px']);
    const md = extra();
    renderSubject('xs');
    expect(fixed()).toEqual(['32px', '32px', '32px']);
    const xs = extra();
    expect(xs).not.toBe(md);
    renderSubject('lg');
    expect(fixed()).toEqual(['32px', '32px', '32px']);
    expect(extra()).not.toBe(xs);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
