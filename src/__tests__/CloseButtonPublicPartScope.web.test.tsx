/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { CloseButton } from '../button/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
  const button = container.querySelector('[data-testid="close"]');
  if (!(button instanceof HTMLElement)) throw new Error('CloseButton did not render');
  return button;
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

it('keeps default geometry independent from BloomScope and honors explicit size', () => {
  const scoped = mount(
    <BloomScope size="lg">
      <CloseButton testID="close" accessibilityLabel="Close" />
    </BloomScope>,
  );
  expect(scoped.style.width).toBe('20px');

  const explicit = mount(
    <BloomScope size="xs">
      <CloseButton testID="close" accessibilityLabel="Close" size="lg" />
    </BloomScope>,
  );
  expect(explicit.style.width).toBe('44px');
});
