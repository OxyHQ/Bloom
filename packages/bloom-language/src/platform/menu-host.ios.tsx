/**
 * iOS: the system menu (SwiftUI `Menu`, a UIMenu, through `@expo/ui`). The
 * trigger is the React view the menu opens from; the rows are SwiftUI's own
 * buttons, toggles, sections and nested menus, each with its icon's SF Symbol
 * (`sfSymbols` in the spec; an icon without one draws no glyph). Without
 * `@expo/ui`, Bloom's menu.
 *
 * The system menu takes its rows before it opens and opens itself. Rows given
 * as they are, tagged (`Item(title).tag(name)`, resolved by the menu's
 * `actions()` when chosen) or with their own handlers, are plain data it can
 * be given then. A `menu()` content, whose rows exist only while the menu is
 * open, cannot be: such a menu is Bloom's menu, as is a menu the app opens
 * itself (`.presented()`), which the system menu cannot be.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '@oxy.so/bloom/theme';

import { useMenuChoice } from './menu-actions';
import { DropdownMenuHost } from './menu-dropdown';
import { builtOnOpen, readMenuRows, type MenuItemRow, type MenuRowData } from './menu-rows';
import type { MenuHostProps } from './host.types';
import { sfSymbolOf } from './sf-symbol';

interface SwiftUI {
  Host: ComponentType<{
    matchContents?: boolean;
    colorScheme?: 'light' | 'dark';
    children?: ReactNode;
  }>;
  Menu: ComponentType<{ label: ReactNode; systemImage?: string; children?: ReactNode }>;
  Button: ComponentType<{
    label: string;
    systemImage?: string;
    role?: 'default' | 'destructive';
    onPress?: () => void;
    modifiers?: unknown[];
  }>;
  Toggle: ComponentType<{
    label: string;
    systemImage?: string;
    isOn: boolean;
    onIsOnChange: (isOn: boolean) => void;
    modifiers?: unknown[];
  }>;
  Section: ComponentType<{ title?: string; children?: ReactNode }>;
  Picker: ComponentType<{
    selection?: string | null;
    onSelectionChange?: (selection: string) => void;
    children?: ReactNode;
    modifiers?: unknown[];
  }>;
  Label: ComponentType<{ title?: string; systemImage?: string; modifiers?: unknown[] }>;
  Divider: ComponentType<object>;
  RNHostView: ComponentType<{ matchContents?: boolean; children: ReactNode }>;
}
interface Modifiers {
  disabled: (disabled?: boolean) => unknown;
  menuActionDismissBehavior: (behavior: 'automatic' | 'disabled' | 'enabled') => unknown;
  pickerStyle: (style: 'inline') => unknown;
  tag: (tag: string) => unknown;
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
  // The system menu opens only from its trigger: a menu the app opens (`.presented()`) is Bloom's.
  if (!loaded || builtOnOpen(props.rows) || props.presented) return <DropdownMenuHost {...props} />;
  return <SystemMenu {...props} swift={loaded.swift} modifiers={loaded.modifiers} />;
}

function SystemMenu({
  trigger,
  rows,
  actions,
  render,
  swift,
  modifiers,
}: MenuHostProps & { swift: SwiftUI; modifiers: Modifiers }) {
  const { isDark } = useTheme();
  const { choose, running } = useMenuChoice(actions);
  const { Host, Menu, RNHostView } = swift;
  return (
    <>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'}>
        <Menu label={<RNHostView matchContents>{render(trigger)}</RNHostView>}>
          {systemMenuRows(readMenuRows(rows, choose), swift, modifiers)}
        </Menu>
      </Host>
      {running}
    </>
  );
}

/** Rows as SwiftUI's own menu elements. */
function systemMenuRows(
  rows: readonly MenuRowData[],
  swift: SwiftUI,
  modifiers: Modifiers,
): ReactNode[] {
  return rows.map((row) => systemMenuRow(row, swift, modifiers));
}

function systemMenuRow(row: MenuRowData, swift: SwiftUI, modifiers: Modifiers): ReactNode {
  const { Button, Toggle, Section, Divider, Menu, Picker, Label } = swift;
  switch (row.kind) {
    case 'divider':
      return <Divider key={row.id} />;
    case 'section':
      // A section of choices is SwiftUI's inline Picker, the system menu's single selection
      // (a `UIMenu` with `.singleSelection`): each choice a label tagged with its value. A
      // Picker dismisses as a whole, so the menu stays open only when every choice keeps it.
      if (row.selection) {
        const { selection } = row;
        // Every row of a section of choices is a tagged item (`readMenuRows` holds it).
        const choices = row.rows as MenuItemRow[];
        const keepOpen = choices.length > 0 && choices.every((choice) => choice.keepOpen);
        return (
          <Section key={row.id} title={row.title}>
            <Picker
              selection={selection.value ?? null}
              onSelectionChange={selection.set}
              modifiers={[
                modifiers.pickerStyle('inline'),
                ...(keepOpen ? [modifiers.menuActionDismissBehavior('disabled')] : []),
              ]}
            >
              {choices.map((choice) => (
                <Label
                  key={choice.id}
                  title={choice.title}
                  systemImage={sfSymbolOf(choice.icon)}
                  modifiers={[
                    modifiers.tag(choice.value as string),
                    modifiers.disabled(choice.disabled),
                  ]}
                />
              ))}
            </Picker>
          </Section>
        );
      }
      return (
        <Section key={row.id} title={row.title}>
          {systemMenuRows(row.rows, swift, modifiers)}
        </Section>
      );
    case 'submenu':
      return (
        <Menu key={row.id} label={row.title} systemImage={sfSymbolOf(row.icon)}>
          {systemMenuRows(row.rows, swift, modifiers)}
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
          systemImage={sfSymbolOf(row.icon)}
          role={row.destructive ? 'destructive' : 'default'}
          onPress={row.onPress}
          modifiers={own}
        />
      ) : (
        <Toggle
          key={row.id}
          label={row.title}
          systemImage={sfSymbolOf(row.icon)}
          isOn={row.checked}
          onIsOnChange={() => row.onPress?.()}
          modifiers={own}
        />
      );
    }
  }
}
