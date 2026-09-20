import React, { useMemo, memo, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { styled } from 'react-native-css';

import { useBloomAppearance } from '../appearance/context';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  BUTTON_GEOMETRY,
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  ICON_BUTTON_ICON_SIZE,
  LINK_BUTTON_GAP,
  isIconComponent,
  resolveButtonPalette,
  type ButtonGradient,
  type ButtonResolvedSize,
} from './shared';
import type { ButtonProps } from './types';

export type {
  ButtonProps,
  ButtonSize,
  ButtonIconComponent,
} from './types';

/**
 * Native fork of the button. Geometry and every state's colours come
 * from `./shared`, the same table `Button.web.tsx` reads.
 *
 * The web fork's `outline | link | destructive` are real variants here too:
 * `outline` and `link` share `secondary`/`text`'s palette, `destructive` paints
 * the negative gradient.
 */

/**
 * Vertical slack that brings each size's native touch target up to 44dp — the
 * floor `Checkbox` derives its own slack from, and the one Apple's HIG asks for.
 * Pinned as literals rather than derived from the height, because a value
 * computed from the thing it is checked against is checked by nothing:
 * `Button.test.tsx` asserts `height + 2 × top >= 44` for every size.
 *
 * Horizontal slack is deliberately ZERO — side slack is what makes two buttons
 * in a row steal each other's presses. Square buttons keep all-round slop.
 *
 * Native only: react-native-web drops `hitSlop`.
 */
const SIZE_HIT_SLOP = {
  xs: { top: 10, bottom: 10, left: 0, right: 0 },
  sm: { top: 6, bottom: 6, left: 0, right: 0 },
  md: { top: 4, bottom: 4, left: 0, right: 0 },
  lg: { top: 0, bottom: 0, left: 0, right: 0 },
} as const satisfies Record<ButtonResolvedSize, NonNullable<ButtonProps['hitSlop']>>;

/** A link hugs its 16–20px line box, so it needs the most vertical slack. */
const LINK_HIT_SLOP = { top: 12, bottom: 12, left: 0, right: 0 } as const;

const SQUARE_HIT_SLOP = {
  xs: { top: 10, bottom: 10, left: 10, right: 10 },
  sm: { top: 6, bottom: 6, left: 6, right: 6 },
  md: { top: 4, bottom: 4, left: 4, right: 4 },
  lg: { top: 0, bottom: 0, left: 0, right: 0 },
} as const satisfies Record<ButtonResolvedSize, NonNullable<ButtonProps['hitSlop']>>;

// ---------------------------------------------------------------------------
//  The button renders ONE node — the same shape the web fork renders (one
//  `<button>`), so a caller's layout `className` lands on the box its parent
//  lays out. `styled()` comes from Bloom's own `react-native-css`, and both
//  wrappers are built ONCE at module scope so the element type is stable.
// ---------------------------------------------------------------------------

/**
 * Exactly the prop surface `Button` hands to the pressable — narrowing keeps
 * `styled()`'s dot-path mapping type from overflowing the checker (`TS2590`).
 */
type ButtonPressableProps = Pick<
  PressableProps,
  | 'accessibilityHint'
  | 'accessibilityLabel'
  | 'accessibilityRole'
  | 'accessibilityState'
  | 'children'
  | 'className'
  | 'disabled'
  | 'hitSlop'
  | 'onPress'
  | 'onPressIn'
  | 'onPressOut'
  | 'testID'
> & { style?: StyleProp<ViewStyle>; 'aria-expanded'?: boolean };

const ButtonPressable: ComponentType<ButtonPressableProps> = Pressable;

const StyledPressable: ComponentType<ButtonPressableProps> = styled(ButtonPressable, {
  className: 'style',
});

let buttonGradientIdCounter = 0;

/**
 * The filled variants' top-to-bottom gradient, painted under the label.
 *
 * Every stop `shared.ts` produces for a gradient is an OPAQUE composite, which
 * is what makes `stopColor` safe here: react-native-svg drops any alpha in it.
 */
const ButtonGradientFill = memo(function ButtonGradientFill({
  gradient,
  radius,
}: {
  gradient: ButtonGradient;
  radius: number;
}) {
  const id = useMemo(() => `bloom-btn-gradient${buttonGradientIdCounter++}`, []);
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradient[0]} />
            <Stop offset="1" stopColor={gradient[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
});

const ButtonComponent: React.FC<ButtonProps> = ({
  onPress,
  children,
  disabled = false,
  appearance = 'solid',
  tone: toneProp,
  size: sizeProp,
  style,
  textStyle,
  icon,
  leading,
  trailing,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  href,
  loading = false,
  loadingColor,
  accessibilityLabel,
  accessibilityHint,
  hitSlop,
  testID,
  className,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
}) => {
  const theme = useTheme();
  const { size, tone } = useBloomAppearance({ size: sizeProp, tone: toneProp }, { size: 'md', tone: 'accent' });
  const geometry = BUTTON_GEOMETRY[size];
  const isSquare = icon != null && children == null;
  const isIconVariant = isSquare;
  const isLink = href != null && appearance === 'plain';
  const isInteractionBlocked = disabled || loading;
  const iconSize = isIconVariant ? ICON_BUTTON_ICON_SIZE[size] : geometry.iconSize;
  const palette = useMemo(
    () => resolveButtonPalette(appearance, theme, tone),
    [appearance, theme, tone],
  );

  // Pressed state drives the ACTIVE palette. Tracked through state rather than
  // Pressable's function-form `style`, which NativeWind's css-interop swallows
  // (dropping every base style with it).
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();

  // No press scale: a 0.98 scale-down was deliberately left out, so a press is
  // the active paint alone.
  const handlePressIn = isInteractionBlocked ? undefined : onPressedIn;
  const handlePressOut = isInteractionBlocked ? undefined : onPressedOut;

  // A loading button keeps its rest paint under the spinner, like the web fork.
  const paint = disabled
    ? palette.disabled
    : pressed && !loading
      ? palette.active
      : palette.rest;

  const baseStyles = useMemo((): ViewStyle => {
    const styles: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: geometry.gap,
      height: geometry.height,
      paddingHorizontal: geometry.paddingHorizontal,
      borderRadius: BUTTON_RADIUS,
      borderWidth: palette.borderWidth,
      borderColor: paint.border,
      // The gradient is a child layer, so the box itself stays clear of it.
      backgroundColor: paint.gradient ? 'transparent' : paint.background,
    };
    if (palette.shadow && !disabled) {
      styles.boxShadow = BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'];
    }
    if (disabled && palette.disabledOpacity != null) {
      styles.opacity = palette.disabledOpacity;
    }
    if (isSquare) {
      styles.width = geometry.height;
      styles.paddingHorizontal = 0;
    }
    if (isLink && !isSquare) {
      // LinkButton: no container — the label's own line box and a 4px
      // gap. The touch target comes back through `hitSlop`.
      styles.height = undefined;
      styles.paddingHorizontal = 0;
      styles.gap = LINK_BUTTON_GAP;
      styles.borderRadius = 4;
    }
    return styles;
  }, [geometry, palette, paint, theme.isDark, disabled, isSquare, isIconVariant, isLink]);

  // The type ramp step (size, line height, tracking, weight) comes from the
  // typography `Text` through `variant`; only the padding and colour are ours.
  const computedTextStyle = useMemo(
    (): TextStyle => ({
      paddingHorizontal: isLink ? 0 : geometry.labelPaddingHorizontal,
      color: paint.foreground,
    }),
    [geometry, paint.foreground, isLink],
  );

  const defaultHitSlop = isSquare
    ? SQUARE_HIT_SLOP[size]
    : isLink
      ? LINK_HIT_SLOP
      : SIZE_HIT_SLOP[size];

  const IconFromProp = icon != null && isIconComponent(icon) ? icon : null;
  const iconNode = IconFromProp ? (
    <IconFromProp width={iconSize} height={iconSize} fill={paint.foreground} />
  ) : (
    (icon as React.ReactNode) ?? null
  );

  const content = (
    <>
      {LeadingIcon ? (
        <LeadingIcon width={iconSize} height={iconSize} fill={paint.foreground} />
      ) : null}
      {leading}
      {iconNode}
      {!isSquare && children != null && (
        <Text variant={geometry.type} style={[computedTextStyle, textStyle]}>
          {children}
        </Text>
      )}
      {trailing}
      {!isSquare && TrailingIcon ? (
        <TrailingIcon width={iconSize} height={iconSize} fill={paint.foreground} />
      ) : null}
    </>
  );

  const handlePress = isInteractionBlocked
    ? undefined
    : onPress ?? (href != null ? () => void Linking.openURL(href) : undefined);

  return (
    <StyledPressable
      className={className}
      style={[
        baseStyles,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isInteractionBlocked}
      hitSlop={hitSlop ?? defaultHitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={href != null ? 'link' : 'button'}
      // `aria-busy` matches what `Button.web.tsx` emits; react-native-web never
      // reads `accessibilityState`, React Native folds `aria-busy` back into it.
      aria-busy={loading || undefined}
      // Forwarded from an anchored family's `asChild` trigger — see
      // `ButtonProps['aria-expanded']`.
      aria-expanded={ariaExpanded}
      {...(ariaHasPopup == null ? {} : { 'aria-haspopup': ariaHasPopup })}
      testID={testID}
    >
      {paint.gradient ? (
        <ButtonGradientFill gradient={paint.gradient} radius={BUTTON_RADIUS} />
      ) : null}
      {loading ? (
        <>
          <View
            pointerEvents="none"
            style={styles.loadingHiddenContent}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {content}
          </View>
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={loadingColor ?? paint.foreground} />
          </View>
        </>
      ) : (
        content
      )}
    </StyledPressable>
  );
};

const styles = StyleSheet.create({
  loadingHiddenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const Button = memo(ButtonComponent);
Button.displayName = 'Button';
