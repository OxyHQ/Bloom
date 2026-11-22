/**
 * A stand-in for `@oxy.so/bloom-lens`, for the lens tests: a `LensBase` that hands what the real
 * base would hand its native view to `lens.last` (the held menu's rows as the engine's items, the
 * base's and the panel's config, the events), the base's context, and a menu handle whose opens and
 * closes are recorded. The real base and menu are exercised by the language's Android tests.
 */
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';

import type { Lens, LensMenu, LensRow } from '../floating/lens/native-lens';

/** A row as the engine takes it. */
export interface StubItem {
  id: string;
  title: string;
  checked?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  keepOpen?: boolean;
  heading?: boolean;
  separator?: boolean;
  items?: StubItem[];
}

/** What the base's native view was last given. */
export interface StubNative {
  items: StubItem[];
  lens?: boolean;
  cornerRadius?: number;
  colorScheme?: string;
  fontFamily?: string;
  triggerConfig?: { tintColor?: string; tintOpacity?: number; absorb?: unknown; jelly?: number };
  config?: Record<string, unknown>;
  onItemSelect: (event: { nativeEvent: { id: string; index?: number } }) => void;
  onMenuOpenChange: (event: { nativeEvent: { open: boolean } }) => void;
  onMenuClosed: () => void;
}

function toItem(row: LensRow): StubItem {
  switch (row.kind) {
    case 'separator':
      return { id: row.id, title: '', separator: true };
    case 'heading':
      return { id: row.id, title: row.title, heading: true };
    case 'submenu':
      return { id: row.id, title: row.title, items: row.rows.map(toItem) };
    case 'item':
      return {
        id: row.id,
        title: row.title,
        checked: row.checked,
        destructive: row.destructive,
        disabled: row.disabled,
        keepOpen: row.keepOpen,
      };
  }
}

function find(rows: readonly LensRow[], id: string): LensRow | undefined {
  for (const row of rows) {
    if (row.id === id) return row;
    if (row.kind === 'submenu') {
      const inner = find(row.rows, id);
      if (inner) return inner;
    }
  }
  return undefined;
}

export const lens = {
  last: undefined as StubNative | undefined,
  mounts: 0,
  handle: { open: jest.fn(), close: jest.fn() },
  reset() {
    lens.last = undefined;
    lens.mounts = 0;
    lens.handle.open.mockClear();
    lens.handle.close.mockClear();
  },
};

const BaseContext = createContext<{ hold: (menu: LensMenu | null) => void } | null>(null);

function LensBase(props: {
  lens?: boolean;
  colorScheme?: string;
  cornerRadius?: number;
  config?: StubNative['triggerConfig'];
  children?: ReactNode;
}) {
  const [menu, setMenu] = useState<LensMenu | null>(null);
  const base = useMemo(() => ({ hold: setMenu }), []);
  const rows = menu?.rows ?? [];
  lens.last = {
    items: rows.map(toItem),
    lens: props.lens ?? true,
    cornerRadius: props.cornerRadius,
    colorScheme: props.colorScheme,
    fontFamily: menu?.fontFamily,
    triggerConfig: props.config,
    config: menu?.config as Record<string, unknown> | undefined,
    onItemSelect: (event) => {
      const row = find(rows, event.nativeEvent.id);
      if (row?.kind === 'item') row.onSelect?.();
    },
    onMenuOpenChange: (event) => menu?.onOpenChange?.(event.nativeEvent.open),
    onMenuClosed: () => menu?.onClosed?.(),
  };
  useEffect(() => {
    lens.mounts += 1;
  }, []);
  return createElement(
    View,
    { testID: 'native-lens' },
    createElement(BaseContext.Provider, { value: base }, props.children),
  );
}

function useLensBaseMenu(menu: LensMenu | null) {
  const base = useContext(BaseContext);
  useLayoutEffect(() => {
    if (base) base.hold(menu);
  }, [base, menu]);
  return useMemo(
    () =>
      base
        ? {
            open: (from?: unknown) => lens.handle.open(from),
            close: () => lens.handle.close(),
          }
        : null,
    [base],
  );
}

export const stubLens: Lens = {
  LensBase: LensBase as Lens['LensBase'],
  useInLensBase: () => useContext(BaseContext) !== null,
  useLensBaseMenu,
};
