/**
 * A settings page keeps its focused field above the software keyboard.
 *
 * The settings modal draws edge to edge, so the keyboard slides over it: a
 * field low on Personalization stayed behind the keyboard with no way to
 * scroll it out (Pixel 8a, Android 16, Bloom 4.23.0). The page now pads by the
 * keyboard and scrolls the focused field up by exactly its overlap.
 */
import React from 'react';
import * as ReactNative from 'react-native';
import { act, renderHook } from '@testing-library/react-native';

import { KEYBOARD_REVEAL_MARGIN, useKeyboardReveal } from '../settings-modal/use-keyboard-reveal';

type Listener = (event: unknown) => void;
let listeners: Record<string, Listener>;
let focused: unknown;

beforeEach(() => {
  listeners = {};
  focused = null;
  jest.spyOn(ReactNative.Keyboard, 'addListener').mockImplementation(((name: string, listener: Listener) => {
    listeners[name] = listener;
    return { remove: () => delete listeners[name] };
  }) as unknown as typeof ReactNative.Keyboard.addListener);
  (ReactNative.TextInput as unknown as { State: unknown }).State = { currentlyFocusedInput: () => focused };
});
afterEach(() => {
  jest.restoreAllMocks();
  delete (ReactNative.TextInput as unknown as { State?: unknown }).State;
});

/** A field whose box, in window coordinates, starts at `y` and is 40 tall. */
const fieldAt = (y: number) => ({ measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(16, y, 300, 40) });
const keyboard = (height: number, screenY: number) => ({ endCoordinates: { height, screenY, screenX: 0, width: 400 } });

function mount(enabled = true) {
  const scrollTo = jest.fn();
  const scrollRef = { current: { scrollTo } as unknown as ReactNative.ScrollView };
  const offset = { value: 100 };
  const hook = renderHook(() => useKeyboardReveal(scrollRef, offset, enabled));
  return { hook, scrollTo };
}

const showName = () => Object.keys(listeners).find((name) => /Show$/.test(name))!;
const hideName = () => Object.keys(listeners).find((name) => /Hide$/.test(name))!;

it('scrolls a field the keyboard covers up above it, and pads the page by the keyboard', () => {
  const { hook, scrollTo } = mount();
  focused = fieldAt(700);
  act(() => listeners[showName()]!(keyboard(300, 500)));
  expect(hook.result.current).toBe(300);
  // The field ends at 740; the keyboard begins at 500.
  expect(scrollTo).toHaveBeenCalledWith({ y: 100 + (740 + KEYBOARD_REVEAL_MARGIN - 500), animated: true });

  act(() => listeners[hideName()]!(keyboard(0, 800)));
  expect(hook.result.current).toBe(0);
});

it('leaves a field the keyboard does not cover where it is', () => {
  const { hook, scrollTo } = mount();
  focused = fieldAt(200);
  act(() => listeners[showName()]!(keyboard(300, 500)));
  expect(hook.result.current).toBe(300);
  expect(scrollTo).not.toHaveBeenCalled();
});

it('does nothing where the browser owns the keyboard (web)', () => {
  const { hook } = mount(false);
  expect(Object.keys(listeners)).toEqual([]);
  expect(hook.result.current).toBe(0);
});
