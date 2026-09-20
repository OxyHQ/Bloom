import { useBloomAppearance } from '../appearance';
import { normalizeTagTone } from './shared';
import React, { memo, useMemo } from 'react';
import { View, type ViewStyle, type TextStyle } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { borderRadius } from '../styles/tokens';
import { Z_INDEX } from '../styles/z-index';
import { BADGE_GEOMETRY, resolveBadgePaint } from './shared';
import type { BadgeProps } from './types';

/**
 * The counter badge, the status dot and the label pill, with colours from
 * Bloom's accent recipe (`resolveAccentColors`) and geometry from
 * `shared.ts`'s rung table — five rungs in two families:
 *
 *                   height  padding-x  icon  text
 *   small           17      4          10    caption-2-semibold
 *   medium          18      4          11    caption-1-semibold   ← default
 *   large           24      6          14    body-semibold
 *   label-small     20      8          12    caption-1-semibold
 *   label-medium    24      10         14    body-2-semibold
 *
 * Bloom uses the full pill radius, like `Button`, rather than a 4px corner. A
 * COUNTER rung keeps a `minWidth` of its height, so a single digit is a circle
 * rather than a pill narrower than it is tall, and never shrinks. A LABEL rung
 * shrinks and truncates instead — it carries a word, and a word must yield
 * before the card around it does.
 *
 * `icon` is a leading glyph drawn at the rung's size in the LABEL's colour and
 * hidden from assistive technology: the badge reads as its text, never as
 * "image, key". An icon tucks the leading padding in by 2, optically.
 *
 * A standalone `dot` is a status dot: a solid centre on a tinted halo
 * (12 / 6 at `medium`). An attached dot stays a plain presence marker — a halo
 * over the child's corner would read as a second ring on the icon.
 *
 * `variant="onMedia"` is the over-a-photograph pill: a light fill with
 * shadow-s, the same in both modes because the photograph is.
 */
const PLACEMENT_CONFIG = {
  'top-right': { top: -4, right: -4 },
  'top-left': { top: -4, left: -4 },
  'bottom-right': { bottom: -4, right: -4 },
  'bottom-left': { bottom: -4, left: -4 },
} as const;

const BadgeComponent: React.FC<BadgeProps> = ({
  content,
  variant: variantProp = 'solid',
  appearance,
  tone: toneProp,
  color,
  size: sizeProp,
  icon: Icon,
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
  const scoped = useBloomAppearance({ size: ['xs','sm','md','lg'].includes(sizeProp ?? '') ? sizeProp as import('../appearance').BloomSize : undefined, tone: toneProp ?? (color ? normalizeTagTone(color) : undefined) }, {size: 'md', tone: 'danger'});
  const size = sizeProp ?? scoped.size;
  const tone = scoped.tone;
  const variant = appearance ?? variantProp;

  // A dot has no label to make legible, so it always paints the tone's FILL. It
  // used to follow the variant, which made `dot variant="outlined"` a fully
  // transparent circle — visually absent, with markup that looks correct.
  const paint = useMemo(
    () => resolveBadgePaint(theme, tone, dot ? 'solid' : variant),
    [theme, tone, dot, variant],
  );
  // The status dot's halo is the same tone's tint — the recipe's `subtle` pair,
  // so it follows the preset and mode exactly as a subtle badge does.
  const halo = useMemo(() => resolveBadgePaint(theme, tone, 'subtle').background, [theme, tone]);
  const geometry = BADGE_GEOMETRY[size];
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
        width: geometry.dotSize,
        height: geometry.dotSize,
        borderRadius: borderRadius.full,
        backgroundColor: paint.background,
      };
    }
    if (dot) {
      return {
        width: geometry.halo,
        height: geometry.halo,
        borderRadius: borderRadius.full,
        backgroundColor: halo,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      };
    }

    const base: ViewStyle = {
      height: geometry.height,
      borderRadius: borderRadius.full,
      // LONGHANDS, not `paddingHorizontal`: react-native-web maps the shorthand
      // to `padding-inline`, which its atomic sheet ranks above `padding-left`
      // whatever the array order — so a caller's `paddingLeft` override would
      // drop on web and land on native. An icon also needs the two sides to
      // differ. Overrides must use these same longhands.
      paddingLeft: Icon ? Math.max(0, geometry.paddingHorizontal - 2) : geometry.paddingHorizontal,
      paddingRight: geometry.paddingHorizontal,
      backgroundColor: paint.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...(Icon ? { gap: geometry.gap } : null),
      // A word shrinks and truncates; a digit is a fixed token that keeps its
      // circle. See `BadgeGeometry.word`.
      ...(geometry.word
        ? { alignSelf: 'flex-start', flexShrink: 1, minWidth: 0 }
        : { minWidth: geometry.height, flexShrink: 0 }),
      ...(paint.shadow ? bloomShadowStyle(paint.shadow) : null),
    };

    if (variant === 'outlined') {
      base.borderWidth = 1;
      base.borderColor = paint.border;
    }

    return base;
  }, [dot, attached, geometry, paint, halo, variant, Icon]);

  const badgeTextStyle = useMemo(
    (): TextStyle => ({
      // `tracking-normal` overrides the caption scale's 0.15px.
      letterSpacing: 0,
      color: paint.foreground,
      textAlign: 'center',
      ...(geometry.word ? { flexShrink: 1, minWidth: 0 } : null),
    }),
    [geometry, paint],
  );

  const core =
    dot && !attached ? (
      <View
        style={{
          width: geometry.core,
          height: geometry.core,
          borderRadius: borderRadius.full,
          backgroundColor: paint.background,
        }}
      />
    ) : null;

  // The icon is a glyph OF the label, so it is hidden: a badge announces its
  // text, never "image, key" beside it.
  const iconNode =
    Icon && !dot ? (
      <View
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        testID={testID ? `${testID}-icon` : undefined}
      >
        <Icon width={geometry.icon} height={geometry.icon} fill={paint.foreground} />
      </View>
    ) : null;

  const label =
    displayContent != null ? (
      <Text variant={geometry.type} numberOfLines={1} style={[badgeTextStyle, textStyle]}>
        {displayContent}
      </Text>
    ) : null;

  // Standalone badge (no children)
  if (!attached) {
    if (invisible) return null;

    return (
      <View style={[badgeStyle, style]} testID={testID}>
        {core}
        {iconNode}
        {label}
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
          {iconNode}
          {label}
        </View>
      )}
    </View>
  );
};

export const Badge = memo(BadgeComponent);
Badge.displayName = 'Badge';
