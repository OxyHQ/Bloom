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

import { AgentProfile, type AgentReplyAgent } from '../agent-reply';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const agents: AgentReplyAgent[] = [
  { id: 'one', name: 'One', avatar: { preset: 'blue_beret' } },
  { id: 'two', name: 'Two', avatar: { preset: 'blue_beret' } },
];

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const profile = <AgentProfile agents={agents} onPress={() => undefined} />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{profile}</BloomScope> : profile}
    </BloomThemeProvider>
  );
}

it('keeps the fixed avatar canvas geometry independent from BloomScope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const canvas = () => {
      const node = host.querySelector<HTMLElement>('[data-testid="agent-profile"] > div');
      if (!node) throw new Error('AgentProfile did not render its avatar canvas');
      return node;
    };
    const assertSize = () => {
      const style = getComputedStyle(canvas());
      expect({ width: style.width, height: style.height }).toEqual({
        width: '56px',
        height: '56px',
      });
    };
    renderSubject();
    assertSize();
    renderSubject('xs');
    assertSize();
    renderSubject('lg');
    assertSize();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
