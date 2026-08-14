import React, { useMemo, memo, type ComponentType } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { styled } from 'react-native-css';

import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import { usePressAnimation } from '../hooks/use-press-animation';
import { useInteractionState } from '../hooks/use-interaction-state';
import type { ButtonProps, ButtonSize, ButtonVariant } from './types';

export type { ButtonProps, ButtonVariant, ButtonSize } from './types';

/**
 * The shared {@link ButtonVariant}/{@link ButtonSize} types include web-only
 * additions (shadcn variants + size aliases) so a single call site type-checks
 * on both platforms. Native normalizes them to its own primitives:
 *   - `outline → secondary`, `link → text`, `destructive → primary` (tinted)
 *   - `sm|md|lg|icon` size aliases → `small|medium|large`
 */
type NativeVariant = 'primary' | 'secondary' | 'inverse' | 'icon' | 'ghost' | 'text';
type NativeSize = 'small' | 'medium' | 'large';

const SIZE_ALIAS: Record<ButtonSize, NativeSize> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
  sm: 'small',
  md: 'medium',
  lg: 'large',
  icon: 'medium',
};

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

// ---------------------------------------------------------------------------
//  The button renders ONE node — the same shape the web fork renders (one
//  `<button>`).
//
//  It used to be two: an unstyled `Animated.View` holding the press-scale
//  transform, wrapping the `Pressable` that carried `className`, `style` and
//  every visual. That wrapper — not the pressable — was the flex child of
//  whatever laid the button out, and it hugged its content, so a caller's
//  `className="flex-1"` (and `style={{ alignSelf }}`, and every other layout
//  declaration) applied INSIDE a box that never grew. Nothing errored; the same
//  call site behaved on web and did nothing on native, and consumers worked
//  around it by wrapping every Bloom `Button` in their own `<View>`.
//
//  Collapsing the two nodes settles "which node does a class belong on?" by
//  removing the choice: layout and visuals are one box here exactly as they are
//  in the DOM, so a layout class and a visual class cannot land in different
//  places. The touch target now scales with the press (0.97 — ~1px on a 40dp
//  button, and the press is registered before it starts), the same trade
//  `PressableScale` made when it dropped its own two-node structure.
//
//  `styled()` comes from Bloom's own `react-native-css` dependency rather than
//  passing `className` as a bare prop and hoping the consumer's NativeWind
//  interop recognises a component Bloom built at module scope. Same reasoning,
//  and the same silent failure if skipped, as `styles/styled-primitives.ts`.
//
//  Both wrappers are built ONCE at module scope so the element type is stable
//  across renders — one built during render remounts the subtree every time.
// ---------------------------------------------------------------------------

/**
 * Exactly the prop surface `Button` hands to the pressable, and no wider.
 * `Animated.createAnimatedComponent` maps `WithAnimatedValue` over every prop of
 * the component it wraps, and doing that to the whole of `PressableProps`
 * overflows the checker (`TS2590: union type that is too complex to represent`).
 * Narrowing is also honest: the function form of `style` is deliberately
 * excluded — see the `useInteractionState` comment in the component body for why
 * Bloom never uses it.
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
> & { style?: StyleProp<ViewStyle> };

/**
 * The same `Pressable` object, typed down to {@link ButtonPressableProps}.
 * `styled()` derives its mapping type from a dot-path union over the wrapped
 * component's ENTIRE prop type, and the one over `PressableProps` also overflows
 * the checker. Nothing changes at runtime — this is the identical component.
 */
const ButtonPressable: ComponentType<ButtonPressableProps> = Pressable;

const StyledPressable: ComponentType<ButtonPressableProps> = styled(ButtonPressable, {
  className: 'style',
});
const AnimatedPressable = Animated.createAnimatedComponent(StyledPressable);

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
  // The shadcn `size="icon"` shorthand also selects the icon variant unless an
  // explicit variant was given by the caller.
  const variant: NativeVariant = useMemo(() => {
    if (sizeProp === 'icon' && variantProp === 'primary') return 'icon';
    switch (variantProp) {
      case 'outline':
        return 'secondary';
      case 'link':
        return 'text';
      case 'destructive':
        return 'primary';
      default:
        return variantProp;
    }
  }, [variantProp, sizeProp]);
  const isDestructive = variantProp === 'destructive';
  const size: NativeSize = SIZE_ALIAS[sizeProp];
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
        styles.backgroundColor = isDestructive
          ? theme.colors.negative
          : theme.colors.primary;
        styles.borderRadius = borderRadius.full;
        break;
      case 'secondary':
        styles.backgroundColor = 'transparent';
        styles.borderWidth = 1;
        styles.borderColor = theme.colors.border;
        styles.borderRadius = borderRadius.full;
        break;
      case 'inverse':
        styles.backgroundColor = '#FFFFFF';
        styles.borderRadius = borderRadius.full;
        break;
      case 'icon':
        // Resolved tokens, not `className="bg-background border border-border"`.
        // The class form made the caller's `className` and the icon's own chrome
        // compete for one slot — `<IconButton className="flex-1" />` replaced the
        // default and shipped a transparent, borderless icon button — and it left
        // the chrome dependent on the consumer's Tailwind pipeline resolving
        // Bloom's color names. These are the SAME tokens `Button.web.tsx`'s
        // `resolveVariantStyle('icon')` already writes inline.
        styles.backgroundColor = theme.colors.background;
        styles.borderWidth = 1;
        styles.borderColor = theme.colors.border;
        styles.borderRadius = borderRadius.full;
        styles.padding = 8;
        styles.width = sizeConfig.minHeight;
        styles.height = sizeConfig.minHeight;
        break;
      case 'ghost':
        styles.backgroundColor = 'transparent';
        styles.borderRadius = borderRadius.full;
        break;
      case 'text':
        styles.backgroundColor = 'transparent';
        styles.borderRadius = borderRadius.full;
        styles.paddingVertical = 4;
        styles.paddingHorizontal = 8;
        break;
    }

    return styles;
  }, [variant, size, theme, isDestructive]);

  const resolvedTextColor = useMemo((): string => {
    switch (variant) {
      case 'primary':
        return isDestructive
          ? theme.colors.negativeForeground
          : theme.colors.primaryForeground;
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
  }, [variant, theme, isDestructive]);

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
    <AnimatedPressable
      className={className}
      style={[
        baseStyles,
        disabled && !loading && { opacity: 0.5 },
        pressed && !hasScaleFeedback && !isInteractionBlocked && { opacity: resolvedActiveOpacity },
        // Before the caller's `style`, so `style` keeps winning the whole array
        // the way it always has (and the way the web fork spreads it last). The
        // cost is that a caller who sets `transform` on a scale variant replaces
        // the press scale instead of composing with it — when the transform sat
        // on a separate wrapper node the two multiplied.
        hasScaleFeedback ? { transform: [{ scale: scaleAnim }] } : null,
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
      // `aria-busy` matches what `Button.web.tsx` emits, so a loading button
      // announces the same thing whichever fork a bundler resolves.
      // react-native-web never reads `accessibilityState`; React Native folds
      // `aria-busy` back into it. The disabled half travels on the `disabled`
      // prop above, which both platforms map.
      aria-busy={loading || undefined}
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
    </AnimatedPressable>
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

export const LinkButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="link" />
));
LinkButton.displayName = 'LinkButton';

export const DestructiveButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="destructive" />
));
DestructiveButton.displayName = 'DestructiveButton';
