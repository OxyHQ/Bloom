import React, { memo, useMemo } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { usePressAnimation } from '../hooks/usePressAnimation';
import { useInteractionState } from '../hooks/useInteractionState';
import type { FabPlacement, FabProps, FabSize, FabVariant } from './types';

export type { FabProps, FabVariant, FabSize, FabPlacement } from './types';

interface ResolvedSize {
  diameter: number;
  iconBox: number;
  fontSize: number;
}

// Material-style FAB scale. `small` (40px) keeps a full 24px icon box so the
// glyph reads clearly; `medium` (56px) is the canonical FAB; `large` (64px) is
// the high-prominence action.
const SIZE_CONFIG: Record<FabSize, ResolvedSize> = {
  small: { diameter: 40, iconBox: 24, fontSize: 14 },
  medium: { diameter: 56, iconBox: 24, fontSize: 15 },
  large: { diameter: 64, iconBox: 28, fontSize: 16 },
};

const MIN_NUMERIC_ICON_BOX = 22;

/**
 * Resolve a `size` prop (preset name or raw pixel diameter) to concrete pixel
 * geometry. A numeric size sets the diameter directly, derives the icon box as
 * `round(size * 0.5)` (clamped to a sensible minimum) and lets the circle radius
 * stay `size / 2` (the container uses a full pill radius, so any square stays a
 * perfect circle).
 */
function resolveSize(size: FabSize | number): ResolvedSize {
  if (typeof size === 'number') {
    return {
      diameter: size,
      iconBox: Math.max(MIN_NUMERIC_ICON_BOX, Math.round(size * 0.5)),
      fontSize: Math.max(13, Math.round(size * 0.27)),
    };
  }
  return SIZE_CONFIG[size];
}

const PILL_RADIUS = 999;
const PRESS_SCALE = 0.94;
const DEFAULT_OFFSET = 16;
const DEFAULT_Z_INDEX = 50;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/**
 * Compute the `position: absolute` anchoring for a placement. The FAB pins to
 * the nearest positioned ancestor (the consumer's column container), NOT the
 * screen — so it never escapes a constrained layout. `static` returns no
 * positioning (consumer-controlled).
 */
function placementStyle(placement: FabPlacement, offset: number): ViewStyle {
  if (placement === 'static') return {};
  const style: ViewStyle = { position: 'absolute' };
  if (placement === 'bottom-right' || placement === 'bottom-left') {
    style.bottom = offset;
  } else {
    style.top = offset;
  }
  if (placement === 'bottom-right' || placement === 'top-right') {
    style.right = offset;
  } else {
    style.left = offset;
  }
  return style;
}

const FabComponent: React.FC<FabProps> = ({
  onPress,
  icon,
  children,
  label,
  variant = 'primary',
  size = 'medium',
  placement = 'bottom-right',
  offset = DEFAULT_OFFSET,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  labelStyle,
  className,
  testID,
  zIndex = DEFAULT_Z_INDEX,
}) => {
  const theme = useTheme();
  const sizeConfig = useMemo(() => resolveSize(size), [size]);
  const isExtended = label != null && label.length > 0;
  const content = icon ?? children;

  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(
    disabled ? undefined : PRESS_SCALE,
  );
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();

  const resolvedColors = useMemo(() => resolveVariant(variant, theme.colors), [variant, theme.colors]);

  const containerStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      backgroundColor: resolvedColors.background,
      borderRadius: PILL_RADIUS,
      height: sizeConfig.diameter,
      // Elevation / shadow (native).
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    };
    if (isExtended) {
      base.paddingHorizontal = sizeConfig.diameter <= 44 ? 14 : 20;
      base.gap = 8;
    } else {
      base.width = sizeConfig.diameter;
    }
    return base;
  }, [resolvedColors.background, sizeConfig.diameter, theme.colors.shadow, isExtended]);

  const labelTextStyle = useMemo((): TextStyle => ({
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    color: resolvedColors.foreground,
  }), [sizeConfig.fontSize, resolvedColors.foreground]);

  const handlePressIn = disabled
    ? undefined
    : () => {
        onPressIn();
        onPressedIn();
      };
  const handlePressOut = disabled
    ? undefined
    : () => {
        onPressOut();
        onPressedOut();
      };

  return (
    <Animated.View
      style={[
        placementStyle(placement, offset),
        { zIndex, transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Pressable
        {...(className ? ({ className } as Record<string, string>) : {})}
        style={[
          containerStyle,
          disabled && { opacity: 0.5 },
          pressed && !disabled && { opacity: 0.9 },
        ]}
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
      >
        {content != null && (
          <View
            style={{
              width: sizeConfig.iconBox,
              height: sizeConfig.iconBox,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {content}
          </View>
        )}
        {isExtended && (
          <Text style={[labelTextStyle, labelStyle]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

function resolveVariant(
  variant: FabVariant,
  colors: ReturnType<typeof useTheme>['colors'],
): { background: string; foreground: string } {
  switch (variant) {
    case 'secondary':
    case 'surface':
      return { background: colors.card, foreground: colors.text };
    case 'primary':
    default:
      return { background: colors.primary, foreground: colors.primaryForeground };
  }
}

export const Fab = memo(FabComponent);
Fab.displayName = 'Fab';
