import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, Animated, type ViewStyle, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePressAnimation } from '../hooks/usePressAnimation';
import type { ChipProps, ChipColor, ChipVariant } from './types';

const SIZE_CONFIG = {
  small: { height: 24, fontSize: 12, paddingHorizontal: 8, iconGap: 4, iconSize: 14 },
  medium: { height: 32, fontSize: 14, paddingHorizontal: 12, iconGap: 6, iconSize: 16 },
  large: { height: 40, fontSize: 16, paddingHorizontal: 16, iconGap: 8, iconSize: 18 },
} as const;

const PRESS_SCALE = 0.95;

function useChipColors(
  color: ChipColor,
  variant: ChipVariant,
  selected: boolean,
  theme: ReturnType<typeof useTheme>,
): { bg: string; fg: string; border: string } {
  const colorMap: Record<ChipColor, string> = {
    default: theme.colors.textSecondary,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  const base = selected ? theme.colors.primary : colorMap[color];

  switch (variant) {
    case 'solid':
      return { bg: base, fg: '#fff', border: base };
    case 'outlined':
      return { bg: 'transparent', fg: base, border: base };
    case 'soft':
      return { bg: base + '18', fg: base, border: 'transparent' };
  }
}

const ChipComponent: React.FC<ChipProps> = ({
  children,
  variant = 'outlined',
  color = 'default',
  size = 'medium',
  startIcon,
  endIcon,
  onPress,
  onClose,
  selected = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(PRESS_SCALE);
  const colors = useChipColors(color, variant, selected, theme);
  const sizeConfig = SIZE_CONFIG[size];

  const containerStyle = useMemo((): ViewStyle => ({
    height: sizeConfig.height,
    borderRadius: sizeConfig.height / 2,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    backgroundColor: colors.bg,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeConfig.iconGap,
    alignSelf: 'flex-start',
  }), [sizeConfig, colors, variant]);

  const labelStyle = useMemo((): TextStyle => ({
    fontSize: sizeConfig.fontSize,
    fontWeight: '500',
    color: colors.fg,
  }), [sizeConfig, colors]);

  const closeButton = onClose ? (
    <Pressable
      onPress={onClose}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel="Remove"
      accessibilityRole="button"
    >
      <Text style={{ fontSize: sizeConfig.iconSize, color: colors.fg, lineHeight: sizeConfig.iconSize }}>
        {'\u00D7'}
      </Text>
    </Pressable>
  ) : null;

  const content = (
    <>
      {startIcon}
      {typeof children === 'string' ? (
        <Text style={[labelStyle, textStyle]}>{children}</Text>
      ) : (
        children
      )}
      {endIcon}
      {closeButton}
    </>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[containerStyle, disabled && { opacity: 0.5 }, style]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled, selected }}
          testID={testID}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View
      style={[containerStyle, disabled && { opacity: 0.5 }, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {content}
    </View>
  );
};

export const Chip = memo(ChipComponent);
Chip.displayName = 'Chip';
