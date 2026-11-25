/**
 * @jest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
// react-native-web itself (untyped here), as a web bundle resolves react-native.
const { StyleSheet, View } = require('react-native-web') as typeof import('react-native');

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'web', select: (spec: Record<string, unknown>) => spec.web ?? spec.default },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('a token at an opacity reaches the DOM through react-native-web', () => {
  const { tokenAlpha } = require('../color-tokens') as typeof import('../color-tokens');
  const styles = StyleSheet.create({ box: { backgroundColor: tokenAlpha('var(--primary)', 0.5) } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<View style={styles.box} />));
  const box = container.firstElementChild as HTMLElement;
  expect(getComputedStyle(box).backgroundColor).toBe(
    'var(--bloom-unset-color, color-mix(in oklab, var(--primary) 50%, transparent))',
  );
  act(() => root.unmount());
});

it('the web reads the tertiary text as its own variable', () => {
  const { useColorTokens } = require('../color-tokens') as typeof import('../color-tokens');
  let tokens: ReturnType<typeof useColorTokens> | undefined;
  function Probe() {
    tokens = useColorTokens();
    return null;
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<Probe />));
  expect(tokens?.faintForeground).toBe('var(--faint-foreground)');
  expect(tokens?.mutedForeground).toBe('var(--muted-foreground)');
  act(() => root.unmount());
});
