import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/useInteractionState';
import { Text } from '../typography';
import { borderRadius, fontSize, space } from '../styles/tokens';
import type { ItemProps } from './types';

const DENSITY = {
  comfortable: { paddingVertical: 10, minHeight: 44 },
  compact: { paddingVertical: 6, minHeight: 36 },
} as const;

/**
 * A generic list row — the building block shared by settings lists, menus,
 * combobox/command option lists, etc. Leading + trailing slots flank a
 * title/subtitle text column (or arbitrary `children`). Pressable when an
 * `onPress` is supplied; otherwise a static container.
 */
const ItemComponent = function Item({
  title,
  subtitle,
  children,
  leading,
  trailing,
  onPress,
  onLongPress,
  disabled = false,
  destructive = false,
  selected = false,
  active = false,
  density = 'comfortable',
  style,
  titleStyle,
  subtitleStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  role,
  testID,
}: ItemProps) {
  const theme = useTheme();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } =
    useInteractionState();

  const titleColor = destructive ? theme.colors.error : theme.colors.text;
  const cfg = DENSITY[density];

  const containerStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingHorizontal: space.lg,
      paddingVertical: cfg.paddingVertical,
      minHeight: cfg.minHeight,
      borderRadius: borderRadius.sm,
    };
    if (selected || active) {
      base.backgroundColor = active
        ? theme.colors.primaryLight
        : theme.colors.backgroundSecondary;
    }
    return base;
  }, [cfg, selected, active, theme]);

  const body =
    children != null ? (
      children
    ) : (
      <View style={styles.textColumn}>
        {title != null ? (
          typeof title === 'string' ? (
            <Text
              numberOfLines={1}
              style={[styles.title, { color: titleColor }, titleStyle]}>
              {title}
            </Text>
          ) : (
            title
          )
        ) : null}
        {subtitle != null ? (
          typeof subtitle === 'string' ? (
            <Text
              numberOfLines={2}
              style={[
                styles.subtitle,
                { color: theme.colors.textSecondary },
                subtitleStyle,
              ]}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )
        ) : null}
      </View>
    );

  const content = (
    <View style={[containerStyle, style]} testID={testID}>
      {leading != null ? <View style={styles.slot}>{leading}</View> : null}
      {body}
      {trailing != null ? <View style={styles.slot}>{trailing}</View> : null}
    </View>
  );

  if (onPress || onLongPress) {
    const resolvedRole = accessibilityRole ?? 'button';
    const handlePress = disabled || !onPress ? undefined : onPress;
    const handleLongPress = disabled || !onLongPress ? undefined : onLongPress;
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        disabled={disabled}
        android_ripple={{ color: theme.colors.border }}
        accessibilityRole={resolvedRole}
        {...(role ? { role } : {})}
        accessibilityLabel={
          accessibilityLabel ?? (typeof title === 'string' ? title : undefined)
        }
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, selected }}
        style={[
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole={accessibilityRole ?? 'none'}
      {...(role ? { role } : {})}
      accessibilityLabel={
        accessibilityLabel ?? (typeof title === 'string' ? title : undefined)
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={disabled ? { disabled: true } : undefined}
      style={disabled ? styles.disabled : undefined}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '500',
    lineHeight: fontSize.md * 1.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.3,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
});

export const Item = memo(ItemComponent);
Item.displayName = 'Item';
