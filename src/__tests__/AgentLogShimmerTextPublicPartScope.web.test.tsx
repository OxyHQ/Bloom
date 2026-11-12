/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../styles/adopt-style-sheet', () => ({
  adoptStyleSheet: jest.fn(),
  dropStyleSheet: jest.fn(),
}));

import { AgentLogShimmerText } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const text = (
    <Text variant="body-regular" testID="parent">
      <AgentLogShimmerText>Reading files</AgentLogShimmerText>
    </Text>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{text}</BloomScope> : text}
    </BloomThemeProvider>
  );
}

it('inherits typography from its parent Text, independently of BloomScope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const fontSize = () => {
      const parent = host.querySelector<HTMLElement>('[data-testid="parent"]');
      if (!parent) throw new Error('Parent Text did not render');
      return getComputedStyle(parent).fontSize;
    };
    const shimmer = () => {
      const node = host.querySelector<HTMLElement>('[data-bloom-agent-log-shimmer]');
      if (!node) throw new Error('AgentLogShimmerText did not render');
      return node;
    };

    renderSubject();
    const defaultFontSize = fontSize();
    expect(shimmer().parentElement).toBe(host.querySelector('[data-testid="parent"]'));
    expect(shimmer().style.fontSize).toBe('');
    renderSubject('xs');
    expect(fontSize()).toBe(defaultFontSize);
    expect(shimmer().style.fontSize).toBe('');
    renderSubject('lg');
    expect(fontSize()).toBe(defaultFontSize);
    expect(shimmer().style.fontSize).toBe('');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
