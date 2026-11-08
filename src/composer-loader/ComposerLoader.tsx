import { ComposerLoaderPaintContext } from './context';
import { Surface } from '../surface';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, FeGaussianBlur, Filter, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BUTTON_SHADOW } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { useSvgIdPrefix } from '../styles/svg-id';
import {
  COMPOSER_LOADER_FADE_MS,
  resolveComposerLoaderColors,
  PILL_RADIUS,
  blurFilterId,
  composerLoaderGeometry,
  dashOffsetAt,
  gradientMidColor,
  type ComposerLoaderStroke,
} from './shared';
import type { ComposerLoaderProps } from './types';
import { useLoaderMotion } from './use-loader-motion';
import { AndroidLight } from './AndroidLight';

/**
 * A composer loader: an iridescent light band orbiting a composer pill's
 * rim, with a soft bloom bleeding inward, while the agent works.
 *
 * Native fork. The band is the same three dash-stroke layers the web fork
 * draws (see `shared.ts`). Android 12+ uses a hardware Canvas light adapter
 * when its native manager is installed; other hosts retain react-native-svg.
 * react-native-svg ignores
 * `pathLength`, so the path-unit dashes are scaled to the measured perimeter in
 * px; the lap runs on a frame clock (`useFrameCallback`) that reproduces the
 * CSS animation's per-layer delay exactly. Blur is `feGaussianBlur`, which
 * react-native-svg 15 implements on iOS and Android.
 *
 * The component paints the pill surface itself and layers the light above it,
 * and ComposerPill inherits that paint ownership through semantic context.
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
  paused = false,
  colors,
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
  const gradientId = `${useSvgIdPrefix('bloom-cl')}gradient`;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const measured = box.w > 0 && box.h > 0;
  const { moving, animate } = useLoaderMotion(active, measured && !paused);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const w = Number.isFinite(width) ? Math.max(0, width) : 0;
    const h = Number.isFinite(height) ? Math.max(0, height) : 0;
    setBox((previous) => (previous.w === w && previous.h === h ? previous : { w, h }));
  }, []);

  const geometry = useMemo(
    () =>
      composerLoaderGeometry({
        width: Math.max(1, box.w),
        height: Math.max(1, box.h),
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

  // Accumulate only active frame deltas. Reanimated resets timeSinceFirstFrame
  // on reactivation; using it would rewind the band after every pause.
  const time = useSharedValue(0);
  const clock = useFrameCallback((frame) => {
    time.value += (frame.timeSincePreviousFrame ?? 0) / 1000;
  }, false);
  useEffect(() => {
    clock.setActive(moving);
    return () => clock.setActive(false);
  }, [moving, clock]);

  const fade = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    fade.value = !animate
      ? active
        ? 1
        : 0
      : withTiming(active ? 1 : 0, { duration: COMPOSER_LOADER_FADE_MS, easing: EASE });
  }, [active, animate, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }), [fade]);

  const [c0, c1, c2, c3] = colors ?? resolveComposerLoaderColors(theme);
  const cornerRadius = radius ?? PILL_RADIUS;

  const surfaceStyle: ViewStyle = {
    borderRadius: cornerRadius,
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
        >
          {/* The plate is the shared Surface, filling its frame (its own class sets `position`,
              so it cannot be the absolutely-positioned node itself). */}
          <Surface radius={cornerRadius} style={{ flex: 1 }} />
        </View>
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
        {measured ? (
          <AndroidLight
            geometry={geometry}
            time={time}
            speed={speed}
            reverse={reverse}
            colors={[c0, c1, gradientMidColor(c1, c2), c2, c3]}
            intensity={intensity}
            width={box.w}
            height={box.h}
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
          </AndroidLight>
        ) : null}
      </Animated.View>

      <ComposerLoaderPaintContext.Provider value={active}>
        <View style={styles.content}>{children}</View>
      </ComposerLoaderPaintContext.Provider>
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
