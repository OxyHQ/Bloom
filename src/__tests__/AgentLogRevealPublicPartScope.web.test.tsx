/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { AgentLogReveal } from '../agent-log';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size, nested }: { size?: 'xs' | 'lg'; nested?: boolean }) {
  const reveal = (
    <AgentLogReveal reduce>
      <Button testID="action">
        <Text>Reveal action</Text>
      </Button>
    </AgentLogReveal>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{reveal}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{reveal}</BloomScope>
      ) : (
        reveal
      )}
    </BloomThemeProvider>
  );
}

it('passes inherited control size through the animated reveal wrapper', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (props?: { size?: 'xs' | 'lg'; nested?: boolean }) =>
      act(() => root.render(<Subject {...props} />));
    const height = () => {
      const action = host.querySelector<HTMLElement>('[data-testid="action"]');
      if (!action) throw new Error('AgentLogReveal did not render its action');
      return getComputedStyle(action).height;
    };

    renderSubject();
    const defaultHeight = height();
    renderSubject({ size: 'xs' });
    const xsHeight = height();
    expect(xsHeight).not.toBe(defaultHeight);
    renderSubject({ size: 'lg' });
    const lgHeight = height();
    expect(lgHeight).not.toBe(xsHeight);
    renderSubject({ nested: true });
    expect(height()).toBe(lgHeight);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
