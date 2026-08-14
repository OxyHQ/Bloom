import React, { memo, useMemo } from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { resolveAccentColors } from '../theme/accent-colors';
import { Z_INDEX } from '../styles/z-index';
import type { BadgeProps } from './types';

const SIZE_CONFIG = {
  small: { minWidth: 16, height: 16, fontSize: 10, paddingHorizontal: 4, dotSize: 6 },
  medium: { minWidth: 20, height: 20, fontSize: 12, paddingHorizontal: 6, dotSize: 8 },
  large: { minWidth: 24, height: 24, fontSize: 14, paddingHorizontal: 8, dotSize: 10 },
} as const;

const PLACEMENT_CONFIG = {
  'top-right': { top: -4, right: -4 },
  'top-left': { top: -4, left: -4 },
  'bottom-right': { bottom: -4, right: -4 },
  'bottom-left': { bottom: -4, left: -4 },
} as const;

const BadgeComponent: React.FC<BadgeProps> = ({
  content,
  variant = 'solid',
  color = 'error',
  size = 'medium',
  dot = false,
  max,
  invisible = false,
  placement = 'top-right',
  children,
  style,
  textStyle,
  testID,
}) => {
  const theme = useTheme();
  // A dot has no label to make legible, so it always paints the tone's FILL. It
  // used to follow the variant, which made `dot variant="outlined"` a fully
  // transparent circle — visually absent, with markup that looks correct.
  const colors = resolveAccentColors(theme.colors, color, dot ? 'solid' : variant);
  const sizeConfig = SIZE_CONFIG[size];

  const displayContent = useMemo(() => {
    if (dot) return null;
    if (content == null) return null;
    if (typeof content === 'number' && max != null && content > max) {
      return `${max}+`;
    }
    return String(content);
  }, [content, dot, max]);

  const badgeStyle = useMemo((): ViewStyle => {
    if (dot) {
      return {
        width: sizeConfig.dotSize,
        height: sizeConfig.dotSize,
        borderRadius: sizeConfig.dotSize / 2,
        backgroundColor: colors.background,
      };
    }

    const base: ViewStyle = {
      minWidth: sizeConfig.height,
      height: sizeConfig.height,
      borderRadius: sizeConfig.height / 2,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (variant === 'outlined') {
      base.borderWidth = 1;
      base.borderColor = colors.border;
    }

    return base;
  }, [dot, sizeConfig, colors, variant]);

  const badgeTextStyle = useMemo(
    (): TextStyle => ({
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
      color: colors.foreground,
      textAlign: 'center',
      lineHeight: sizeConfig.height,
    }),
    [sizeConfig, colors],
  );

  // Standalone badge (no children)
  if (!children) {
    if (invisible) return null;

    return (
      <View style={[badgeStyle, style]} testID={testID}>
        {displayContent != null && (
          <Text style={[badgeTextStyle, textStyle]}>{displayContent}</Text>
        )}
      </View>
    );
  }

  // Positioned badge wrapping children
  return (
    <View style={{ position: 'relative', alignSelf: 'flex-start' }} testID={testID}>
      {children}
      {!invisible && (
        <View
          style={[
            {
              position: 'absolute',
              zIndex: Z_INDEX.raised,
              ...PLACEMENT_CONFIG[placement],
            },
            badgeStyle,
            style,
          ]}
        >
          {displayContent != null && (
            <Text style={[badgeTextStyle, textStyle]}>{displayContent}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export const Badge = memo(BadgeComponent);
Badge.displayName = 'Badge';
