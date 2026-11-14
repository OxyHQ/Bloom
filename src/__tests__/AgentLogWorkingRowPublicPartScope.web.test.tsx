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

import { AgentLogWorkingRow } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const row = <AgentLogWorkingRow label="Working" reduce testID="working-row" />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{row}</BloomScope> : row}
    </BloomThemeProvider>
  );
}

it('keeps the working indicator geometry and label recipe stable across control scopes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const element = (testID: string) => {
      const node = host.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
      if (!node) throw new Error(`AgentLogWorkingRow did not render ${testID}`);
      return node;
    };
    const assertRecipe = () => {
      const stars = getComputedStyle(element('agent-thinking-stars'));
      const label = Array.from(element('working-row').querySelectorAll<HTMLElement>('*')).find(
        (node) => node.textContent === 'Working' && node.children.length === 0,
      );
      if (!label) throw new Error('AgentThinking label did not render');
      expect({ width: stars.width, height: stars.height }).toEqual({
        width: '21px',
        height: '21px',
      });
      expect(getComputedStyle(label).fontSize).toBe('14px');
    };

    renderSubject();
    assertRecipe();
    renderSubject('xs');
    assertRecipe();
    renderSubject('lg');
    assertRecipe();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
