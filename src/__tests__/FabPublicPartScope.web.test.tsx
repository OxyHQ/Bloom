/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Text } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { Fab } from '../fab/Fab.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
  const fab = container.querySelector('[data-testid="fab"]');
  if (!(fab instanceof HTMLElement)) throw new Error('Fab did not render');
  return fab;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it.each([
  ['xs', '40px'],
  ['sm', '48px'],
  ['md', '50px'],
  ['lg', '64px'],
] as const)('maps %s scope to the matching Fab diameter in the DOM', (size, diameter) => {
  const fab = mount(
    <div>
      <BloomScope size={size}>
        <Fab accessibilityLabel="Create" icon={() => <Text>+</Text>} testID="fab" />
      </BloomScope>
    </div>,
  );
  expect(getComputedStyle(fab).width).toBe(diameter);
  expect(getComputedStyle(fab).height).toBe(diameter);
});

it('uses md by default and honors explicit sm over nested scopes in the DOM', () => {
  expect(
    getComputedStyle(mount(<Fab accessibilityLabel="Create" icon={() => null} testID="fab" />))
      .width,
  ).toBe('50px');

  const fab = mount(
    <BloomScope size="xs">
      <BloomScope size="lg">
        <Fab size="sm" accessibilityLabel="Create" icon={() => null} testID="fab" />
      </BloomScope>
    </BloomScope>,
  );
  expect(getComputedStyle(fab).width).toBe('48px');
  expect(getComputedStyle(fab).height).toBe('48px');
});
