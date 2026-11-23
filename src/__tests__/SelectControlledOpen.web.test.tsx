/**
 * @jest-environment jsdom
 */

/**
 * `Select`'s controlled `open` on the web: set, the list shows while it is
 * true and a dismissal (Escape) reports the change instead of making it;
 * unset, the select keeps its own state (every other Select test).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select/index.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

const FRUIT = [
  { value: 'apple', label: 'Apple' },
  { value: 'cherry', label: 'Cherry' },
];

function render(open: boolean, onOpenChange: (open: boolean) => void) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <Select value="apple" onValueChange={() => {}} open={open} onOpenChange={onOpenChange}>
          <SelectTrigger label="Fruit" testID="fruit">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent
            label="Fruit"
            items={FRUIT}
            renderItem={(item) => (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </BloomThemeProvider>,
    );
  });
  for (let i = 0; i < 4; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

const options = () => document.querySelectorAll('[role="option"]').length;

it('shows the list while `open` holds, and reports a dismissal instead of making it', () => {
  const onOpenChange = jest.fn();
  render(true, onOpenChange);
  expect(options()).toBe(2);
  act(() => {
    const target = (document.activeElement ?? document.body) as HTMLElement;
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(options()).toBe(2);
  render(false, onOpenChange);
  expect(options()).toBe(0);
});
