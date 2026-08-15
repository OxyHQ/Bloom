import React, { memo, useMemo, type ComponentType } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { styled } from 'react-native-css';
import { BlurView } from 'expo-blur';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius } from '../styles/tokens';
import { pressedSurface } from '../theme/press-colors';
import { usePressAnimation } from '../hooks/use-press-animation';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  applyIconColor,
  resolveFrostedPalette,
  resolveFrostedSize,
} from './shared';
import type { FrostedIconButtonProps } from './types';

export type { FrostedIconButtonProps, FrostedIconButtonSize } from './types';

const DEFAULT_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

// BlurView intensity (0–100). A gentle frost so the chip reads over an image
// without smearing the content behind it. The `active` (solid) state has none.
const BLUR_INTENSITY = 24;

// ---------------------------------------------------------------------------
//  ONE node, like `Fab` and `Button` and like this component's own `.web.tsx`
//  fork (a single `<button>`). It used to be an unstyled `Animated.View` holding
//  the press transform and the caller's `style`, wrapping the `Pressable` that
//  carried `className` and the chrome — so `style` and `className` landed on
//  DIFFERENT nodes and every layout class applied inside a box the parent had
//  already laid out. Silent on native, correct on web. Full reasoning in
//  `button/Button.tsx`.
// ---------------------------------------------------------------------------

/** The prop surface handed to the pressable, narrowed to avoid `TS2590`. */
type FrostedPressableProps = Pick<
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
> & { style?: StyleProp<ViewStyle>; 'aria-pressed'?: boolean };

const FrostedPressable: ComponentType<FrostedPressableProps> = Pressable;

const StyledPressable: ComponentType<FrostedPressableProps> = styled(FrostedPressable, {
  className: 'style',
});
const AnimatedPressable = Animated.createAnimatedComponent(StyledPressable);

const FrostedIconButtonComponent: React.FC<FrostedIconButtonProps> = ({
  onPress,
  icon,
  children,
  active = false,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  accessibilityHint,
  style,
  className,
  testID,
  hitSlop,
}) => {
  const theme = useTheme();
  const geo = useMemo(() => resolveFrostedSize(size), [size]);
  const palette = useMemo(
    () => resolveFrostedPalette(theme.colors, theme.isDark),
    [theme.colors, theme.isDark],
  );

  const { scaleAnim, onPressIn: onScalePressIn, onPressOut: onScalePressOut } =
    usePressAnimation(disabled ? undefined : animation.pressScale);
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();

  const handlePressIn = disabled
    ? undefined
    : () => {
        onScalePressIn();
        onPressedIn();
      };
  const handlePressOut = disabled
    ? undefined
    : () => {
        onScalePressOut();
        onPressedOut();
      };

  const held = pressed && !disabled;
  // This is the one family that already HAD a background press. What it did not
  // have was one distinct from hover — both landed on `surfaceHover`, and the
  // scale was carrying the whole difference. The held state now steps beyond it,
  // from `surfaceHover` rather than from rest, because on web a press is always
  // also a hover. Off the ACTIVE state the layer is `colors.text`, the same hue
  // the frosted surface is a tint of — so the composite is that tint at a higher
  // alpha, which is the right answer over arbitrary media and needs no fourth
  // palette member.
  const restSurface = active ? palette.activeSurface : palette.surface;
  const surface = held
    ? active
      ? pressedSurface(theme.colors, palette.activeSurface, palette.activeIcon)
      : pressedSurface(theme.colors, palette.surfaceHover, theme.colors.text)
    : restSurface;
  const ring = held ? palette.ringHover : palette.ring;
  const iconColor = active ? palette.activeIcon : palette.icon;

  const containerStyle = useMemo((): ViewStyle => {
    return {
      width: geo.diameter,
      height: geo.diameter,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: ring,
      // Soft shadow lives on the (non-clipping) Pressable so it renders on iOS —
      // the blur/tint are clipped by an inner overflow:hidden layer instead.
      //
      // Deliberately NOT `bloomShadowStyle`: the role tokens fix the colour at
      // black, and this chip's whole job is to read over ARBITRARY media, so its
      // shadow colour is theme-derived (`palette.shadow`, alpha included, hence
      // `shadowOpacity: 1`) and must survive in dark mode where a black shadow
      // over dark artwork gives no edge at all. Every other hand-rolled shadow in
      // the package was folded into the tokens; this one is the exception, on
      // purpose.
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    };
  }, [geo.diameter, ring, palette.shadow]);

  const content = icon ?? children;

  return (
    <AnimatedPressable
      className={className}
      style={[
        containerStyle,
        disabled && styles.disabled,
        // Before the caller's `style`, so `style` still wins the array. A caller
        // who sets `transform` now replaces the press scale instead of
        // composing with it — the trade `Button` made for the same reason.
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop ?? DEFAULT_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      // `aria-pressed` matches what the `.web.tsx` fork emits, so the same
      // button announces the same state whichever fork a bundler picks.
      // Both spellings are needed: react-native-web ignores
      // `accessibilityState`, React Native has no `aria-pressed`.
      accessibilityState={{ disabled, selected: active }}
      aria-pressed={active}
      testID={testID}
    >
      {/* Clip layer: blur (frosted only) + translucent/solid tint, rounded. */}
      <View style={[StyleSheet.absoluteFill, styles.clip]}>
        {!active && (
          <BlurView
            intensity={BLUR_INTENSITY}
            tint={theme.isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: surface }]} />
      </View>
      {content != null && (
        <View
          style={{
            width: geo.iconBox,
            height: geo.iconBox,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {applyIconColor(content, iconColor)}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  clip: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
});

export const FrostedIconButton = memo(FrostedIconButtonComponent);
FrostedIconButton.displayName = 'FrostedIconButton';
