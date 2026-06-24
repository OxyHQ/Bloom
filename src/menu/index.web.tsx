import React, {
  cloneElement,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { DialogControlProps } from '../dialog/types';
import { Portal } from '../portal/index.web';
import { createDropdownZIndex } from '../styles/z-index';
import {
  MenuContext,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from './context';
import type {
  MenuContextType,
  MenuGroupProps,
  MenuItemIconProps,
  MenuItemProps,
  MenuItemTextProps,
  MenuTriggerProps,
} from './types';

export { useMenuContext };

const menuZIndex = createDropdownZIndex();
const VIEWPORT_GUTTER = 8;
const MENU_OFFSET = 6;

export type MenuControlProps = {
  id: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export function useMenuControl(): MenuControlProps {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);

  return useMemo(
    () => ({
      id,
      isOpen,
      open() {
        setIsOpen(true);
      },
      close() {
        setIsOpen(false);
      },
    }),
    [id, isOpen],
  );
}

/**
 * Adapter that wraps MenuControlProps to satisfy the DialogControlProps
 * interface required by MenuContextType. This avoids using type suppressions
 * by providing a real ref object.
 */
function useMenuControlAsDialogControl(
  menuControl: MenuControlProps,
): DialogControlProps {
  const ref = useRef<{ open: () => void; close: (cb?: () => void) => void } | null>(null);

  return useMemo<DialogControlProps>(() => {
    const dialogControl: DialogControlProps = {
      id: menuControl.id,
      ref,
      open() {
        menuControl.open();
      },
      close(cb?: () => void) {
        menuControl.close();
        if (typeof cb === 'function') {
          cb();
        }
      },
    };
    return dialogControl;
  }, [menuControl]);
}

export function Menu({
  children,
  control,
}: React.PropsWithChildren<{
  control?: MenuControlProps;
}>) {
  const defaultControl = useMenuControl();
  const activeControl = control ?? defaultControl;
  const dialogControl = useMenuControlAsDialogControl(activeControl);
  const rootRef = useRef<View>(null);
  const triggerRef = useRef<unknown>(null);
  const dropdownRef = useRef<unknown>(null);

  const context = useMemo<MenuContextType>(
    () => ({
      control: dialogControl,
      isOpen: activeControl.isOpen,
      triggerRef,
      dropdownRef,
    }),
    [activeControl.isOpen, dialogControl],
  );

  useEffect(() => {
    if (!activeControl.isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const rootNode = rootRef.current as unknown as HTMLElement | null;
      const dropdownNode = dropdownRef.current as HTMLElement | null;
      const eventTarget = event.target as Node;
      if (rootNode?.contains(eventTarget) || dropdownNode?.contains(eventTarget)) {
        return;
      }
      activeControl.close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        activeControl.close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeControl]);

  return (
    <MenuContext.Provider value={context}>
      <View
        ref={rootRef}
        style={[styles.root, activeControl.isOpen && styles.openRoot]}
      >
        {children}
      </View>
    </MenuContext.Provider>
  );
}

export function MenuTrigger({
  children,
  label,
  role = 'button',
  hint,
}: MenuTriggerProps) {
  const { control, triggerRef } = useMenuContext();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return children({
    control,
    state: {
      hovered,
      focused,
      pressed: false,
    },
    props: {
      ref: triggerRef,
      onPress: () => control.open(),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      accessibilityHint: hint,
      accessibilityLabel: label,
      accessibilityRole: role,
    },
  });
}

export function MenuContent({
  children,
  style,
}: React.PropsWithChildren<{
  showCancel?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const theme = useTheme();
  const context = useMenuContext();
  const [position, setPosition] = useState<ViewStyle | null>(null);

  useLayoutEffect(() => {
    if (!context.isOpen || typeof window === 'undefined') {
      return;
    }

    const triggerNode = context.triggerRef?.current as HTMLElement | null;
    if (!triggerNode?.getBoundingClientRect) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerNode.getBoundingClientRect();
      const width = Math.max(180, rect.width);
      const availableRight = window.innerWidth - VIEWPORT_GUTTER;
      const left = Math.min(
        Math.max(VIEWPORT_GUTTER, rect.right - width),
        Math.max(VIEWPORT_GUTTER, availableRight - width),
      );
      const top = Math.min(
        rect.bottom + MENU_OFFSET,
        Math.max(VIEWPORT_GUTTER, window.innerHeight - VIEWPORT_GUTTER),
      );

      setPosition({
        position: 'fixed' as 'absolute',
        top,
        left,
        right: undefined,
        bottom: undefined,
        minWidth: width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [context.isOpen, context.triggerRef]);

  if (!context.isOpen) {
    return null;
  }

  return (
    <Portal>
      <View
        ref={context.dropdownRef as React.Ref<View>}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme.isDark
              ? theme.colors.backgroundSecondary
              : theme.colors.background,
            borderColor: theme.colors.borderLight,
            shadowColor: theme.colors.shadow,
          },
          style,
          styles.portaledDropdown,
          position,
        ]}
      >
        {children}
      </View>
    </Portal>
  );
}

export function MenuItem({ children, label, onPress, style, ...rest }: MenuItemProps) {
  const theme = useTheme();
  const { control } = useMenuContext();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const handlePress = useCallback(
    (e: import('react-native').GestureResponderEvent) => {
      onPress(e);
      if (!e.defaultPrevented) {
        control.close();
      }
    },
    [control, onPress],
  );

  const isDisabled = Boolean(rest.disabled);
  const isHighlighted = (hovered || focused) && !isDisabled;

  const itemContextValue = useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onPress={handlePress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as Record<string, () => void>)}
      style={[
        styles.webItem,
        isHighlighted && {
          backgroundColor: theme.isDark
            ? theme.colors.contrast50
            : theme.colors.backgroundSecondary,
        },
        style,
      ]}
    >
      <ItemContext.Provider value={itemContextValue}>
        {children}
      </ItemContext.Provider>
    </Pressable>
  );
}

export function MenuItemText({ children, style }: MenuItemTextProps) {
  const theme = useTheme();
  const { disabled } = useMenuItemContext();

  return (
    <Text
      style={[
        styles.webItemText,
        { color: disabled ? theme.colors.textTertiary : theme.colors.text },
        ...(style ? [style] : []),
      ]}
    >
      {children}
    </Text>
  );
}

export function MenuItemIcon({ icon: Comp, position = 'left', fill }: MenuItemIconProps) {
  const theme = useTheme();
  const { disabled } = useMenuItemContext();

  return (
    <View
      style={[
        position === 'left' && styles.iconLeft,
        position === 'right' && styles.iconRight,
      ]}
    >
      <Comp
        size="md"
        fill={
          fill
            ? fill({ disabled })
            : disabled
              ? theme.colors.textTertiary
              : theme.colors.textSecondary
        }
      />
    </View>
  );
}

export function MenuGroup({ children }: MenuGroupProps) {
  return <>{children}</>;
}

export function MenuDivider() {
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

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  openRoot: {
    zIndex: menuZIndex.root,
  },
  dropdown: {
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: menuZIndex.surface,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    minWidth: 180,
  },
  portaledDropdown: {
    pointerEvents: 'auto',
  },
  webItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 10,
    minHeight: 32,
  },
  webItemText: {
    flex: 1,
    fontWeight: '600',
  },
  iconLeft: {
    marginLeft: -2,
  },
  iconRight: {
    marginRight: -2,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
