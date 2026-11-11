/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { CompositionBar } from '../composition-bar/CompositionBar';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const categories = [
  { key: 'content', name: 'Content', amount: 3, color: '#6366F1' },
  { key: 'social', name: 'Social', amount: 1, color: '#10B981' },
];

function Subject({ scope, nestedScope }: { scope?: BloomSize; nestedScope?: BloomSize }) {
  const bar = (
    <CompositionBar
      categories={categories}
      selectedKey={null}
      onSelect={() => undefined}
      hintLabel="Tap a segment"
    />
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{bar}</BloomScope> : bar}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps each chart segment at its role-specific 44px touch height under control scopes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: { scope?: BloomSize; nestedScope?: BloomSize }) =>
    act(() => root.render(<Subject {...props} />));
  const segment = () => host.querySelector<HTMLElement>('[aria-label="Content"]');
  const height = () => {
    const node = segment();
    if (!node) throw new Error('CompositionBar did not render its Content segment');
    return getComputedStyle(node).height;
  };
  try {
    renderSubject();
    expect(height()).toBe('44px');
    expect(segment()?.getAttribute('role')).toBe('button');
    renderSubject({ scope: 'xs' });
    expect(height()).toBe('44px');
    renderSubject({ scope: 'lg' });
    expect(height()).toBe('44px');
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(height()).toBe('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
