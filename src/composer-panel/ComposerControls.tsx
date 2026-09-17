import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { paintToCssImage, type ButtonStatePaint } from '../button/shared';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiMic2Line } from '../icons/remix/RiMic2Line';
import type { WebCssStyle } from '../styles/web-view-style';
import { CONTROL_SIZE, TRANSITION_MS, type ComposerPalette } from './shared';
import { dataHook, IS_WEB } from './web-hooks';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** Staggered clocks and heights so the bars read as live audio, not a loop. */
const MIC_BARS = [
  { height: 8, duration: 900, delay: -400 },
  { height: 15, duration: 700, delay: -150 },
  { height: 11, duration: 1050, delay: -600 },
  { height: 14, duration: 800, delay: -300 },
] as const;

/** One equalizer bar: CSS keyframes on web, a reanimated loop on native. */
function MicBar({ bar, color }: { bar: (typeof MIC_BARS)[number]; color: string }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(0.7);
  useEffect(() => {
    if (IS_WEB) return;
    if (reducedMotion) {
      scale.value = 0.7;
      return;
    }
    const half = bar.duration / 2;
    scale.value = 0.4;
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing: EASE_IN_OUT }),
        withTiming(0.4, { duration: half, easing: EASE_IN_OUT }),
      ),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [bar.duration, reducedMotion, scale]);
  const nativeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }), [scale]);

  const base = { width: 2.5, height: bar.height, borderRadius: 9999, backgroundColor: color };
  if (IS_WEB) {
    // The keyframes live in the family sheet; each bar runs its own clock.
    const web: WebCssStyle = reducedMotion
      ? { ...base, transform: [{ scaleY: 0.7 }] }
      : { ...base, animation: `bloom-composer-mic-bars ${bar.duration}ms ease-in-out ${bar.delay}ms infinite` };
    return <View style={web} />;
  }
  return <Animated.View style={[base, nativeStyle]} />;
}

/** A layer that blurs/scales out to 0.8 as it leaves and back in as it arrives (280ms ease-out). */
function SwapLayer({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion ? (shown ? 1 : 0) : withTiming(shown ? 1 : 0, { duration: 280, easing: EASE_OUT });
  }, [shown, reducedMotion, progress]);
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: 0.8 + 0.2 * progress.value }],
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${3 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * Voice input: a 36px bordered white disc with
 * shadow-xs whose mic crossfades to four dancing accent-500 bars (2.5 wide, 2.5
 * apart) while listening.
 */
export function MicButton({
  listening,
  onToggle,
  label,
  palette,
}: {
  listening: boolean;
  onToggle: () => void;
  label: string;
  palette: ComposerPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    position: 'relative',
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: hovered ? palette.hover : palette.surface,
    boxShadow: palette.shadowXs,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <Pressable
      {...dataHook('bloomComposerControl')}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-pressed={listening}
      accessibilityState={{ selected: listening }}
      onPress={onToggle}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <SwapLayer shown={listening}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.5 }}>
          {MIC_BARS.map((bar, index) => (
            <MicBar key={index} bar={bar} color={palette.accent500} />
          ))}
        </View>
      </SwapLayer>
      <SwapLayer shown={!listening}>
        <RiMic2Line width={20} height={20} fill={palette.iconPrimary} />
      </SwapLayer>
    </Pressable>
  );
}

let gradientId = 0;

/** A two-stop top-to-bottom fill: a CSS gradient on web, an SVG rect on native. */
function GradientFill({ paint, opacity = 1 }: { paint: ButtonStatePaint; opacity?: number }) {
  const id = useMemo(() => `bloom-composer-send-${gradientId++}`, []);
  const [top, bottom] = paint.gradient ?? [paint.background, paint.background];
  if (IS_WEB) {
    const style: WebCssStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 9999,
      backgroundImage: paintToCssImage(paint),
      opacity,
      transitionProperty: 'opacity',
      transitionDuration: `${TRANSITION_MS}ms`,
      transitionTimingFunction: 'ease',
    };
    return <View pointerEvents="none" style={style} />;
  }
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={CONTROL_SIZE / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * Send (`bg-button-primary` disc): the accent gradient, its hover
 * gradient crossfading in over 150ms, the active gradient while held; disabled
 * paints the disabled gradient at 40% opacity (200ms). White 20px arrow.
 */
export function SendButton({
  disabled,
  onPress,
  label,
  palette,
}: {
  disabled: boolean;
  onPress: () => void;
  label: string;
  palette: ComposerPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const paint = palette.send;
  const base = disabled ? paint.disabled : pressed ? paint.active : paint.rest;
  const style: WebCssStyle = {
    position: 'relative',
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'auto' : 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <Pressable
      {...dataHook('bloomComposerControl', 'send')}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <GradientFill paint={base} />
      {disabled ? null : <GradientFill paint={paint.hover} opacity={hovered && !pressed ? 1 : 0} />}
      {/* Its own positioned box, so it paints above the absolutely placed fills. */}
      <View pointerEvents="none" style={{ position: 'relative', width: 20, height: 20 }}>
        <RiArrowUpLine width={20} height={20} fill="#ffffff" />
      </View>
    </Pressable>
  );
}
