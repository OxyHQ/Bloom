import { Platform, type GestureResponderEvent } from 'react-native';
import { isPlainLinkActivation, openHref } from '../hooks/link-activation';
import { useMenuDensity } from './use-menu-density';
/**
 * The menu ROW vocabulary — ONE implementation, published by all three menu
 * families under shadcn's own part names.
 *
 * shadcn/react-native-reusables ship three copy-pasted row sets
 * (`DropdownMenuItem`, `ContextMenuItem`, `MenubarItem`, and the same again for
 * label, separator, shortcut, checkbox, radio and the sub trio) that differ in
 * nothing but their prefix. Bloom keeps the NAMES, because a shadcn call site
 * porting across is the whole point of this family, and refuses the THREE
 * COPIES: `createMenuRows(prefix)` builds one set per family, so a fix to the
 * inset arithmetic or the checkbox indicator lands in all three at once.
 *
 * The parts are built per family rather than shared as single components so each
 * one carries its own `displayName` — `<ContextMenuItem>` reads as
 * `ContextMenuItem` in React DevTools and in a test's rendered tree, not as some
 * shared internal. They are still built at MODULE scope by each family (one call
 * per file, never per render), because an element type constructed during render
 * remounts its whole subtree every time.
 *
 * Universal, not forked — with ONE exception, the sub-menu trio, which is a
 * flyout on web and an inline disclosure on native. That difference cannot be a
 * branch inside this file: the flyout imports the web-only `FloatingPanel`, so a
 * `Platform.OS` check would link `react-dom` and the web portal into every
 * native bundle. It arrives as a FACTORY instead — each family's own platform
 * fork passes `createFlyoutMenuSub` or `createInlineMenuSub`, and this file
 * never learns which platform it is on.
 *
 * ── STYLING ──────────────────────────────────────────────────────────────────
 *
 * Every shape below is a style from `floating/constants.ts` and the density
 * (`use-menu-density.ts`); a caller's `style` goes over it. The row shell itself
 * is `shared.tsx`'s `MenuRowShell` — see its header for why these rows are no
 * longer `item/Item`.
 *
 * The `sm:` breakpoint the previous pass carried (`py-2 sm:py-1.5`) is gone:
 * the target has one row inset (6px) plus a 32px minimum height, so a row is
 * the same density at every window width.
 */
import type React from 'react';
import { useCallback, useMemo } from 'react';

import { RiCheckLine as CheckIcon } from '../icons/remix/RiCheckLine';
import { Text, View } from 'react-native';
import { createTokenStyles } from '../theme/color-tokens';
import {
  ROW_ICON_SIZE,
  ROW_INDICATOR_END_STYLE,
  ROW_INDICATOR_STYLE,
  ROW_LABEL_INSET_STYLE,
  ROW_TRAILING_STYLE,
} from './constants';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { MenuRadioGroupProvider, useMenuRadioGroup, useMenuSurface } from './context';
import { useMenuPalette } from './menu-palette';
import { MENU_FONT_FAMILY, menuType } from './menu-type';
import { MenuRowGlyph, MenuRowShell, splitChildren, useMenuRowInk } from './shared';
import { DESKTOP_TEXT_STYLES } from '../typography/desktop-scale';
import { useMenuRowAlignment } from './menu-row-alignment';
import { MenuSwatchRow } from './menu-swatch-row';

const NO_ROW_TRAITS = { gutter: false, leading: false } as const;

const ROW_RELATIVE = { position: 'relative' } as const;

/** The default radio mark: an 8px dot in the foreground, with no ring. */
const useRadioDotStyles = createTokenStyles((t) => ({
  dot: { width: 8, height: 8, borderRadius: ROUNDED_FULL, backgroundColor: t.foreground },
}));
import type {
  MenuCheckboxRowProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioRowProps,
  MenuRowParts,
  MenuRowProps,
  MenuShortcutProps,
  MenuSubFactory,
  MenuSwatchRowProps,
} from './types';

/**
 * The target's 32px selection gutter with its out-of-flow 14px indicator.
 *
 * The indicator is OUT OF FLOW, which is the whole point: a checkbox row's text
 * starts at a fixed inset whether or not a check is drawn, so a menu's rows line
 * up. `indicatorPosition="trailing"` mirrors that geometry for products whose
 * menu vocabulary puts the check at the far edge. Passing the mark as a normal
 * slot would put it back in flow and collapse the column on an unchecked row.
 *
 * `pointerEvents="none"` as a PROP, not a style entry: the box sits ON TOP of
 * the row's own pressable, so without it the indicator swallows the press that
 * toggles the row. (`'none'` does survive as a style on react-native-web, but
 * the prop path is the one both platforms resolve.)
 */
function IndicatorGutter({
  indicator,
  position,
  children,
}: {
  indicator: React.ReactNode;
  position: 'leading' | 'trailing';
  children: React.ReactNode;
}) {
  const density = useMenuDensity();
  // A desktop platform's row draws its mark itself (`MenuRowShell indicator`), so the
  // mark takes the row's ink under the accent highlight.
  if (density.desktop) return <>{children}</>;
  return (
    <View style={ROW_RELATIVE}>
      {children}
      <View
        style={[
          position === 'leading' ? ROW_INDICATOR_STYLE : ROW_INDICATOR_END_STYLE,
          { width: density.leadingSize },
        ]}
        pointerEvents="none"
      >
        {indicator}
      </View>
    </View>
  );
}

/** A desktop's radio mark: a 6px dot in the row's ink (the accent's foreground while highlighted). */
function MenuRadioDot() {
  const palette = useMenuPalette();
  const ink = useMenuRowInk();
  return (
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ink ?? palette.text }} />
  );
}

/**
 * Build one family's row parts.
 *
 * `prefix` is the family's own name (`'DropdownMenu'`, `'ContextMenu'`,
 * `'Menubar'`) and is used for nothing but `displayName`.
 *
 * `createSub` is the platform's sub-menu trio — `createFlyoutMenuSub` from a
 * `.web.tsx` fork, `createInlineMenuSub` from the native one. It is a required
 * argument rather than a default, so a new family cannot silently ship the
 * wrong presentation by omitting it.
 */
export function createMenuRows(prefix: string, createSub: MenuSubFactory): MenuRowParts {
  function MenuItem({
    children,
    current,
    href,
    onPress,
    disabled = false,
    leading,
    trailing,
    inset = false,
    variant = 'default',
    tone,
    keepOpen = false,
    accessibilityLabel,
    style,
    testID,
  }: MenuRowProps) {
    const surface = useMenuSurface();
    const { title, body } = splitChildren(children);

    const handlePress = useCallback(
      (event: GestureResponderEvent) => {
        if (href != null && Platform.OS === 'web') {
          if (!isPlainLinkActivation(event)) return;
          if (onPress) event.preventDefault();
        }
        if (onPress) onPress();
        else if (href != null && Platform.OS !== 'web') openHref(href);
        if (!keepOpen) surface.close();
      },
      [href, onPress, keepOpen, surface],
    );

    return (
      <MenuRowShell
        role="menuitem"
        current={current}
        href={href}
        disabled={disabled}
        destructive={tone === 'danger' || (tone === undefined && variant === 'destructive')}
        inset={inset}
        leading={leading}
        trailing={trailing}
        title={title}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        style={style}
        testID={testID}
      >
        {body}
      </MenuRowShell>
    );
  }
  MenuItem.displayName = `${prefix}Item`;

  function MenuCheckboxItem({
    children,
    checked,
    onCheckedChange,
    indicator,
    indicatorPosition = 'leading',
    disabled = false,
    leading,
    trailing,
    keepOpen = false,
    accessibilityLabel,
    style,
    testID,
  }: MenuCheckboxRowProps) {
    const palette = useMenuPalette();
    const surface = useMenuSurface();
    const density = useMenuDensity();
    const { title, body } = splitChildren(children);
    // The selection tick: `size-4 shrink-0 text-text-secondary`. A desktop's is
    // the text's size, in the label's own ink (the accent's foreground while
    // highlighted), and a checked row is not painted as highlighted: the check
    // says it.
    const selectedIndicator =
      indicator !== undefined ? (
        indicator
      ) : density.desktop ? (
        <MenuRowGlyph Icon={CheckIcon} fill={palette.text} />
      ) : (
        <CheckIcon width={ROW_ICON_SIZE} height={ROW_ICON_SIZE} fill={palette.textSecondary} />
      );

    return (
      <IndicatorGutter position={indicatorPosition} indicator={checked ? selectedIndicator : null}>
        <MenuRowShell
          role="checkbox"
          checked={checked}
          selected={density.desktop ? false : checked}
          indicator={density.desktop ? (checked ? selectedIndicator : null) : undefined}
          disabled={disabled}
          gutter={indicatorPosition}
          leading={leading}
          trailing={trailing}
          title={title}
          onPress={() => {
            onCheckedChange(!checked);
            if (!keepOpen) surface.close();
          }}
          accessibilityLabel={accessibilityLabel}
          style={style}
          testID={testID}
        >
          {body}
        </MenuRowShell>
      </IndicatorGutter>
    );
  }
  MenuCheckboxItem.displayName = `${prefix}CheckboxItem`;

  function MenuRadioGroup({ children, value, onValueChange }: MenuRadioGroupProps) {
    const context = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
    return (
      <MenuRadioGroupProvider value={context}>
        {/* `gap-1` — the panel's own 4px row rhythm, carried into the group. */}
        <View
          collapsable={false}
          role={Platform.OS === 'web' ? 'group' : 'radiogroup'}
          style={useMenuDensity().groupStyle}
        >
          {children}
        </View>
      </MenuRadioGroupProvider>
    );
  }
  MenuRadioGroup.displayName = `${prefix}RadioGroup`;

  function MenuRadioItem({
    children,
    value,
    indicator,
    indicatorPosition = 'leading',
    disabled = false,
    leading,
    trailing,
    keepOpen = false,
    accessibilityLabel,
    style,
    testID,
  }: MenuRadioRowProps) {
    const surface = useMenuSurface();
    const group = useMenuRadioGroup();
    const { title, body } = splitChildren(children);
    const checked = group.value === value;
    const density = useMenuDensity();
    const radioDot = useRadioDotStyles();
    // `bg-foreground h-2 w-2 rounded-full`: the established default remains a
    // filled dot. A caller-supplied node replaces only this selected mark; the
    // shared gutter and ARIA state remain owned here. A desktop's dot takes the
    // row's ink, and the chosen row is marked by it, not highlighted.
    const selectedIndicator =
      indicator !== undefined ? (
        indicator
      ) : density.desktop ? (
        <MenuRadioDot />
      ) : (
        <View style={radioDot.dot} />
      );

    return (
      <IndicatorGutter position={indicatorPosition} indicator={checked ? selectedIndicator : null}>
        <MenuRowShell
          role="radio"
          checked={checked}
          selected={density.desktop ? false : checked}
          indicator={density.desktop ? (checked ? selectedIndicator : null) : undefined}
          disabled={disabled}
          gutter={indicatorPosition}
          leading={leading}
          trailing={trailing}
          title={title}
          onPress={() => {
            group.onValueChange(value);
            if (!keepOpen) surface.close();
          }}
          accessibilityLabel={accessibilityLabel}
          style={style}
          testID={testID}
        >
          {body}
        </MenuRowShell>
      </IndicatorGutter>
    );
  }
  MenuRadioItem.displayName = `${prefix}RadioItem`;

  function MenuLabel({ children, inset = false, style }: MenuLabelProps) {
    const palette = useMenuPalette();
    const density = useMenuDensity();
    const column = useMenuRowAlignment(NO_ROW_TRAITS);
    // A desktop's group label: the subheadline (11/14), semibold, in the
    // secondary label level.
    const labelType = density.desktop
      ? { ...DESKTOP_TEXT_STYLES.subheadline, fontWeight: '600' as const, ...MENU_FONT_FAMILY }
      : menuType('caption-1-medium');
    const aligned = inset || column.gutter;
    // The group label: the rows' inset, a caption, one step back in colour.
    return (
      <Text
        style={[
          density.labelStyle,
          aligned ? ROW_LABEL_INSET_STYLE : null,
          labelType,
          aligned ? { paddingLeft: density.gutter } : null,
          { color: palette.textSecondary },
          style,
        ]}
      >
        {children}
      </Text>
    );
  }
  MenuLabel.displayName = `${prefix}Label`;

  function MenuSeparator() {
    const palette = useMenuPalette();
    const density = useMenuDensity();
    // `-mx-2.5 my-1.5 h-px bg-border-button-default`. Not `Divider`: the
    // negative inset is what makes the rule reach the panel's edge through its
    // own `p-2.5`, and a hairline is not what the target draws — `h-px` is one
    // whole pixel.
    // A desktop's rule is inset from the panel's padding with room above and
    // below (`DESKTOP_MENU_GEOMETRY`).
    return (
      <View
        style={[
          density.separatorStyle,
          density.desktop
            ? {
                height: 1,
                marginLeft: density.separatorMargin,
                marginRight: density.separatorMargin,
                marginTop: density.separatorMargin,
                marginBottom: density.separatorMargin,
                backgroundColor: palette.border,
              }
            : { backgroundColor: palette.border },
        ]}
      />
    );
  }
  MenuSeparator.displayName = `${prefix}Separator`;

  function MenuShortcut({ children, style }: MenuShortcutProps) {
    const palette = useMenuPalette();
    const density = useMenuDensity();
    const ink = useMenuRowInk();
    if (density.desktop) {
      // A desktop's key column: the row's own body size, in the secondary label
      // level (the accent's foreground while the row is highlighted), clear of
      // the label by 16px and pushed to the trailing edge.
      return (
        <Text
          numberOfLines={1}
          style={[
            ROW_TRAILING_STYLE,
            { ...density.rowType, ...MENU_FONT_FAMILY },
            { paddingLeft: 16, textAlign: 'right' },
            { color: ink ?? palette.textSecondary },
            style,
          ]}
        >
          {children}
        </Text>
      );
    }
    return (
      <Text
        style={[
          ROW_TRAILING_STYLE,
          menuType('caption-1-medium'),
          { color: palette.textSecondary },
          style,
        ]}
      >
        {children}
      </Text>
    );
  }
  MenuShortcut.displayName = `${prefix}Shortcut`;

  function MenuGroup({ children, style }: MenuGroupProps) {
    // `group` is the ARIA role for a set of related menu rows; it carries no
    // state, so there is no `aria-*` counterpart to spell.
    return (
      <View collapsable={false} role="group" style={[useMenuDensity().groupStyle, style]}>
        {children}
      </View>
    );
  }
  MenuGroup.displayName = `${prefix}Group`;

  function MenuSwatchRowPart(props: MenuSwatchRowProps) {
    return <MenuSwatchRow {...props} />;
  }
  MenuSwatchRowPart.displayName = `${prefix}SwatchRow`;

  return {
    Item: MenuItem,
    CheckboxItem: MenuCheckboxItem,
    RadioGroup: MenuRadioGroup,
    RadioItem: MenuRadioItem,
    Label: MenuLabel,
    Separator: MenuSeparator,
    Shortcut: MenuShortcut,
    Group: MenuGroup,
    SwatchRow: MenuSwatchRowPart,
    ...createSub(prefix),
  };
}
