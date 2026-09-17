import React, { memo, useEffect, useState } from 'react';
import { Image, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { AuthMediaCarouselProps, AuthMediaSlide } from './types';

/**
 * Auto-advancing artwork for the auth card's `media` slot.
 *
 * A four-beat cycle rather than a plain slide: the image fills the panel edge
 * to edge; when its turn is up it SHRINKS into a rounded card (scale 0.82,
 * radius 24, 450ms) and HOLDS (200ms), then SLIDES left (700ms) while the next
 * one rides in beside it already card-sized (0.8), then GROWS back to full
 * bleed (500ms). The travel happens in depth: the panel holds an 850px
 * perspective and cards leave/arrive pushed back 220px along Z and turned 48°
 * on Y, as though on a drum turning past the viewer.
 *
 * Only the slides moving in a beat transition; everything else is repositioned
 * instantly, so the one leaving on the left can jump to the back of the queue
 * without streaking across. Dots at the bottom (6px, the current one 20px wide
 * at 90%, the rest 45%) follow the index over 500ms ease-out.
 *
 * `translateZ` has no React Native equivalent, so the push-back is expressed as
 * the projection it produces: with perspective P = 850 and depth D = 220,
 * `translateX(t) translateZ(-D)` under the parent's perspective equals
 * `perspective(P) translateX(t·k) scale(k)` with k = P / (P + D) — exact for
 * every point of the rotated card, derived rather than eyeballed, and it runs
 * identically on web and native.
 *
 * Holds on the first slide under reduced motion.
 */

/** Card state: shrunk to a rounded tile, and the size it rides in at. */
const CARD_SCALE = 0.82;
const ENTER_SCALE = 0.8;
const CARD_RADIUS = 24;

/** How deep the drum is, and how far the cards turn on it. */
const PERSPECTIVE = 850;
const DEPTH = 220;
const TILT = 48;
const DEPTH_SCALE = PERSPECTIVE / (PERSPECTIVE + DEPTH);

const SHRINK_MS = 450;
const HOLD_MS = 200;
const SLIDE_MS = 700;
const GROW_MS = 500;
const DOT_MS = 500;

/** Tailwind `ease-in-out` / `ease-out`. */
const EASE_IN_OUT = Easing.bezier(0.4, 0, 0.2, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

/**
 * `idle`   at rest, full bleed
 * `shrink` pulling back into a card, then holding
 * `slide`  travelling left while the next one rides in
 * `enter`  the frame where the new slide takes over, before it grows
 */
type Phase = 'idle' | 'shrink' | 'slide' | 'enter';

const NEXT_PHASE: Record<Phase, Phase> = {
  idle: 'shrink',
  shrink: 'slide',
  slide: 'enter',
  enter: 'idle',
};

interface Pose {
  /** Horizontal offset as a fraction of the panel width. */
  x: number;
  /** 1 at the front of the drum, {@link DEPTH_SCALE} pushed back. */
  depth: number;
  /** rotateY in degrees. */
  rotate: number;
  scale: number;
  radius: number;
}

function poseFor(position: number, phase: Phase): Pose {
  const current = position === 0;
  const upNext = position === 1;
  const radius = current && phase === 'idle' ? 0 : CARD_RADIUS;
  if (current) {
    if (phase === 'slide') {
      return { x: -1, depth: DEPTH_SCALE, rotate: -TILT, scale: CARD_SCALE, radius };
    }
    if (phase === 'shrink') return { x: 0, depth: 1, rotate: 0, scale: CARD_SCALE, radius };
    if (phase === 'enter') return { x: 0, depth: 1, rotate: 0, scale: ENTER_SCALE, radius };
    return { x: 0, depth: 1, rotate: 0, scale: 1, radius };
  }
  if (upNext && phase === 'slide') {
    return { x: 0, depth: 1, rotate: 0, scale: ENTER_SCALE, radius };
  }
  return { x: 1, depth: DEPTH_SCALE, rotate: TILT, scale: ENTER_SCALE, radius };
}

function drive(value: SharedValue<number>, target: number, duration: number | null) {
  value.value = duration == null ? target : withTiming(target, { duration, easing: EASE_IN_OUT });
}

const Slide = memo(function Slide({
  slide,
  pose,
  duration,
  width,
  testID,
}: {
  slide: AuthMediaSlide;
  pose: Pose;
  /** `null` repositions instantly. */
  duration: number | null;
  width: number;
  testID?: string;
}) {
  const x = useSharedValue(pose.x);
  const depth = useSharedValue(pose.depth);
  const rotate = useSharedValue(pose.rotate);
  const scale = useSharedValue(pose.scale);
  const radius = useSharedValue(pose.radius);

  useEffect(() => {
    drive(x, pose.x, duration);
    drive(depth, pose.depth, duration);
    drive(rotate, pose.rotate, duration);
    drive(scale, pose.scale, duration);
    drive(radius, pose.radius, duration);
  }, [pose.x, pose.depth, pose.rotate, pose.scale, pose.radius, duration, x, depth, rotate, scale, radius]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      borderRadius: radius.value,
      transform: [
        { perspective: PERSPECTIVE },
        { translateX: x.value * width * depth.value },
        { scale: depth.value },
        { rotateY: `${rotate.value}deg` },
        { scale: scale.value },
      ],
    }),
    [width, x, depth, rotate, scale, radius],
  );

  const source = typeof slide.source === 'string' ? { uri: slide.source } : slide.source;
  const decorative = !slide.alt;

  return (
    <Animated.View
      testID={testID}
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
        animatedStyle,
      ]}>
      <Image
        source={source}
        resizeMode="cover"
        accessibilityLabel={slide.alt}
        accessibilityIgnoresInvertColors
        accessibilityElementsHidden={decorative}
        importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
        aria-hidden={decorative || undefined}
        style={{ width: '100%', height: '100%' }}
      />
    </Animated.View>
  );
});

function Dot({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    const target = active ? 1 : 0;
    progress.value = reducedMotion
      ? target
      : withTiming(target, { duration: DOT_MS, easing: EASE_OUT });
  }, [active, reducedMotion, progress]);
  const style = useAnimatedStyle(() => ({
    width: 6 + 14 * progress.value,
    opacity: 0.45 + 0.45 * progress.value,
  }), [progress]);
  return (
    <Animated.View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height: 6, borderRadius: 9999, backgroundColor: '#FFFFFF' }, style]}
    />
  );
}

function AuthMediaCarouselComponent({
  slides,
  interval = 3200,
  style,
  testID,
}: AuthMediaCarouselProps) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [width, setWidth] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || reducedMotion) return;
    // `enter` is only a re-labelling: the incoming slide takes position 0 at the
    // size it was already drawn at, and needs a frame before the grow starts.
    const delay = {
      idle: interval,
      shrink: SHRINK_MS + HOLD_MS,
      slide: SLIDE_MS,
      enter: 20,
    }[phase];
    const timer = setTimeout(() => {
      if (phase === 'slide') setIndex((current) => (current + 1) % count);
      setPhase(NEXT_PHASE[phase]);
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, count, interval, reducedMotion]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const beatDuration = phase === 'slide' ? SLIDE_MS : phase === 'shrink' ? SHRINK_MS : GROW_MS;

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
        style,
      ]}>
      {/* Nothing until the panel is measured: the queued slides are placed a
          panel-width to the right, and at width 0 they would stack over the
          current one for a frame. */}
      {width > 0 ? slides.map((slide, slideIndex) => {
        // 0 is the slide in play, 1 is next in the queue, the rest wait right.
        const position = (slideIndex - index + count) % count;
        const moving = position === 0 || (position === 1 && phase === 'slide');
        const animate = moving && phase !== 'enter' && !reducedMotion;
        return (
          <Slide
            key={typeof slide.source === 'string' ? slide.source : slideIndex}
            testID={testID ? `${testID}-slide-${slideIndex}` : undefined}
            slide={slide}
            pose={poseFor(position, phase)}
            duration={animate ? beatDuration : null}
            width={width}
          />
        );
      }) : null}

      {count > 1 ? (
        <View
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 16,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}>
          {slides.map((slide, slideIndex) => (
            <Dot
              key={typeof slide.source === 'string' ? slide.source : slideIndex}
              active={slideIndex === index}
              reducedMotion={reducedMotion}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const AuthMediaCarousel = memo(AuthMediaCarouselComponent);
