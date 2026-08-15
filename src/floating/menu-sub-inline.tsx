/**
 * The NATIVE sub-menu: an inline disclosure inside the sheet.
 *
 * `SubTrigger` is an ordinary row whose chevron swaps between down and up, and
 * `SubContent` is a plain indented block below it. That is what
 * react-native-reusables itself renders on native, and it is the right shape for
 * a sheet: there is nowhere for a flyout to fly to, and a second anchored window
 * over a modal sheet is a presentation iOS cannot reliably stack anyway.
 *
 * The WEB counterpart is `menu-sub-flyout.tsx`. The two are chosen by each
 * family's own platform fork (`DropdownMenu.tsx` vs `DropdownMenu.web.tsx`)
 * rather than by a `Platform.OS` branch here — the flyout imports the web-only
 * `FloatingPanel`, so a runtime branch would drag `react-dom` and the portal
 * into every native bundle.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '../icons/Chevron';
import { Item } from '../item';
import { space } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { ROW_ICON_SIZE } from './constants';
import { MenuSubProvider, useMenuSub } from './context';
import { rowShapeStyles, splitChildren, useRowStyle } from './shared';
import type {
  MenuSubContentProps,
  MenuSubParts,
  MenuSubProps,
  MenuSubTriggerProps,
} from './types';

/** Build one family's inline sub trio. `prefix` is used for nothing but `displayName`. */
export function createInlineMenuSub(prefix: string): MenuSubParts {
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

  function MenuSubTrigger({
    children,
    disabled = false,
    inset = false,
    leading,
    accessibilityLabel,
    style,
    testID,
  }: MenuSubTriggerProps) {
    const theme = useTheme();
    const sub = useMenuSub();
    const rowStyle = useRowStyle();
    const { title, body } = splitChildren(children);
    // Down when closed, up when open: the disclosure states an INLINE
    // relationship, which is what the native presentation is.
    const Chevron = sub.open ? ChevronTopIcon : ChevronBottomIcon;

    return (
      <Item
        title={title}
        disabled={disabled}
        role="menuitem"
        expanded={sub.open}
        leading={leading}
        // `text-foreground ml-auto size-4 shrink-0` — the chevron is full
        // foreground and the same 16px as a row's check, not a small muted
        // glyph. `Item`'s body already carries `flex: 1`, which is what pushes
        // it right; `ml-auto` needs no counterpart.
        trailing={
          <Chevron width={ROW_ICON_SIZE} height={ROW_ICON_SIZE} fill={theme.colors.text} />
        }
        onPress={() => sub.setOpen(!sub.open)}
        accessibilityLabel={accessibilityLabel}
        titleStyle={rowShapeStyles.rowText}
        style={[
          rowStyle,
          rowShapeStyles.subTrigger,
          inset ? rowShapeStyles.inset : null,
          style,
        ]}
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

  return { Sub: MenuSub, SubTrigger: MenuSubTrigger, SubContent: MenuSubContent };
}

const styles = StyleSheet.create({
  subContent: {
    paddingLeft: space.md,
  },
});
