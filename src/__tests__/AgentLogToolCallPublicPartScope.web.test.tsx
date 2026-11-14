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

import { AgentLogToolCall } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const call = <AgentLogToolCall name="search" label="Searching" status="done" testID="call" />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{call}</BloomScope> : call}
    </BloomThemeProvider>
  );
}

it('keeps tool call typography and row spacing fixed across control scopes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const required = (selector: string) => {
      const node = host.querySelector<HTMLElement>(selector);
      if (!node) throw new Error(`AgentLogToolCall did not render ${selector}`);
      return node;
    };
    const recipe = () => {
      const label = Array.from(
        required('[data-testid="call"]').querySelectorAll<HTMLElement>('*'),
      ).find((node) => node.textContent === 'Searching' && node.children.length === 0);
      if (!label) throw new Error('AgentLogToolCall did not render its title');
      expect(getComputedStyle(label).fontSize).toBe('14px');
      const rowContent = required('[data-testid="call-row"] > div');
      const style = getComputedStyle(rowContent);
      expect({
        gap: style.gap,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
      }).toEqual({
        gap: '6px',
        paddingTop: '4px',
        paddingBottom: '4px',
      });
    };
    renderSubject();
    recipe();
    renderSubject('xs');
    recipe();
    renderSubject('lg');
    recipe();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
