import React, { useMemo, memo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePressAnimation } from '../hooks/usePressAnimation';
import { useInteractionState } from '../hooks/useInteractionState';
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
  loading = false,
  loadingColor,
  accessibilityLabel,
  accessibilityHint,
  hitSlop,
  activeOpacity,
  testID,
  className,
}) => {
  const theme = useTheme();
  const hasScaleFeedback = SCALE_VARIANTS.has(variant);
  const isInteractionBlocked = disabled || loading;
  const { scaleAnim, onPressIn: onScalePressIn, onPressOut: onScalePressOut } =
    usePressAnimation(
      hasScaleFeedback && !isInteractionBlocked ? PRESS_SCALE : undefined,
    );
  // Non-scale variants (icon/ghost/text) convey press feedback via an opacity
  // dip. We drive it through component state + onPressIn/onPressOut rather than
  // Pressable's function-form `style` because NativeWind v4's css-interop
  // rewrites the `style` prop of every JSX element and swallows the function
  // form, which would drop ALL base styles (background, radius, padding,
  // minHeight). A static style array is merged correctly by css-interop.
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();

  const handlePressIn = useMemo(() => {
    if (isInteractionBlocked) return undefined;
    return () => {
      onScalePressIn();
      onPressedIn();
    };
  }, [isInteractionBlocked, onScalePressIn, onPressedIn]);

  const handlePressOut = useMemo(() => {
    if (isInteractionBlocked) return undefined;
    return () => {
      onScalePressOut();
      onPressedOut();
    };
  }, [isInteractionBlocked, onScalePressOut, onPressedOut]);

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

  const resolvedTextColor = useMemo((): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.primaryForeground;
      case 'secondary':
        return theme.colors.text;
      case 'inverse':
        return '#000000';
      case 'ghost':
      case 'text':
        return theme.colors.primary;
      case 'icon':
      default:
        return theme.colors.text;
    }
  }, [variant, theme]);

  const computedTextStyle = useMemo((): TextStyle => {
    const sizeConfig = SIZE_CONFIG[size];
    return {
      fontSize: sizeConfig.fontSize,
      fontWeight: Platform.OS === 'web' ? 'bold' : '600',
      color: resolvedTextColor,
    };
  }, [size, resolvedTextColor]);

  const defaultHitSlop = variant === 'icon' ? ICON_HIT_SLOP : undefined;
  const resolvedActiveOpacity = activeOpacity ?? (variant === 'icon' ? 0.7 : 0.8);
  const resolvedClassName = className ?? (variant === 'icon' ? 'bg-background border border-border' : undefined);

  const content = (
    <>
      {iconPosition === 'left' && icon}
      {children != null && (
        <Text style={[computedTextStyle, textStyle]}>{children}</Text>
      )}
      {iconPosition === 'right' && icon}
    </>
  );

  return (
    <Animated.View style={hasScaleFeedback ? { transform: [{ scale: scaleAnim }] } : undefined}>
      <Pressable
        {...(resolvedClassName ? { className: resolvedClassName } as Record<string, string> : {})}
        style={[
          baseStyles,
          disabled && !loading && { opacity: 0.5 },
          pressed && !hasScaleFeedback && !isInteractionBlocked && { opacity: resolvedActiveOpacity },
          style,
        ]}
        onPress={isInteractionBlocked ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInteractionBlocked}
        hitSlop={hitSlop ?? defaultHitSlop}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={loading ? { disabled: isInteractionBlocked, busy: true } : { disabled: isInteractionBlocked }}
        testID={testID}
      >
        {loading ? (
          <>
            <View
              style={styles.loadingHiddenContent}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              {content}
            </View>
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={loadingColor ?? resolvedTextColor} />
            </View>
          </>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  loadingHiddenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    pointerEvents: 'none',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});

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
