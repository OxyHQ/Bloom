import React, { memo, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, FeGaussianBlur, Filter, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BUTTON_SHADOW, resolveButtonRamps } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import {
  COMPOSER_LOADER_FADE_MS,
  DEFAULT_COMPOSER_LOADER_COLORS,
  PILL_RADIUS,
  blurFilterId,
  composerLoaderGeometry,
  dashOffsetAt,
  gradientMidColor,
  type ComposerLoaderStroke,
} from './shared';
import type { ComposerLoaderProps } from './types';

/**
 * A composer loader: an iridescent light band orbiting a composer pill's
 * rim, with a soft bloom bleeding inward, while the agent works.
 *
 * Native fork. The band is the same three dash-stroke layers the web fork
 * draws (see `shared.ts`), in react-native-svg. react-native-svg ignores
 * `pathLength`, so the path-unit dashes are scaled to the measured perimeter in
 * px; the lap runs on a frame clock (`useFrameCallback`) that reproduces the
 * CSS animation's per-layer delay exactly. Blur is `feGaussianBlur`, which
 * react-native-svg 15 implements on iOS and Android.
 *
 * The component paints the pill surface itself and layers the light above it,
 * so the wrapped composer must not paint its own background while `active`.
 */

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** CSS `ease`. */
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

const LoaderStroke = memo(function LoaderStroke({
  stroke,
  time,
  speed,
  reverse,
  perimeter,
  width,
  height,
  rx,
  gradientId,
}: {
  stroke: ComposerLoaderStroke;
  time: SharedValue<number>;
  speed: number;
  reverse: boolean;
  perimeter: number;
  width: number;
  height: number;
  rx: number;
  gradientId: string;
}) {
  const unit = perimeter / 100;
  const { phase } = stroke;
  const animatedProps = useAnimatedProps(
    () => ({ strokeDashoffset: dashOffsetAt(time.value, phase, speed, reverse) * unit }),
    [time, phase, speed, reverse, unit],
  );
  return (
    <AnimatedRect
      animatedProps={animatedProps}
      x={0}
      y={0}
      width={width}
      height={height}
      rx={rx}
      ry={rx}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={stroke.strokeWidth}
      strokeLinecap="round"
      strokeDasharray={[stroke.dash * unit, (100 - stroke.dash) * unit]}
      opacity={stroke.opacity}
      filter={stroke.blur > 0 ? `url(#${blurFilterId(gradientId, stroke.blur)})` : undefined}
    />
  );
});

function ComposerLoaderComponent({
  children,
  active = true,
  colors = DEFAULT_COMPOSER_LOADER_COLORS,
  speed = 4.5,
  intensity = 0.7,
  bloom = 16,
  bloomStrength = 0.3,
  arc = 120,
  reverse = false,
  radius,
  line = 2.5,
  bloomOnly = false,
  surface = true,
  taper = 0,
  blend,
  offset = 0,
  style,
  testID,
}: ComposerLoaderProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const gradientId = `bloom-cl-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [box, setBox] = useState({ w: 640, h: 52 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ w: Math.max(1, width), h: Math.max(1, height) });
  }, []);

  const geometry = useMemo(
    () =>
      composerLoaderGeometry({
        width: box.w,
        height: box.h,
        arc,
        line,
        bloom,
        bloomStrength,
        bloomOnly,
        taper,
        reverse,
        offset,
        radius,
      }),
    [box.w, box.h, arc, line, bloom, bloomStrength, bloomOnly, taper, reverse, offset, radius],
  );

  // Frame clock: seconds since the light started. Runs while active (and
  // through the fade-out), never under reduced motion — the dashes then rest
  // at offset 0, as with `animation: none`.
  const time = useSharedValue(0);
  const clock = useFrameCallback((frame) => {
    time.value = frame.timeSinceFirstFrame / 1000;
  }, false);
  useEffect(() => {
    if (reducedMotion) {
      clock.setActive(false);
      time.value = 0;
      return;
    }
    if (active) {
      clock.setActive(true);
      return;
    }
    const stop = setTimeout(() => clock.setActive(false), COMPOSER_LOADER_FADE_MS);
    return () => clearTimeout(stop);
  }, [active, reducedMotion, clock, time]);

  const fade = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    fade.value = reducedMotion
      ? active
        ? 1
        : 0
      : withTiming(active ? 1 : 0, { duration: COMPOSER_LOADER_FADE_MS, easing: EASE });
  }, [active, reducedMotion, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }), [fade]);

  const [c0, c1, c2, c3] = colors;
  const cornerRadius = radius ?? PILL_RADIUS;
  const { neutral } = resolveButtonRamps(theme);

  const surfaceStyle: ViewStyle = {
    borderRadius: cornerRadius,
    // `bg-background-primary-default shadow-xs`.
    backgroundColor: theme.isDark ? neutral[800] : theme.colors.card,
    boxShadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
  };

  return (
    <View style={[styles.root, style]} testID={testID}>
      {surface ? (
        <View
          aria-hidden
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, surfaceStyle]}
          testID={testID ? `${testID}-surface` : undefined}
        />
      ) : null}

      <Animated.View
        aria-hidden
        pointerEvents="none"
        onLayout={onLayout}
        testID={testID ? `${testID}-light` : undefined}
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          { borderRadius: cornerRadius },
          blend ? { mixBlendMode: blend } : null,
          fadeStyle,
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
          opacity={intensity}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={c0} />
              <Stop offset="30%" stopColor={c1} />
              <Stop offset="50%" stopColor={gradientMidColor(c1, c2)} />
              <Stop offset="70%" stopColor={c2} />
              <Stop offset="100%" stopColor={c3} />
            </LinearGradient>
            {geometry.blurs.map((blur) => (
              <Filter
                key={blur}
                id={blurFilterId(gradientId, blur)}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <FeGaussianBlur stdDeviation={blur} />
              </Filter>
            ))}
          </Defs>
          {geometry.strokes.map((stroke) => (
            <LoaderStroke
              key={stroke.key}
              stroke={stroke}
              time={time}
              speed={speed}
              reverse={reverse}
              perimeter={geometry.perimeter}
              width={box.w}
              height={box.h}
              rx={geometry.rx}
              gradientId={gradientId}
            />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  clip: { overflow: 'hidden' },
  content: { position: 'relative' },
});

export const ComposerLoader = memo(ComposerLoaderComponent);
ComposerLoader.displayName = 'ComposerLoader';
