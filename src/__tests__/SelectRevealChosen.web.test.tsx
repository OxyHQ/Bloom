/**
 * @jest-environment jsdom
 */

/**
 * `Select` on WEB opens with the chosen option scrolled into its list, the way
 * react-aria's listbox does, so a value far down a long list is not hidden
 * below the fold.
 *
 * The reveal runs in the commit that shows the list (its node arrives in a
 * render after the select opens), not on a timer a frame later.
 *
 * jsdom has no layout, so each option reports a 40px row at its index and the
 * list a 120px viewport; `scrollTop` is recorded per element.
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

const ROW = 40;
const VIEWPORT = 120;
const scrollTops = new WeakMap<Element, number>();
const restore: Array<() => void> = [];

function override(
  name: 'offsetTop' | 'offsetHeight' | 'clientHeight' | 'scrollTop',
  descriptor: PropertyDescriptor,
) {
  const original =
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, name) ??
    Object.getOwnPropertyDescriptor(Element.prototype, name);
  Object.defineProperty(HTMLElement.prototype, name, { configurable: true, ...descriptor });
  restore.push(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, name, original);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name];
  });
}

const isOption = (element: Element) => element.getAttribute('role') === 'option';
const optionIndex = (element: Element) =>
  [...document.querySelectorAll('[role="option"]')].indexOf(element);

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  override('offsetTop', {
    get(this: HTMLElement) {
      return isOption(this) ? optionIndex(this) * ROW : 0;
    },
  });
  override('offsetHeight', {
    get(this: HTMLElement) {
      return isOption(this) ? ROW : 0;
    },
  });
  override('clientHeight', {
    get() {
      return VIEWPORT;
    },
  });
  override('scrollTop', {
    get(this: HTMLElement) {
      return scrollTops.get(this) ?? 0;
    },
    set(this: HTMLElement, value: number) {
      scrollTops.set(this, value);
    },
  });
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  while (restore.length) restore.pop()?.();
});

const ITEMS = Array.from({ length: 12 }, (_, index) => ({
  value: `item-${index}`,
  label: `Item ${index}`,
}));

function Long({ initial }: { initial: string }) {
  const [value, setValue] = React.useState(initial);
  return (
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger label="Item" testID="item">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent
          label="Item"
          items={ITEMS}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
    </BloomThemeProvider>
  );
}

const trigger = () =>
  document.querySelector<HTMLElement>('[data-testid="item"] [aria-haspopup]') as HTMLElement;
const list = () => document.querySelector('[data-bloom-select-list]') as HTMLElement;

/** The portal mounts, the panel places itself and every effect settles. */
function settle() {
  for (let i = 0; i < 4; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

describe('Select (web) — opening reveals the chosen option', () => {
  it('scrolls a chosen option below the fold up to the bottom of the list', () => {
    act(() => root.render(<Long initial="item-9" />));
    act(() => trigger().click());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    // Row 9 spans 360–400; a 120px viewport shows it at 280. No frame has run.
    expect(list().scrollTop).toBe(9 * ROW + ROW - VIEWPORT);
    settle();
    expect(list().scrollTop).toBe(9 * ROW + ROW - VIEWPORT);
  });

  it('leaves a chosen option that is already in view where it is', () => {
    act(() => root.render(<Long initial="item-1" />));
    act(() => trigger().click());
    settle();
    expect(list().scrollTop).toBe(0);
  });
});
