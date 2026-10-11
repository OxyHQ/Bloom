/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Chip } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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

it.each([false, true])(
  'keeps selection and removal as independent sibling buttons (disabled=%s)',
  (disabled) => {
    const select = jest.fn();
    const remove = jest.fn();
    const error = jest.spyOn(console, 'error');
    act(() =>
      root.render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Chip
            selected
            disabled={disabled}
            onPress={select}
            onClose={remove}
            closeLabel="Remove saved search"
          >
            Unread
          </Chip>
        </BloomThemeProvider>,
      ),
    );
    const buttons = [...container.querySelectorAll('button, [role="button"]')] as HTMLElement[];
    expect(buttons).toHaveLength(2);
    const [primary, close] = buttons;
    expect(primary!.contains(close!)).toBe(false);
    expect(close!.contains(primary!)).toBe(false);
    expect(primary!.parentElement).toBe(close!.parentElement);
    expect(primary!.textContent).toBe('Unread');
    expect(primary!.getAttribute('aria-pressed')).toBe('true');
    expect(close!.getAttribute('aria-label')).toBe('Remove saved search');
    act(() => close!.click());
    expect(remove).toHaveBeenCalledTimes(disabled ? 0 : 1);
    expect(select).not.toHaveBeenCalled();
    act(() => primary!.click());
    expect(select).toHaveBeenCalledTimes(disabled ? 0 : 1);
    expect(remove).toHaveBeenCalledTimes(disabled ? 0 : 1);
    if (!disabled) {
      primary!.focus();
      expect(document.activeElement).toBe(primary);
      close!.focus();
      expect(document.activeElement).toBe(close);
    }
    expect(error.mock.calls.flat().join(' ')).not.toMatch(
      /cannot be a descendant|cannot contain a nested|hydration error/i,
    );
    error.mockRestore();
  },
);
