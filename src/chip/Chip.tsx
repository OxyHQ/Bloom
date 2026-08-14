import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, Animated, type ViewStyle, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import { usePressAnimation } from '../hooks/use-press-animation';
import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '../icons/Times';
import type { ChipProps } from './types';

/**
 * `closeIcon` is a rung of the icon scale rather than a pixel height: the close
 * affordance is an `Icons` glyph, and those take `size` from the shared scale
 * (`sm` = 16, `md` = 20).
 */
const SIZE_CONFIG = {
  small: { height: 24, fontSize: 12, paddingHorizontal: 8, iconGap: 4, closeIcon: 'sm' },
  medium: { height: 32, fontSize: 14, paddingHorizontal: 12, iconGap: 6, closeIcon: 'sm' },
  large: { height: 40, fontSize: 16, paddingHorizontal: 16, iconGap: 8, closeIcon: 'md' },
} as const;

const PRESS_SCALE = 0.95;

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
  // Selection promotes the chip to the brand tone \u2014 the filter-pill behaviour \u2014
  // rather than to a second colour system of its own.
  const colors = resolveAccentColors(theme.colors, selected ? 'primary' : color, variant);
  const sizeConfig = SIZE_CONFIG[size];

  const containerStyle = useMemo((): ViewStyle => ({
    height: sizeConfig.height,
    borderRadius: sizeConfig.height / 2,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    backgroundColor: colors.background,
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
    color: colors.foreground,
  }), [sizeConfig, colors]);

  const closeButton = onClose ? (
    <Pressable
      onPress={onClose}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityLabel="Remove"
      accessibilityRole="button"
    >
      <TimesIcon size={sizeConfig.closeIcon} fill={colors.foreground} />
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
          // Both spellings, because neither platform reads the other's and
          // there is no single prop that serves both here: react-native-web
          // ignores `accessibilityState`, while React Native has no
          // `aria-pressed` at all (its `AccessibilityState` is
          // disabled/selected/checked/busy/expanded). `aria-pressed` is also
          // the state ARIA defines for a toggle with `role="button"` —
          // `aria-selected` would be invalid on that role.
          accessibilityState={{ disabled, selected }}
          aria-pressed={selected}
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
