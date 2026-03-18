import React, {
  cloneElement,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Portal } from '../portal';
import type { DialogControlProps } from '../dialog/types';
import {
  MenuContext,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from './context';
import type {
  MenuContextType,
  GroupProps,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
  TriggerProps,
} from './types';

export { useMenuContext };

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

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: MenuControlProps;
}>) {
  const defaultControl = useMenuControl();
  const activeControl = control ?? defaultControl;
  const dialogControl = useMenuControlAsDialogControl(activeControl);

  const context = useMemo<MenuContextType>(
    () => ({ control: dialogControl }),
    [dialogControl],
  );

  return (
    <MenuContext.Provider value={context}>
      {activeControl.isOpen && (
        <Portal>
          <Pressable
            style={styles.backdrop}
            onPress={() => activeControl.close()}
            accessibilityHint=""
            accessibilityLabel="Close menu"
          />
        </Portal>
      )}
      {children}
    </MenuContext.Provider>
  );
}

export function Trigger({
  children,
  label,
  role = 'button',
  hint,
}: TriggerProps) {
  const { control } = useMenuContext();
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
      onPress: () => control.open(),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      accessibilityHint: hint,
      accessibilityLabel: label,
      accessibilityRole: role,
    },
  });
}

export function Outer({
  children,
  style,
}: React.PropsWithChildren<{
  showCancel?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const theme = useTheme();
  const dropdownRef = useRef<View>(null);

  return (
    <View
      ref={dropdownRef}
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
      ]}
    >
      {children}
    </View>
  );
}

export function Item({ children, label, onPress, style, ...rest }: ItemProps) {
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

export function ItemText({ children, style }: ItemTextProps) {
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

export function ItemIcon({ icon: Comp, position = 'left', fill }: ItemIconProps) {
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

export function Group({ children }: GroupProps) {
  return <>{children}</>;
}

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
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    minWidth: 180,
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
