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
 * Universal, not forked. What differs between a native bottom sheet and a web
 * dropdown is density, and it is read from `useMenuSurface().presentation` — the
 * shell states which surface it is, so a row never asks the platform. Pointer
 * highlight is `Item`'s own, which is why no row here tracks hover.
 *
 * Every row IS an `item/Item`, Bloom's one row primitive. That is what keeps the
 * touch target, the disabled treatment, the destructive colour and the ARIA
 * state in one place instead of a fourth copy living here.
 */
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Divider } from '../divider';
import { useControllableState } from '../hooks/use-controllable-state';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '../icons/Chevron';
import { Item } from '../item';
import { RadioIndicator } from '../radio-indicator';
import { fontSize, space } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MenuRadioGroupProvider,
  MenuSubProvider,
  useMenuRadioGroup,
  useMenuSub,
  useMenuSurface,
  type MenuSurfaceContextValue,
} from './context';
import type {
  MenuCheckboxRowProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioRowProps,
  MenuRowParts,
  MenuRowProps,
  MenuShortcutProps,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
} from './types';

/** Width of the checkbox/radio indicator column, so rows line up under `inset`. */
const INDICATOR_SIZE = 20;

/** A sheet row is a touch target; a dropdown row is a pointer target. */
function densityFor(
  presentation: MenuSurfaceContextValue['presentation'],
): 'comfortable' | 'compact' {
  return presentation === 'sheet' ? 'comfortable' : 'compact';
}

/**
 * A string child becomes the row's TITLE so `Item` colours it (destructive,
 * disabled); anything else is rendered verbatim, which is shadcn's own
 * `<Icon /><Text>…</Text>` composition.
 */
function splitChildren(children: React.ReactNode): {
  title?: string;
  body?: React.ReactNode;
} {
  return typeof children === 'string' ? { title: children } : { body: children };
}

/**
 * Build one family's row parts.
 *
 * `prefix` is the family's own name (`'DropdownMenu'`, `'ContextMenu'`,
 * `'Menubar'`) and is used for nothing but `displayName`.
 */
export function createMenuRows(prefix: string): MenuRowParts {
  function MenuItem({
    children,
    onPress,
    disabled = false,
    leading,
    trailing,
    inset = false,
    variant = 'default',
    keepOpen = false,
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
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        destructive={variant === 'destructive'}
        role="menuitem"
        leading={leading}
        trailing={trailing}
        onPress={handlePress}
        style={[inset ? styles.inset : null, style]}
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
    style,
    testID,
  }: MenuCheckboxRowProps) {
    const theme = useTheme();
    const surface = useMenuSurface();
    const { title, body } = splitChildren(children);

    return (
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        // `checkbox` + `selected` is what makes `Item` emit `aria-checked`,
        // which is the only spelling react-native-web reads.
        role="checkbox"
        selected={checked}
        leading={
          <View style={styles.indicator}>
            {checked ? <CheckIcon size="sm" fill={theme.colors.text} /> : null}
          </View>
        }
        trailing={trailing}
        onPress={() => {
          onCheckedChange(!checked);
          if (!keepOpen) surface.close();
        }}
        style={style}
        testID={testID}>
        {body}
      </Item>
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
    style,
    testID,
  }: MenuRadioRowProps) {
    const surface = useMenuSurface();
    const group = useMenuRadioGroup();
    const { title, body } = splitChildren(children);
    const checked = group.value === value;

    return (
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        role="radio"
        selected={checked}
        // The same indicator `Select` and `Radio` draw. A menu radio row that
        // hand-rolled its own dot would be the second one in the library.
        leading={<RadioIndicator selected={checked} size={INDICATOR_SIZE} />}
        trailing={trailing}
        onPress={() => {
          group.onValueChange(value);
          if (!keepOpen) surface.close();
        }}
        style={style}
        testID={testID}>
        {body}
      </Item>
    );
  }
  MenuRadioItem.displayName = `${prefix}RadioItem`;

  function MenuLabel({ children, inset = false, style }: MenuLabelProps) {
    const theme = useTheme();
    return (
      <Text
        style={[
          styles.label,
          { color: theme.colors.textSecondary },
          inset ? styles.labelInset : null,
          style,
        ]}>
        {children}
      </Text>
    );
  }
  MenuLabel.displayName = `${prefix}Label`;

  function MenuSeparator() {
    return <Divider spacing={space.xs} />;
  }
  MenuSeparator.displayName = `${prefix}Separator`;

  function MenuShortcut({ children, style }: MenuShortcutProps) {
    const theme = useTheme();
    return (
      <Text style={[styles.shortcut, { color: theme.colors.textTertiary }, style]}>
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

  function MenuSub({ children, open, defaultOpen = false, onOpenChange }: MenuSubProps) {
    const [isOpen, setOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const context = useMemo(() => ({ open: isOpen, setOpen }), [isOpen, setOpen]);
    return <MenuSubProvider value={context}>{children}</MenuSubProvider>;
  }
  MenuSub.displayName = `${prefix}Sub`;

  /**
   * A sub-menu is an INLINE DISCLOSURE on both platforms, not a web-only flyout.
   *
   * That is the one presentational departure from shadcn, and it is deliberate:
   * react-native-reusables already renders sub-menus inline on native (its own
   * trigger swaps the chevron between up and down to say so), while a web flyout
   * would need `overlay/dropdown-placement` to grow a horizontal axis, plus
   * hover-intent and roving keyboard focus across two surfaces. The API — `Sub`
   * / `SubTrigger` / `SubContent` — is unchanged, so a shadcn call site ports
   * verbatim and only the presentation differs.
   */
  function MenuSubTrigger({
    children,
    disabled = false,
    inset = false,
    leading,
    style,
    testID,
  }: MenuSubTriggerProps) {
    const theme = useTheme();
    const surface = useMenuSurface();
    const sub = useMenuSub();
    const { title, body } = splitChildren(children);
    const Chevron = sub.open ? ChevronTopIcon : ChevronBottomIcon;

    return (
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        role="menuitem"
        expanded={sub.open}
        leading={leading}
        trailing={<Chevron size="xs" fill={theme.colors.textSecondary} />}
        onPress={() => sub.setOpen(!sub.open)}
        style={[inset ? styles.inset : null, style]}
        testID={testID}>
        {body}
      </Item>
    );
  }
  MenuSubTrigger.displayName = `${prefix}SubTrigger`;

  function MenuSubContent({ children, style }: MenuSubContentProps) {
    const sub = useMenuSub();
    if (!sub.open) return null;
    return <View style={[styles.subContent, style]}>{children}</View>;
  }
  MenuSubContent.displayName = `${prefix}SubContent`;

  return {
    Item: MenuItem,
    CheckboxItem: MenuCheckboxItem,
    RadioGroup: MenuRadioGroup,
    RadioItem: MenuRadioItem,
    Label: MenuLabel,
    Separator: MenuSeparator,
    Shortcut: MenuShortcut,
    Group: MenuGroup,
    Sub: MenuSub,
    SubTrigger: MenuSubTrigger,
    SubContent: MenuSubContent,
  };
}

const styles = StyleSheet.create({
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lines a plain row up with the rows that carry an indicator: the indicator
  // column plus `Item`'s own leading-slot gap.
  inset: {
    paddingLeft: space.lg + INDICATOR_SIZE + space.md,
  },
  label: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  labelInset: {
    paddingLeft: space.lg + INDICATOR_SIZE + space.md,
  },
  shortcut: {
    marginLeft: 'auto',
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },
  subContent: {
    paddingLeft: space.md,
  },
});
