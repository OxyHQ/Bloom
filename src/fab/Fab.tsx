import React, { memo, useEffect, useMemo, useRef, type ComponentType } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { styled } from 'react-native-css';

import { useBottomEdgeCollapsed, useBottomEdgeInset } from '../layout/bottom-edge';
import { useTheme } from '../theme/use-theme';
import { animation, borderRadius } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { pressedSurface } from '../theme/press-colors';
import { usePressAnimation } from '../hooks/use-press-animation';
import { useInteractionState } from '../hooks/use-interaction-state';
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

/**
 * How long the FAB takes to leave when the bottom edge collapses.
 *
 * A DURATION, not a spring matched to the tab bar's — because the FAB is not
 * trying to stay level with the bar any more. It tried: an earlier version rode
 * the bar down by the 14px it shrank, and on a device the two visibly did not
 * move together. The bar animates on the UI thread while this component learns
 * about the collapse through `runOnJS` plus two React renders, so it starts one
 * to three frames late — worst exactly while scrolling, which is the only time
 * it happens. No spring config fixes a variable start delay.
 *
 * Fading is what makes that latency invisible: there is no spatial relationship
 * left to violate, so nothing betrays the few frames. Slightly quicker than the
 * bar's 380ms minimize, so the FAB is gone before the eye goes looking for it.
 */
const COLLAPSE_FADE_MS = 200;

const DEFAULT_OFFSET = 16;
const DEFAULT_Z_INDEX = 50;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

/**
 * Compute the `position: absolute` anchoring for a placement. The FAB pins to
 * the nearest positioned ancestor (the consumer's column container), NOT the
 * screen — so it never escapes a constrained layout. `static` returns no
 * positioning (consumer-controlled).
 *
 * `bottomEdgeInset` applies to the BOTTOM axis only, and only for a bottom
 * placement. It is not a gap preference — `offset` is that — but the height of
 * whatever floating surface has already claimed the bottom edge, so the FAB
 * lands above a floating tab bar instead of behind it. A z-index cannot fix that
 * pairing: the bar's host is the last sibling of the app shell and paints over
 * every descendant, so the FAB has to be somewhere else, not merely on top.
 *
 * It is the RESERVED inset, so this stays a static layout value — it does not
 * shrink when the bar collapses. The FAB fades out instead of chasing the bar
 * down; see `COLLAPSE_FADE_MS` for why chasing it does not work.
 */
function placementStyle(
  placement: FabPlacement,
  offset: number,
  bottomEdgeInset: number,
): ViewStyle {
  if (placement === 'static') return {};
  const style: ViewStyle = { position: 'absolute' };
  if (placement === 'bottom-right' || placement === 'bottom-left') {
    style.bottom = offset + bottomEdgeInset;
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

// ---------------------------------------------------------------------------
//  The FAB renders ONE node — the same shape `Fab.web.tsx` renders (one
//  `<button>` carrying `className`, `style` and every visual).
//
//  It used to be two, and the split was worse than the one `Button` had: the
//  outer `Animated.View` held the placement, the `zIndex`, the press transform
//  AND the caller's `style`, while the inner `Pressable` held `className` and
//  the FAB's own chrome. So a caller's `style` and their `className` landed on
//  DIFFERENT nodes, and every layout class applied inside a box that had already
//  been positioned and sized by the wrapper. Nothing errored; the same call site
//  behaved on web and did nothing on native.
//
//  See `button/Button.tsx` for the full reasoning, including why splitting
//  classes by kind is not implementable and why both wrappers are built once at
//  module scope.
// ---------------------------------------------------------------------------

/**
 * Exactly the prop surface `Fab` hands to the pressable, and no wider — mapping
 * `WithAnimatedValue` (or `styled()`'s dot-path union) over the whole of
 * `PressableProps` overflows the checker with `TS2590`.
 */
type FabPressableProps = Pick<
  PressableProps,
  | 'accessibilityElementsHidden'
  | 'accessibilityHint'
  | 'accessibilityLabel'
  | 'accessibilityRole'
  | 'accessibilityState'
  | 'importantForAccessibility'
  | 'pointerEvents'
  | 'children'
  | 'className'
  | 'disabled'
  | 'hitSlop'
  | 'onPress'
  | 'onPressIn'
  | 'onPressOut'
  | 'testID'
> & { style?: StyleProp<ViewStyle> };

const FabPressable: ComponentType<FabPressableProps> = Pressable;

const StyledPressable: ComponentType<FabPressableProps> = styled(FabPressable, {
  className: 'style',
});
const AnimatedPressable = Animated.createAnimatedComponent(StyledPressable);

const FabComponent: React.FC<FabProps> = ({
  onPress,
  icon,
  children,
  label,
  variant = 'tertiary',
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
  const bottomEdgeInset = useBottomEdgeInset();
  // The FAB belongs to the chrome: when the chrome retracts, so does it.
  const bottomEdgeCollapsed = useBottomEdgeCollapsed();
  const theme = useTheme();
  const sizeConfig = useMemo(() => resolveSize(size), [size]);
  const isExtended = label != null && label.length > 0;
  const content = icon ?? children;

  // Only a FAB anchored to the BOTTOM edge is affected by the bottom edge
  // collapsing; a top-placed or consumer-placed one is not.
  const hidesOnCollapse = placement === 'bottom-right' || placement === 'bottom-left';
  const hidden = hidesOnCollapse && bottomEdgeCollapsed;
  const fade = useRef(new Animated.Value(1)).current;

  // An effect because RN's Animated has no declarative form — starting an
  // animation is imperative by construction. `opacity` is native-drivable, so
  // once started this never touches the JS thread again, which matters: it runs
  // while the user is mid-scroll.
  // The disabled dim rides on the SAME value rather than a second static
  // `opacity` in the style array: two opacity entries would mean the later one
  // silently wins, so a disabled FAB would either not dim or not fade.
  const restingOpacity = disabled ? 0.5 : 1;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: hidden ? 0 : restingOpacity,
      duration: COLLAPSE_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [hidden, restingOpacity, fade]);

  const { scaleAnim, onPressIn, onPressOut } = usePressAnimation(
    disabled ? undefined : animation.pressScale,
  );
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();

  const resolvedColors = useMemo(() => resolveVariant(variant, theme.colors), [variant, theme.colors]);

  // A FAB is always filled, so the held state is a state layer of its own label
  // colour over its own fill — never a wash, and never an alpha'd fill: it
  // floats over arbitrary content, so "let the page show through" would change
  // meaning with whatever it happens to be sitting on. It REPLACES the opacity
  // dip this used to carry, which was a second press vocabulary for one family.
  const pressedBackground = useMemo(
    () => pressedSurface(theme.colors, resolvedColors.background, resolvedColors.foreground),
    [theme.colors, resolvedColors.background, resolvedColors.foreground],
  );

  const containerStyle = useMemo((): ViewStyle => {
    const base: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      backgroundColor: resolvedColors.background,
      borderRadius: borderRadius.full,
      height: sizeConfig.diameter,
      // `shadow-m` — the elevated/overlay role. Hand-rolling it here meant one
      // more set of numbers to keep in step, and only the native half of the
      // split: on web these props are the deprecated path.
      ...bloomShadowStyle('m'),
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
    <AnimatedPressable
      className={className}
      style={[
        placementStyle(placement, offset, bottomEdgeInset),
        { zIndex },
        containerStyle,
        { opacity: fade },
        pressed && !disabled && { backgroundColor: pressedBackground },
        // Before the caller's `style`, so `style` keeps winning the whole array
        // the way it always has (and the way the web fork spreads it last). The
        // cost is that a caller who sets `transform` replaces the press scale
        // instead of composing with it — when the transform sat on a separate
        // wrapper node the two multiplied.
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
      // A FAB that has faded out must not be pressable or reachable — an
      // invisible target that still takes a tap is worse than a visible one.
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      onPress={disabled || hidden ? undefined : onPress}
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
    </AnimatedPressable>
  );
};

function resolveVariant(
  variant: FabVariant,
  colors: ReturnType<typeof useTheme>['colors'],
): { background: string; foreground: string } {
  switch (variant) {
    case 'secondary':
      return { background: colors.secondary, foreground: colors.secondaryForeground };
    case 'tertiary':
      return { background: colors.tertiary, foreground: colors.tertiaryForeground };
    case 'surface':
      return { background: colors.card, foreground: colors.text };
    case 'primary':
    default:
      return { background: colors.primary, foreground: colors.primaryForeground };
  }
}

export const Fab = memo(FabComponent);
Fab.displayName = 'Fab';
