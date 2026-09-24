/**
 * The keyboard half of the ARIA menu-button pattern for the anchored menus —
 * `DropdownMenu`, `ContextMenu`, `Menubar` and their flyout sub-menus — on WEB.
 *
 * What shipped: the trigger opened the menu on Enter/Space (it is a real
 * `<button>`) and focus STAYED on it. The rows are portaled to the end of
 * `<body>`, so the arrow keys had nothing to move, Tab walked on through the
 * page BEHIND the open menu, and a keyboard user could open a menu and choose
 * nothing. The markup was right throughout (`role="menu"`, `menuitem`,
 * `aria-checked`), which is why nothing flagged it.
 *
 * The contract now:
 *
 *  - Opening from the keyboard moves focus INTO the menu: Enter, Space and
 *    ArrowDown land on the first enabled row, ArrowUp on the last. A pointer
 *    open leaves focus where the pointer put it; an arrow on the trigger of an
 *    already-open menu then moves it in.
 *  - In the menu: ArrowDown/ArrowUp move between enabled rows and WRAP;
 *    Home/End jump to the ends; Enter and Space activate the row — a checkbox
 *    row toggles, a radio row selects, and a row's `keepOpen` still decides
 *    whether the menu closes. react-native-web presses a `menuitem`, `checkbox`
 *    or `radio` on Enter only (`PressResponder.isValidKeyPress` limits Space to
 *    `role="button"`), so Space is supplied here.
 *  - Tab closes the menu and returns focus to the trigger — a menu is not in
 *    the page's tab sequence. Escape closes the innermost surface
 *    (`escape-stack.ts`) and focus returns the same way.
 *  - The sub-menu keys stay `menu-sub-flyout.tsx`'s: → on a sub trigger opens
 *    the flyout and focuses its first row, ← inside it closes it and refocuses
 *    the trigger row.
 *
 * DOM listeners rather than props, like the sub-menu's: a row is
 * `shared.tsx`'s `MenuRowShell`, the trigger may be the caller's own element
 * under `asChild`, and the order of rows is whatever the caller rendered —
 * the DOM already holds all of it. Every entry point is inert without a DOM
 * node, so native (the menu is a bottom sheet there) is untouched.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isSpaceKey, rovingItems, rovingMove, rovingTarget } from '../hooks/roving-focus';
import { MENU_MOTION_DURATION } from './constants';

/** Every role a menu ROW can carry — the rows a pointer or a key can land on. */
export const MENU_ROW_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="checkbox"], [role="radio"]';

/** A panel, so a nested panel's rows are never counted as this one's. */
const MENU_PANEL_SELECTOR = '[role="menu"]';

export type MenuFocusEdge = 'first' | 'last';

/**
 * Where focus should land the next time the menu's panel is ready — set by a
 * key on the trigger, consumed by the panel. Owned by the family ROOT, which is
 * the one component both the trigger and the content can reach.
 */
export interface MenuFocusIntent {
  /** The pending edge, or `null` for "leave focus alone" (a pointer open). */
  edge: React.MutableRefObject<MenuFocusEdge | null>;
  /** Bumped to ask an ALREADY-open panel to take focus. */
  tick: number;
  request: (edge: MenuFocusEdge) => void;
}

export function useMenuFocusIntent(): MenuFocusIntent {
  const edge = useRef<MenuFocusEdge | null>(null);
  const [tick, setTick] = useState(0);
  const request = useCallback((next: MenuFocusEdge) => {
    edge.current = next;
    setTick((count) => count + 1);
  }, []);
  return useMemo(() => ({ edge, tick, request }), [tick, request]);
}

/** A react-native-web host ref, read as the DOM element it is on web. */
export function hostElement(node: unknown): HTMLElement | null {
  if (!node || typeof node !== 'object') return null;
  const scrollable = (node as { getScrollableNode?: () => unknown }).getScrollableNode?.();
  const element = (scrollable ?? node) as Partial<HTMLElement>;
  return typeof element.querySelector === 'function' &&
    typeof element.addEventListener === 'function'
    ? (element as HTMLElement)
    : null;
}

/** The trigger's own focusable control inside its anchor wrapper. */
export function triggerControl(anchor: unknown): HTMLElement | null {
  const wrapper = hostElement(anchor);
  return (
    wrapper?.querySelector<HTMLElement>('[aria-haspopup]') ??
    wrapper?.querySelector<HTMLElement>('[tabindex]') ??
    null
  );
}

/**
 * Hand focus back to the trigger when a surface closes with focus inside it.
 *
 * `isInside` says whether an element belongs to the surface. Checked AT the
 * close, when the panel is still mounted for its exit animation, so a row that
 * was just activated still counts. Focus that has already gone somewhere real
 * — a dialog the row opened, a field the pointer clicked — is left alone. The
 * one deferred case is focus left on a node the exit is about to UNMOUNT (the
 * outside-press backdrop): once the exit has run and focus has fallen to
 * `<body>`, it goes back to the trigger too.
 */
export function useReturnFocusOnClose(
  anchorRef: React.RefObject<unknown>,
  open: boolean,
  isInside: (element: Element) => boolean,
): void {
  const wasOpen = useRef(open);
  const isInsideRef = useRef(isInside);
  isInsideRef.current = isInside;
  useEffect(() => {
    const closed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!closed || typeof document === 'undefined') return undefined;
    const active = document.activeElement;
    if (!active || active === document.body || isInsideRef.current(active)) {
      triggerControl(anchorRef.current)?.focus({ preventScroll: true });
      return undefined;
    }
    const timer = setTimeout(() => {
      if (document.activeElement === document.body && !active.isConnected) {
        triggerControl(anchorRef.current)?.focus({ preventScroll: true });
      }
    }, MENU_MOTION_DURATION + 50);
    return () => clearTimeout(timer);
  }, [open, anchorRef]);
}

/** Whether an element is one of the menu surfaces — any panel, any depth. */
export function isInMenuSurface(element: Element): boolean {
  return element.closest(MENU_PANEL_SELECTOR) !== null;
}

/**
 * The menu trigger's keys, on its anchor wrapper: Enter/Space mark a closed
 * menu's open as a keyboard one (the press itself is the button's own);
 * ArrowDown/ArrowUp open it — or, open already, move focus in — landing on the
 * first/last row. Plus the focus return on close.
 */
export function useMenuTriggerKeys(
  anchorRef: React.RefObject<unknown>,
  {
    open,
    setOpen,
    disabled,
    intent,
  }: {
    open: boolean;
    setOpen: (next: boolean) => void;
    disabled?: boolean;
    intent: MenuFocusIntent | undefined;
  },
): void {
  const edge = intent?.edge;
  const request = intent?.request;
  useEffect(() => {
    const wrapper = hostElement(anchorRef.current);
    if (!wrapper || disabled || !edge || !request) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Enter' || isSpaceKey(event.key)) {
        if (!open) edge.current = 'first';
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      if (!open) setOpen(true);
      request(event.key === 'ArrowDown' ? 'first' : 'last');
    };
    wrapper.addEventListener('keydown', onKeyDown);
    return () => wrapper.removeEventListener('keydown', onKeyDown);
  }, [anchorRef, disabled, open, setOpen, edge, request]);

  // A pointer open must not inherit a stale keyboard intent from a key that
  // did not open anything (a disabled row, a prevented press).
  useEffect(() => {
    if (!open && edge) edge.current = null;
  }, [open, edge]);

  useReturnFocusOnClose(anchorRef, open, isInMenuSurface);
}

/** The enabled rows that belong to `panel`, in document order. */
function menuRows(panel: Element): HTMLElement[] {
  // The owner is the nearest `role="menu"` — the panel itself, or (for a sub
  // panel, whose rows sit in an inner scroller) the panel around it.
  const owner = panel.closest(MENU_PANEL_SELECTOR) ?? panel;
  return rovingItems(owner, MENU_ROW_SELECTOR, { owner: MENU_PANEL_SELECTOR });
}

/**
 * The keys inside an open menu panel: arrows (wrapping), Home/End, Space, Tab.
 * `intent`, when given, lands focus on the first/last row as the panel opens
 * from the keyboard (a sub-panel focuses its own first row and passes none).
 */
export function useMenuPanelKeys(
  panel: HTMLElement | null,
  { open, onTab, intent }: { open: boolean; onTab: () => void; intent?: MenuFocusIntent },
): void {
  const onTabRef = useRef(onTab);
  onTabRef.current = onTab;

  const edge = intent?.edge;
  const tick = intent?.tick;
  useEffect(() => {
    if (!open || !panel || !edge?.current) return;
    const rows = menuRows(panel);
    const target = edge.current === 'last' ? rows[rows.length - 1] : rows[0];
    edge.current = null;
    target?.focus({ preventScroll: true });
  }, [open, panel, edge, tick]);

  useEffect(() => {
    if (!panel || !open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const active =
        typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      const current = active?.closest?.(MENU_ROW_SELECTOR) ?? null;
      if (event.key === 'Tab') {
        event.preventDefault();
        onTabRef.current();
        return;
      }
      if (isSpaceKey(event.key)) {
        if (!current || current.getAttribute('aria-disabled') === 'true') return;
        event.preventDefault();
        (current as HTMLElement).click();
        return;
      }
      const move = rovingMove(event.key, { orientation: 'vertical', homeEnd: true });
      if (move === null) return;
      event.preventDefault();
      rovingTarget(menuRows(panel), current, move, true)?.focus();
    };
    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [panel, open]);
}
