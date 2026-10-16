/** @jest-environment jsdom */
/**
 * `Checkbox readOnly` in the DOM react-native-web produces: a `checkbox` with
 * its state and `aria-readonly`, no tab stop, no `disabled`, and a click that
 * changes nothing.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Checkbox } from '../checkbox';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('renders a read-only checkbox that is neither focusable nor disabled', () => {
  const onCheckedChange = jest.fn();
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Checkbox readOnly checked label="Ship it" onCheckedChange={onCheckedChange} />
      </BloomThemeProvider>,
    ),
  );
  const box = container.querySelector('[role="checkbox"]') as HTMLElement;
  expect(box).not.toBeNull();
  expect(box.getAttribute('aria-checked')).toBe('true');
  expect(box.getAttribute('aria-readonly')).toBe('true');
  expect(box.getAttribute('aria-disabled')).toBeNull();
  expect(box.getAttribute('aria-label')).toBe('Ship it');
  // Not a tab stop: react-native-web would otherwise give the role `0`.
  expect(box.getAttribute('tabindex')).toBe('-1');
  expect(box.tagName).not.toBe('BUTTON');
  act(() => box.click());
  expect(onCheckedChange).not.toHaveBeenCalled();
  expect(box.getAttribute('aria-checked')).toBe('true');
});
