/**
 * The bar driven from the keyboard, as a Mac's after Control-F2 (OxyOS's
 * Super+F2): the owner puts the keyboard on a menu's title (`Menubar`'s
 * `focusValue`), and while it is there these keys are the bar's.
 *
 * - ← and → move to the previous and the next menu, round the ends, skipping a
 *   disabled one; with a menu open the next one opens in its place, on its
 *   first row. An open menu keeps the arrow it acts on itself: → on a row that
 *   opens a submenu, ← inside a submenu (`PopupNavigation.takes`).
 * - With none open: ↓, Return and Space open the focused menu on its first
 *   enabled row, ↑ on its last; a letter moves to the next menu whose title
 *   starts with it; Escape leaves the bar (`focusValue` becomes undefined).
 * - With one open, every other key is the menu's own (its rows, typeahead,
 *   Escape closing it back to its title).
 * - A key with Ctrl, Alt or Meta is never the bar's.
 *
 * A menu opened by a press, the keyboard elsewhere, takes ← and → the same
 * way, as a Mac's menu opened by a click does: the next menu opens in its
 * place, on its first row, and the keyboard stays where it was (`focusValue`
 * is untouched). Every other key is the menu's own.
 *
 * The keys come from the platform's `keyboard` before anything else sees them
 * (a native host), or from the document (the web). A key the bar takes goes no
 * further.
 */
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import type { PlatformKeyEvent, PlatformKeyboard } from '../platform-surface/types';
import type { MenubarMenuHandle } from './context';

interface BarState {
  /** The menus' values, in the bar's order. */
  order: readonly string[];
  menus: Map<string, MenubarMenuHandle>;
  focusValue: string | undefined;
  openValue: string | undefined;
  setFocusValue: (next: string | undefined) => void;
  setOpenValue: (next: string | undefined) => void;
}

const TYPEAHEAD_MS = 500;

/** What a key does to the bar: true when the bar took it. */
export function menubarKey(
  event: PlatformKeyEvent,
  bar: BarState,
  typed: { text: string; at: number },
): boolean {
  if (event.ctrlKey || event.altKey || event.metaKey) return false;
  // The title with the keyboard, else the open menu's: a menu opened by a press.
  const byKeyboard = bar.focusValue !== undefined;
  const focused = bar.focusValue ?? bar.openValue;
  if (focused === undefined) return false;
  const enabled = bar.order.filter((value) => !bar.menus.get(value)?.disabled);
  if (enabled.length === 0) return false;
  const open = (value: string, edge: 'first' | 'last') => {
    const handle = bar.menus.get(value);
    if (handle) handle.focusIntent.edge.current = edge;
    bar.setOpenValue(value);
  };
  const isOpen = bar.openValue !== undefined;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (isOpen && bar.menus.get(bar.openValue as string)?.navigation.current?.takes(event.key)) {
      return false;
    }
    const from = Math.max(0, enabled.indexOf(focused));
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const to = enabled[(from + step + enabled.length) % enabled.length] as string;
    if (byKeyboard) bar.setFocusValue(to);
    if (isOpen) open(to, 'first');
    return true;
  }
  if (isOpen || !byKeyboard) return false;
  switch (event.key) {
    case 'ArrowDown':
    case 'Enter':
    case ' ':
      open(focused, 'first');
      return true;
    case 'ArrowUp':
      open(focused, 'last');
      return true;
    case 'Escape':
      bar.setFocusValue(undefined);
      return true;
    default:
      break;
  }
  // Typeahead across the titles: within TYPEAHEAD_MS the letters build one query.
  if ([...event.key].length !== 1 || event.key.trim() === '') return false;
  const now = Date.now();
  typed.text = now - typed.at < TYPEAHEAD_MS ? typed.text + event.key : event.key;
  typed.at = now;
  const query = typed.text.toLocaleLowerCase();
  const index = enabled.indexOf(focused);
  const start = typed.text.length > 1 ? Math.max(index, 0) : index + 1;
  for (let step = 0; step < enabled.length; step++) {
    const value = enabled[(start + step) % enabled.length] as string;
    if (bar.menus.get(value)?.label.toLocaleLowerCase().startsWith(query)) {
      bar.setFocusValue(value);
      return true;
    }
  }
  return true;
}

export function useMenubarKeys(bar: BarState, keyboard: PlatformKeyboard | null): void {
  const latest = useRef(bar);
  latest.current = bar;
  const typed = useRef({ text: '', at: 0 });
  // The bar's keys while it has the keyboard; while a menu opened by a press is open, its arrows.
  const mode =
    bar.focusValue !== undefined ? 'keyboard' : bar.openValue !== undefined ? 'open' : null;

  useEffect(() => {
    if (!mode) return undefined;
    if (keyboard) {
      return keyboard.subscribe((event) => menubarKey(event, latest.current, typed.current));
    }
    if (typeof document === 'undefined') return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (menubarKey(event, latest.current, typed.current)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    // With the keyboard, capture: the bar's arrows win over the focused element's own. A menu
    // opened by a press hears them as they bubble, after its rows: a submenu's trigger takes →
    // and a submenu ← (`menu-sub-flyout.tsx`), each preventing it, and the bar takes the rest.
    const capture = mode === 'keyboard';
    document.addEventListener('keydown', onKeyDown, capture);
    return () => document.removeEventListener('keydown', onKeyDown, capture);
  }, [mode, keyboard]);

  // The assistive technology's focus, and the web's, follow the title with the keyboard while no
  // menu is open, as VoiceOver's follows a Mac's bar.
  const { focusValue, openValue, menus } = bar;
  useEffect(() => {
    if (focusValue === undefined || openValue !== undefined) return;
    const node = menus.get(focusValue)?.anchorRef.current as unknown;
    if (!node) return;
    if (Platform.OS === 'web') {
      const element = node as {
        focus?: (options?: { preventScroll?: boolean }) => void;
        querySelector?: (s: string) => { focus?: () => void } | null;
      };
      const control = element.querySelector?.('[role="button"], button') ?? element;
      control.focus?.();
      return;
    }
    AccessibilityInfo.sendAccessibilityEvent(
      node as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0],
      'focus',
    );
  }, [focusValue, openValue, menus]);
}
