/**
 * A stand-in for `@oxy.so/bloom-lens` (the upstream app's menu component), for the menu tests:
 * it hands what the upstream trigger would hand its native view to `lens.last` (the rows as the
 * engine's items, the trigger's and the panel's config, the events), and counts mounted views.
 * The real component is exercised by the language's Android tests.
 */
import {
  Children,
  createContext,
  createElement,
  isValidElement,
  useContext,
  useEffect,
  useImperativeHandle,
  type ReactNode,
} from 'react';
import { View } from 'react-native';

import type { Lens, LensRow } from '../floating/lens/native-lens';

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

/** What the native view was last given. */
export interface StubNative {
  items: StubItem[];
  lens?: boolean;
  cornerRadius?: number;
  colorScheme?: string;
  fontFamily?: string;
  openWithItems?: boolean;
  triggerConfig?: { tintColor?: string; tintOpacity?: number; absorb?: unknown };
  config?: Record<string, unknown>;
  onItemSelect: (event: { nativeEvent: { id: string; index?: number } }) => void;
  onMenuOpenChange: (event: { nativeEvent: { open: boolean } }) => void;
  onMenuClosed?: () => void;
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

interface MenuProps {
  ref?: unknown;
  colorScheme?: string;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
const MenuContext = createContext<MenuProps & { content?: Record<string, unknown> }>({});

function RowsMarker(_: { rows: readonly LensRow[] }) {
  return null;
}

function Menu(props: MenuProps) {
  useImperativeHandle(props.ref as never, () => lens.handle);
  let content: Record<string, unknown> | undefined;
  Children.forEach(props.children, (child) => {
    if (isValidElement(child) && child.type === Content) content = child.props as never;
  });
  return createElement(MenuContext.Provider, { value: { ...props, content } }, props.children);
}

function Trigger(props: Record<string, unknown> & { children?: ReactNode }) {
  const menu = useContext(MenuContext);
  const content = menu.content ?? {};
  let rows: readonly LensRow[] = [];
  Children.forEach(content.children as ReactNode, (child) => {
    if (isValidElement(child) && child.type === RowsMarker)
      rows = (child.props as { rows: readonly LensRow[] }).rows;
  });
  lens.last = {
    items: rows.map(toItem),
    lens: props.lens as boolean | undefined,
    cornerRadius: props.cornerRadius as number | undefined,
    colorScheme: menu.colorScheme,
    fontFamily: content.fontFamily as string | undefined,
    openWithItems: props.openWithItems as boolean | undefined,
    triggerConfig: props.config as StubNative['triggerConfig'],
    config: content.config as Record<string, unknown> | undefined,
    onItemSelect: (event) => {
      const row = find(rows, event.nativeEvent.id);
      if (row?.kind === 'item') row.onSelect?.();
    },
    onMenuOpenChange: (event) => menu.onOpenChange?.(event.nativeEvent.open),
    onMenuClosed: props.onMenuClosed as (() => void) | undefined,
  };
  useEffect(() => {
    lens.mounts += 1;
  }, []);
  return createElement(View, { testID: 'native-lens' }, props.children);
}

function Content(_: Record<string, unknown>) {
  return null;
}

export const stubLens: Lens = {
  Menu: Object.assign(Menu, { Trigger, Content }) as unknown as Lens['Menu'],
  lensRows: (rows) => [createElement(RowsMarker, { key: 'rows', rows })],
};
