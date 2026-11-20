/**
 * Android and OxyOS: the lens menu. The engine draws the panel, its rows and
 * its motion natively; React gives it the rows as data and their glyphs as
 * views. Where the engine cannot run, Bloom's own menu.
 *
 * A closed menu is only its trigger: no native view and no row work. A press
 * mounts the lens view around the trigger with the menu already open
 * (`openOnMount`); the view stays until the engine says the menu has finished
 * closing, so the closing motion is never cut short.
 */
import { useMemo, useState, type ComponentType } from 'react';
import { View } from 'react-native';
import { resolveSurfaceLevel } from '@oxy.so/bloom/styles';
import { useTheme } from '@oxy.so/bloom/theme';

import { glassTriggerConfig } from './lens-glass';
import { useMenuChoice } from './menu-actions';
import { glyph, DropdownMenuHost } from './menu-dropdown';
import {
  menuHandlers,
  pressableTrigger,
  readMenuRows,
  setApart,
  splitTriggerGlass,
  type MenuRowData,
} from './menu-rows';
import type { MenuHostProps } from './host.types';
import {
  getNativeLens,
  LENS_ICON_HOST_ID,
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
  trigger,
  NativeLens,
  ...props
}: MenuHostProps & { NativeLens: ComponentType<LensNativeProps> }) {
  const [open, setOpen] = useState(false);
  // The choice outlives the open menu: the engine closes the menu as a row is chosen.
  const { choose, running } = useMenuChoice(props.actions);
  return (
    <>
      {open ? (
        <OpenLensMenu
          {...props}
          trigger={trigger}
          choose={choose}
          NativeLens={NativeLens}
          onClosed={() => setOpen(false)}
        />
      ) : (
        props.render(pressableTrigger(trigger, () => setOpen(true)))
      )}
      {running}
    </>
  );
}

/** The menu the engine presents for one opening: it reads the rows, and the theme for their ink. */
function OpenLensMenu({
  trigger: given,
  rows: nodes,
  testID,
  render,
  choose,
  NativeLens,
  onClosed,
}: MenuHostProps & {
  choose: ((tag: string) => void) | undefined;
  NativeLens: ComponentType<LensNativeProps>;
  onClosed: () => void;
}) {
  const theme = useTheme();
  const rows = readMenuRows(nodes, choose);
  const handlers = menuHandlers(rows);
  const icons: Child[] = [];
  const items = lensItems(rows, icons);
  // A trigger on glass gives the menu that glass: the menu draws it, and morphs out of it.
  const { trigger, glass } = splitTriggerGlass(given);
  const dark = theme.isDark;
  const config = useMemo(() => {
    const surface = resolveSurfaceLevel(theme, 1);
    return {
      tintColor: surface.background,
      tintOpacity: dark ? PANEL_OPACITY.dark : PANEL_OPACITY.light,
      textColor: surface.text,
      mutedColor: surface.textSecondary,
      destructiveColor: theme.colors.errorSubtleForeground,
      separatorColor: surface.border,
    };
  }, [theme, dark]);
  const triggerConfig = glass
    ? glassTriggerConfig(glass, undefined, theme.colors)
    : { tintColor: theme.colors.backgroundSecondary, tintOpacity: PLAIN_TRIGGER_OPACITY };
  return (
    <NativeLens
      items={items}
      lens={glass !== undefined}
      colorScheme={dark ? 'dark' : 'light'}
      config={config}
      triggerConfig={triggerConfig}
      openOnMount
      style={TRIGGER_STYLE}
      onItemSelect={(event) => handlers[event.nativeEvent.id]?.()}
      onMenuClosed={onClosed}
    >
      <View testID={testID}>{render(trigger)}</View>
      <View nativeID={LENS_ICON_HOST_ID} collapsable={false} pointerEvents="none" style={ICON_HOST}>
        {icons.map((icon, slot) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: the slot index is the identity the engine uses
          <View key={slot} collapsable={false} style={ICON_SLOT}>
            {render(icon)}
          </View>
        ))}
      </View>
    </NativeLens>
  );
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

/** The panel's tint over the page, as Bloom's own lens menu draws it. */
const PANEL_OPACITY = { light: 0.6, dark: 0.72 } as const;
/** A trigger without glass: the menu morphs out of Bloom's quiet field fill. */
const PLAIN_TRIGGER_OPACITY = 0.5;
const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
const ICON_HOST = { position: 'absolute', left: 0, top: 0 } as const;
const ICON_SLOT = { alignSelf: 'flex-start' } as const;
