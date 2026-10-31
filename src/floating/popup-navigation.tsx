/**
 * Keyboard navigation for a menu in a platform popup (`floating/PopupPanel`).
 *
 * On the web a menu's rows are DOM elements and `menu-keyboard.ts` moves real
 * focus between them. A native popup has no such focus: the platform sends the
 * keys pressed while the popup has keyboard focus (`PopupSurfaceProps.onKey`,
 * W3C `KeyboardEvent.key` names), and the panel keeps an ACTIVE row. That is
 * Radix's roving highlight, which `MenuRowShell` already paints for hover. Rows
 * register in render order; the active row is highlighted, Enter or Space
 * activates it, and a pointer hovering a row makes it active, so the pointer and
 * the keyboard share one highlight.
 *
 * Submenus (a `SubTrigger` and its `SubContent`, inline in a sheet or a
 * flyout popup of their own on a desktop, `menu-sub-inline.tsx`) take the keys
 * the WAI-ARIA menu pattern, macOS and Android menus give them: → on a row with
 * a submenu opens it and makes its first enabled row active (on a submenu
 * already open, moves into it); ← inside a submenu, or Escape, closes it and
 * makes the row that opened it active again. Escape anywhere else closes the
 * menu. A flyout's popup sends its keys here too: its rows are this panel's,
 * registered through the same React tree. The web flyout's own keys are
 * `menu-sub-flyout.tsx`'s.
 *
 * A flyout also follows the pointer as the web's does: hovering its row opens
 * it, and hovering a row outside it closes it after `FLYOUT_CLOSE_MS`, long
 * enough for the pointer to cross from its row to its panel.
 *
 * A menu opened from the keyboard starts with its first enabled row active (or its
 * last), as a Mac's does (the root's `openFocus`, through `MenuFocusIntent`); one
 * opened by a pointer starts with none, so the first ↓ lands on the first row.
 */
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { GestureResponderEvent } from 'react-native';

import type { MenuFocusIntent } from './menu-keyboard';

/**
 * What a row's `onPress` receives when the keyboard activates it: there is no
 * touch behind it, so it carries no position, and `preventDefault` does nothing.
 */
export const KEYBOARD_ACTIVATION = {
  nativeEvent: {},
  preventDefault: () => {},
  stopPropagation: () => {},
  isDefaultPrevented: () => false,
  isPropagationStopped: () => false,
  persist: () => {},
} as unknown as GestureResponderEvent;

/** How long typed characters accumulate into one typeahead query, in ms. */
export const TYPEAHEAD_MS = 500;

/**
 * How long a flyout stays open after the pointer moves onto a row outside it: the web flyout's
 * grace (`menu-sub-flyout.tsx`), for the diagonal from its row to its panel.
 */
export const FLYOUT_CLOSE_MS = 300;

/**
 * A submenu as navigation sees it: one object for the submenu's life, its fields kept current by
 * its owner (`menu-sub-inline.tsx`'s `MenuSub`). The row that opens it registers it as its
 * `submenu`; the rows inside it (under `PopupSubmenuScope`) register it as their `owner`.
 */
export interface PopupSubmenu {
  open: boolean;
  setOpen: (next: boolean) => void;
  /** Drawn beside its row in a popup of its own (a desktop), so the pointer opens it. */
  flyout?: boolean;
}

interface Row {
  id: number;
  disabled: boolean;
  label: string | undefined;
  activate: () => void;
  /** The submenu this row opens, if it is a submenu's trigger. */
  submenu: PopupSubmenu | undefined;
  /** The submenu this row is inside, if any. */
  owner: PopupSubmenu | null;
}

// Two contexts: the registry is stable for the panel's life, so a row registers once; the
// active row changes on every key and only re-renders the rows.
interface Registry {
  register: (row: Row) => () => void;
  setActive: (id: number | null) => void;
  /** The pointer moved onto a row: it becomes active, and flyouts follow it. */
  hover: (id: number) => void;
}

const PopupNavigationContext = createContext<Registry | null>(null);
const ActiveRowContext = createContext<number | null>(null);
/** Whether the active row was made so by the keyboard (not the pointer): the screen reader follows it. */
const ActiveByKeysContext = createContext(false);
const PopupSubmenuContext = createContext<PopupSubmenu | null>(null);

/** The rows rendered inside it are `submenu`'s, for navigation. */
export function PopupSubmenuScope({
  submenu,
  children,
}: {
  submenu: PopupSubmenu | undefined;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <PopupSubmenuContext.Provider value={submenu ?? null}>{children}</PopupSubmenuContext.Provider>
  );
}

let nextRowId = 0;

/**
 * A menu row's part in popup navigation: whether it is the active row, and
 * `hover()` to make it active under the pointer. Outside a popup panel it is
 * never active and `hover` does nothing.
 */
export function usePopupNavigationRow({
  disabled,
  label,
  activate,
  submenu,
}: {
  disabled: boolean;
  label: string | undefined;
  activate: () => void;
  /** The submenu this row opens (a submenu's trigger). */
  submenu?: PopupSubmenu;
}): { active: boolean; byKeys: boolean; hover: () => void; inPopup: boolean } {
  const navigation = useContext(PopupNavigationContext);
  const activeId = useContext(ActiveRowContext);
  const byKeys = useContext(ActiveByKeysContext);
  const owner = useContext(PopupSubmenuContext);
  const id = useRef<number | null>(null);
  if (id.current === null) id.current = ++nextRowId;
  const row = { id: id.current, disabled, label, activate, submenu, owner };
  const latest = useRef(row);
  latest.current = row;
  useEffect(() => {
    if (!navigation) return;
    return navigation.register({
      get id() {
        return latest.current.id;
      },
      get disabled() {
        return latest.current.disabled;
      },
      get label() {
        return latest.current.label;
      },
      get submenu() {
        return latest.current.submenu;
      },
      get owner() {
        return latest.current.owner;
      },
      activate: () => latest.current.activate(),
    });
  }, [navigation]);
  const hover = useCallback(() => {
    if (navigation && !latest.current.disabled) navigation.hover(latest.current.id);
  }, [navigation]);
  const active = navigation !== null && activeId === id.current;
  return { active, byKeys: active && byKeys, hover, inPopup: navigation !== null };
}

/**
 * The navigation state of one popup panel and its key handler. `onClose` runs
 * for Escape and Tab (Tab leaves the menu, as on the web). `intent`'s edge, when
 * the panel opens with one (an open from the keyboard), makes the first or last
 * enabled row active once the rows have registered.
 */
export interface PopupNavigation {
  provider: (children: React.ReactNode) => React.ReactElement;
  onKey: (key: string) => void;
  /**
   * Whether `onKey` would act on an arrow across (← or →) rather than leave it to the owner: →
   * on a row that opens a submenu, ← inside a submenu. A menu bar moves to its next or previous
   * menu with the keys the menu leaves.
   */
  takes: (key: 'ArrowLeft' | 'ArrowRight') => boolean;
}

export function usePopupNavigation(onClose: () => void, intent?: MenuFocusIntent): PopupNavigation {
  const rows = useRef<Row[]>([]);
  const [activeId, setActive] = useState<number | null>(null);
  // The keyboard moved the active row last (the pointer's hover clears it): a screen reader's
  // focus follows the row then, as VoiceOver's follows a menu's highlight, never the pointer.
  const [byKeys, setByKeys] = useState(false);
  const typed = useRef({ text: '', at: 0 });
  // A submenu → opened, whose first enabled row becomes active as its rows register.
  const entering = useRef<PopupSubmenu | null>(null);
  // The edge an open from the keyboard asked for, taken as the panel mounts and settled once its
  // rows have registered (they may arrive after it, in a popup that renders its content later).
  const opening = useRef<'first' | 'last' | null>(null);
  const [registered, setRegistered] = useState(0);
  if (intent?.edge.current && opening.current === null) {
    const edge = intent.edge.current;
    intent.edge.current = null;
    if (edge === 'first' || edge === 'last') opening.current = edge;
  }
  const register = useCallback((row: Row) => {
    rows.current = [...rows.current, row];
    if (opening.current) setRegistered((count) => count + 1);
    if (entering.current && row.owner === entering.current && !row.disabled) {
      entering.current = null;
      setActive(row.id);
    }
    return () => {
      rows.current = rows.current.filter((other) => other !== row);
      setActive((active) => (active === row.id ? null : active));
    };
  }, []);
  // Flyouts the pointer left, closing once FLYOUT_CLOSE_MS has passed unless it comes back.
  const closing = useRef(new Map<PopupSubmenu, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = closing.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);
  const hover = useCallback((id: number) => {
    setActive(id);
    setByKeys(false);
    const row = rows.current.find((each) => each.id === id);
    if (!row) return;
    // The submenus the row is in, innermost first: each is open while the pointer is on it.
    const within = new Set<PopupSubmenu>();
    for (let owner = row.owner; owner && !within.has(owner); ) {
      within.add(owner);
      owner = rows.current.find((each) => each.submenu === owner)?.owner ?? null;
    }
    if (row.submenu) within.add(row.submenu);
    for (const each of rows.current) {
      const submenu = each.submenu;
      if (!submenu?.flyout) continue;
      const timer = closing.current.get(submenu);
      if (within.has(submenu)) {
        if (timer !== undefined) clearTimeout(timer);
        closing.current.delete(submenu);
      } else if (submenu.open && timer === undefined) {
        closing.current.set(
          submenu,
          setTimeout(() => {
            closing.current.delete(submenu);
            submenu.setOpen(false);
          }, FLYOUT_CLOSE_MS),
        );
      }
    }
    if (row.submenu?.flyout && !row.submenu.open && !row.disabled) row.submenu.setOpen(true);
  }, []);
  const registry = useMemo<Registry>(() => ({ register, setActive, hover }), [register, hover]);
  useEffect(() => {
    const edge = opening.current;
    if (!edge) return;
    const enabled = rows.current.filter((row) => !row.disabled && row.owner === null);
    const row = edge === 'last' ? enabled[enabled.length - 1] : enabled[0];
    if (!row) return;
    opening.current = null;
    setActive(row.id);
    setByKeys(true);
  }, [registered]);

  const onKey = useCallback(
    (key: string) => {
      setByKeys(true);
      const enabled = rows.current.filter((row) => !row.disabled);
      const index = enabled.findIndex((row) => row.id === activeId);
      const move = (to: number) => {
        const row = enabled[Math.max(0, Math.min(enabled.length - 1, to))];
        if (row) setActive(row.id);
      };
      const current = enabled[index];
      // Closes the submenu the active row is in, making the row that opened it active.
      const leave = () => {
        const owner = current?.owner;
        if (!owner) return false;
        const trigger = rows.current.find((row) => row.submenu === owner);
        owner.setOpen(false);
        if (trigger) setActive(trigger.id);
        return true;
      };
      switch (key) {
        case 'ArrowRight': {
          const submenu = current?.submenu;
          if (!submenu) return;
          if (submenu.open) {
            const first = enabled.find((row) => row.owner === submenu);
            if (first) setActive(first.id);
            return;
          }
          entering.current = submenu;
          submenu.setOpen(true);
          return;
        }
        case 'ArrowLeft':
          leave();
          return;
        case 'ArrowDown':
          return move(index < 0 ? 0 : index + 1);
        case 'ArrowUp':
          return move(index < 0 ? enabled.length - 1 : index - 1);
        case 'Home':
        case 'PageUp':
          return move(0);
        case 'End':
        case 'PageDown':
          return move(enabled.length - 1);
        case 'Enter':
        case ' ':
          enabled[index]?.activate();
          return;
        case 'Escape':
          if (leave()) return;
          return onClose();
        case 'Tab':
          return onClose();
        default:
          break;
      }
      // Typeahead: a printable character extends the query (within TYPEAHEAD_MS) and
      // activates the next enabled row whose label starts with it.
      if ([...key].length !== 1 || key.trim() === '') return;
      const now = Date.now();
      typed.current = {
        text: now - typed.current.at < TYPEAHEAD_MS ? typed.current.text + key : key,
        at: now,
      };
      const query = typed.current.text.toLocaleLowerCase();
      const start = typed.current.text.length > 1 ? Math.max(index, 0) : index + 1;
      for (let step = 0; step < enabled.length; step++) {
        const row = enabled[(start + step) % enabled.length];
        if (row?.label?.toLocaleLowerCase().startsWith(query)) return setActive(row.id);
      }
    },
    [activeId, onClose],
  );

  const takes = useCallback(
    (key: 'ArrowLeft' | 'ArrowRight') => {
      const current = rows.current.find((row) => row.id === activeId && !row.disabled);
      return key === 'ArrowRight' ? current?.submenu !== undefined : current?.owner != null;
    },
    [activeId],
  );

  const provider = useCallback(
    (children: React.ReactNode) => (
      <PopupNavigationContext.Provider value={registry}>
        <ActiveRowContext.Provider value={activeId}>
          <ActiveByKeysContext.Provider value={byKeys}>
            <PopupKeysContext.Provider value={onKey}>{children}</PopupKeysContext.Provider>
          </ActiveByKeysContext.Provider>
        </ActiveRowContext.Provider>
      </PopupNavigationContext.Provider>
    ),
    [registry, activeId, byKeys, onKey],
  );
  return { provider, onKey, takes };
}

const PopupKeysContext = createContext<((key: string) => void) | null>(null);

/**
 * The key handler of the popup panel around, for a flyout's popup: its keys go to the panel its
 * rows are registered with. Null outside a popup panel.
 */
export function usePopupKeys(): ((key: string) => void) | null {
  return useContext(PopupKeysContext);
}
