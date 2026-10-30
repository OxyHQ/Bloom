/**
 * `useWindowKeys`: an application's own keys from the window, on every
 * platform, wherever focus is — a file list's arrows, Return and Space, and
 * type-select, which a Mac's Finder takes as its key view's.
 *
 * The keys come from the window's key source (`window-keys.ts`): the platform
 * adapter's `keyboard` (a native host), else the DOM's `window` (the web),
 * else none (React Native without an adapter has no window-wide key event, so
 * a view's keys there are its own `onKeyDown`'s). A menu's shortcut hears a
 * key first, so a command declared in a `Menubar` (`Mod+O`) runs its item and
 * never reaches the application's handler.
 *
 * Not offered, and so the focused control's:
 *  - a key while a text field has focus: it types, moves and deletes there
 *    (unless `whileTyping`: the field's owner hears it first, as a list's
 *    rename field hears Escape, which no field acts on);
 *  - a key while an anchored menu, list or dialog is open: its own;
 *  - an input method's composition, and a key something else already took.
 *
 * The handler returns `true` for a key it took: it goes no further (not to the
 * focused view, not to the browser's own default). Anything else passes on.
 */
import { useEffect, useRef } from 'react';

import { hasOpenFloatingSurface } from '../floating/escape-stack';
import { isApplePlatform } from './chord';
import { addWindowKeyHandler, APPLICATION_KEYS } from './window-keys';
import { usePlatformKeyboard } from '../platform-surface/context';
import type { PlatformKeyEvent } from '../platform-surface/types';

export interface UseWindowKeysOptions {
  /** Listen only while true (a window shown, a view in front). Defaults to true. */
  enabled?: boolean;
  /**
   * Hear keys while a text field has focus too: for the field's owner, which
   * takes only what the field does not act on (Escape to cancel an edit) and
   * returns false for the rest. Defaults to false.
   */
  whileTyping?: boolean;
}

export function useWindowKeys(
  handler: (event: PlatformKeyEvent) => boolean,
  { enabled = true, whileTyping = false }: UseWindowKeysOptions = {},
): void {
  const keyboard = usePlatformKeyboard();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (!enabled) return undefined;
    return addWindowKeyHandler(keyboard, APPLICATION_KEYS, (event, textEntry) => {
      if ((textEntry && !whileTyping) || hasOpenFloatingSurface()) return false;
      return latest.current(event) === true;
    });
  }, [keyboard, enabled, whileTyping]);
}

/**
 * Whether a key or pointer event carries the platform's command modifier, the
 * `Mod` of a chord: ⌘ (Meta) on Apple platforms, Ctrl elsewhere, OxyOS
 * included. A list adds one item to its selection with it held, as Finder's
 * ⌘-click does.
 */
export function isCommandKey(event: { ctrlKey?: boolean; metaKey?: boolean }): boolean {
  return isApplePlatform() ? event.metaKey === true : event.ctrlKey === true;
}
