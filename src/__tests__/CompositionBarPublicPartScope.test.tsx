import { render } from '@testing-library/react-native';
import { CompositionBar } from '../composition-bar';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

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
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{bar}</BloomScope> : bar}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps each chart segment at its role-specific 44px touch height under control scopes', () => {
  const screen = render(<Subject />);
  const segment = () => screen.getByLabelText('Content');
  const height = () => resolvedStyle(segment().props.style).height;

  expect(height()).toBe(44);
  expect(segment().props.accessibilityRole).toBe('button');
  screen.rerender(<Subject scope="xs" />);
  expect(height()).toBe(44);
  screen.rerender(<Subject scope="lg" />);
  expect(height()).toBe(44);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(height()).toBe(44);
});
