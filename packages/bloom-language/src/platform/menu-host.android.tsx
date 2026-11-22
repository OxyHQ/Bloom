/**
 * Android and OxyOS: the lens menu, the upstream app's menu component on Bloom's lens engine
 * (`@oxy.so/bloom-lens`). This host only adapts Bloom's menu to it: the rows become its own parts
 * (glyphs as views in the row's ink), and Bloom gives the colours (the panel's tint, the rows' ink,
 * the scheme) and the face (Inter). Where the lens cannot run, Bloom's own menu.
 *
 * The menu grows out of a lens base, the upstream app's glass trigger, and goes back into it. Inside a base (a group on glass, a
 * toolbar's capsule) it is that base's menu, and the whole base becomes the menu. Anywhere else
 * the trigger is a base of its own: a trigger on `.glass()` (the fixed layer) is drawn by the
 * window, with the glass's tint and frost; any other (a feed row's ⋯) draws its lens in its own
 * place in the page, against the fill of the surface it sits on (`restBackdrop`), so it scrolls,
 * clips and stacks with the page. A tap on a menu's own base opens it on the UI thread, with no
 * round trip to JS (`openOnTap`); the trigger's press opens it too, from inside a group. Rows given as they
 * are (tagged, or with handlers) are held by the base before it opens; a `menu()` content is built
 * by the press, and the base opens with its rows as they arrive.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { resolveSurfaceLevel, useSurfaceFill } from '@oxy.so/bloom/styles';
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
  type MenuRowData,
} from './menu-rows';
import type { MenuHostProps } from './host.types';
import { valuesOf } from './values';
import { getLens, type Lens, type LensMenuConfig, type LensRow } from './lens';
import { Icon } from '../primitives';
import { isNode, type Child, type IconComponent } from '../node';

export function MenuHost(props: MenuHostProps) {
  const lens = getLens();
  if (!lens) return <DropdownMenuHost {...props} />;
  return <LensMenuHost {...props} lens={lens} />;
}

function LensMenuHost({
  trigger: given,
  rows,
  actions,
  testID,
  render,
  lens,
}: MenuHostProps & { lens: Lens }) {
  const theme = useTheme();
  // The choice outlives the open menu: the engine closes the menu as a row is chosen.
  const { choose, running } = useMenuChoice(actions);
  const inBase = lens.useInLensBase();
  const surfaceFill = useSurfaceFill();
  const { trigger, glass } = splitTriggerGlass(given);
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
    glass ? glassTriggerConfig(glass, undefined, theme.colors) : undefined,
  );
  const opener = (
    <LensMenuOpener
      trigger={trigger}
      nodes={rows}
      choose={choose}
      config={config}
      testID={testID}
      render={render}
      lens={lens}
    />
  );
  const { LensBase } = lens;
  return (
    <>
      {inBase ? (
        opener
      ) : (
        <LensBase
          colorScheme={theme.isDark ? 'dark' : 'light'}
          cornerRadius={triggerCorner(given)}
          config={triggerConfig}
          restBackdrop={glass ? undefined : surfaceFill}
          openOnTap={!(isNode(given) && valuesOf(given).disabled === true)}
          style={TRIGGER_STYLE}
        >
          {opener}
        </LensBase>
      )}
      {running}
    </>
  );
}

/** The menu in the nearest base, and its trigger, whose press opens it. */
function LensMenuOpener({
  trigger,
  nodes,
  choose,
  config,
  testID,
  render,
  lens,
}: {
  trigger: Child;
  nodes: MenuHostProps['rows'];
  choose: ((tag: string) => void) | undefined;
  config: LensMenuConfig;
  testID: string | undefined;
  render: MenuHostProps['render'];
  lens: Lens;
}) {
  // A `menu()` content is read only from the press that opens it until the menu has closed.
  const deferred = builtOnOpen(nodes);
  const [building, setBuilding] = useState(false);
  const rows = deferred && !building ? NO_ROWS : readMenuRows(nodes, choose);
  const menu =
    rows.length > 0
      ? {
          rows: toLensRows(rows, render),
          config,
          fontFamily: MENU_FONT_FAMILY,
          onClosed: deferred ? () => setBuilding(false) : undefined,
        }
      : null;
  const handle = lens.useLensBaseMenu(menu);
  // Built by the press: the base opens the menu as its rows arrive.
  const opening = useRef(false);
  useLayoutEffect(() => {
    if (!opening.current || !menu) return;
    opening.current = false;
    handle?.open();
  });
  const open = deferred
    ? () => {
        opening.current = true;
        setBuilding(true);
      }
    : () => handle?.open();
  return <View testID={testID}>{render(pressableTrigger(trigger, open))}</View>;
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
/** The rows' face: Bloom's sans (Inter), the family the app registered for every Bloom text. */
const MENU_FONT_FAMILY = fontFamilyStyle('sans').fontFamily;
const TRIGGER_STYLE = { alignSelf: 'flex-start' } as const;
