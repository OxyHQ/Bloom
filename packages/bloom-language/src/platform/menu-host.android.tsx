/**
 * Android and OxyOS: the lens menu. The engine draws the panel, its rows and
 * its motion natively; React gives it the rows as data and their glyphs as
 * views. Where the engine cannot run, Bloom's own menu.
 *
 * The lens view is the trigger, as in the engine's upstream app. It is mounted
 * with the trigger and stays: it draws the trigger (its glass too, when the
 * trigger is on glass), sees the press first (the glass springs under the
 * finger) and opens natively from where it is, with no remount. Rows given as
 * they are (tagged, or with their own handlers) are data the view holds
 * before it opens, so a press is one call to the engine. A `menu()` content
 * builds its rows on the press that opens it: the view opens itself as they
 * arrive (`openWithItems`) and lets them go once the engine says the menu has
 * finished closing, so the closing motion is never cut short.
 */
import { useCallback, useMemo, useRef, useState, type ComponentType } from 'react';
import { View } from 'react-native';
import { resolveSurfaceLevel } from '@oxy.so/bloom/styles';
import { useTheme } from '@oxy.so/bloom/theme';
import { fontFamilyStyle } from '@oxy.so/bloom/typography';

import { glassTriggerConfig } from './lens-glass';
import { useMenuChoice } from './menu-actions';
import { glyph, DropdownMenuHost } from './menu-dropdown';
import {
  builtOnOpen,
  menuHandlers,
  pressableTrigger,
  readMenuRows,
  setApart,
  splitTriggerGlass,
  triggerCorner,
  type MenuRowData,
} from './menu-rows';
import type { MenuHostProps } from './host.types';
import {
  getNativeLens,
  LENS_GLASS_TRIGGER_ABSORB,
  LENS_ICON_HOST_ID,
  type LensNativeHandle,
  type LensNativeItem,
  type LensNativeProps,
} from './lens';
import type { Child } from '../node';

export function MenuHost(props: MenuHostProps) {
  const NativeLens = getNativeLens();
  if (!NativeLens) return <DropdownMenuHost {...props} />;
  return <LensMenuHost {...props} NativeLens={NativeLens} />;
}

function LensMenuHost({
  trigger: given,
  rows: nodes,
  actions,
  testID,
  render,
  NativeLens,
}: MenuHostProps & { NativeLens: ComponentType<LensNativeProps> }) {
  const theme = useTheme();
  const native = useRef<LensNativeHandle | null>(null);
  // The choice outlives the open menu: the engine closes the menu as a row is chosen.
  const { choose, running } = useMenuChoice(actions);
  // A `menu()` content is read only from the press that opens it until the menu has closed.
  const deferred = builtOnOpen(nodes);
  const [building, setBuilding] = useState(false);
  const rows = deferred && !building ? NO_ROWS : readMenuRows(nodes, choose);
  const handlers = menuHandlers(rows);
  const icons: Child[] = [];
  const items = useSame(lensItems(rows, icons));
  // A trigger on glass gives the menu that glass: the menu draws it, and morphs out of it.
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
  }, [theme, dark]);
  // Without glass, the menu morphs out of untinted glass in the trigger's shape.
  const triggerConfig = useSame(
    glass
      ? { ...glassTriggerConfig(glass, undefined, theme.colors), absorb: LENS_GLASS_TRIGGER_ABSORB }
      : undefined,
  );
  const open = deferred ? () => setBuilding(true) : () => void native.current?.open();
  const closed = useCallback(() => setBuilding(false), []);
  return (
    <>
      <NativeLens
        ref={native}
        items={items}
        lens={glass !== undefined}
        morph
        cornerRadius={triggerCorner(given)}
        colorScheme={dark ? 'dark' : 'light'}
        fontFamily={MENU_FONT_FAMILY}
        alignment="auto"
        config={config}
        triggerConfig={triggerConfig}
        openWithItems={deferred}
        style={TRIGGER_STYLE}
        onItemSelect={(event) => handlers[event.nativeEvent.id]?.()}
        onMenuClosed={deferred ? closed : undefined}
      >
        <View testID={testID}>{render(pressableTrigger(trigger, open))}</View>
        <View
          nativeID={LENS_ICON_HOST_ID}
          collapsable={false}
          pointerEvents="none"
          style={ICON_HOST}
        >
          {icons.map((icon, slot) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the slot index is the identity the engine uses
            <View key={slot} collapsable={false} style={ICON_SLOT}>
              {render(icon)}
            </View>
          ))}
        </View>
      </NativeLens>
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

/** The rows as the engine takes them, collecting each glyph into its slot. */
function lensItems(rows: readonly MenuRowData[], icons: Child[]): LensNativeItem[] {
  const items: LensNativeItem[] = [];
  rows.forEach((row, index) => {
    if (setApart(rows, index)) items.push({ id: `${row.id}-`, title: '', separator: true });
    switch (row.kind) {
      case 'divider':
        items.push({ id: row.id, title: '', separator: true });
        break;
      case 'section':
        if (row.title) items.push({ id: `${row.id}h`, title: row.title, heading: true });
        items.push(...lensItems(row.rows, icons));
        break;
      case 'submenu': {
        const item: LensNativeItem = {
          id: row.id,
          title: row.title,
          items: lensItems(row.rows, icons),
        };
        if (row.icon) item.iconSlot = icons.push(glyph(row.icon, false)) - 1;
        if (row.disabled) item.disabled = true;
        items.push(item);
        break;
      }
      case 'item': {
        const item: LensNativeItem = { id: row.id, title: row.title };
        if (row.subtitle) item.subtitle = row.subtitle;
        if (row.icon) item.iconSlot = icons.push(glyph(row.icon, row.destructive)) - 1;
        if (row.checked !== undefined) item.checked = row.checked;
        if (row.destructive) item.destructive = true;
        if (row.disabled) item.disabled = true;
        if (row.keepOpen) item.keepOpen = true;
        items.push(item);
        break;
      }
    }
  });
  return items;
}

const NO_ROWS: readonly MenuRowData[] = [];
/** The rows' face: Bloom's sans (Inter), the family the app registered for every Bloom text. */
const MENU_FONT_FAMILY = fontFamilyStyle('sans').fontFamily;
const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
const ICON_HOST = { position: 'absolute', left: 0, top: 0 } as const;
const ICON_SLOT = { alignSelf: 'flex-start' } as const;
