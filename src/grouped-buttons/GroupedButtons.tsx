import React, { Children, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { GroupedButtonsProps, GroupedButtonItemProps } from './types';

export type { GroupedButtonsProps, GroupedButtonItemProps } from './types';

// ── Item (defined first so it can be attached to GroupedButtons) ─

function ItemComponent({
  label,
  description,
  icon,
  onPress,
  destructive = false,
  disabled = false,
  testID,
}: GroupedButtonItemProps) {
  const theme = useTheme();
  const labelColor = destructive ? theme.colors.negative : theme.colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      testID={testID}
      style={[styles.item, disabled && styles.disabled]}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <View style={styles.textWrapper}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const Item = memo(ItemComponent);
Item.displayName = 'GroupedButtons.Item';

// ── GroupedButtons ───────────────────────────────────────────────

function GroupedButtonsComponent({ children, style }: GroupedButtonsProps) {
  const theme = useTheme();
  const childArray = Children.toArray(children);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.card },
        style,
      ]}
    >
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childArray.length - 1 && (
            <View
              style={[styles.divider, { backgroundColor: theme.colors.borderLight }]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const GroupedButtonsMemo = memo(GroupedButtonsComponent);
GroupedButtonsMemo.displayName = 'GroupedButtons';

export const GroupedButtons = Object.assign(GroupedButtonsMemo, { Item });

// ── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});
