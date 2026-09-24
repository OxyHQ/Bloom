/**
 * @jest-environment jsdom
 */

/**
 * `Select` on WEB, driven from the keyboard alone — the ARIA select-only
 * combobox contract, against the DOM react-native-web really produces.
 *
 * What shipped: Enter/Space opened the list and focus stayed on the trigger,
 * where no key did anything, so a keyboard user could open a select and never
 * choose. And Escape inside a `Dialog` closed the DIALOG, because the panel's
 * Escape listener and the dialog's sat side by side on `document` and the
 * dialog's — registered first — ran first.
 *
 * Keys are dispatched on `document.activeElement`, never on an element picked
 * by the test: a handler that forgot to move focus leaves the key landing on
 * the trigger, and the assertion that follows fails.
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
import { Dialog } from '../dialog/Dialog.web';

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
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'damson', label: 'Damson' },
];

function Fruit({ initial, onChange }: { initial?: string; onChange?: (value: string) => void }) {
  const [value, setValue] = React.useState<string | undefined>(initial);
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}>
      <SelectTrigger label="Fruit" testID="fruit">
        <SelectValue placeholder="Pick one" />
      </SelectTrigger>
      <SelectContent
        label="Fruit"
        items={FRUIT}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label} disabled={item.disabled}>
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
  flush();
}

/** Let the portal mount, the panel place itself and every effect settle. */
function flush() {
  for (let i = 0; i < 4; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

/**
 * A key press on whatever holds focus: keydown, then keyup — plus the one thing
 * the browser adds that jsdom does not. A `<button>` (react-native-web renders
 * a `role="button"` Pressable as one) is ACTIVATED by the browser itself: Enter
 * clicks it on keydown, Space on keyup, unless the key's default was
 * prevented. react-native-web leaves those keys to the browser for a native
 * button, so without this the trigger would never open here.
 */
function press(key: string) {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const isButton = target.tagName === 'BUTTON';
  let down!: KeyboardEvent;
  act(() => {
    down = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(down);
    if (isButton && key === 'Enter' && !down.defaultPrevented) target.click();
  });
  const upTarget = (document.activeElement ?? document.body) as HTMLElement;
  act(() => {
    const up = new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true });
    upTarget.dispatchEvent(up);
    if (isButton && upTarget === target && key === ' ' && !down.defaultPrevented) target.click();
  });
  flush();
}

const trigger = () =>
  document.querySelector<HTMLElement>('[data-testid="fruit"] [aria-haspopup]') as HTMLElement;
const expanded = () => trigger().getAttribute('aria-expanded') === 'true';
const focusedLabel = () => document.activeElement?.getAttribute('aria-label') ?? null;

function openWith(key: string) {
  act(() => trigger().focus());
  press(key);
}

describe('Select (web) — keyboard', () => {
  it.each(['Enter', ' '])('opening with %j focuses the chosen option', (key) => {
    mount(<Fruit initial="cherry" />);
    openWith(key);
    expect(expanded()).toBe(true);
    expect(focusedLabel()).toBe('Cherry');
  });

  it('opening with nothing chosen focuses the first option', () => {
    mount(<Fruit />);
    openWith('Enter');
    expect(focusedLabel()).toBe('Apple');
  });

  it.each(['ArrowDown', 'ArrowUp'])('%s on the closed trigger opens the list into focus', (key) => {
    mount(<Fruit initial="damson" />);
    openWith(key);
    expect(expanded()).toBe(true);
    expect(focusedLabel()).toBe('Damson');
  });

  it('a pointer open leaves focus on the trigger until an arrow moves it in', () => {
    mount(<Fruit initial="apple" />);
    act(() => trigger().focus());
    act(() => trigger().click());
    flush();
    expect(expanded()).toBe(true);
    expect(document.activeElement).toBe(trigger());
    press('ArrowDown');
    expect(focusedLabel()).toBe('Apple');
  });

  it('arrows step over disabled options and stop at the ends; Home/End jump', () => {
    mount(<Fruit initial="apple" />);
    openWith('Enter');
    press('ArrowUp');
    expect(focusedLabel()).toBe('Apple');
    press('ArrowDown');
    expect(focusedLabel()).toBe('Cherry');
    press('ArrowDown');
    expect(focusedLabel()).toBe('Damson');
    press('ArrowDown');
    expect(focusedLabel()).toBe('Damson');
    press('Home');
    expect(focusedLabel()).toBe('Apple');
    press('End');
    expect(focusedLabel()).toBe('Damson');
  });

  it.each(['Enter', ' '])('%j chooses the focused option, closes, and returns focus to the trigger', (key) => {
    const onChange = jest.fn();
    mount(<Fruit initial="apple" onChange={onChange} />);
    openWith('Enter');
    press('End');
    press(key);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('damson');
    expect(expanded()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it.each(['Escape', 'Tab'])('%s closes without choosing and returns focus to the trigger', (key) => {
    const onChange = jest.fn();
    mount(<Fruit initial="apple" onChange={onChange} />);
    openWith('Enter');
    press('ArrowDown');
    press(key);
    expect(expanded()).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
  });

  it('Escape inside a Dialog closes the list and NOT the dialog; the next Escape closes the dialog', () => {
    const onClose = jest.fn();
    mount(
      <Dialog startOpen onClose={onClose} placement="center" title="Edit">
        <Fruit initial="apple" />
      </Dialog>,
    );
    openWith('Enter');
    expect(expanded()).toBe(true);
    press('Escape');
    expect(expanded()).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    // Control: the dialog's own Escape still works once the list is gone, so the
    // assertion above measures the list swallowing the key, not a dead dialog.
    press('Escape');
    expect(onClose).toHaveBeenCalled();
  });
});
