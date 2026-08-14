/**
 * ContextMenu — Native implementation
 *
 * Opens a bottom-sheet menu when the user long-presses the trigger. The
 * menu body uses bloom's internal `SheetShell` (a `BottomSheet`
 * presentation primitive with the same drag-handle + close-on-tap
 * semantics shared by `Menu` and `Select`).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useDialogControl } from '../dialog/context';
import { SheetShell } from '../dialog/SheetShell';
import type { DialogControlProps } from '../dialog/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import { ItemCtx, useItemContext } from './context';
import type {
  ContextMenuContextValue,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuItemIconProps,
  ContextMenuItemProps,
  ContextMenuItemTextProps,
  ContextMenuTriggerProps,
  ItemContextValue,
} from './types';

// ---------------------------------------------------------------------------
// Native-specific context (extends base with Dialog control)
// ---------------------------------------------------------------------------

type NativeContextMenuContextValue = ContextMenuContextValue & {
  control: DialogControlProps;
};

const NativeContextMenuContext = createContext<NativeContextMenuContextValue | null>(null);
NativeContextMenuContext.displayName = 'NativeContextMenuContext';

function useNativeContextMenuContext(): NativeContextMenuContextValue {
  const ctx = useContext(NativeContextMenuContext);
  if (!ctx) {
    throw new Error(
      'ContextMenu components must be used within a <ContextMenu>',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// ContextMenu (Root)
// ---------------------------------------------------------------------------

export function ContextMenu({ children }: { children: React.ReactNode }) {
  const control = useDialogControl();

  const ctx = useMemo(
    () => ({
      isOpen: false,
      open: () => control.open(),
      close: () => control.close(),
      control,
    }),
    [control],
  );

  return (
    <NativeContextMenuContext.Provider value={ctx}>
      {children}
    </NativeContextMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuTrigger
// ---------------------------------------------------------------------------

export function ContextMenuTrigger({ children, label, hint, style }: ContextMenuTriggerProps) {
  const { open } = useNativeContextMenuContext();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  return (
    <View style={style}>
      {children({
        isOpen: false,
        state: {
          hovered: false,
          focused,
          pressed: false,
        },
        props: {
          onPress: null,
          onLongPress: open,
          onFocus,
          onBlur,
          accessibilityLabel: label,
          accessibilityHint: hint ?? 'Long press to open context menu',
        },
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuContent  (the menu container — uses Bloom Dialog as a bottom sheet)
// ---------------------------------------------------------------------------

export function ContextMenuContent({ children, style }: ContextMenuContentProps) {
  const { control } = useNativeContextMenuContext();

  return (
    <SheetShell control={control} label="Context menu">
      <NativeContextMenuContext.Provider
        value={{
          isOpen: true,
          open: () => control.open(),
          close: () => control.close(),
          control,
        }}
      >
        <View style={[styles.outerContent, style]}>{children}</View>
      </NativeContextMenuContext.Provider>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuItem
// ---------------------------------------------------------------------------

export function ContextMenuItem({
  children,
  label,
  onPress,
  disabled = false,
  style,
}: ContextMenuItemProps) {
  const theme = useTheme();
  const { close } = useNativeContextMenuContext();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState();

  const isHighlighted = (focused || pressed) && !disabled;

  const handlePress = useCallback(() => {
    close();
    onPress();
  }, [close, onPress]);

  const itemCtx = useMemo<ItemContextValue>(
    () => ({ disabled }),
    [disabled],
  );

  return (
    <Pressable
      accessibilityHint=""
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.item,
        {
          backgroundColor: theme.colors.contrast50,
          borderColor: theme.colors.borderLight,
        },
        isHighlighted && {
          backgroundColor: theme.colors.backgroundSecondary,
        },
        style,
      ]}
    >
      <ItemCtx.Provider value={itemCtx}>{children}</ItemCtx.Provider>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuItemText
// ---------------------------------------------------------------------------

export function ContextMenuItemText({ children, style }: ContextMenuItemTextProps) {
  const theme = useTheme();
  const { disabled } = useItemContext();

  return (
    <Text
      numberOfLines={2}
      ellipsizeMode="middle"
      style={[
        styles.itemText,
        { color: disabled ? theme.colors.textTertiary : theme.colors.text },
        ...(style ? [style] : []),
      ]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// ContextMenuItemIcon
// ---------------------------------------------------------------------------

export function ContextMenuItemIcon({ icon: Comp }: ContextMenuItemIconProps) {
  const theme = useTheme();
  const { disabled } = useItemContext();

  return (
    <Comp
      size="lg"
      fill={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
    />
  );
}

// ---------------------------------------------------------------------------
// ContextMenuGroup
// ---------------------------------------------------------------------------

export function ContextMenuGroup({ children, style }: ContextMenuGroupProps) {
  return <View style={style}>{children}</View>;
}

// ---------------------------------------------------------------------------
// ContextMenuDivider
// ---------------------------------------------------------------------------

export function ContextMenuDivider() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.divider,
        { borderTopColor: theme.colors.borderLight },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  outerContent: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 44,
    paddingVertical: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
