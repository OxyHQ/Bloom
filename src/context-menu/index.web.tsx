/**
 * ContextMenu — Web implementation
 *
 * Opens a positioned dropdown menu on right-click (contextmenu event).
 * Uses Bloom's Portal for rendering the menu above other content.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Portal } from '../portal';
import { useInteractionState } from '../hooks/useInteractionState';
import { ItemCtx, useItemContext } from './context';
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
// Web-specific context (extends base with position)
// ---------------------------------------------------------------------------

type Position = { x: number; y: number };

type WebContextMenuContextValue = ContextMenuContextValue & {
  position: Position | null;
};

const WebContextMenuContext = createContext<WebContextMenuContextValue | null>(null);
WebContextMenuContext.displayName = 'WebContextMenuContext';

function useWebContextMenuContext(): WebContextMenuContextValue {
  const ctx = useContext(WebContextMenuContext);
  if (!ctx) {
    throw new Error(
      'ContextMenu components must be used within a ContextMenu.Root',
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function Root({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null);
  const isOpen = position !== null;

  const ctx = useMemo<WebContextMenuContextValue>(
    () => ({
      isOpen,
      position,
      open: () => {
        /* open is handled by the Trigger's contextmenu event */
      },
      close: () => setPosition(null),
    }),
    [isOpen, position],
  );

  /**
   * We store the setPosition in a ref so the Trigger can call it
   * without needing a stable identity on `open`.
   */
  return (
    <WebContextMenuContext.Provider value={ctx}>
      <SetPositionContext.Provider value={setPosition}>
        {children}
      </SetPositionContext.Provider>
    </WebContextMenuContext.Provider>
  );
}

const SetPositionContext = createContext<
  React.Dispatch<React.SetStateAction<Position | null>>
>(() => {});
SetPositionContext.displayName = 'ContextMenuSetPositionContext';

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export function Trigger({ children, label, hint, style }: TriggerProps) {
  const ctx = useWebContextMenuContext();
  const setPosition = useContext(SetPositionContext);
  const triggerRef = useRef<View>(null);

  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
    },
    [setPosition],
  );

  useEffect(() => {
    const node = triggerRef.current;
    if (!node) return;
    // On web, View refs resolve to DOM elements
    const element = node as unknown as HTMLElement;
    element.addEventListener('contextmenu', handleContextMenu);
    return () => {
      element.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleContextMenu]);

  return (
    <View ref={triggerRef} style={style}>
      {children({
        isOpen: ctx.isOpen,
        state: {
          hovered: false,
          focused: false,
          pressed: false,
        },
        props: {
          onPress: null,
          onLongPress: null,
          onFocus: null,
          onBlur: null,
          accessibilityLabel: label,
          accessibilityHint: hint ?? 'Right-click to open context menu',
        },
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Outer
// ---------------------------------------------------------------------------

export function Outer({ children, style }: OuterProps) {
  const ctx = useWebContextMenuContext();
  const theme = useTheme();
  const { isOpen, close, position } = ctx;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen || !position) return null;

  return (
    <Portal>
      <Pressable
        style={styles.backdrop}
        onPress={close}
        accessibilityLabel="Close context menu"
      />
      <View
        style={[
          styles.dropdown,
          {
            top: position.y,
            left: position.x,
            backgroundColor: theme.isDark
              ? theme.colors.backgroundSecondary
              : theme.colors.background,
            borderColor: theme.colors.borderLight,
            shadowColor: theme.colors.shadow,
          },
          style,
        ]}
      >
        {children}
      </View>
    </Portal>
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
  const ctx = useWebContextMenuContext();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const isHighlighted = (hovered || focused) && !disabled;

  const handlePress = useCallback(() => {
    onPress();
    ctx.close();
  }, [onPress, ctx]);

  const itemCtx = useMemo<ItemContextValue>(
    () => ({ disabled }),
    [disabled],
  );

  return (
    <Pressable
      accessibilityHint=""
      accessibilityLabel={label}
      disabled={disabled}
      onPress={handlePress}
      onFocus={onFocus}
      onBlur={onBlur}
      {...({
        onMouseEnter,
        onMouseLeave,
      } as Record<string, () => void>)}
      style={[
        styles.item,
        isHighlighted && {
          backgroundColor: theme.isDark
            ? theme.colors.contrast50
            : theme.colors.backgroundSecondary,
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
      numberOfLines={1}
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
      size="md"
      fill={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
    />
  );
}

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export function Group({ children }: GroupProps) {
  return <>{children}</>;
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
        { backgroundColor: theme.colors.borderLight },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  dropdown: {
    position: 'fixed' as 'absolute',
    zIndex: 60,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    minWidth: 180,
    maxWidth: 280,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 10,
    minHeight: 32,
  },
  itemText: {
    flex: 1,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
