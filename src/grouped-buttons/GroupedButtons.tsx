import React, { Children } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type { GroupedButtonsProps, GroupedButtonItemProps } from './types';

export type { GroupedButtonsProps, GroupedButtonItemProps } from './types';

export function GroupedButtons({ children, style }: GroupedButtonsProps) {
  const theme = useTheme();
  const childArray = Children.toArray(children);

  return (
    <View
      style={[
        {
          borderRadius: 12,
          backgroundColor: theme.colors.card,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < childArray.length - 1 && (
            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.borderLight,
                marginLeft: 16,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export function Item({
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon && (
        <View style={{ marginRight: 12 }}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: labelColor }}>
          {label}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: 13,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

GroupedButtons.Item = Item;
