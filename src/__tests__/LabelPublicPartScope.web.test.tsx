/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { Label } from '../label';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
  const label = container.querySelector('[data-testid="label"]');
  if (!(label instanceof HTMLElement)) throw new Error('Label did not render');
  return label;
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
  ['xs', '13px'],
  ['sm', '14px'],
  ['md', '16px'],
  ['lg', '16px'],
] as const)('maps %s scope to the supported label type ramp in the DOM', (size, fontSize) => {
  const label = mount(
    <div>
      <BloomScope size={size}>
        <Label children="Email" htmlFor="entry" testID="label" />
      </BloomScope>
    </div>,
  );
  expect(getComputedStyle(label).fontSize).toBe(fontSize);
});

it('defaults to sm and lets explicit xs win inside nested web scopes', () => {
  expect(
    getComputedStyle(mount(<Label children="Email" htmlFor="entry" testID="label" />)).fontSize,
  ).toBe('14px');

  const label = mount(
    <BloomScope size="lg">
      <BloomScope size="md">
        <Label children="Email" size="xs" htmlFor="entry" testID="label" />
      </BloomScope>
    </BloomScope>,
  );
  expect(getComputedStyle(label).fontSize).toBe('13px');
});
