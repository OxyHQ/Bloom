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

interface Row {
  id: number;
  disabled: boolean;
  label: string | undefined;
  activate: () => void;
}

// Two contexts: the registry is stable for the panel's life, so a row registers once; the
// active row changes on every key and only re-renders the rows.
interface Registry {
  register: (row: Row) => () => void;
  setActive: (id: number | null) => void;
}

const PopupNavigationContext = createContext<Registry | null>(null);
const ActiveRowContext = createContext<number | null>(null);

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
}: {
  disabled: boolean;
  label: string | undefined;
  activate: () => void;
}): { active: boolean; hover: () => void } {
  const navigation = useContext(PopupNavigationContext);
  const activeId = useContext(ActiveRowContext);
  const id = useRef<number | null>(null);
  if (id.current === null) id.current = ++nextRowId;
  const row = { id: id.current, disabled, label, activate };
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
  const register = useCallback((row: Row) => {
    rows.current = [...rows.current, row];
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
      switch (key) {
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
