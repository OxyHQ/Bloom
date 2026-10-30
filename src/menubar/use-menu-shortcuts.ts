/**
 * A menu item's shortcut runs the item, on every platform, with or without a
 * bar showing it (OxyOS ADR 0021, decision 3).
 *
 * WHERE THE KEYS COME FROM. The window's key presses, from one source per
 * window:
 *  - the platform adapter's `keyboard` when it supplies one (a native host,
 *    which offers each key to Bloom before the focused view);
 *  - otherwise the DOM's `window` where there is one (the web), in the CAPTURE
 *    phase. A bubble listener never hears a key typed in a text field:
 *    react-native-web's `TextInput` stops every keydown's propagation (see
 *    `overlay/modal-keyboard.ts`), and `Mod+S` in a field must still save, and
 *    must stop the browser's own Save before it happens;
 *  - otherwise none: React Native has no window-wide key event (its `onKeyDown`
 *    reaches only the focused view and its ancestors, on Android only), so a
 *    native app without an adapter `keyboard` has no shortcuts. The menus
 *    still work by pressing.
 *
 * WHO TAKES A KEY. A menu's shortcut takes precedence over the focused control,
 * as a Mac's key equivalents do, except:
 *  - in a focused text field, the keys it edits with (`kbd/chord.ts`
 *    `textEntryKeeps`: typing, moving and deleting, `Mod+C/X/V/A/Z`,
 *    `Mod+Shift+Z`); Edit's own Copy item acts through the field instead;
 *  - while an anchored menu or list is open, a key without Ctrl, Alt or Meta,
 *    which is that menu's (arrows, typeahead);
 *  - a key something else already took (`defaultPrevented`), and an input
 *    method's composition.
 * A key that ran an item is consumed (`preventDefault`, `stopPropagation`; an
 * adapter's `subscribe` listener returns true). A held key runs it once. A
 * disabled item's chord is not taken.
 *
 * Several bars in one window share the source: the first mounted bar that has
 * the chord runs it, once.
 */
import { useEffect, useRef } from 'react';
import { TextInput } from 'react-native';

import { hasOpenFloatingSurface } from '../floating/escape-stack';
import { hasCommandModifier, isApplePlatform, textEntryKeeps } from '../kbd/chord';
import { isTextEntry } from '../overlay/modal-keyboard';
import { usePlatformKeyboard } from '../platform-surface/context';
import type { PlatformKeyboard, PlatformKeyEvent } from '../platform-surface/types';
import type { MenuEntry, MenubarRegistry } from './registry';

/** One bar's answer to a key: whether it ran an item for it. */
type ChordHandler = (event: PlatformKeyEvent, textEntry: boolean) => boolean;

interface KeySource {
  handlers: ChordHandler[];
  release: (() => void) | null;
}

declare global {
  var __oxy_so_bloom_menubar_keys__: Map<object, KeySource> | undefined;
}

/** `globalThis`-anchored, as `floating/escape-stack.ts` is. */
function sources(): Map<object, KeySource> {
  globalThis.__oxy_so_bloom_menubar_keys__ ??= new Map();
  return globalThis.__oxy_so_bloom_menubar_keys__;
}

/** The DOM's key source's identity in `sources()`. */
const DOCUMENT = {};

function offer(source: KeySource, event: PlatformKeyEvent, textEntry: boolean): boolean {
  if (event.isComposing) return false;
  return [...source.handlers].some((handler) => handler(event, textEntry));
}

/** Whether focus is in a text field, for a key that does not say where it went. */
function focusedTextEntry(): boolean {
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

/** Adds a bar's handler to the window's key source; returns its removal. */
function addHandler(keyboard: PlatformKeyboard | null, handler: ChordHandler): () => void {
  const all = sources();
  const identity = keyboard ?? DOCUMENT;
  let source = all.get(identity);
  if (!source) {
    source = { handlers: [], release: null };
    all.set(identity, source);
    source.release = listen(keyboard, source);
  }
  const current = source;
  current.handlers.push(handler);
  return () => {
    const index = current.handlers.indexOf(handler);
    if (index >= 0) current.handlers.splice(index, 1);
    if (current.handlers.length > 0) return;
    current.release?.();
    all.delete(identity);
  };
}

/**
 * Runs `registry`'s item for each key press that is its shortcut, while
 * `active`. `onRun` is told the item that ran (the bar closes an open menu
 * after it, as a press on the row would).
 */
export function useMenuShortcuts(
  registry: MenubarRegistry,
  active: boolean,
  onRun: (entry: MenuEntry) => void,
): void {
  const keyboard = usePlatformKeyboard();
  const latestOnRun = useRef(onRun);
  useEffect(() => {
    latestOnRun.current = onRun;
  });

  useEffect(() => {
    if (!active) return undefined;
    return addHandler(keyboard, (event, textEntry) => {
      const apple = isApplePlatform();
      if (textEntry && textEntryKeeps(event, apple)) return false;
      if (!hasCommandModifier(event) && hasOpenFloatingSurface()) return false;
      const entry = registry.shortcutFor(event, apple);
      if (!entry) return false;
      if (!event.repeat && registry.activate(entry.id)) latestOnRun.current(entry);
      return true;
    });
  }, [registry, active, keyboard]);
}
