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
 * Every shape below is a Tailwind class from `floating/constants.ts`, applied
 * through Bloom's own `styled()` primitives, because that is how the originals
 * are built and it is the only form a consumer can override with a utility. The
 * row shell itself is `shared.tsx`'s `MenuRowShell` — see its header for why
 * these rows are no longer `item/Item`.
 *
 * Every part takes a `className` and APPENDS it to its own, so a caller can
 * restyle a row without stripping its chrome.
 *
 * The `sm:` breakpoint the previous pass carried (`py-2 sm:py-1.5`) is gone:
 * the target has one row inset (6px) plus a 32px minimum height, so a row is
 * the same density at every window width.
 */
import type React from 'react';
import { useCallback, useMemo } from 'react';

import { RiCheckLine as CheckIcon } from '../icons/remix/RiCheckLine';
import { StyledText, StyledView } from '../styles/styled-primitives';
import {
  ROW_ICON_SIZE,
  ROW_INDICATOR_CLASS,
  ROW_INDICATOR_END_CLASS,
  ROW_LABEL_INSET_CLASS,
  ROW_RADIO_DOT_CLASS,
  ROW_SHORTCUT_CLASS,
} from './constants';
import { MenuRadioGroupProvider, useMenuRadioGroup, useMenuSurface } from './context';
import { useMenuPalette } from './menu-palette';
import { MENU_FONT_FAMILY, menuType, menuTypeClass } from './menu-type';
import { cx, MenuRowGlyph, MenuRowShell, splitChildren, useMenuRowInk } from './shared';
import { DESKTOP_TEXT_STYLES } from '../typography/desktop-scale';
import { useMenuRowAlignment } from './menu-row-alignment';
import { MenuSwatchRow } from './menu-swatch-row';

const NO_ROW_TRAITS = { gutter: false, leading: false } as const;
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
    <StyledView className="relative">
      {children}
      <StyledView
        className={position === 'leading' ? ROW_INDICATOR_CLASS : ROW_INDICATOR_END_CLASS}
        style={{ width: density.leadingSize }}
        pointerEvents="none"
      >
        {indicator}
      </StyledView>
    </StyledView>
  );
}

/** A desktop's radio mark: a 6px dot in the row's ink (the accent's foreground while highlighted). */
function MenuRadioDot() {
  const palette = useMenuPalette();
  const ink = useMenuRowInk();
  return (
    <StyledView
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ink ?? palette.text }}
    />
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
    className,
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
        className={className}
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
    className,
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
          className={className}
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
        <StyledView
          collapsable={false}
          role={Platform.OS === 'web' ? 'group' : 'radiogroup'}
          className={useMenuDensity().groupClass}
        >
          {children}
        </StyledView>
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
    className,
    style,
    testID,
  }: MenuRadioRowProps) {
    const surface = useMenuSurface();
    const group = useMenuRadioGroup();
    const { title, body } = splitChildren(children);
    const checked = group.value === value;
    const density = useMenuDensity();
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
        <StyledView className={ROW_RADIO_DOT_CLASS} />
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
          className={className}
          style={style}
          testID={testID}
        >
          {body}
        </MenuRowShell>
      </IndicatorGutter>
    );
  }
  MenuRadioItem.displayName = `${prefix}RadioItem`;

  function MenuLabel({ children, inset = false, className, style }: MenuLabelProps) {
    const palette = useMenuPalette();
    const density = useMenuDensity();
    const type = 'caption-1-medium';
    const column = useMenuRowAlignment(NO_ROW_TRAITS);
    // A desktop's group label: the subheadline (11/14), semibold, in the
    // secondary label level.
    const labelType = density.desktop
      ? className
        ? MENU_FONT_FAMILY
        : { ...DESKTOP_TEXT_STYLES.subheadline, fontWeight: '600' as const, ...MENU_FONT_FAMILY }
      : menuType(type, className);
    const aligned = inset || column.gutter;
    // The group label: `pl-2 text-body-medium text-text-secondary` — the
    // rows' size and weight, one step back in colour. The colour is inline only
    // while the caller passes no `className`: an inline colour would outrank a
    // caller's `text-*` utility on native.
    return (
      <StyledText
        className={cx(
          density.labelClass,
          aligned && ROW_LABEL_INSET_CLASS,
          menuTypeClass(type, className),
          className && 'text-muted-foreground',
          className,
        )}
        style={[
          labelType,
          aligned ? { paddingLeft: density.gutter } : null,
          className ? null : { color: palette.textSecondary },
          style,
        ]}
      >
        {children}
      </StyledText>
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
    // below (`DESKTOP_MENU_GEOMETRY`), inline as well as in the class.
    return (
      <StyledView
        className={density.separatorClass}
        style={
          density.desktop
            ? {
                height: 1,
                marginLeft: density.separatorMargin,
                marginRight: density.separatorMargin,
                marginTop: density.separatorMargin,
                marginBottom: density.separatorMargin,
                backgroundColor: palette.border,
              }
            : { backgroundColor: palette.border }
        }
      />
    );
  }
  MenuSeparator.displayName = `${prefix}Separator`;

  function MenuShortcut({ children, className, style }: MenuShortcutProps) {
    const palette = useMenuPalette();
    const density = useMenuDensity();
    const ink = useMenuRowInk();
    if (density.desktop) {
      // A desktop's key column: the row's own body size, in the secondary label
      // level (the accent's foreground while the row is highlighted), clear of
      // the label by 16px and pushed to the trailing edge.
      return (
        <StyledText
          numberOfLines={1}
          className={cx(ROW_SHORTCUT_CLASS, className)}
          style={[
            className ? MENU_FONT_FAMILY : { ...density.rowType, ...MENU_FONT_FAMILY },
            { paddingLeft: 16, textAlign: 'right' },
            className && ink == null ? null : { color: ink ?? palette.textSecondary },
            style,
          ]}
        >
          {children}
        </StyledText>
      );
    }
    return (
      <StyledText
        className={cx(
          ROW_SHORTCUT_CLASS,
          menuTypeClass('caption-1-medium', className),
          className && 'text-muted-foreground',
          className,
        )}
        style={[
          menuType('caption-1-medium', className),
          className ? null : { color: palette.textSecondary },
          style,
        ]}
      >
        {children}
      </StyledText>
    );
  }
  MenuShortcut.displayName = `${prefix}Shortcut`;

  function MenuGroup({ children, className, style }: MenuGroupProps) {
    // `group` is the ARIA role for a set of related menu rows; it carries no
    // state, so there is no `aria-*` counterpart to spell.
    return (
      <StyledView
        collapsable={false}
        role="group"
        className={cx(useMenuDensity().groupClass, className)}
        style={style}
      >
        {children}
      </StyledView>
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
