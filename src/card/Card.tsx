import { CardForegroundContext } from './context';
import { useBloomAppearance, type BloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
/**
 * `Card` — THE card-shaped surface. One place decides what "a card" is made of:
 * the `card` background role, a border colour and width, an elevation, a corner
 * rung, and the clip that keeps content inside those corners.
 *
 * Families used to draw that chrome by hand (`settings-list`'s group and
 * `link-preview` compose it now; `user-hover-card` has since moved to the
 * floating-panel surface the menus share), which is the duplication this
 * component exists to remove. They differ in the RUNG and the border/elevation,
 * not in what a card IS — so the axes are props drawn from the token scales
 * rather than more variants:
 *
 *   appearance the preset (`plain` is the bare surface; the other three add one axis)
 *   radius    a rung of `RADIUS` — never a free number
 *   border    `none` | `hairline` (0.5px) | `thin` (1px)
 *   elevation `none` | `s` | `m`, resolved through the platform-forked `bloomShadowStyle`
 *
 * An explicit axis prop wins over the appearance's default, so no combination
 * requires a new appearance name.
 */
import React, { memo, useMemo, useContext } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { styled } from 'react-native-css';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceFill } from '../surface/shared';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceLevelValue } from '../styles/surface-levels';
import { withAlpha } from '../theme/color-utils';
import { useTheme } from '../theme/use-theme';
import { RADIUS, BORDER_WIDTH } from '../design-tokens/scales';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { space } from '../styles/tokens';
import type {
  CardProps,
  CardBorder,
  CardElevation,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
} from './types';

/** The width each border role resolves to. `none` is expressed by omitting the border. */
const BORDER_PX: Record<Exclude<CardBorder, 'none'>, number> = {
  hairline: BORDER_WIDTH.hairline,
  thin: 1,
};

/** What each preset means on the two axes an explicit prop can override. */
const VARIANT_DEFAULTS: Record<BloomAppearance, { border: CardBorder; elevation: CardElevation }> = {
  plain: { border: 'none', elevation: 'none' },
  // `shadow-s` IS the "subtle raise — cards, chips" role, and the token is
  // already platform-forked, so a hand-rolled `Platform.OS` branch would be one
  // more copy of the split with slightly different numbers.
  solid: { border: 'none', elevation: 's' },
  outline: { border: 'thin', elevation: 'none' },
  subtle: { border: 'none', elevation: 'none' },
};

const CardRootComponent = React.forwardRef<View, CardProps>(function CardRootComponent({
  children,
  appearance: appearanceProp,
  variant,
  tone: toneProp,
  radius = 'radius-12',
  elevation,
  border,
  material = 'solid',
  style,
  className,
  onPress,
  onLayout,
  accessibilityRole = 'button',
  disabled = false,
  accessibilityLabel,
  testID,
}, ref) {
  const theme = useTheme();
  const layer = useSurfaceLayer();
  const parentLevel = useSurfaceLevelValue();
  const appearance = appearanceProp ?? (variant === 'filled' ? 'subtle' : variant === 'outlined' ? 'outline' : 'solid');
  const {tone} = useBloomAppearance({tone: toneProp}, {size: 'md', tone: 'neutral'});
  const paint = resolveBloomColors(theme.colors, tone, appearance);
  // Drive the press-opacity via state instead of Pressable's function-form
  // `style`, which NativeWind v4's css-interop swallows (dropping the base
  // container style: background, radius, border, shadow).
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } =
    useInteractionState();

  const containerStyle = useMemo((): ViewStyle => {
    const defaults = VARIANT_DEFAULTS[appearance];
    const resolvedBorder = border ?? defaults.border;
    const resolvedElevation = elevation ?? (variant === 'plain' && appearanceProp == null ? 'none' : defaults.elevation);

    const base: ViewStyle = {
      backgroundColor:
        tone === 'neutral' && appearance !== 'plain' ? layer.fill : paint.background,
      borderRadius: RADIUS[radius],
      overflow: 'hidden',
    };

    if (resolvedBorder !== 'none') {
      base.borderWidth = BORDER_PX[resolvedBorder];
      base.borderColor = tone === 'neutral' ? theme.colors.border : paint.border;
    }

    if (resolvedElevation !== 'none') {
      Object.assign(base, bloomShadowStyle(resolvedElevation));
    }

    return base;
  }, [appearance, appearanceProp, variant, tone, paint, radius, border, elevation, theme, layer.fill]);

  // Resolve class utilities before splitting layout: the outer node keeps the
  // parent's sizing/position and shadow; the inner node owns content clipping.
  const resolved = StyleSheet.flatten([containerStyle, style]) ?? {};
  const isWeb = Platform.OS === 'web';
  // Web overflow clips children without clipping the CSS box shadow. Keep one
  // layout node there so utility classes still lay out the actual content.
  const outerStyle: ViewStyle = { ...resolved, overflow: isWeb ? resolved.overflow : 'visible' };
  const contentStyle: ViewStyle = {
    flexGrow: 1, flexShrink: 1, alignSelf: 'stretch',
    borderRadius: resolved.borderRadius,
    overflow: resolved.overflow === 'visible' && StyleSheet.flatten(style)?.overflow === 'visible' ? 'visible' : 'hidden',
  };
  const contentKeys = [
    'flexDirection', 'flexWrap', 'alignItems', 'justifyContent', 'alignContent',
    'gap', 'rowGap', 'columnGap', 'padding', 'paddingHorizontal', 'paddingVertical',
    'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingStart', 'paddingEnd',
  ] as const;
  for (const key of isWeb ? [] : contentKeys) {
    if (resolved[key] !== undefined) {
      Object.assign(contentStyle, { [key]: resolved[key] });
      delete outerStyle[key];
    }
  }
  const baseFill = String(containerStyle.backgroundColor);
  const fill = StyleSheet.flatten(style)?.backgroundColor ?? (material === 'glass' ? withAlpha(baseFill, tone !== 'neutral' && appearance === 'solid' ? 0.94 : 0.25) : baseFill);
  const paintsSurface = appearance !== 'plain';
  // Solid paint is exact; glass publishes the tint's estimate over its known parent,
  // not a claim about the refracted pixels underneath it.
  const publishedFill = resolveSurfaceFill(String(paintsSurface ? fill : resolved.backgroundColor ?? 'transparent'), false, layer.parentFill);
  const content = <SurfaceLevelProvider level={paintsSurface ? layer.level : parentLevel} fill={publishedFill}>
    <CardForegroundContext.Provider value={tone === 'neutral' ? undefined : paint.foreground}>{children}</CardForegroundContext.Provider>
  </SurfaceLevelProvider>;
  Object.assign(outerStyle, surfaceFillVars(publishedFill));
  if (paintsSurface) outerStyle.backgroundColor = 'transparent';
  const contents = <>
    {paintsSurface ? <SurfacePaint fill={material === 'glass' ? String(fill) : publishedFill} backdrop={layer.parentFill} radius={resolved.borderRadius ?? RADIUS[radius]} glass={material === 'glass'} /> : null}
    {isWeb ? content : <View style={contentStyle} testID={testID ? `${testID}-content` : undefined}>{content}</View>}
  </>;

  if (onPress) {
    return (
      <StyledPressable
        ref={ref}
        onLayout={onLayout}
        className={className}
        style={[outerStyle, pressed && !disabled && { opacity: 0.85 }, disabled && { opacity: 0.5 }]}
        onPress={onPress}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled }}
        aria-disabled={disabled}
        testID={testID}
      >
        {contents}
      </StyledPressable>
    );
  }

  return (
    <StyledView
      ref={ref}
      onLayout={onLayout}
      className={className}
      style={[outerStyle, disabled && { opacity: 0.5 }]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {contents}
    </StyledView>
  );
});

const CardHeaderComponent: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingHorizontal: space.lg,
        paddingTop: space.lg,
        paddingBottom: space.sm,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const CardBodyComponent: React.FC<CardBodyProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const CardFooterComponent: React.FC<CardFooterProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: space.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: space.sm,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const CardTitleComponent: React.FC<CardTitleProps> = ({ children, style, numberOfLines }) => {
  const theme = useTheme();
  const foreground = useContext(CardForegroundContext);
  return (
    <Text
      style={[
        {
          fontSize: 17,
          fontWeight: '600',
          color: foreground ?? theme.colors.text,
          lineHeight: 22,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const CardDescriptionComponent: React.FC<CardDescriptionProps> = ({
  children,
  style,
  numberOfLines,
}) => {
  const theme = useTheme();
  const foreground = useContext(CardForegroundContext);
  return (
    <Text
      style={[
        {
          fontSize: 14,
          color: foreground ?? theme.colors.textSecondary,
          lineHeight: 20,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

// Keep ref internals out of styled's recursive property-path inference.
const StyledCard = styled(CardRootComponent as React.ComponentType<CardProps>, { className: 'style' }) as typeof CardRootComponent;
export const Card = memo(StyledCard);
Card.displayName = 'Card';

export const CardHeader = memo(CardHeaderComponent);
CardHeader.displayName = 'CardHeader';

export const CardBody = memo(CardBodyComponent);
CardBody.displayName = 'CardBody';

export const CardFooter = memo(CardFooterComponent);
CardFooter.displayName = 'CardFooter';

export const CardTitle = memo(CardTitleComponent);
CardTitle.displayName = 'CardTitle';

export const CardDescription = memo(CardDescriptionComponent);
CardDescription.displayName = 'CardDescription';
