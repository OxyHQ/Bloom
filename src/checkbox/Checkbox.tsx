import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius, space } from '../styles/tokens';
import type { CheckboxProps } from './types';

const SIZE_CONFIG = {
  small: { box: 18, checkmark: 10, fontSize: 14, lineHeight: 20, descFontSize: 12 },
  medium: { box: 22, checkmark: 12, fontSize: 15, lineHeight: 22, descFontSize: 13 },
  large: { box: 26, checkmark: 14, fontSize: 16, lineHeight: 24, descFontSize: 14 },
} as const;

const CheckboxComponent: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  size = 'medium',
  disabled = false,
  indeterminate = false,
  color,
  style,
  labelStyle,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const sizeConfig = SIZE_CONFIG[size];
  const checkColor = color ?? theme.colors.primary;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: checked || indeterminate ? 1 : 0,
      useNativeDriver: true,
      ...animation.spring.snappy,
    }).start();
  }, [checked, indeterminate, scaleAnim]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  }, [checked, disabled, onCheckedChange]);

  const onPressIn = useCallback(() => {
    Animated.spring(pressAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      ...animation.spring.snappy,
    }).start();
  }, [pressAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...animation.spring.gentle,
    }).start();
  }, [pressAnim]);

  const boxStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      width: sizeConfig.box,
      height: sizeConfig.box,
      borderRadius: borderRadius._2xs + 2,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (checked || indeterminate) {
      base.backgroundColor = checkColor;
      base.borderColor = checkColor;
    } else {
      base.backgroundColor = 'transparent';
      base.borderColor = theme.colors.border;
    }

    return base;
  }, [sizeConfig, checked, indeterminate, checkColor, theme]);

  // Checkmark using unicode characters for zero-dependency rendering
  const checkmarkContent = indeterminate ? '\u2014' : '\u2713';

  return (
    <Pressable
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: space.sm,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID={testID}
    >
      <Animated.View style={[boxStyle, { transform: [{ scale: pressAnim }] }]}>
        <Animated.View
          style={{
            opacity: scaleAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Text
            style={{
              fontSize: sizeConfig.checkmark,
              color: '#fff',
              fontWeight: '700',
              lineHeight: sizeConfig.checkmark + 2,
              textAlign: 'center',
            }}
          >
            {checkmarkContent}
          </Text>
        </Animated.View>
      </Animated.View>

      {(label || description) && (
        <View style={{ flex: 1, paddingTop: 1 }}>
          {label && (
            <Text
              style={[
                {
                  fontSize: sizeConfig.fontSize,
                  lineHeight: sizeConfig.lineHeight,
                  color: theme.colors.text,
                  fontWeight: '500',
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          )}
          {description && (
            <Text
              style={{
                fontSize: sizeConfig.descFontSize,
                color: theme.colors.textSecondary,
                lineHeight: sizeConfig.descFontSize + 6,
                marginTop: 2,
              }}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const Checkbox = memo(CheckboxComponent);
Checkbox.displayName = 'Checkbox';
