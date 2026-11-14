/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { ColorSwatchPicker } from '../color-swatch-picker';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let coarsePointer = true;
const originalMatchMedia = window.matchMedia;
const media = {
  media: '(pointer: coarse)',
  get matches() {
    return coarsePointer;
  },
  onchange: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  dispatchEvent: () => true,
} as unknown as MediaQueryList;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
  const option = container.querySelector('[role="option"]');
  if (!(option instanceof HTMLElement)) throw new Error('Color swatch option did not render');
  return option;
}

beforeEach(() => {
  coarsePointer = true;
  window.matchMedia = jest.fn(() => media);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = originalMatchMedia;
});

function swatchDimensions(option: HTMLElement) {
  return [...option.querySelectorAll('div')]
    .map((node) => (node as HTMLElement).style.width)
    .filter(
      (width) => width === '50px' || width === '40px' || width === '34px' || width === '24px',
    );
}

it('keeps default numeric swatch size independent from an lg web scope', () => {
  const option = mount(
    <BloomScope size="lg">
      <ColorSwatchPicker
        label="Brand colour"
        value="#3b82f6"
        onValueChange={() => undefined}
        colors={['#3b82f6']}
        names={{ '#3b82f6': 'Blue' }}
      />
    </BloomScope>,
  );
  expect(swatchDimensions(option)).toEqual(['50px', '40px']);
});

it('honors an explicit numeric swatch size inside an xs scope', () => {
  const option = mount(
    <BloomScope size="xs">
      <ColorSwatchPicker
        label="Brand colour"
        value="#3b82f6"
        onValueChange={() => undefined}
        colors={['#3b82f6']}
        names={{ '#3b82f6': 'Blue' }}
        size={24}
      />
    </BloomScope>,
  );
  expect(swatchDimensions(option)).toEqual(['34px', '24px']);
  expect(option.style.minWidth).toBe('44px');
  expect(option.style.minHeight).toBe('44px');
});

it('keeps coarse-pointer choice targets at least 44px without enlarging desktop targets', () => {
  coarsePointer = false;
  const option = mount(
    <ColorSwatchPicker
      label="Brand colour"
      value="#3b82f6"
      onValueChange={() => undefined}
      colors={['#3b82f6']}
      size={24}
    />,
  );
  expect(option.style.minWidth).toBe('');
  expect(option.style.minHeight).toBe('');
});
