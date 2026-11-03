/** @jest-environment jsdom */
/**
 * `ChoiceList` on the web: a `listbox` of `option`s, ONE tab stop (the chosen
 * option), the arrows moving the focus alone and stopping at the ends, Enter
 * (react-native-web's press) and Space choosing the focused option.
 */
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ChoiceList } from '../choice-list';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const ACCOUNTS = [
  { value: 'ada', label: 'Ada' },
  { value: 'bea', label: 'Bea', disabled: true },
  { value: 'cy', label: 'Cy' },
  { value: 'dee', label: 'Dee' },
];
const key = (el: HTMLElement, key: string) =>
  act(() =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })),
  );

function Accounts({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('ada');
  return (
    <BloomThemeProvider>
      <ChoiceList
        label="Accounts"
        value={value}
        onValueChange={(next) => {
          onChange(next);
          setValue(next);
        }}
        options={ACCOUNTS}
        renderContent={(option, { selected }) => (
          <Text>{selected ? `${option.label} (chosen)` : option.label}</Text>
        )}
      />
    </BloomThemeProvider>
  );
}

it('is a named listbox of options, one tab stop, moved by the arrows without choosing', () => {
  const change = jest.fn();
  act(() => root.render(<Accounts onChange={change} />));
  const list = container.querySelector<HTMLElement>('[role=listbox]')!;
  expect(list.getAttribute('aria-label')).toBe('Accounts');
  expect(list.getAttribute('aria-orientation')).toBe('horizontal');
  const options = Array.from(container.querySelectorAll<HTMLElement>('[role=option]'));
  expect(options.map((el) => el.getAttribute('aria-label'))).toEqual(['Ada', 'Bea', 'Cy', 'Dee']);
  expect(options.map((el) => el.getAttribute('aria-selected'))).toEqual([
    'true',
    'false',
    'false',
    'false',
  ]);
  expect(options[1]!.getAttribute('aria-disabled')).toBe('true');
  expect(options.map((el) => el.tabIndex)).toEqual([0, -1, -1, -1]);
  act(() => options[0]!.focus());
  key(options[0]!, 'ArrowRight');
  // The disabled option is skipped; nothing is chosen, the stop stays the chosen one.
  expect(document.activeElement).toBe(options[2]);
  expect(change).not.toHaveBeenCalled();
  expect(options.map((el) => el.tabIndex)).toEqual([0, -1, -1, -1]);
  key(options[2]!, 'ArrowRight');
  expect(document.activeElement).toBe(options[3]);
  // A list stops at its ends; ↓ is not a row's.
  key(options[3]!, 'ArrowRight');
  expect(document.activeElement).toBe(options[3]);
  key(options[3]!, 'ArrowDown');
  expect(document.activeElement).toBe(options[3]);
  key(options[3]!, 'Home');
  expect(document.activeElement).toBe(options[0]);
  key(options[0]!, 'End');
  expect(document.activeElement).toBe(options[3]);
  expect(change).not.toHaveBeenCalled();
  // Space chooses the focused option, which becomes the stop.
  key(options[3]!, ' ');
  expect(change).toHaveBeenLastCalledWith('dee');
  expect(options[3]!.getAttribute('aria-selected')).toBe('true');
  expect(options[3]!.textContent).toBe('Dee (chosen)');
  expect(options.map((el) => el.tabIndex)).toEqual([-1, -1, -1, 0]);
});
