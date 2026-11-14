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

import { AgentLogRow } from '../agent-log';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size, nested }: { size?: 'xs' | 'lg'; nested?: boolean }) {
  const row = (
    <AgentLogRow first last reduce testID="row">
      <Button testID="action">
        <Text>Row action</Text>
      </Button>
    </AgentLogRow>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{row}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{row}</BloomScope>
      ) : (
        row
      )}
    </BloomThemeProvider>
  );
}

it('passes scope to caller controls while preserving the row guide inset', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (props?: { size?: 'xs' | 'lg'; nested?: boolean }) =>
      act(() => root.render(<Subject {...props} />));
    const element = (testID: string) => {
      const node = host.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
      if (!node) throw new Error(`AgentLogRow did not render ${testID}`);
      return node;
    };
    const actionHeight = () => getComputedStyle(element('action')).height;
    const inset = () =>
      getComputedStyle(element('row').firstElementChild as HTMLElement).paddingLeft;

    renderSubject();
    const defaultHeight = actionHeight();
    expect(inset()).toBe('16px');
    renderSubject({ size: 'xs' });
    const xsHeight = actionHeight();
    expect(xsHeight).not.toBe(defaultHeight);
    expect(inset()).toBe('16px');
    renderSubject({ size: 'lg' });
    const lgHeight = actionHeight();
    expect(lgHeight).not.toBe(xsHeight);
    expect(inset()).toBe('16px');
    renderSubject({ nested: true });
    expect(actionHeight()).toBe(lgHeight);
    expect(inset()).toBe('16px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
