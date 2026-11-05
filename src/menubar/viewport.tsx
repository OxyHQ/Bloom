/**
 * A menu bar's ONE menu surface (Radix `NavigationMenu`'s viewport, a Mac's menu bar).
 *
 * While a menu of the bar is open and the pointer crosses onto another title (or ← / → is
 * pressed), the open surface does not close for another to open: it changes into the next menu.
 * It moves under the new title and takes the new menu's size, both eased on the menu motion
 * (`MENU_MORPH_MOTION`), while the two menus' rows crossfade inside it. With Reduce Motion it
 * changes at once, still one surface.
 *
 * How:
 *
 *  - Each `MenubarContent` drawn as an anchored menu PUBLISHES itself to its bar's store
 *    (`MenubarViewportContent`) instead of drawing a panel of its own: its props, its children
 *    and the menu's contexts. Its rows are drawn by the bar's viewport, inside the one surface.
 *  - The viewport (each fork's `MenubarViewport`) draws the open menu's content as a LAYER and,
 *    while the surface changes, the menus it is changing from as layers leaving: inert, hidden
 *    from assistive technology, out of the bar's declaration (no scope: they register nothing),
 *    their submenus closed, fading out. Each layer is the menu as it would be on its own: its
 *    padding, its rows, its floor and ceiling; the surface around them is material, edge and
 *    corner only, so its size is the open layer's.
 *  - A menu that becomes the open one is always a FRESH layer (`key`), even one still leaving:
 *    it mounts as a menu opening does, so its keyboard navigation, its first row from the keys
 *    and the screen reader's focus are a new menu's.
 *
 * The rows are drawn in the viewport's React tree, not the content's: the bar's and the menu's
 * own contexts are carried over (`MenubarMenuProvider`, the declaration's scope), and so is
 * everything above the bar; a provider an application puts between its `Menubar` and a
 * `MenubarContent` does not reach the rows (as with Radix's viewport).
 *
 * NEUTRAL: the forks draw the surface (`Menubar.tsx`, `Menubar.web.tsx`).
 */
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';
import {
  type MenubarMenuContextValue,
  type MenubarScope,
  useMenubar,
  useMenubarMenu,
  useMenubarScope,
} from './context';
import type { MenubarContentProps } from './types';

/** What a menu's content gives the viewport: everything its rows are drawn with. */
export interface MenubarViewportEntry {
  readonly value: string;
  readonly props: MenubarContentProps;
  readonly menu: MenubarMenuContextValue;
  readonly scope: MenubarScope | null;
}

/** The bar's menus' contents, by `value`, for its viewport. */
export class MenubarViewportStore {
  private readonly entries = new Map<string, MenubarViewportEntry>();
  /** Bumped by each change of a value's entry: the viewport re-renders for the menus it shows. */
  private readonly versions = new Map<string, number>();
  private readonly listeners = new Set<() => void>();
  private next = 1;

  get(value: string): MenubarViewportEntry | undefined {
    return this.entries.get(value);
  }

  /** A key that changes whenever the entry of one of `values` does. */
  versionOf(values: readonly string[]): string {
    return values.map((value) => this.versions.get(value) ?? 0).join(',');
  }

  publish(entry: MenubarViewportEntry): void {
    if (this.entries.get(entry.value) === entry) return;
    this.entries.set(entry.value, entry);
    this.changed(entry.value);
  }

  /** The content went away; only its own entry is removed (another may have its value now). */
  remove(entry: MenubarViewportEntry): void {
    if (this.entries.get(entry.value) !== entry) return;
    this.entries.delete(entry.value);
    this.changed(entry.value);
  }

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private changed(value: string) {
    this.versions.set(value, this.next);
    this.next += 1;
    for (const listener of this.listeners) listener();
  }
}

/**
 * A `MenubarContent` drawn as an anchored menu: publishes itself to the bar's viewport after
 * every render, and draws nothing where it is declared.
 */
export function MenubarViewportContent(props: MenubarContentProps) {
  const bar = useMenubar();
  const menu = useMenubarMenu();
  const scope = useMenubarScope();
  const { viewport } = bar;
  const latest = useRef<MenubarViewportEntry | null>(null);
  useIsomorphicLayoutEffect(() => {
    const entry: MenubarViewportEntry = { value: menu.value, props, menu, scope };
    latest.current = entry;
    viewport.publish(entry);
  });
  useIsomorphicLayoutEffect(
    () => () => {
      if (latest.current) viewport.remove(latest.current);
    },
    [viewport],
  );
  return null;
}

/** A menu drawn in the viewport: the open one, or one the surface is changing from. */
export interface MenubarLayer {
  /** New for each time a menu becomes the open one. */
  readonly key: number;
  readonly entry: MenubarViewportEntry;
  /** The surface is changing from it: inert, fading out, removed by `retire`. */
  readonly exiting: boolean;
}

interface Shown {
  readonly key: number;
  readonly value: string;
}

/**
 * The layers the viewport draws for the bar's open menu (`openValue`). Opening from none shows
 * one layer; a switch keeps the menus it changes from as leaving layers until each is retired,
 * unless `instant` (Reduce Motion), which shows the new one alone at once.
 */
export function useMenubarLayers(
  store: MenubarViewportStore,
  openValue: string | undefined,
  instant: boolean,
): {
  layers: readonly MenubarLayer[];
  current: MenubarLayer | undefined;
  retire: (key: number) => void;
} {
  const [state, setState] = useState<{ next: number; shown: readonly Shown[] }>(() => ({
    next: 1,
    shown: openValue === undefined ? [] : [{ key: 0, value: openValue }],
  }));
  // Adjusted during render, so the commit that opens a menu draws it.
  let { next, shown } = state;
  if (openValue === undefined) {
    if (shown.length > 0) shown = [];
  } else if (shown[shown.length - 1]?.value !== openValue) {
    const opened = { key: next, value: openValue };
    next += 1;
    shown = instant || shown.length === 0 ? [opened] : [...shown, opened];
  } else if (instant && shown.length > 1) {
    shown = shown.slice(-1);
  }
  if (shown !== state.shown) setState({ next, shown });
  // Drawn again when a menu it shows changes its content, never for the others: a closed bar's
  // contents publishing as the application renders costs the bar nothing.
  const values = shown.map((each) => each.value);
  const version = () => store.versionOf(values);
  useSyncExternalStore(store.subscribe, version, version);

  const retire = useCallback((key: number) => {
    setState((prev) => {
      const index = prev.shown.findIndex((each) => each.key === key);
      // The open menu is never retired.
      if (index < 0 || index === prev.shown.length - 1) return prev;
      return { ...prev, shown: prev.shown.filter((each) => each.key !== key) };
    });
  }, []);

  const layers: MenubarLayer[] = [];
  shown.forEach((each, index) => {
    const entry = store.get(each.value);
    if (entry) layers.push({ key: each.key, entry, exiting: index < shown.length - 1 });
  });
  const last = layers[layers.length - 1];
  return { layers, current: last && !last.exiting ? last : undefined, retire };
}

/**
 * Counts the times the viewport opened: keyed on it, a surface opened again starts afresh, never
 * eased from where the last one closed.
 */
export function useOpenCount(open: boolean): number {
  const [state, setState] = useState({ open, count: 0 });
  if (state.open !== open) setState({ open, count: open ? state.count + 1 : state.count });
  return open && !state.open ? state.count + 1 : state.count;
}

/** Whether the rows here are in a menu the surface is changing from (inert, leaving). */
const LeavingContext = createContext(false);

export function MenubarLeavingScope({
  leaving,
  children,
}: {
  leaving: boolean;
  children?: ReactNode;
}) {
  return <LeavingContext.Provider value={leaving}>{children}</LeavingContext.Provider>;
}

/** In a menu the surface is changing from: a submenu there closes (`MenubarSub`). */
export function useMenubarLeaving(): boolean {
  return useContext(LeavingContext);
}
