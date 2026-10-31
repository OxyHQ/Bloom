import { resolvePaintMode } from '../theme/paint';
import { useThemeRecipe } from '../theme/use-theme-paint';
import { useSurfaceFillRecipe } from '../styles/surface-levels';
import { resolveSurfaceLayer } from '../surface/use-surface-layer';
import { ConcentricView } from '../concentric';
import { useSurfacePresenceRef } from '../surface/use-surface-presence-ref';
import { DISABLED_OPACITY } from '../styles/tokens';
import { surfacePresenceStyle } from '../surface/use-surface-presence';
import { ConcentricProvider } from '../concentric/ConcentricProvider';
import { useConcentricGeometry } from '../concentric/use-concentric-geometry';
import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
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
import React, { type ComponentRef, memo, useMemo, useContext } from 'react';
import { StyleSheet, type View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../typography';

import { styled } from 'react-native-css';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceGeometry } from '../surface/resolve-surface-geometry';
import { splitCompiledStyle } from '../styles/compiled-style';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { SurfaceLevelProvider, useSurfaceLevelValue } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { RADIUS, BORDER_WIDTH } from '../design-tokens/scales';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { space } from '../styles/tokens';
import { usePanelShape } from '../styles/panel-chrome';
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
import type { MemoRefComponent } from '../styles/native-refs';
import { typographyDefaultsWhenNoClassName } from '../typography/defaults';

/** How present a card stays while it is pressed. */
const PRESSED_PRESENCE = 0.85;

/** The width each border role resolves to. `none` resolves to zero. */
const BORDER_PX: Record<Exclude<CardBorder, 'none'>, number> = {
  hairline: BORDER_WIDTH.hairline,
  thin: 1,
  medium: 2,
};

/** What each preset means on the two axes an explicit prop can override. */
const VARIANT_DEFAULTS: Record<BloomAppearance, { border: CardBorder; elevation: CardElevation }> =
  {
    plain: { border: 'none', elevation: 'none' },
    // `shadow-s` IS the "subtle raise — cards, chips" role, and the token is
    // already platform-forked, so a hand-rolled `Platform.OS` branch would be one
    // more copy of the split with slightly different numbers.
    solid: { border: 'none', elevation: 's' },
    outline: { border: 'thin', elevation: 'none' },
    subtle: { border: 'none', elevation: 'none' },
  };

const CardRootComponent = React.forwardRef<ComponentRef<typeof View>, CardProps>(
  function CardRootComponent(
    {
      children,
      appearance: appearanceProp,
      tone: toneProp,
      radius,
      cornerCurve: cornerCurveProp,
      clipContent = false,
      contentStyle,
      elevation,
      border,
      style,
      className,
      onPress,
      onLayout,
      accessibilityRole = 'button',
      disabled = false,
      accessibilityLabel,
      testID,
    },
    ref,
  ) {
    const theme = useTheme();
    const layer = useSurfaceLayer();
    const parentRecipe = useSurfaceFillRecipe();
    const parentLevel = useSurfaceLevelValue();
    const panelShape = usePanelShape();
    const cornerCurve =
      cornerCurveProp ?? (radius === 'panel' ? panelShape.curve : SURFACE_SHAPES.card.curve);
    const explicitRadius =
      radius === 'panel'
        ? panelShape.radius
        : radius && radius !== 'concentric'
          ? RADIUS[radius]
          : undefined;
    // On web the caller's `className` arrives in `style` as a compiled-CSS entry
    // (this component is `styled()` below). Values are read from the inline part
    // only, and the classes stay separate entries on the host — never flattened
    // into the inline object, which react-native-web would reject wholesale.
    const { classes, inline: callerStyle } = splitCompiledStyle<ViewStyle>(style);
    const baseGeometry = resolveSurfaceGeometry(
      explicitRadius,
      callerStyle,
      SURFACE_SHAPES.card.radius,
      cornerCurve,
    );
    const appearance = appearanceProp ?? 'solid';
    const borderRole = border ?? VARIANT_DEFAULTS[appearance].border;
    const concentric = useConcentricGeometry({
      allowClassRadius: radius === undefined,
      webClasses: Boolean(classes || className) && callerStyle?.borderRadius === undefined,
      radius:
        radius === 'concentric'
          ? 'concentric'
          : typeof baseGeometry.radius === 'number'
            ? baseGeometry.radius
            : undefined,
      style: {
        ...callerStyle,
        borderWidth: borderRole === 'none' ? 0 : BORDER_PX[borderRole],
      },
    });
    const resolvedGeometry =
      radius === 'concentric' || concentric.hasClassRadius
        ? {
            radius: undefined,
            shape: {
              radius: concentric.radii,
              curve: radius === 'concentric' ? ('round' as const) : cornerCurve,
            },
            style: concentric.radiusStyle,
          }
        : baseGeometry;
    const { tone } = useBloomAppearance({ tone: toneProp }, { size: 'md', tone: 'neutral' });
    const paint = resolveBloomColors(theme.colors, tone, appearance);
    // Drive the press-opacity via state instead of Pressable's function-form
    // `style`, which NativeWind v4's css-interop swallows (dropping the base
    // container style: background, radius, border, shadow).
    const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
    // Pressed and disabled dim the card through its presence, never its own
    // opacity: on the web that would make the card a backdrop root and turn its
    // material flat while dimmed (`surface/use-surface-presence.ts`).
    const presence = disabled ? DISABLED_OPACITY : pressed && onPress ? PRESSED_PRESENCE : 1;
    const hostRef = useSurfacePresenceRef(ref, presence);

    const containerStyle = useMemo((): ViewStyle => {
      const defaults = VARIANT_DEFAULTS[appearance];
      const resolvedBorder = border ?? defaults.border;
      const resolvedElevation = elevation ?? defaults.elevation;

      return {
        backgroundColor:
          tone === 'neutral' && appearance !== 'plain' ? layer.fill : paint.background,
        ...resolvedGeometry.style,
        ...(resolvedBorder !== 'none'
          ? {
              borderWidth: BORDER_PX[resolvedBorder],
              borderColor: tone === 'neutral' ? theme.colors.border : paint.border,
            }
          : null),
        ...(resolvedElevation !== 'none' ? bloomShadowStyle(resolvedElevation) : null),
      };
    }, [
      appearance,
      appearanceProp,
      tone,
      paint,
      radius,
      cornerCurve,
      border,
      elevation,
      theme,
      layer.fill,
      resolvedGeometry.radius,
    ]);

    // Resolve class utilities on the actual layout host. Geometry remains owned
    // by the public shape axes; clipping is explicit and keeps shadows outside.
    const shape = resolvedGeometry.shape;
    const geometry = { ...resolvedGeometry.style, borderWidth: containerStyle.borderWidth ?? 0 };
    const resolved: ViewStyle =
      StyleSheet.flatten<StyleProp<ViewStyle>>([containerStyle, callerStyle, geometry]) ?? {};
    const material = resolveSurfaceMaterial({
      fill: String(resolved.backgroundColor ?? 'transparent'),
      parentFill: layer.parentFill,
      parentLevel,
      paint: appearance !== 'plain',
    });
    const { paintFill: fill, painted: paintsSurface, publishedFill } = material;
    const paintRecipe = useThemeRecipe(
      (palette, documentMode, documentPreset) => {
        const modeLayer = resolveSurfaceLayer(
          palette,
          resolvePaintMode(parentRecipe, documentMode, documentPreset),
          parentLevel,
        );
        const modePaint = resolveBloomColors(palette.colors, tone, appearance);
        const background =
          callerStyle?.backgroundColor ??
          (tone === 'neutral' && appearance !== 'plain' ? modeLayer.fill : modePaint.background);
        return {
          ...resolveSurfaceMaterial({
            fill: String(background),
            parentFill: modeLayer.parentFill,
            parentLevel,
            paint: appearance !== 'plain',
          }),
          borderColor: tone === 'neutral' ? palette.colors.border : modePaint.border,
          foreground: modePaint.foreground,
        };
      },
      [tone, callerStyle?.backgroundColor, parentRecipe, parentLevel, appearance],
    );
    const outerStyle: ViewStyle = {
      ...resolved,
      ...paintRecipe.paint.vars,
      ...(resolved.borderColor === containerStyle.borderColor
        ? { borderColor: paintRecipe.paint.borderColor }
        : null),
      ...concentric.variables,
      ...(paintsSurface ? { backgroundColor: 'transparent' } : null),
    };
    const contents = (
      <>
        {paintRecipe.sheet}
        {paintsSurface ? (
          <SurfacePaint
            fill={String(fill)}
            paintFill={paintRecipe.paint.paintFill}
            radius={resolvedGeometry.radius}
            shape={shape}
            geometryStyle={resolvedGeometry.style}
            // A bordered card (`outline`, or any `border`) already has its stroke;
            // the paint's inset rim would be a second one inside it.
            rim={borderRole === 'none'}
          />
        ) : null}
        <ConcentricProvider value={concentric.context} variables={concentric.nativeVariables}>
          <SurfaceLevelProvider
            level={material.level}
            fill={publishedFill}
            fillModes={{
              light: paintRecipe.light.publishedFill,
              dark: paintRecipe.dark.publishedFill,
              resolvePreset: (preset, mode) =>
                paintRecipe.resolvePreset(preset, mode).publishedFill,
            }}
          >
            <CardForegroundContext.Provider
              value={tone === 'neutral' ? undefined : paintRecipe.paint.foreground}
            >
              {clipContent ? (
                <ConcentricView
                  radius={
                    radius === 'concentric' || concentric.hasClassRadius ? 'concentric' : undefined
                  }
                  testID={testID ? `${testID}-clip` : undefined}
                  style={[
                    contentStyle,
                    surfaceStyle({
                      ...shape,
                      radius:
                        typeof resolvedGeometry.radius === 'number'
                          ? Math.max(0, resolvedGeometry.radius - geometry.borderWidth)
                          : undefined,
                    }),
                    {
                      borderRadius:
                        typeof resolvedGeometry.radius === 'number'
                          ? Math.max(0, resolvedGeometry.radius - geometry.borderWidth)
                          : resolvedGeometry.radius,
                      overflow: 'hidden',
                      alignSelf: 'stretch',
                      flexGrow: 1,
                      flexShrink: 1,
                    },
                  ]}
                >
                  {children}
                </ConcentricView>
              ) : (
                children
              )}
            </CardForegroundContext.Provider>
          </SurfaceLevelProvider>
        </ConcentricProvider>
      </>
    );

    if (onPress) {
      return (
        <StyledPressable
          ref={hostRef}
          onLayout={onLayout}
          className={className}
          style={[classes, outerStyle, surfacePresenceStyle(presence)]}
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
        ref={hostRef}
        onLayout={onLayout}
        className={className}
        style={[classes, outerStyle, surfacePresenceStyle(presence)]}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {contents}
      </StyledView>
    );
  },
);

const CardHeaderComponent: React.FC<CardHeaderProps> = ({ children, style }) => (
  <ConcentricView
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
  </ConcentricView>
);

const CardBodyComponent: React.FC<CardBodyProps> = ({ children, style }) => (
  <ConcentricView
    style={[
      {
        paddingHorizontal: space.lg,
        paddingVertical: space.sm,
      },
      style,
    ]}
  >
    {children}
  </ConcentricView>
);

const CardFooterComponent: React.FC<CardFooterProps> = ({ children, style }) => (
  <ConcentricView
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
  </ConcentricView>
);

const CardTitleComponent: React.FC<CardTitleProps> = ({
  children,
  style,
  numberOfLines,
  className,
}) => {
  const theme = useTheme();
  const foreground = useContext(CardForegroundContext);
  return (
    <Text
      {...(className ? { className } : {})}
      style={[
        typographyDefaultsWhenNoClassName(className, {
          fontSize: 17,
          fontWeight: '600',
          color: foreground ?? theme.colors.text,
          lineHeight: 22,
        }),
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
  className,
}) => {
  const theme = useTheme();
  const foreground = useContext(CardForegroundContext);
  return (
    <Text
      {...(className ? { className } : {})}
      style={[
        typographyDefaultsWhenNoClassName(className, {
          fontSize: 14,
          color: foreground ?? theme.colors.textSecondary,
          lineHeight: 20,
        }),
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

// Keep ref internals out of styled's recursive property-path inference.
const StyledCard = styled(CardRootComponent as React.ComponentType<CardProps>, {
  className: 'style',
}) as typeof CardRootComponent;
export const Card: MemoRefComponent<CardProps> = memo(StyledCard);
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
