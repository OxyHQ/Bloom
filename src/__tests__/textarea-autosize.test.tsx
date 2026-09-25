/**
 * @jest-environment jsdom
 *
 * The web autosize the three composers share (`hooks/use-textarea-autosize.ts`),
 * rendered through the REAL react-native-web.
 *
 * jsdom lays nothing out, so `scrollHeight` is modelled on the one property the
 * measurement depends on: it is the content's height (20px a line) but never
 * less than the height already applied — which is why a field has to be
 * collapsed before it can be seen to shrink. Every write of `0px` to the
 * field's height is counted: each is a whole-document layout in a browser, and
 * collapsing on every keystroke cost 23–27 ms a key beside a 1,000-message
 * conversation.
 *
 * What is pinned, in each composer:
 *
 * - **Typing and pasting never collapse the field**, and it still grows a line
 *   at a time and stops at its cap. (The old measurement collapsed on every
 *   change: these counts were one per keystroke.)
 * - **Deleting does collapse it, and it shrinks.**
 * - **The clear after send shrinks it back to one line**, controlled or not —
 *   a programmatic value fires no input event.
 * - The pill used to take react-native-web's `onContentSizeChange`, which
 *   reads `scrollHeight` without collapsing and so never shrank at all.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ChatComposer } from '../chat-composer';
import { ComposerPanel, ComposerPill } from '../composer-panel';
import { isPureInsertion, measureTextarea } from '../hooks/use-textarea-autosize';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LINE = 20;
const lines = (count: number) => Array.from({ length: count }, (_, i) => `line ${i + 1}`).join('\n');

let container: HTMLDivElement;
let root: Root;
let restoreScrollHeight: () => void;

beforeAll(() => {
  const proto = HTMLTextAreaElement.prototype;
  const own = Object.getOwnPropertyDescriptor(proto, 'scrollHeight');
  Object.defineProperty(proto, 'scrollHeight', {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      const content = this.value.split('\n').length * LINE;
      return Math.max(parseFloat(this.style.height) || 0, content);
    },
  });
  restoreScrollHeight = () => {
    if (own) Object.defineProperty(proto, 'scrollHeight', own);
    else delete (proto as { scrollHeight?: number }).scrollHeight;
  };
});

afterAll(() => restoreScrollHeight());

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
  });
}

function field(): HTMLTextAreaElement {
  const found = container.querySelector('textarea');
  if (!found) throw new Error('no textarea in the document');
  return found;
}

/** Counts the `0px` writes to this field's height from now on. */
function countCollapses(el: HTMLTextAreaElement): { readonly count: number } {
  const counter = { count: 0 };
  const style = el.style;
  let proto: object | null = Object.getPrototypeOf(style);
  let descriptor: PropertyDescriptor | undefined;
  while (proto && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(proto, 'height');
    proto = Object.getPrototypeOf(proto);
  }
  if (!descriptor?.set || !descriptor.get) throw new Error('style.height is not an accessor here');
  const { get, set } = descriptor;
  Object.defineProperty(style, 'height', {
    configurable: true,
    get() {
      return get.call(style);
    },
    set(value: string) {
      if (value === '0px') counter.count++;
      set.call(style, value);
    },
  });
  return counter;
}

function type(el: HTMLTextAreaElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/** Types `text` after what the field holds, one character at a time, as a person would. */
function typeOut(el: HTMLTextAreaElement, text: string) {
  const start = el.value;
  for (let i = 1; i <= text.length; i++) type(el, start + text.slice(0, i));
}

function pressEnter(el: HTMLTextAreaElement) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
}

const height = (el: HTMLTextAreaElement) => parseFloat(el.style.height);

describe('isPureInsertion', () => {
  it('is true when characters were only added, at the end, the start or the middle', () => {
    expect(isPureInsertion('', 'a')).toBe(true);
    expect(isPureInsertion('ab', 'abc')).toBe(true);
    expect(isPureInsertion('bc', 'abc')).toBe(true);
    expect(isPureInsertion('ac', 'a\nb\nc')).toBe(true);
    expect(isPureInsertion('same', 'same')).toBe(true);
  });

  it('is false for a deletion, and for a replacement that keeps the length', () => {
    expect(isPureInsertion('abc', 'ab')).toBe(false);
    expect(isPureInsertion('a\nb', 'axb')).toBe(false);
    expect(isPureInsertion('abc', 'xbcd')).toBe(false);
    expect(isPureInsertion('ab', '')).toBe(false);
  });
});

describe('measureTextarea', () => {
  it('reads without touching the height, or collapses and puts the height back', () => {
    const el = document.createElement('textarea');
    el.value = 'one';
    el.style.height = '60px';
    expect(measureTextarea(el, false)).toBe(60);
    expect(measureTextarea(el, true)).toBe(LINE);
    expect(el.style.height).toBe('60px');
  });
});

describe('ChatComposer autosize (web)', () => {
  it('grows a line at a time while typing, stops at maxLines, and never collapses', () => {
    mount(<ChatComposer testID="c" maxLines={4} />);
    const el = field();
    expect(height(el)).toBe(LINE);
    const collapses = countCollapses(el);
    typeOut(el, 'a\nb\nc');
    expect(height(el)).toBe(3 * LINE);
    typeOut(el, '\nd\ne\nf');
    expect(height(el)).toBe(4 * LINE);
    expect(collapses.count).toBe(0);
  });

  it('jumps straight to the cap on a many-line paste, without collapsing', () => {
    mount(<ChatComposer testID="c" maxLines={6} />);
    const el = field();
    const collapses = countCollapses(el);
    type(el, lines(40));
    expect(height(el)).toBe(6 * LINE);
    expect(collapses.count).toBe(0);
  });

  it('collapses to measure a deletion, and shrinks', () => {
    mount(<ChatComposer testID="c" />);
    const el = field();
    type(el, lines(4));
    const collapses = countCollapses(el);
    type(el, lines(2));
    expect(height(el)).toBe(2 * LINE);
    expect(collapses.count).toBe(1);
  });

  it('shrinks back to one line after sending an uncontrolled draft', () => {
    const onSend = jest.fn();
    mount(<ChatComposer testID="c" onSend={onSend} />);
    const el = field();
    type(el, lines(5));
    expect(height(el)).toBe(5 * LINE);
    pressEnter(el);
    expect(onSend).toHaveBeenCalledWith(lines(5));
    expect(el.value).toBe('');
    expect(height(el)).toBe(LINE);
  });

  it('shrinks when a CONTROLLED value is cleared by its owner', () => {
    mount(<ChatComposer testID="c" value={lines(5)} />);
    const el = field();
    expect(height(el)).toBe(5 * LINE);
    mount(<ChatComposer testID="c" value="" />);
    expect(height(el)).toBe(LINE);
  });

  it('keeps minLines as the floor, and does not collapse a field already on it', () => {
    mount(<ChatComposer testID="c" minLines={2} />);
    const el = field();
    expect(height(el)).toBe(2 * LINE);
    const collapses = countCollapses(el);
    type(el, 'x');
    type(el, '');
    expect(height(el)).toBe(2 * LINE);
    expect(collapses.count).toBe(0);
  });
});

describe('ComposerPanel autosize (web)', () => {
  it('grows while typing without collapsing, and caps at 200 then scrolls', () => {
    mount(<ComposerPanel testID="p" />);
    const el = field();
    expect(height(el)).toBe(LINE);
    const collapses = countCollapses(el);
    typeOut(el, 'a\nb\nc');
    expect(height(el)).toBe(3 * LINE);
    type(el, `a\nb\nc${lines(30)}`);
    expect(height(el)).toBe(200);
    expect(collapses.count).toBe(0);
  });

  it('shrinks on a deletion and back to one line after send', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPanel testID="p" onSubmit={onSubmit} />);
    const el = field();
    type(el, lines(6));
    type(el, lines(3));
    expect(height(el)).toBe(3 * LINE);
    pressEnter(el);
    expect(onSubmit).toHaveBeenCalledWith(lines(3));
    expect(height(el)).toBe(LINE);
  });
});

describe('ComposerPill autosize (web)', () => {
  it('grows while typing without collapsing', () => {
    mount(<ComposerPill testID="pill" />);
    const el = field();
    expect(height(el)).toBe(LINE);
    const collapses = countCollapses(el);
    typeOut(el, 'a\nb\nc');
    expect(height(el)).toBe(3 * LINE);
    expect(collapses.count).toBe(0);
  });

  it('shrinks when the draft does', () => {
    mount(<ComposerPill testID="pill" />);
    const el = field();
    type(el, lines(4));
    expect(height(el)).toBe(4 * LINE);
    type(el, lines(2));
    expect(height(el)).toBe(2 * LINE);
  });

  it('shrinks back to one line when its owner clears the draft after send', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPill testID="pill" value={lines(4)} onSubmit={onSubmit} />);
    const el = field();
    expect(height(el)).toBe(4 * LINE);
    pressEnter(el);
    expect(onSubmit).toHaveBeenCalledWith(lines(4));
    mount(<ComposerPill testID="pill" value="" onSubmit={onSubmit} />);
    expect(height(el)).toBe(LINE);
  });
});
