/**
 * The lens base: the upstream app's glass trigger (`Menu` around `Menu.Trigger`), the one glass of
 * Bloom's controls. A button, a group of buttons, a bar: each is one base, and a menu opened from
 * anything inside it grows out of that whole base and goes back into it, as the upstream app's
 * toolbar pill does. A press anywhere on the base springs it.
 *
 * The base is the upstream app's glass trigger with its trigger config (`absorb` over 0.48 s: the
 * menu goes back into it as into the upstream app's toolbar pill); a caller's config adds to it.
 *
 * Menus inside a base give it their rows (`useLensBaseMenu`). The base holds the first menu's rows,
 * so opening that menu is one call to the engine; another menu of the same base swaps its rows in
 * and the view opens itself with them (`openWithItems`), as does a menu whose rows are built only
 * by the press that opens it.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Menu } from './menu';
import type { IMenuHandle, TMenuConfig, TMenuRect, TMenuTriggerConfig } from './menu';
import { lensRows, type LensRow } from './rows';

/** A menu as a base opens it. */
export interface LensMenu {
  rows: readonly LensRow[];
  /** The panel's material and the rows' ink. */
  config?: TMenuConfig;
  fontFamily?: string;
  /** The menu opened or started closing. */
  onOpenChange?: (open: boolean) => void;
  /** The menu has finished closing. */
  onClosed?: () => void;
}

/** What a menu inside a base calls. */
export interface LensMenuHandle {
  /** Opens the menu from the base, out of `from` (a press point's box) when given. */
  open: (from?: TMenuRect) => void;
  close: () => void;
}

interface Held {
  key: object;
  menu: LensMenu;
}

interface BaseHandle {
  hold: (key: object, menu: LensMenu) => void;
  release: (key: object) => void;
  open: (key: object, menu: LensMenu, from?: TMenuRect) => void;
  close: () => void;
}

export const LensBaseContext = createContext<BaseHandle | null>(null);
LensBaseContext.displayName = 'BloomLensBase';

export interface LensBaseProps {
  /** Draw the base's lens; without it, a menu still grows out of the base's shape. */
  lens?: boolean;
  colorScheme?: 'light' | 'dark';
  /** The corner radius in points; `undefined` is a capsule. */
  cornerRadius?: number;
  config?: TMenuTriggerConfig;
  /** The colour the base sits on: its lens is drawn in its place in the page (a base in a scroll). */
  restBackdrop?: string;
  /**
   * The base is one menu's trigger: a tap opens the menu it holds natively, on the UI thread, with no
   * round trip to JS. Not for a group, whose items open their own menus or do their own thing.
   */
  openOnTap?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function LensBase({
  lens = true,
  colorScheme,
  cornerRadius,
  config,
  restBackdrop,
  openOnTap,
  style,
  children,
}: LensBaseProps) {
  const native = useRef<IMenuHandle | null>(null);
  const [held, setHeld] = useState<Held | null>(null);
  const [pending, setPending] = useState(false);
  const current = useRef(held);
  current.current = held;
  const handle = useMemo<BaseHandle>(
    () => ({
      hold: (key, menu) =>
        setHeld((last) =>
          last === null || last.key === key ? (last?.menu === menu ? last : { key, menu }) : last,
        ),
      release: (key) => setHeld((last) => (last?.key === key ? null : last)),
      open: (key, menu, from) => {
        const last = current.current;
        if (last?.key === key && last.menu === menu) {
          native.current?.open(from);
          return;
        }
        setHeld({ key, menu });
        setPending(true);
      },
      close: () => native.current?.close(),
    }),
    [],
  );
  const menu = held?.menu;
  const trigger = useMemo(() => ({ ...UPSTREAM_TRIGGER, ...config }), [config]);
  return (
    <Menu
      ref={native}
      colorScheme={colorScheme}
      onOpenChange={(open) => {
        if (open) setPending(false);
        current.current?.menu.onOpenChange?.(open);
      }}
    >
      <Menu.Trigger
        lens={lens}
        cornerRadius={cornerRadius}
        config={trigger}
        restBackdrop={restBackdrop}
        openOnTap={openOnTap}
        openOnPress={false}
        openWithItems={pending}
        onMenuClosed={() => current.current?.menu.onClosed?.()}
        style={style}
      >
        <LensBaseContext.Provider value={handle}>{children}</LensBaseContext.Provider>
      </Menu.Trigger>
      <Menu.Content fontFamily={menu?.fontFamily} config={menu?.config}>
        {menu ? lensRows(menu.rows) : null}
      </Menu.Content>
    </Menu>
  );
}

/** The upstream app's glass trigger config: its toolbar pill takes the menu back over 0.48 s. */
const UPSTREAM_TRIGGER: TMenuTriggerConfig = { absorb: { duration: 0.48 } };

/** Whether a view is inside a base (it then draws no lens of its own). */
export function useInLensBase(): boolean {
  return useContext(LensBaseContext) !== null;
}

/**
 * A menu inside the nearest base: the base holds its rows (`null` while it has none, as a menu
 * whose rows are built by its press) and opens it. `null` outside a base.
 */
export function useLensBaseMenu(menu: LensMenu | null): LensMenuHandle | null {
  const base = useContext(LensBaseContext);
  const key = useRef({}).current;
  const latest = useRef(menu);
  latest.current = menu;
  // A menu with no rows (one built only while open, now closed) lets the base go: no row work.
  useLayoutEffect(() => {
    if (!base) return;
    if (menu) base.hold(key, menu);
    else base.release(key);
  }, [base, key, menu]);
  useLayoutEffect(() => () => base?.release(key), [base, key]);
  return useMemo(
    () =>
      base
        ? {
            open: (from) => {
              if (latest.current) base.open(key, latest.current, from);
            },
            close: base.close,
          }
        : null,
    [base, key],
  );
}
