/**
 * The menu ROW vocabulary — one implementation, rendered by all three menu
 * shells (`DropdownMenu`, `ContextMenu`, `Menubar`).
 *
 * Universal, not forked. What differs between a native bottom sheet and a web
 * dropdown is density and pointer highlight, and both are read from
 * `useMenuSurface().presentation` — the shell states which surface it is, so a
 * row never has to ask the platform.
 *
 * Every row is an `item/Item`, Bloom's one row primitive. That is what keeps
 * the touch target, the disabled treatment, the destructive colour and the ARIA
 * state in one place instead of a fourth copy living here.
 */
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Divider } from '../divider';
import { useInteractionState } from '../hooks/use-interaction-state';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '../icons/Chevron';
import { Item } from '../item';
import { useControllableState } from '../hooks/use-controllable-state';
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
  MenuCheckboxItemProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuShortcutProps,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
} from './types';

/** Width of the checkbox/radio indicator column, so rows line up under `inset`. */
const INDICATOR_SIZE = 20;

/**
 * Pointer highlight, on the surfaces that have a pointer.
 *
 * The handlers go on a WRAPPER `View` rather than on `Item`: `Item` renders a
 * `Pressable`, and nesting one inside another is what react-native-web turns
 * into a nested `<button>`. `onPointerEnter`/`onPointerLeave` are typed on
 * `ViewProps` by React Native and forwarded to the DOM by react-native-web, so
 * this needs no cast on either platform — and they are attached only for a
 * `'dropdown'` surface, so a touch on a native sheet row never flashes a hover
 * state on its way to a press.
 */
function useRowHighlight(presentation: MenuSurfaceContextValue['presentation']): {
  highlighted: boolean;
  hoverProps: Pick<ViewProps, 'onPointerEnter' | 'onPointerLeave'>;
} {
  const { state, onIn, onOut } = useInteractionState();
  const isDropdown = presentation === 'dropdown';
  return {
    highlighted: isDropdown && state,
    hoverProps: isDropdown ? { onPointerEnter: onIn, onPointerLeave: onOut } : {},
  };
}

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

export function MenuItem({
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
}: MenuItemProps) {
  const surface = useMenuSurface();
  const { highlighted, hoverProps } = useRowHighlight(surface.presentation);
  const { title, body } = splitChildren(children);

  const handlePress = useCallback(() => {
    onPress?.();
    if (!keepOpen) surface.close();
  }, [onPress, keepOpen, surface]);

  return (
    <View {...hoverProps}>
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        destructive={variant === 'destructive'}
        active={highlighted && !disabled}
        role="menuitem"
        leading={leading}
        trailing={trailing}
        onPress={handlePress}
        style={[inset ? styles.inset : null, style]}
        testID={testID}>
        {body}
      </Item>
    </View>
  );
}

export function MenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  disabled = false,
  trailing,
  keepOpen = false,
  style,
  testID,
}: MenuCheckboxItemProps) {
  const theme = useTheme();
  const surface = useMenuSurface();
  const { highlighted, hoverProps } = useRowHighlight(surface.presentation);
  const { title, body } = splitChildren(children);

  return (
    <View {...hoverProps}>
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        active={highlighted && !disabled}
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
    </View>
  );
}

export function MenuRadioGroup({ children, value, onValueChange }: MenuRadioGroupProps) {
  const context = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
  return (
    <MenuRadioGroupProvider value={context}>
      <View role="radiogroup">{children}</View>
    </MenuRadioGroupProvider>
  );
}

export function MenuRadioItem({
  children,
  value,
  disabled = false,
  trailing,
  keepOpen = false,
  style,
  testID,
}: MenuRadioItemProps) {
  const theme = useTheme();
  const surface = useMenuSurface();
  const group = useMenuRadioGroup();
  const { highlighted, hoverProps } = useRowHighlight(surface.presentation);
  const { title, body } = splitChildren(children);
  const checked = group.value === value;

  return (
    <View {...hoverProps}>
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        active={highlighted && !disabled}
        role="radio"
        selected={checked}
        leading={
          <View style={styles.indicator}>
            {checked ? (
              <View style={[styles.radioDot, { backgroundColor: theme.colors.text }]} />
            ) : null}
          </View>
        }
        trailing={trailing}
        onPress={() => {
          group.onValueChange(value);
          if (!keepOpen) surface.close();
        }}
        style={style}
        testID={testID}>
        {body}
      </Item>
    </View>
  );
}

export function MenuLabel({ children, inset = false, style }: MenuLabelProps) {
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

export function MenuSeparator() {
  return <Divider spacing={space.xs} />;
}

export function MenuShortcut({ children, style }: MenuShortcutProps) {
  const theme = useTheme();
  return (
    <Text style={[styles.shortcut, { color: theme.colors.textTertiary }, style]}>
      {children}
    </Text>
  );
}

export function MenuGroup({ children, style }: MenuGroupProps) {
  // `group` is the ARIA role for a set of related menu rows; it carries no
  // state, so there is no `aria-*` counterpart to spell.
  return (
    <View role="group" style={style}>
      {children}
    </View>
  );
}

export function MenuSub({ children, open, defaultOpen = false, onOpenChange }: MenuSubProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const context = useMemo(() => ({ open: isOpen, setOpen }), [isOpen, setOpen]);
  return <MenuSubProvider value={context}>{children}</MenuSubProvider>;
}

/**
 * A sub-menu is an INLINE DISCLOSURE on both platforms, not a web-only flyout.
 *
 * That is the one presentational departure from shadcn, and it is deliberate:
 * react-native-reusables already renders sub-menus inline on native (its own
 * trigger swaps the chevron between up and down to say so), while a web flyout
 * would need `overlay/dropdown-placement` to grow a horizontal axis plus
 * hover-intent and roving keyboard focus. The API — `MenuSub` / `MenuSubTrigger`
 * / `MenuSubContent` — is unchanged, so a shadcn call site ports verbatim.
 */
export function MenuSubTrigger({
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
  const { highlighted, hoverProps } = useRowHighlight(surface.presentation);
  const { title, body } = splitChildren(children);
  const Chevron = sub.open ? ChevronTopIcon : ChevronBottomIcon;

  return (
    <View {...hoverProps}>
      <Item
        title={title}
        density={densityFor(surface.presentation)}
        disabled={disabled}
        active={highlighted && !disabled}
        role="menuitem"
        expanded={sub.open}
        leading={leading}
        trailing={<Chevron size="xs" fill={theme.colors.textSecondary} />}
        onPress={() => sub.setOpen(!sub.open)}
        style={[inset ? styles.inset : null, style]}
        testID={testID}>
        {body}
      </Item>
    </View>
  );
}

export function MenuSubContent({ children, style }: MenuSubContentProps) {
  const sub = useMenuSub();
  if (!sub.open) return null;
  return <View style={[styles.subContent, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
