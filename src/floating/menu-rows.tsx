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
import React, { useCallback, useMemo } from 'react';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import { StyledText, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import {
  ROW_ICON_SIZE,
  ROW_INDICATOR_CLASS,
  ROW_LABEL_CLASS,
  ROW_LABEL_INSET_CLASS,
  ROW_RADIO_DOT_CLASS,
  ROW_SEPARATOR_CLASS,
  ROW_SHORTCUT_CLASS,
} from './constants';
import { MenuRadioGroupProvider, useMenuRadioGroup, useMenuSurface } from './context';
import { cx, MenuRowShell, splitChildren } from './shared';
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
 * The target's `pl-8` gutter with its `absolute left-2 size-3.5` indicator.
 *
 * The indicator is OUT OF FLOW, which is the whole point: a checkbox row's text
 * starts at a fixed 32px whether or not a check is drawn, so a menu's rows line
 * up with each other and with an `inset` plain row. Passing it as a leading slot
 * instead would put it back in flow and add the row's `gap-2` on top, and it
 * would also make the column collapse to nothing on an unchecked row.
 *
 * `pointerEvents="none"` as a PROP, not a style entry: the box sits ON TOP of
 * the row's own pressable, so without it the indicator swallows the press that
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
    <StyledView className="relative">
      {children}
      <StyledView className={ROW_INDICATOR_CLASS} pointerEvents="none">
        {indicator}
      </StyledView>
    </StyledView>
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
    className,
    style,
    testID,
  }: MenuRowProps) {
    const surface = useMenuSurface();
    const { title, body } = splitChildren(children);

    const handlePress = useCallback(() => {
      onPress?.();
      if (!keepOpen) surface.close();
    }, [onPress, keepOpen, surface]);

    return (
      <MenuRowShell
        role="menuitem"
        disabled={disabled}
        destructive={variant === 'destructive'}
        inset={inset}
        leading={leading}
        trailing={trailing}
        title={title}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        className={className}
        style={style}
        testID={testID}>
        {body}
      </MenuRowShell>
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
    className,
    style,
    testID,
  }: MenuCheckboxRowProps) {
    const theme = useTheme();
    const surface = useMenuSurface();
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
        <MenuRowShell
          role="checkbox"
          checked={checked}
          disabled={disabled}
          gutter
          trailing={trailing}
          title={title}
          onPress={() => {
            onCheckedChange(!checked);
            if (!keepOpen) surface.close();
          }}
          accessibilityLabel={accessibilityLabel}
          className={className}
          style={style}
          testID={testID}>
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
        <StyledView role="radiogroup">{children}</StyledView>
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
    className,
    style,
    testID,
  }: MenuRadioRowProps) {
    const surface = useMenuSurface();
    const group = useMenuRadioGroup();
    const { title, body } = splitChildren(children);
    const checked = group.value === value;

    return (
      <IndicatorGutter
        indicator={
          // `bg-foreground h-2 w-2 rounded-full` — a selected radio row is a
          // FILLED DOT with no ring, which is what fits an 8px mark inside a
          // 14px indicator box. `radio-indicator/` draws Bloom's ringed control,
          // a different thing at a different size, and using it here is what made
          // a menu radio row twice the width of its checkbox sibling.
          checked ? <StyledView className={ROW_RADIO_DOT_CLASS} /> : null
        }>
        <MenuRowShell
          role="radio"
          checked={checked}
          disabled={disabled}
          gutter
          trailing={trailing}
          title={title}
          onPress={() => {
            group.onValueChange(value);
            if (!keepOpen) surface.close();
          }}
          accessibilityLabel={accessibilityLabel}
          className={className}
          style={style}
          testID={testID}>
          {body}
        </MenuRowShell>
      </IndicatorGutter>
    );
  }
  MenuRadioItem.displayName = `${prefix}RadioItem`;

  function MenuLabel({ children, inset = false, className, style }: MenuLabelProps) {
    // `text-foreground px-2 py-1.5 text-sm font-medium` — NOT muted. A menu label
    // is a heading over its group, set in the same colour and size as the rows
    // under it and separated only by its weight.
    return (
      <StyledText
        className={cx(ROW_LABEL_CLASS, inset && ROW_LABEL_INSET_CLASS, className)}
        style={style}>
        {children}
      </StyledText>
    );
  }
  MenuLabel.displayName = `${prefix}Label`;

  function MenuSeparator() {
    // `bg-border -mx-1 my-1 h-px`. Not `Divider`: the negative inset is what
    // makes the rule reach the panel's edge through its own `p-1`, and a
    // hairline is not what the target draws — `h-px` is one whole pixel.
    return <StyledView className={ROW_SEPARATOR_CLASS} />;
  }
  MenuSeparator.displayName = `${prefix}Separator`;

  function MenuShortcut({ children, className, style }: MenuShortcutProps) {
    return (
      <StyledText className={cx(ROW_SHORTCUT_CLASS, className)} style={style}>
        {children}
      </StyledText>
    );
  }
  MenuShortcut.displayName = `${prefix}Shortcut`;

  function MenuGroup({ children, className, style }: MenuGroupProps) {
    // `group` is the ARIA role for a set of related menu rows; it carries no
    // state, so there is no `aria-*` counterpart to spell.
    return (
      <StyledView role="group" className={className} style={style}>
        {children}
      </StyledView>
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
