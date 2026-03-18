/**
 * ContextMenu — Native implementation
 *
 * Opens a bottom-sheet menu via Bloom's Dialog when the user long-presses
 * the trigger.  The menu body is rendered through Bloom's Menu component
 * pattern using Dialog.Outer / Dialog.ScrollableInner.
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
import * as Dialog from '../dialog';
import { useInteractionState } from '../hooks/useInteractionState';
import type {
  ContextMenuContextValue,
  GroupProps,
  ItemContextValue,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
  OuterProps,
  TriggerProps,
} from './types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ContextMenuContext = createContext<
  (ContextMenuContextValue & { control: Dialog.DialogControlProps }) | null
>(null);
ContextMenuContext.displayName = 'ContextMenuContext';

const ItemCtx = createContext<ItemContextValue | null>(null);
ItemCtx.displayName = 'ContextMenuItemContext';

function useContextMenuContext() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error(
      'ContextMenu components must be used within a ContextMenu.Root',
    );
  }
  return ctx;
}

function useItemContext(): ItemContextValue {
  const ctx = useContext(ItemCtx);
  if (!ctx) {
    throw new Error(
      'ContextMenu.ItemText/ItemIcon must be used within a ContextMenu.Item',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function Root({ children }: { children: React.ReactNode }) {
  const control = Dialog.useDialogControl();

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
    <ContextMenuContext.Provider value={ctx}>
      {children}
    </ContextMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export function Trigger({ children, label, hint, style }: TriggerProps) {
  const { open } = useContextMenuContext();
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
// Outer  (the menu container — uses Bloom Dialog as a bottom sheet)
// ---------------------------------------------------------------------------

export function Outer({ children, style }: OuterProps) {
  const { control } = useContextMenuContext();

  return (
    <Dialog.Outer control={control} preventExpansion>
      <Dialog.Handle />
      <ContextMenuContext.Provider
        value={{
          isOpen: true,
          open: () => control.open(),
          close: () => control.close(),
          control,
        }}
      >
        <Dialog.ScrollableInner label="Context menu">
          <View style={[styles.outerContent, style]}>{children}</View>
        </Dialog.ScrollableInner>
      </ContextMenuContext.Provider>
    </Dialog.Outer>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export function Item({
  children,
  label,
  onPress,
  disabled = false,
  style,
}: ItemProps) {
  const theme = useTheme();
  const { close } = useContextMenuContext();
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
// ItemText
// ---------------------------------------------------------------------------

export function ItemText({ children, style }: ItemTextProps) {
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
// ItemIcon
// ---------------------------------------------------------------------------

export function ItemIcon({ icon: Comp }: ItemIconProps) {
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
// Group
// ---------------------------------------------------------------------------

export function Group({ children, style }: GroupProps) {
  return <View style={style}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export function Divider() {
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
