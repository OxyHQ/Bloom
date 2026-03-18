import React, { cloneElement, Fragment, isValidElement, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Button } from '../button';
import * as Dialog from '../dialog';
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

export type { DialogControlProps as MenuControlProps } from '../dialog';
export { useDialogControl as useMenuControl } from '../dialog';
export { useMenuContext };

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogControlProps;
}>) {
  const defaultControl = Dialog.useDialogControl();
  const context = useMemo<MenuContextType>(
    () => ({
      control: control ?? defaultControl,
    }),
    [control, defaultControl],
  );

  return (
    <MenuContext.Provider value={context}>
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
  const context = useMenuContext();
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  return children({
    control: context.control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    props: {
      onPress: () => context.control.open(),
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
  showCancel,
}: React.PropsWithChildren<{
  showCancel?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const context = useMenuContext();

  return (
    <Dialog.Outer
      control={context.control}
      preventExpansion
    >
      <Dialog.Handle />
      <MenuContext.Provider value={context}>
        <Dialog.ScrollableInner label="Menu">
          <View style={styles.outerContent}>
            {children}
            {showCancel && <Cancel />}
          </View>
        </Dialog.ScrollableInner>
      </MenuContext.Provider>
    </Dialog.Outer>
  );
}

export function Item({ children, label, style, onPress, ...rest }: ItemProps) {
  const theme = useTheme();
  const context = useMenuContext();
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handlePress = useCallback(
    (e: import('react-native').GestureResponderEvent) => {
      context.control.close(() => {
        onPress(e);
      });
    },
    [context.control, onPress],
  );

  const isDisabled = Boolean(rest.disabled);
  const isHighlighted = (focused || pressed) && !isDisabled;

  const itemContextValue = useMemo(
    () => ({ disabled: isDisabled }),
    [isDisabled],
  );

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
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

export function ItemIcon({ icon: Comp, fill }: ItemIconProps) {
  const theme = useTheme();
  const { disabled } = useMenuItemContext();

  return (
    <Comp
      size="lg"
      fill={
        fill
          ? fill({ disabled })
          : disabled
            ? theme.colors.textTertiary
            : theme.colors.textSecondary
      }
    />
  );
}

export function Group({ children, style }: GroupProps) {
  const theme = useTheme();

  const childArray = React.Children.toArray(children).filter(isValidElement);

  return (
    <View
      style={[
        styles.group,
        { borderColor: theme.colors.borderLight },
        style,
      ]}
    >
      {childArray.map((child, i) => {
        if (child.type === Item) {
          return (
            <Fragment key={i}>
              {i > 0 && (
                <View
                  style={[
                    styles.groupDivider,
                    { borderBottomColor: theme.colors.borderLight },
                  ]}
                />
              )}
              {cloneElement(child, {
                style: {
                  borderRadius: 0,
                  borderWidth: 0,
                },
              } as Record<string, unknown>)}
            </Fragment>
          );
        }
        return null;
      })}
    </View>
  );
}

export function Divider() {
  return null;
}

function Cancel() {
  const context = useMenuContext();

  return (
    <Button
      accessibilityLabel="Close this menu"
      size="small"
      variant="ghost"
      onPress={() => context.control.close()}
    >
      Cancel
    </Button>
  );
}

const styles = StyleSheet.create({
  outerContent: {
    gap: 16,
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
  group: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  groupDivider: {
    borderBottomWidth: 1,
  },
});
