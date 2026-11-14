/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
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

import { AgentReplyAction } from '../agent-reply';
import { BloomScope } from '../appearance';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const action = <AgentReplyAction icon={RiCheckLine} label="Save response" onPress={() => {}} />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{action}</BloomScope> : action}
    </BloomThemeProvider>
  );
}

it('keeps its explicit small control size under external BloomScope values', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const button = () => {
      const node = host.querySelector<HTMLElement>('[aria-label="Save response"]');
      if (!node) throw new Error('AgentReplyAction did not render its button');
      return node;
    };
    renderSubject();
    expect(getComputedStyle(button()).height).toBe('32px');
    renderSubject('xs');
    expect(getComputedStyle(button()).height).toBe('32px');
    renderSubject('lg');
    expect(getComputedStyle(button()).height).toBe('32px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
