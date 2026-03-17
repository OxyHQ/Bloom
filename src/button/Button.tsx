import React, { useMemo, memo } from 'react';
import { TouchableOpacity, Text, Platform, type ViewStyle, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
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
}) => {
  const theme = useTheme();

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
      case 'icon':
        styles.backgroundColor = theme.colors.background;
        styles.borderWidth = 1;
        styles.borderColor = theme.colors.border;
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
      case 'ghost':
      case 'text':
        styles.color = theme.colors.primary;
        break;
    }

    return styles;
  }, [variant, size, theme]);

  const defaultHitSlop = variant === 'icon' ? ICON_HIT_SLOP : undefined;

  return (
    <TouchableOpacity
      style={[baseStyles, disabled && { opacity: 0.5 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity ?? (variant === 'icon' ? 0.7 : 0.8)}
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
    </TouchableOpacity>
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

export const TextButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="text" />
));
TextButton.displayName = 'TextButton';
