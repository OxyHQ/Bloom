/**
 * Android and OxyOS: the lens menu, which is the upstream app's menu component on Bloom's lens
 * engine (`@oxy.so/bloom-lens`). This host only adapts Bloom's menu to it: the rows become its
 * own parts (glyphs as views in the row's ink), the trigger is its trigger, and Bloom gives the
 * colours (the panel's tint, the rows' ink, the scheme) and the face (Inter). Where the lens
 * cannot run, Bloom's own menu.
 *
 * Every trigger is the upstream app's glass trigger: its lens is the trigger's base, which the
 * menu grows out of and takes back, with the upstream app's trigger config (`absorb` over
 * 0.48 s); a trigger on `.glass()` gives that base its tint and frost. Its press layer opens the
 * menu natively (a trigger's own press is left out: a trigger opens its menu). Rows given as they are (tagged, or with handlers) are there before it opens. A
 * `menu()` content is built by the trigger's own press instead: the view opens itself as its rows
 * arrive (`openWithItems`) and lets them go once the menu has finished closing.
 */
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { resolveSurfaceLevel } from '@oxy.so/bloom/styles';
import { useTheme } from '@oxy.so/bloom/theme';
import { fontFamilyStyle } from '@oxy.so/bloom/typography';

import { glassTriggerConfig } from './lens-glass';
import { useMenuChoice } from './menu-actions';
import { DropdownMenuHost } from './menu-dropdown';
import {
  builtOnOpen,
  pressableTrigger,
  readMenuRows,
  setApart,
  splitTriggerGlass,
  triggerCorner,
  triggerLabel,
  withoutPress,
  type MenuRowData,
} from './menu-rows';
import type { MenuHostProps } from './host.types';
import { getLens, type Lens, type LensRow } from './lens';
import { Icon } from '../primitives';
import type { Child, IconComponent } from '../node';

export function MenuHost(props: MenuHostProps) {
  const lens = getLens();
  if (!lens) return <DropdownMenuHost {...props} />;
  return <LensMenuHost {...props} lens={lens} />;
}

function LensMenuHost({
  trigger: given,
  rows: nodes,
  actions,
  testID,
  render,
  lens,
}: MenuHostProps & { lens: Lens }) {
  const theme = useTheme();
  // The choice outlives the open menu: the engine closes the menu as a row is chosen.
  const { choose, running } = useMenuChoice(actions);
  // A `menu()` content is read only from the press that opens it until the menu has closed.
  const deferred = builtOnOpen(nodes);
  const [building, setBuilding] = useState(false);
  const rows = deferred && !building ? NO_ROWS : readMenuRows(nodes, choose);
  const { trigger, glass } = splitTriggerGlass(given);
  const dark = theme.isDark;
  const config = useMemo(() => {
    const surface = resolveSurfaceLevel(theme, 1);
    return {
      tintColor: surface.background,
      textColor: surface.text,
      mutedColor: surface.textSecondary,
      destructiveColor: theme.colors.errorSubtleForeground,
      separatorColor: surface.border,
    };
  }, [theme]);
  const triggerConfig = useSame(
    glass
      ? { ...glassTriggerConfig(glass, undefined, theme.colors), ...TRIGGER_CONFIG }
      : TRIGGER_CONFIG,
  );
  const closed = useCallback(() => setBuilding(false), []);
  const { Menu, lensRows } = lens;
  return (
    <>
      <Menu colorScheme={dark ? 'dark' : 'light'}>
        <Menu.Trigger
          lens
          cornerRadius={triggerCorner(given)}
          config={triggerConfig}
          openOnPress={!deferred}
          openWithItems={deferred}
          onMenuClosed={deferred ? closed : undefined}
          accessibilityLabel={triggerLabel(given)}
          style={TRIGGER_STYLE}
        >
          <View testID={testID}>
            {render(
              deferred ? pressableTrigger(trigger, () => setBuilding(true)) : withoutPress(trigger),
            )}
          </View>
        </Menu.Trigger>
        <Menu.Content fontFamily={MENU_FONT_FAMILY} config={config}>
          {lensRows(toLensRows(rows, render))}
        </Menu.Content>
      </Menu>
      {running}
    </>
  );
}

/** The same content keeps the same value, so a render that changes nothing sends the engine nothing. */
function useSame<T>(value: T): T {
  const key = JSON.stringify(value);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the key is the value's content
  return useMemo(() => value, [key]);
}

/** A row's glyph: Bloom's 20pt icon in the row's ink, or its negative one. */
function lensGlyph(icon: IconComponent, destructive: boolean): Child {
  return Icon(icon)
    .size('md')
    .foreground(destructive ? 'error' : 'foreground');
}

/** The rows as the lens menu takes them: a section is a heading set apart by separators. */
function toLensRows(rows: readonly MenuRowData[], render: MenuHostProps['render']): LensRow[] {
  const out: LensRow[] = [];
  rows.forEach((row, index) => {
    if (setApart(rows, index)) out.push({ kind: 'separator', id: `${row.id}-` });
    switch (row.kind) {
      case 'divider':
        out.push({ kind: 'separator', id: row.id });
        break;
      case 'section':
        if (row.title) out.push({ kind: 'heading', id: `${row.id}h`, title: row.title });
        out.push(...toLensRows(row.rows, render));
        break;
      // A disabled submenu is a row that cannot be opened; the lens menu's submenus take no glyph.
      case 'submenu':
        out.push(
          row.disabled
            ? { kind: 'item', id: row.id, title: row.title, disabled: true }
            : { kind: 'submenu', id: row.id, title: row.title, rows: toLensRows(row.rows, render) },
        );
        break;
      case 'item':
        out.push({
          kind: 'item',
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          icon: row.icon ? render(lensGlyph(row.icon, row.destructive)) : undefined,
          checked: row.checked,
          destructive: row.destructive || undefined,
          disabled: row.disabled || undefined,
          keepOpen: row.keepOpen || undefined,
          onSelect: row.onPress,
        });
        break;
    }
  });
  return out;
}

const NO_ROWS: readonly MenuRowData[] = [];
/** The upstream app's glass trigger config: the menu goes back into it over 0.48 s. */
const TRIGGER_CONFIG = { absorb: { duration: 0.48 } } as const;
/** The rows' face: Bloom's sans (Inter), the family the app registered for every Bloom text. */
const MENU_FONT_FAMILY = fontFamilyStyle('sans').fontFamily;
const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
