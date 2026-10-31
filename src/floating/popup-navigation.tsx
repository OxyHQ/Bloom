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
 * Submenus (an inline `SubTrigger` and its `SubContent`) take the keys the
 * WAI-ARIA menu pattern, macOS and Android menus give them: → on a row with a
 * submenu opens it and makes its first enabled row active (on a submenu already
 * open, moves into it); ← inside a submenu, or Escape, closes it and makes the
 * row that opened it active again. Escape anywhere else closes the menu. The web
 * flyout's own keys are `menu-sub-flyout.tsx`'s.
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
 * A submenu as navigation sees it: one object for the submenu's life, its fields kept current by
 * its owner (`menu-sub-inline.tsx`'s `MenuSub`). The row that opens it registers it as its
 * `submenu`; the rows inside it (under `PopupSubmenuScope`) register it as their `owner`.
 */
export interface PopupSubmenu {
  open: boolean;
  setOpen: (next: boolean) => void;
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
}

const PopupNavigationContext = createContext<Registry | null>(null);
const ActiveRowContext = createContext<number | null>(null);
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
}): { active: boolean; hover: () => void } {
  const navigation = useContext(PopupNavigationContext);
  const activeId = useContext(ActiveRowContext);
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
    if (navigation && !latest.current.disabled) navigation.setActive(latest.current.id);
  }, [navigation]);
  return { active: navigation !== null && activeId === id.current, hover };
}

/**
 * The navigation state of one popup panel and its key handler. `onClose` runs
 * for Escape and Tab (Tab leaves the menu, as on the web).
 */
export function usePopupNavigation(onClose: () => void): {
  provider: (children: React.ReactNode) => React.ReactElement;
  onKey: (key: string) => void;
} {
  const rows = useRef<Row[]>([]);
  const [activeId, setActive] = useState<number | null>(null);
  const typed = useRef({ text: '', at: 0 });
  // A submenu → opened, whose first enabled row becomes active as its rows register.
  const entering = useRef<PopupSubmenu | null>(null);
  const register = useCallback((row: Row) => {
    rows.current = [...rows.current, row];
    if (entering.current && row.owner === entering.current && !row.disabled) {
      entering.current = null;
      setActive(row.id);
    }
    return () => {
      rows.current = rows.current.filter((other) => other !== row);
      setActive((active) => (active === row.id ? null : active));
    };
  }, []);
  const registry = useMemo<Registry>(() => ({ register, setActive }), [register]);

  const onKey = useCallback(
    (key: string) => {
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

  const provider = useCallback(
    (children: React.ReactNode) => (
      <PopupNavigationContext.Provider value={registry}>
        <ActiveRowContext.Provider value={activeId}>{children}</ActiveRowContext.Provider>
      </PopupNavigationContext.Provider>
    ),
    [registry, activeId],
  );
  return { provider, onKey };
}
