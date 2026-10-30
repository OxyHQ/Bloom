/**
 * A menu item's shortcut runs the item, on every platform, with or without a
 * bar showing it (OxyOS ADR 0021, decision 3).
 *
 * WHERE THE KEYS COME FROM. The window's key source (`kbd/window-keys`): the
 * platform adapter's `keyboard`, else the DOM's `window` in the capture phase,
 * else none, in which case the menus still work by pressing. Menus hear a key
 * before an application's own keys (`useWindowKeys`).
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

import { hasOpenFloatingSurface } from '../floating/escape-stack';
import { hasCommandModifier, isApplePlatform, textEntryKeeps } from '../kbd/chord';
import { addWindowKeyHandler, MENU_SHORTCUTS } from '../kbd/window-keys';
import { usePlatformKeyboard } from '../platform-surface/context';
import type { MenuEntry, MenubarRegistry } from './registry';

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
    return addWindowKeyHandler(keyboard, MENU_SHORTCUTS, (event, textEntry) => {
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
