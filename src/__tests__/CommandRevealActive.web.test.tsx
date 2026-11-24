/**
 * @jest-environment jsdom
 */

/**
 * `Command` on WEB keeps the keyboard-highlighted row inside its list's
 * viewport: ArrowDown past the bottom scrolls the row up into view, ArrowUp
 * (wrapping to the last row and back to the first) scrolls it back.
 *
 * The reveal runs in the commit that highlights the row, not on a timer a frame
 * later: the assertions run with no frame advanced.
 *
 * jsdom has no layout, so each option reports a 40px row at its index and the
 * list a 120px viewport; `scrollTop` is recorded per element.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// The web Dialog's sheet placements import `../bottom-sheet`; use its web shell.
jest.mock('../bottom-sheet', () => jest.requireActual('../bottom-sheet/index.web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Command } from '../command/index.web';
import type { CommandItem } from '../command';

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

const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];
const isOption = (element: Element) => element.getAttribute('role') === 'option';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  override('offsetTop', {
    get(this: HTMLElement) {
      return isOption(this) ? options().indexOf(this) * ROW : 0;
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

const ITEMS: CommandItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `item-${index}`,
  label: `Item ${index}`,
  onSelect: () => {},
}));

/** The list's scroll position: the scrolled ancestor of the rows. */
function listScroll(): number {
  for (let node = options()[0]?.parentElement; node; node = node.parentElement)
    if (scrollTops.has(node)) return scrollTops.get(node) ?? 0;
  return 0;
}

function press(key: string) {
  const input = document.querySelector('input') as HTMLInputElement;
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

const highlighted = () =>
  options().find((option) => option.getAttribute('aria-selected') === 'true')?.textContent;

describe('Command (web) — the highlighted row stays in view', () => {
  it('scrolls with the keyboard highlight in the same commit', () => {
    act(() =>
      root.render(
        <BloomThemeProvider mode="light" colorPreset="oxy">
          <Command open onOpenChange={() => {}} items={ITEMS} />
        </BloomThemeProvider>,
      ),
    );
    for (let i = 0; i < 4; i++)
      act(() => {
        jest.advanceTimersByTime(50);
      });
    expect(highlighted()).toBe('Item 0');
    expect(listScroll()).toBe(0);

    // Rows 0–2 fill the 120px viewport; row 3 is below it.
    press('ArrowDown');
    press('ArrowDown');
    expect(highlighted()).toBe('Item 2');
    expect(listScroll()).toBe(0);
    press('ArrowDown');
    expect(highlighted()).toBe('Item 3');
    expect(listScroll()).toBe(4 * ROW - VIEWPORT);

    // Down to the last row, then ArrowDown wraps back to the first.
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    expect(highlighted()).toBe('Item 7');
    expect(listScroll()).toBe(8 * ROW - VIEWPORT);
    press('ArrowDown');
    expect(highlighted()).toBe('Item 0');
    expect(listScroll()).toBe(0);
  });
});
