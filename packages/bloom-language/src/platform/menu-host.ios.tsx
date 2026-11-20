/**
 * iOS: the system menu (SwiftUI `Menu`, a UIMenu, through `@expo/ui`). The
 * trigger is the React view the menu opens from; the rows are SwiftUI's own
 * buttons, toggles, sections and nested menus. Without `@expo/ui`, Bloom's
 * menu.
 *
 * The system menu takes its rows before it opens, and it opens itself: it
 * cannot build them as it is pressed. So a menu whose rows come from a
 * `menu()` content (built only while open, as a row's ⋯ menu is) is Bloom's
 * menu; a menu of rows given as they are is the system's. Row glyphs are
 * Bloom icons, which a system menu cannot draw: its rows show their titles.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '@oxy.so/bloom/theme';

import { isNode } from '../node';
import { DropdownMenuHost } from './menu-dropdown';
import { readMenuRows, type MenuRowData } from './menu-rows';
import type { MenuHostProps } from './host.types';

interface SwiftUI {
  Host: ComponentType<{
    matchContents?: boolean;
    colorScheme?: 'light' | 'dark';
    children?: ReactNode;
  }>;
  Menu: ComponentType<{ label: ReactNode; children?: ReactNode }>;
  Button: ComponentType<{
    label: string;
    role?: 'default' | 'destructive';
    onPress?: () => void;
    modifiers?: unknown[];
  }>;
  Toggle: ComponentType<{
    label: string;
    isOn: boolean;
    onIsOnChange: (isOn: boolean) => void;
    modifiers?: unknown[];
  }>;
  Section: ComponentType<{ title?: string; children?: ReactNode }>;
  Divider: ComponentType<object>;
  RNHostView: ComponentType<{ matchContents?: boolean; children: ReactNode }>;
}
interface Modifiers {
  disabled: (disabled?: boolean) => unknown;
  menuActionDismissBehavior: (behavior: 'automatic' | 'disabled' | 'enabled') => unknown;
}

let ui: { swift: SwiftUI; modifiers: Modifiers } | null | undefined;

function loadSwiftUI() {
  if (ui !== undefined) return ui;
  ui = null;
  try {
    const swift = require('@expo/ui/swift-ui') as SwiftUI;
    const modifiers = require('@expo/ui/swift-ui/modifiers') as Modifiers;
    ui = swift.Menu && swift.RNHostView ? { swift, modifiers } : null;
  } catch {
    ui = null;
  }
  return ui;
}

export function MenuHost(props: MenuHostProps) {
  const loaded = loadSwiftUI();
  const builtOnOpen = props.rows.some((row) => isNode(row) && row.kind === 'menuContent');
  if (!loaded || builtOnOpen) return <DropdownMenuHost {...props} />;
  return <SystemMenu {...props} swift={loaded.swift} modifiers={loaded.modifiers} />;
}

function SystemMenu({
  trigger,
  rows,
  render,
  swift,
  modifiers,
}: MenuHostProps & { swift: SwiftUI; modifiers: Modifiers }) {
  const { isDark } = useTheme();
  const { Host, Menu, RNHostView } = swift;
  return (
    <Host matchContents colorScheme={isDark ? 'dark' : 'light'}>
      <Menu label={<RNHostView matchContents>{render(trigger)}</RNHostView>}>
        {drawRows(readMenuRows(rows), swift, modifiers)}
      </Menu>
    </Host>
  );
}

function drawRows(rows: readonly MenuRowData[], swift: SwiftUI, modifiers: Modifiers): ReactNode[] {
  return rows.map((row) => drawRow(row, swift, modifiers));
}

function drawRow(row: MenuRowData, swift: SwiftUI, modifiers: Modifiers): ReactNode {
  const { Button, Toggle, Section, Divider, Menu } = swift;
  switch (row.kind) {
    case 'divider':
      return <Divider key={row.id} />;
    case 'section':
      return (
        <Section key={row.id} title={row.title}>
          {drawRows(row.rows, swift, modifiers)}
        </Section>
      );
    case 'submenu':
      return (
        <Menu key={row.id} label={row.title}>
          {drawRows(row.rows, swift, modifiers)}
        </Menu>
      );
    case 'item': {
      const own = [
        modifiers.disabled(row.disabled),
        ...(row.keepOpen ? [modifiers.menuActionDismissBehavior('disabled')] : []),
      ];
      return row.checked === undefined ? (
        <Button
          key={row.id}
          label={row.title}
          role={row.destructive ? 'destructive' : 'default'}
          onPress={row.onPress}
          modifiers={own}
        />
      ) : (
        <Toggle
          key={row.id}
          label={row.title}
          isOn={row.checked}
          onIsOnChange={() => row.onPress?.()}
          modifiers={own}
        />
      );
    }
  }
}
