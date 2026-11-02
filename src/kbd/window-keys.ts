/**
 * The window's key presses, from one source per window, for everything in
 * Bloom that listens to the window rather than to a focused view: a menu's
 * shortcuts (`menubar/use-menu-shortcuts`) and an application's own keys
 * (`useWindowKeys`: a file list's arrows, Return and type-select).
 *
 * WHERE THE KEYS COME FROM:
 *  - the platform adapter's `keyboard` when it supplies one (a native host,
 *    which offers each key to Bloom before the focused view);
 *  - otherwise the DOM's `window` where there is one (the web), in the CAPTURE
 *    phase. A bubble listener never hears a key typed in a text field:
 *    react-native-web's `TextInput` stops every keydown's propagation (see
 *    `overlay/modal-keyboard.ts`), and `Mod+S` in a field must still save, and
 *    must stop the browser's own Save before it happens;
 *  - otherwise none: React Native has no window-wide key event (its `onKeyDown`
 *    reaches only the focused view and its ancestors, on Android only).
 *
 * WHO HEARS A KEY FIRST. Handlers are offered a key by rank, then in the order
 * they were added: menus' shortcuts (`MENU_SHORTCUTS`), then the focused
 * control's own keys (`FOCUSED_CONTROL_KEYS`: a segmented control's or a
 * sidebar's arrows while one of its options has the keyboard focus), then an
 * application's keys (`APPLICATION_KEYS`), as a Mac's key equivalents come
 * before the key view, and the key view before the window. The first that takes it ends it: it is consumed
 * (`preventDefault`, `stopPropagation`; an adapter's `subscribe` listener
 * returns true). A key something else already took (`defaultPrevented`) and an
 * input method's composition reach no one.
 */
import { TextInput } from 'react-native';

import { isTextEntry } from '../overlay/modal-keyboard';
import type { PlatformKeyboard, PlatformKeyEvent } from '../platform-surface/types';

/** A handler's answer to a key: whether it took it. `textEntry`: focus is in a text field. */
export type WindowKeyHandler = (event: PlatformKeyEvent, textEntry: boolean) => boolean;

/** Ranks: lower hears first. */
export const MENU_SHORTCUTS = 0;
export const FOCUSED_CONTROL_KEYS = 1;
export const APPLICATION_KEYS = 2;

interface Ranked {
  rank: number;
  handler: WindowKeyHandler;
}

interface KeySource {
  handlers: Ranked[];
  release: (() => void) | null;
}

declare global {
  var __oxy_so_bloom_window_keys__: Map<object, KeySource> | undefined;
}

/** `globalThis`-anchored, as `floating/escape-stack.ts` is, so two copies of Bloom share it. */
function sources(): Map<object, KeySource> {
  globalThis.__oxy_so_bloom_window_keys__ ??= new Map();
  return globalThis.__oxy_so_bloom_window_keys__;
}

/** The DOM's key source's identity in `sources()`. */
const DOCUMENT = {};

function offer(source: KeySource, event: PlatformKeyEvent, textEntry: boolean): boolean {
  if (event.isComposing) return false;
  return [...source.handlers].some(({ handler }) => handler(event, textEntry));
}

/** Whether focus is in a text field, for a key that does not say where it went. */
export function focusedTextEntry(): boolean {
  if (typeof document !== 'undefined') return isTextEntry(document.activeElement);
  const state = (TextInput as { State?: { currentlyFocusedInput?: () => unknown } }).State;
  return state?.currentlyFocusedInput?.() != null;
}

function listen(keyboard: PlatformKeyboard | null, source: KeySource): (() => void) | null {
  if (keyboard) {
    return keyboard.subscribe((event) => offer(source, event, focusedTextEntry()));
  }
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return null;
  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (!offer(source, event, isTextEntry(event.target))) return;
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}

/** Adds a handler to the window's key source at `rank`; returns its removal. */
export function addWindowKeyHandler(
  keyboard: PlatformKeyboard | null,
  rank: number,
  handler: WindowKeyHandler,
): () => void {
  const all = sources();
  const identity = keyboard ?? DOCUMENT;
  let source = all.get(identity);
  if (!source) {
    source = { handlers: [], release: null };
    all.set(identity, source);
    source.release = listen(keyboard, source);
  }
  const current = source;
  const entry = { rank, handler };
  // After every handler of its rank or a lower one: ranks first, then the order added.
  const at = current.handlers.findIndex((other) => other.rank > rank);
  current.handlers.splice(at < 0 ? current.handlers.length : at, 0, entry);
  return () => {
    const index = current.handlers.indexOf(entry);
    if (index >= 0) current.handlers.splice(index, 1);
    if (current.handlers.length > 0) return;
    current.release?.();
    all.delete(identity);
  };
}
