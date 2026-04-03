import React, { useCallback, useMemo, useRef, memo } from 'react';
import { Pressable, Text, Platform, Animated, type ViewStyle, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import type { ButtonProps } from './types';

export type { ButtonProps, ButtonVariant, ButtonSize } from './types';

const SIZE_CONFIG = {
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    minHeight: 32,
  },
  medium: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    minHeight: 40,
  },
  large: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    minHeight: 48,
  },
} as const;

const ICON_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

const PRESS_SCALE = 0.97;
const SCALE_VARIANTS = new Set<string>(['primary', 'secondary', 'inverse']);

const ButtonComponent: React.FC<ButtonProps> = ({
  onPress,
  children,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
  accessibilityHint,
  hitSlop,
  activeOpacity,
  testID,
  className,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hasScaleFeedback = SCALE_VARIANTS.has(variant);

  const onPressIn = useCallback(() => {
    if (!hasScaleFeedback) return;
    Animated.spring(scaleAnim, {
      toValue: PRESS_SCALE,
      useNativeDriver: true,
      ...animation.spring.snappy,
    }).start();
  }, [scaleAnim, hasScaleFeedback]);

  const onPressOut = useCallback(() => {
    if (!hasScaleFeedback) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...animation.spring.gentle,
    }).start();
  }, [scaleAnim, hasScaleFeedback]);

  const baseStyles = useMemo((): ViewStyle => {
    const sizeConfig = SIZE_CONFIG[size];
    const styles: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
    };

    if (variant !== 'icon') {
      styles.paddingVertical = sizeConfig.paddingVertical;
      styles.paddingHorizontal = sizeConfig.paddingHorizontal;
      styles.minHeight = sizeConfig.minHeight;
    }

    switch (variant) {
      case 'primary':
        styles.backgroundColor = theme.colors.primary;
        styles.borderRadius = 20;
        break;
      case 'secondary':
        styles.backgroundColor = 'transparent';
        styles.borderWidth = 1;
        styles.borderColor = theme.colors.border;
        styles.borderRadius = 20;
        break;
      case 'inverse':
        styles.backgroundColor = '#FFFFFF';
        styles.borderRadius = 20;
        break;
      case 'icon':
        styles.borderRadius = 100;
        styles.padding = 8;
        styles.width = sizeConfig.minHeight;
        styles.height = sizeConfig.minHeight;
        break;
      case 'ghost':
        styles.backgroundColor = 'transparent';
        styles.borderRadius = 8;
        break;
      case 'text':
        styles.backgroundColor = 'transparent';
        styles.paddingVertical = 4;
        styles.paddingHorizontal = 8;
        break;
    }

    return styles;
  }, [variant, size, theme]);

  const computedTextStyle = useMemo((): TextStyle => {
    const sizeConfig = SIZE_CONFIG[size];
    const styles: TextStyle = {
      fontSize: sizeConfig.fontSize,
      fontWeight: Platform.OS === 'web' ? 'bold' : '600',
    };

    switch (variant) {
      case 'primary':
        styles.color = theme.colors.card;
        break;
      case 'secondary':
        styles.color = theme.colors.text;
        break;
      case 'inverse':
        styles.color = '#000000';
        break;
      case 'ghost':
      case 'text':
        styles.color = theme.colors.primary;
        break;
    }

    return styles;
  }, [variant, size, theme]);

  const defaultHitSlop = variant === 'icon' ? ICON_HIT_SLOP : undefined;
  const resolvedActiveOpacity = activeOpacity ?? (variant === 'icon' ? 0.7 : 0.8);
  const resolvedClassName = className ?? (variant === 'icon' ? 'bg-background border border-border' : undefined);

  return (
    <Animated.View style={hasScaleFeedback ? { transform: [{ scale: scaleAnim }] } : undefined}>
      <Pressable
        {...(resolvedClassName ? { className: resolvedClassName } as any : {})}
        style={({ pressed }) => [
          baseStyles,
          disabled && { opacity: 0.5 },
          pressed && !hasScaleFeedback && { opacity: resolvedActiveOpacity },
          style,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        hitSlop={hitSlop ?? defaultHitSlop}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        testID={testID}
      >
        {iconPosition === 'left' && icon}
        {children != null && (
          <Text style={[computedTextStyle, textStyle]}>{children}</Text>
        )}
        {iconPosition === 'right' && icon}
      </Pressable>
    </Animated.View>
  );
};

export const Button = memo(ButtonComponent);
Button.displayName = 'Button';

export const PrimaryButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="primary" />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="secondary" />
));
SecondaryButton.displayName = 'SecondaryButton';

export const IconButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="icon" />
));
IconButton.displayName = 'IconButton';

export const GhostButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="ghost" />
));
GhostButton.displayName = 'GhostButton';

export const InverseButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="inverse" />
));
InverseButton.displayName = 'InverseButton';

export const TextButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="text" />
));
TextButton.displayName = 'TextButton';
