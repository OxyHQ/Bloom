import React, { memo, useMemo } from 'react';
import { View, type ViewStyle, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import type { TypeScaleVariant } from '../typography/scale';
import { resolveBloomColors } from '../appearance/colors';
import { useBloomAppearance } from '../appearance';
import { borderRadius } from '../styles/tokens';
import { Z_INDEX } from '../styles/z-index';
import type { BadgeProps } from './types';

/**
 * The counter badge and status dot, with colours from Bloom's accent recipe
 * (`resolveBloomColors`).
 *
 *            text                            padding-x  height  (py 1)
 *   small    caption-2-semibold, tracking 0  4          17
 *   medium   caption-1-semibold, tracking 0  4          18      ← default size
 *   large    body-semibold,      tracking 0  6          24
 *
 * Bloom uses the full pill radius, like `Button`, rather than a 4px corner,
 * and keeps a `minWidth` of the height so a single digit is a circle rather
 * than a pill narrower than it is tall.
 *
 * A standalone `dot` is a status dot: a solid centre on a tinted halo
 * (12 / 6 at `medium`). An attached dot stays a plain presence marker — a halo
 * over the child's corner would read as a second ring on the icon.
 */
const SIZE_CONFIG = {
  xs: { height: 14, type: 'caption-2-semibold', paddingHorizontal: 3, dotSize: 4, halo: 6, core: 3 },
  sm: { height: 17, type: 'caption-2-semibold', paddingHorizontal: 4, dotSize: 6, halo: 8, core: 4 },
  md: { height: 18, type: 'caption-1-semibold', paddingHorizontal: 4, dotSize: 8, halo: 12, core: 6 },
  lg: { height: 24, type: 'body-semibold', paddingHorizontal: 6, dotSize: 10, halo: 16, core: 8 },
} as const satisfies Record<string, { height: number; type: TypeScaleVariant; paddingHorizontal: number; dotSize: number; halo: number; core: number }>;

const PLACEMENT_CONFIG = {
  'top-right': { top: -4, right: -4 },
  'top-left': { top: -4, left: -4 },
  'bottom-right': { bottom: -4, right: -4 },
  'bottom-left': { bottom: -4, left: -4 },
} as const;

const BadgeComponent: React.FC<BadgeProps> = ({
  content,
  appearance = 'solid',
  tone: toneProp,
  size: sizeProp,
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
  const { size: scopedSize, tone } = useBloomAppearance({size: sizeProp, tone: toneProp}, {size: 'md', tone: 'danger'});
  const size = scopedSize;
  // A dot has no label to make legible, so it always paints the tone's FILL. It
  // used to follow the appearance, which made `dot appearance="outlined"` a fully
  // transparent circle — visually absent, with markup that looks correct.
  const colors = resolveBloomColors(theme.colors, tone, dot ? 'solid' : appearance);
  // The status dot's halo is the same tone's tint — the recipe's `subtle` pair,
  // so it follows the preset and mode exactly as a subtle badge does.
  const halo = resolveBloomColors(theme.colors, tone, 'subtle').background;
  const sizeConfig = SIZE_CONFIG[size];
  const attached = Boolean(children);

  const displayContent = useMemo(() => {
    if (dot) return null;
    if (content == null) return null;
    if (typeof content === 'number' && max != null && content > max) {
      return `${max}+`;
    }
    return String(content);
  }, [content, dot, max]);

  const badgeStyle = useMemo((): ViewStyle => {
    if (dot && attached) {
      return {
        width: sizeConfig.dotSize,
        height: sizeConfig.dotSize,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
      };
    }
    if (dot) {
      return {
        width: sizeConfig.halo,
        height: sizeConfig.halo,
        borderRadius: borderRadius.full,
        backgroundColor: halo,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      };
    }

    const base: ViewStyle = {
      minWidth: sizeConfig.height,
      height: sizeConfig.height,
      borderRadius: borderRadius.full,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };

    if (appearance === 'outline') {
      base.borderWidth = 1;
      base.borderColor = colors.border;
    }

    return base;
  }, [dot, attached, sizeConfig, colors, halo, appearance]);

  const badgeTextStyle = useMemo(
    (): TextStyle => ({
      // `tracking-normal` overrides the caption scale's 0.15px.
      letterSpacing: 0,
      color: colors.foreground,
      textAlign: 'center',
    }),
    [sizeConfig, colors],
  );

  const core =
    dot && !attached ? (
      <View
        style={{
          width: sizeConfig.core,
          height: sizeConfig.core,
          borderRadius: borderRadius.full,
          backgroundColor: colors.background,
        }}
      />
    ) : null;

  // Standalone badge (no children)
  if (!attached) {
    if (invisible) return null;

    return (
      <View style={[badgeStyle, style]} testID={testID}>
        {core}
        {displayContent != null && (
          <Text variant={sizeConfig.type} numberOfLines={1} style={[badgeTextStyle, textStyle]}>
            {displayContent}
          </Text>
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
            <Text variant={sizeConfig.type} numberOfLines={1} style={[badgeTextStyle, textStyle]}>
              {displayContent}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export const Badge = memo(BadgeComponent);
Badge.displayName = 'Badge';
