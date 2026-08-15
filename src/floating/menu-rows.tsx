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
 * Pointer highlight is `Item`'s own, which is why no row here tracks hover.
 *
 * Every row IS an `item/Item`, Bloom's one row primitive. That is what keeps the
 * disabled treatment, the destructive colour and the ARIA state in one place
 * instead of a fourth copy living here. Its GEOMETRY is not `Item`'s, though:
 * every number below comes from react-native-reusables' own class strings,
 * resolved in `floating/constants.ts`, because a shadcn menu row is a denser
 * thing than a Bloom settings row (8px of horizontal inset against 16, a 14px
 * label against 15, no minimum height at all) and `Item`'s defaults still belong
 * to every other caller.
 *
 * The `sm:` half of `py-2 sm:py-1.5` is a real breakpoint, not a platform split:
 * NativeWind resolves it against the WINDOW WIDTH on both platforms, so the row
 * reads it the same way, from `BREAKPOINTS.sm`. `useMenuSurface().presentation`
 * is no longer consulted for density — a web dropdown on a 400px window is 8px,
 * exactly as upstream.
 */
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import { Item } from '../item';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  FONT_MEDIUM,
  ROW_ICON_SIZE,
  ROW_INDICATOR_BOX,
  ROW_INDICATOR_INSET,
  ROW_INSET_PADDING_X,
  ROW_PADDING_X,
  ROW_PADDING_Y,
  ROW_PADDING_Y_SM,
  ROW_RADIO_DOT,
  ROW_SEPARATOR_INSET_X,
  ROW_SEPARATOR_MARGIN_Y,
  ROW_SEPARATOR_THICKNESS,
  SHORTCUT_LETTER_SPACING,
  TEXT_SM,
  TEXT_SM_LINE_HEIGHT,
  TEXT_XS,
  TEXT_XS_LINE_HEIGHT,
} from './constants';
import { MenuRadioGroupProvider, useMenuRadioGroup, useMenuSurface } from './context';
import { rowShapeStyles, splitChildren, useRowStyle } from './shared';
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
} from './types';

/**
 * Upstream's `pl-8` gutter with its `absolute left-2 h-3.5 w-3.5` indicator.
 *
 * The indicator is OUT OF FLOW, which is the whole point: a checkbox row's text
 * starts at a fixed 32px whether or not a check is drawn, so a menu's rows line
 * up with each other and with an `inset` plain row. Passing it as `Item`'s
 * `leading` instead would put it back in flow and add the row's `gap-2` on top,
 * which is how the text ended up 8px further right than upstream's — and it
 * would also make the column collapse to nothing on an unchecked row.
 *
 * `pointerEvents="none"` as a PROP, not a style entry: the box sits ON TOP of
 * `Item`'s own `Pressable`, so without it the indicator swallows the press that
 * toggles the row. (`'none'` does survive as a style on react-native-web, but
 * the prop path is the one both platforms resolve.)
 */
function IndicatorGutter({
  indicator,
  children,
}: {
  indicator: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View>
      {children}
      <View style={styles.indicator} pointerEvents="none">
        {indicator}
      </View>
    </View>
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
    onPress,
    disabled = false,
    leading,
    trailing,
    inset = false,
    variant = 'default',
    keepOpen = false,
    accessibilityLabel,
    style,
    testID,
  }: MenuRowProps) {
    const surface = useMenuSurface();
    const rowStyle = useRowStyle();
    const { title, body } = splitChildren(children);

    const handlePress = useCallback(() => {
      onPress?.();
      if (!keepOpen) surface.close();
    }, [onPress, keepOpen, surface]);

    return (
      <Item
        title={title}
        disabled={disabled}
        destructive={variant === 'destructive'}
        role="menuitem"
        leading={leading}
        trailing={trailing}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        titleStyle={rowShapeStyles.rowText}
        style={[rowStyle, inset ? rowShapeStyles.inset : null, style]}
        testID={testID}>
        {body}
      </Item>
    );
  }
  MenuItem.displayName = `${prefix}Item`;

  function MenuCheckboxItem({
    children,
    checked,
    onCheckedChange,
    disabled = false,
    trailing,
    keepOpen = false,
    accessibilityLabel,
    style,
    testID,
  }: MenuCheckboxRowProps) {
    const theme = useTheme();
    const surface = useMenuSurface();
    const rowStyle = useRowStyle();
    const { title, body } = splitChildren(children);

    return (
      <IndicatorGutter
        indicator={
          checked ? (
            <CheckIcon
              width={ROW_ICON_SIZE}
              height={ROW_ICON_SIZE}
              fill={theme.colors.text}
            />
          ) : null
        }>
        <Item
          title={title}
          disabled={disabled}
          // `checkbox` + `selected` is what makes `Item` emit `aria-checked`,
          // which is the only spelling react-native-web reads.
          role="checkbox"
          selected={checked}
          trailing={trailing}
          onPress={() => {
            onCheckedChange(!checked);
            if (!keepOpen) surface.close();
          }}
          accessibilityLabel={accessibilityLabel}
          titleStyle={rowShapeStyles.rowText}
          style={[rowStyle, styles.gutterRow, style]}
          testID={testID}>
          {body}
        </Item>
      </IndicatorGutter>
    );
  }
  MenuCheckboxItem.displayName = `${prefix}CheckboxItem`;

  function MenuRadioGroup({ children, value, onValueChange }: MenuRadioGroupProps) {
    const context = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
    return (
      <MenuRadioGroupProvider value={context}>
        <View role="radiogroup">{children}</View>
      </MenuRadioGroupProvider>
    );
  }
  MenuRadioGroup.displayName = `${prefix}RadioGroup`;

  function MenuRadioItem({
    children,
    value,
    disabled = false,
    trailing,
    keepOpen = false,
    accessibilityLabel,
    style,
    testID,
  }: MenuRadioRowProps) {
    const theme = useTheme();
    const surface = useMenuSurface();
    const group = useMenuRadioGroup();
    const rowStyle = useRowStyle();
    const { title, body } = splitChildren(children);
    const checked = group.value === value;

    return (
      <IndicatorGutter
        indicator={
          // `bg-foreground h-2 w-2 rounded-full` — upstream's selected radio row
          // is a FILLED DOT with no ring, which is what fits an 8px mark inside a
          // 14px indicator box. `radio-indicator/` draws Bloom's ringed control,
          // a different thing at a different size, and using it here is what made
          // a menu radio row twice the width of its checkbox sibling.
          checked ? (
            <View style={[styles.radioDot, { backgroundColor: theme.colors.text }]} />
          ) : null
        }>
        <Item
          title={title}
          disabled={disabled}
          role="radio"
          selected={checked}
          trailing={trailing}
          onPress={() => {
            group.onValueChange(value);
            if (!keepOpen) surface.close();
          }}
          accessibilityLabel={accessibilityLabel}
          titleStyle={rowShapeStyles.rowText}
          style={[rowStyle, styles.gutterRow, style]}
          testID={testID}>
          {body}
        </Item>
      </IndicatorGutter>
    );
  }
  MenuRadioItem.displayName = `${prefix}RadioItem`;

  function MenuLabel({ children, inset = false, style }: MenuLabelProps) {
    const theme = useTheme();
    const { width } = useWindowDimensions();
    return (
      <Text
        style={[
          styles.label,
          // `px-2 py-2 sm:py-1.5`, and `text-foreground` — NOT muted. A shadcn
          // menu label is a heading over its group, set in the same colour and
          // size as the rows under it and separated only by its weight.
          { paddingVertical: width >= BREAKPOINTS.sm ? ROW_PADDING_Y_SM : ROW_PADDING_Y },
          { color: theme.colors.text },
          inset ? styles.labelInset : null,
          style,
        ]}>
        {children}
      </Text>
    );
  }
  MenuLabel.displayName = `${prefix}Label`;

  function MenuSeparator() {
    const theme = useTheme();
    // `bg-border -mx-1 my-1 h-px`. Not `Divider`: the negative inset is what
    // makes the rule reach the panel's edge through its own `p-1`, and a
    // hairline is not what upstream draws — `h-px` is one whole pixel.
    return (
      <View style={[styles.separator, { backgroundColor: theme.colors.borderLight }]} />
    );
  }
  MenuSeparator.displayName = `${prefix}Separator`;

  function MenuShortcut({ children, style }: MenuShortcutProps) {
    const theme = useTheme();
    return (
      <Text style={[styles.shortcut, { color: theme.colors.textSecondary }, style]}>
        {children}
      </Text>
    );
  }
  MenuShortcut.displayName = `${prefix}Shortcut`;

  function MenuGroup({ children, style }: MenuGroupProps) {
    // `group` is the ARIA role for a set of related menu rows; it carries no
    // state, so there is no `aria-*` counterpart to spell.
    return (
      <View role="group" style={style}>
        {children}
      </View>
    );
  }
  MenuGroup.displayName = `${prefix}Group`;

  return {
    Item: MenuItem,
    CheckboxItem: MenuCheckboxItem,
    RadioGroup: MenuRadioGroup,
    RadioItem: MenuRadioItem,
    Label: MenuLabel,
    Separator: MenuSeparator,
    Shortcut: MenuShortcut,
    Group: MenuGroup,
    ...createSub(prefix),
  };
}

const styles = StyleSheet.create({
  // `absolute left-2 flex h-3.5 w-3.5 items-center justify-center`, stretched
  // top-to-bottom so it centres against whatever the row's height turns out to
  // be rather than guessing one.
  indicator: {
    position: 'absolute',
    left: ROW_INDICATOR_INSET,
    top: 0,
    bottom: 0,
    width: ROW_INDICATOR_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `h-2 w-2 rounded-full`.
  radioDot: {
    width: ROW_RADIO_DOT,
    height: ROW_RADIO_DOT,
    borderRadius: ROW_RADIO_DOT / 2,
  },
  // `pl-8 pr-2` on the two rows that carry an indicator.
  gutterRow: {
    paddingLeft: ROW_INSET_PADDING_X,
    paddingRight: ROW_PADDING_X,
  },
  // `text-foreground px-2 py-2 text-sm font-medium sm:py-1.5` (the vertical
  // inset is applied at the call site, where the breakpoint is read).
  label: {
    // Longhands, so `labelInset`'s `paddingLeft` is not outranked on web.
    paddingLeft: ROW_PADDING_X,
    paddingRight: ROW_PADDING_X,
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
    fontWeight: FONT_MEDIUM,
  },
  labelInset: {
    paddingLeft: ROW_INSET_PADDING_X,
  },
  // `text-muted-foreground ml-auto text-xs tracking-widest`.
  shortcut: {
    marginLeft: 'auto',
    fontSize: TEXT_XS,
    lineHeight: TEXT_XS_LINE_HEIGHT,
    letterSpacing: SHORTCUT_LETTER_SPACING,
  },
  // `bg-border -mx-1 my-1 h-px`.
  separator: {
    height: ROW_SEPARATOR_THICKNESS,
    marginVertical: ROW_SEPARATOR_MARGIN_Y,
    marginHorizontal: ROW_SEPARATOR_INSET_X,
  },
});
