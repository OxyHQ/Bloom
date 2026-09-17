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

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  BUTTON_GEOMETRY,
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  BUTTON_SIZE_ALIAS,
  ICON_BUTTON_ICON_SIZE,
  LINK_BUTTON_GAP,
  iconOnlyWidth,
  isIconComponent,
  resolveButtonPalette,
  resolveButtonUnderline,
  type ButtonGradient,
  type ButtonResolvedSize,
} from './shared';
import type { ButtonProps, ButtonVariant, LinkButtonProps } from './types';

export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonIconComponent,
  ButtonLinkTone,
  LinkButtonProps,
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
  small: { top: 6, bottom: 6, left: 0, right: 0 },
  medium: { top: 4, bottom: 4, left: 0, right: 0 },
  large: { top: 0, bottom: 0, left: 0, right: 0 },
} as const satisfies Record<ButtonResolvedSize, NonNullable<ButtonProps['hitSlop']>>;

/** A link hugs its 16–20px line box, so it needs the most vertical slack. */
const LINK_HIT_SLOP = { top: 12, bottom: 12, left: 0, right: 0 } as const;

const SQUARE_HIT_SLOP = {
  xs: { top: 10, bottom: 10, left: 10, right: 10 },
  small: { top: 6, bottom: 6, left: 6, right: 6 },
  medium: { top: 4, bottom: 4, left: 4, right: 4 },
  large: { top: 0, bottom: 0, left: 0, right: 0 },
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
  | 'onHoverIn'
  | 'onHoverOut'
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
      <Svg style={StyleSheet.absoluteFill}>
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
  variant: variantProp = 'primary',
  size: sizeProp = 'medium',
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  iconOnly = false,
  linkTone = 'primary',
  underline,
  textVariant,
  numberOfLines,
  href,
  loading = false,
  loadingColor,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  hitSlop,
  testID,
  className,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
}) => {
  const theme = useTheme();
  // The shadcn `size="icon"` shorthand also selects the icon variant unless an
  // explicit variant was given by the caller.
  const variant: ButtonVariant =
    sizeProp === 'icon' && variantProp === 'primary' ? 'icon' : variantProp;
  const size: ButtonResolvedSize = BUTTON_SIZE_ALIAS[sizeProp];
  const geometry = BUTTON_GEOMETRY[size];
  const isIconVariant = variant === 'icon';
  const isSquare = iconOnly || isIconVariant;
  const isText = variant === 'text';
  const isLink = variant === 'link';
  const isInteractionBlocked = disabled || loading;
  const iconSize = isIconVariant ? ICON_BUTTON_ICON_SIZE[size] : geometry.iconSize;
  const palette = useMemo(
    () => resolveButtonPalette(variant, theme, linkTone),
    [variant, theme, linkTone],
  );
  const underlineMode = resolveButtonUnderline(variant, underline);

  // Pressed state drives the ACTIVE palette. Tracked through state rather than
  // Pressable's function-form `style`, which NativeWind's css-interop swallows
  // (dropping every base style with it).
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();
  // Hover exists on this fork too: a react-native-web (Metro-web) consumer
  // renders THIS file, and `linkTone="text"` is the first tone whose hover
  // changes the foreground rather than only a background the web fork's
  // stylesheet owned. On a real device no hover event is ever dispatched, so
  // `hovered` stays false and nothing about native changes.
  const { state: hovered, onIn: onHoveredIn, onOut: onHoveredOut } =
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
      : hovered && !loading
        ? palette.hover
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
      styles.width = isIconVariant ? geometry.height : iconOnlyWidth(geometry, palette.borderWidth);
      styles.paddingHorizontal = 0;
    }
    if (isText) {
      styles.paddingVertical = 4;
      styles.paddingHorizontal = 8;
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
  }, [geometry, palette, paint, theme.isDark, disabled, isSquare, isIconVariant, isText, isLink]);

  // The type ramp step (size, line height, tracking, weight) comes from the
  // typography `Text` through `variant`; only the padding and colour are ours.
  const computedTextStyle = useMemo(
    (): TextStyle => ({
      paddingHorizontal: isLink ? 0 : geometry.labelPaddingHorizontal,
      color: paint.foreground,
      ...(underlineMode === 'rest' || (underlineMode === 'hover' && hovered && !disabled)
        ? { textDecorationLine: 'underline' as const }
        : null),
    }),
    [geometry, paint.foreground, isLink, underlineMode, hovered, disabled],
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
      {iconPosition === 'left' && iconNode}
      {!isSquare && children != null && (
        <Text
          variant={textVariant ?? geometry.type}
          numberOfLines={numberOfLines}
          style={[computedTextStyle, textStyle]}
        >
          {children}
        </Text>
      )}
      {iconPosition === 'right' && iconNode}
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
      onHoverIn={isInteractionBlocked ? undefined : onHoveredIn}
      onHoverOut={isInteractionBlocked ? undefined : onHoveredOut}
      disabled={isInteractionBlocked}
      hitSlop={hitSlop ?? defaultHitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole ?? (href != null ? 'link' : 'button')}
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
            style={styles.loadingHiddenContent}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            {content}
          </View>
          <View style={styles.loadingOverlay}>
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

// Web/shadcn-aligned variants. On native they normalize to existing primitives
// (`outline → secondary`, `link → text`, `destructive → primary` tinted with the
// negative token) inside `Button`, so these stay API-parallel with the web fork.
export const OutlineButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="outline" />
));
OutlineButton.displayName = 'OutlineButton';

/**
 * `LinkButton`: an inline text action — no fill, no border, the label
 * (plus icons) in the accent or secondary colour. `variant` is its colour; pass
 * `href` to open a URL.
 */
export const LinkButton = memo(({ variant = 'primary', ...props }: LinkButtonProps) => (
  <Button {...props} variant="link" linkTone={variant} />
));
LinkButton.displayName = 'LinkButton';

export const DestructiveButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="destructive" />
));
DestructiveButton.displayName = 'DestructiveButton';
