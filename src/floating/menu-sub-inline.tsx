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

import { useControllableState } from '../hooks/use-controllable-state';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '../icons/Chevron';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { ROW_ICON_SIZE } from './constants';
import { MenuSubProvider, useMenuSub } from './context';
import { cx, MenuRowChevron, MenuRowShell, splitChildren, SUB_TRIGGER_CLASS } from './shared';
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
    className,
    style,
    testID,
  }: MenuSubTriggerProps) {
    const theme = useTheme();
    const sub = useMenuSub();
    const { title, body } = splitChildren(children);
    // Down when closed, up when open: the disclosure states an INLINE
    // relationship, which is what the native presentation is.
    const Chevron = sub.open ? ChevronTopIcon : ChevronBottomIcon;

    return (
      <MenuRowShell
        role="menuitem"
        expanded={sub.open}
        disabled={disabled}
        inset={inset}
        leading={leading}
        // `size-4 shrink-0 ms-auto text-fg-secondary` — the same 16px glyph as a
        // row's check, one step back in colour, exactly as the flyout's.
        trailing={
          <MenuRowChevron>
            <Chevron
              width={ROW_ICON_SIZE}
              height={ROW_ICON_SIZE}
              fill={theme.colors.textSecondary}
            />
          </MenuRowChevron>
        }
        title={title}
        onPress={() => sub.setOpen(!sub.open)}
        accessibilityLabel={accessibilityLabel}
        className={cx(SUB_TRIGGER_CLASS, className)}
        style={style}
        testID={testID}>
        {body}
      </MenuRowShell>
    );
  }
  MenuSubTrigger.displayName = `${prefix}SubTrigger`;

  function MenuSubContent({ children, className, style }: MenuSubContentProps) {
    const sub = useMenuSub();
    if (!sub.open) return null;
    // Indented under its trigger, which is the whole visual statement an inline
    // disclosure makes.
    return (
      <StyledView className={cx('pl-space-16', className)} style={style}>
        {children}
      </StyledView>
    );
  }
  MenuSubContent.displayName = `${prefix}SubContent`;

  return { Sub: MenuSub, SubTrigger: MenuSubTrigger, SubContent: MenuSubContent };
}
