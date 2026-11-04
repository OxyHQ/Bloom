import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useMessages } from '../locale/messages';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';
import { pointerEventsStyles } from '../styles/pointer-events';
import { borderRadius } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { CAROUSEL_MESSAGES } from './messages';
import {
  CAROUSEL_DOT_SIZE,
  carouselDotWindow,
  resolveCarouselPaint,
  type CarouselDotSlot,
  type CarouselPaint,
} from './shared';
import type { CarouselDotsProps } from './types';

/**
 * A carousel's position indicator: a centred row of dots, one per slide.
 *
 *   pill   6px tall, 6 apart; the active one stretches to `activeWidth` (16)
 *   dot    6px round, 5 apart; the active one solid, the rest at
 *          `inactiveOpacity`
 *   ease   width, size, opacity and colour over `duration` (200ms), Tailwind
 *          `ease-out`; none under reduced motion
 *
 * Web eases through an adopted sheet (a CSS transition, never JS frames);
 * native drives the same values, since it has no stylesheet to carry them.
 */

/** Tailwind `ease-out`. */
const EASE_OUT_CSS = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

const STYLE_ID = 'bloom-carousel-dots-web-css';
const DOT = '[data-bloom-carousel-dot]';

const CAROUSEL_DOTS_CSS = `
${DOT} {
  outline: none;
  transition-property: width, height, opacity, background-color;
  transition-duration: var(--bloom-carousel-dots-ms, 200ms);
  transition-timing-function: ${EASE_OUT_CSS};
}
${DOT}[role="button"] {
  cursor: pointer;
}
${DOT}:focus-visible {
  outline: 2px solid var(--bloom-carousel-ring, currentColor);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
${DOT} {
  transition: none;
}
}
`;

interface DotGeometry {
  width: number;
  height: number;
  opacity: number;
}

/** Native has no stylesheet to carry the transition, so the geometry is driven. */
function useDrivenGeometry(target: DotGeometry, duration: number) {
  const values = useRef({
    width: new Animated.Value(target.width),
    height: new Animated.Value(target.height),
    opacity: new Animated.Value(target.opacity),
  }).current;

  useEffect(() => {
    if (IS_WEB) return;
    const keys = ['width', 'height', 'opacity'] as const;
    if (duration <= 0) {
      for (const key of keys) values[key].setValue(target[key]);
      return;
    }
    const run = Animated.parallel(
      keys.map((key) =>
        Animated.timing(values[key], {
          toValue: target[key],
          duration,
          easing: EASE_OUT,
          // `width`/`height` are layout properties, which the native driver cannot animate.
          useNativeDriver: false,
        }),
      ),
    );
    run.start();
    return () => run.stop();
  }, [target.width, target.height, target.opacity, duration, values]);

  return values;
}

function Dot({
  slot,
  pill,
  activeWidth,
  opacity,
  colors,
  duration,
  label,
  onPress,
}: {
  slot: CarouselDotSlot;
  pill: boolean;
  activeWidth: number;
  opacity: number;
  colors: { active: string; rest: string; hover: string };
  duration: number;
  label?: string;
  onPress?: () => void;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const geometry: DotGeometry = {
    width: pill && slot.active ? activeWidth : slot.size,
    height: slot.size,
    opacity,
  };
  const driven = useDrivenGeometry(geometry, duration);
  const backgroundColor = slot.active ? colors.active : hovered ? colors.hover : colors.rest;
  const painted = { ...geometry, borderRadius: borderRadius.full, backgroundColor };
  const data = webDataSet({ bloomCarouselDot: slot.active ? 'active' : '' });
  const nativeDot = (
    <Animated.View
      style={[painted, { width: driven.width, height: driven.height, opacity: driven.opacity }]}
    />
  );

  if (!onPress) return IS_WEB ? <View {...data} style={painted} /> : nativeDot;
  return (
    <Pressable
      {...data}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-current={slot.active}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={IS_WEB ? painted : undefined}
    >
      {IS_WEB ? null : nativeDot}
    </Pressable>
  );
}

function dotColors(paint: CarouselPaint, onMedia: boolean) {
  return onMedia
    ? { active: paint.dotOnMedia, rest: paint.dotOnMedia, hover: paint.dotOnMedia }
    : { active: paint.dotActive, rest: paint.dot, hover: paint.dotHover };
}

function CarouselDotsComponent({
  count,
  index,
  onIndexChange,
  dotLabel,
  shape = 'pill',
  appearance = 'default',
  maxDots,
  activeWidth = 16,
  activeOpacity = 1,
  inactiveOpacity,
  duration = 200,
  style,
  testID,
}: CarouselDotsProps) {
  adoptStyleSheet(STYLE_ID, CAROUSEL_DOTS_CSS);
  const theme = useTheme();
  const { messages } = useMessages(CAROUSEL_MESSAGES);
  const reducedMotion = usePrefersReducedMotion();
  const paint = useMemo(() => resolveCarouselPaint(theme), [theme]);
  const onMedia = appearance === 'onMedia';
  const colors = useMemo(() => dotColors(paint, onMedia), [paint, onMedia]);
  const restOpacity = inactiveOpacity ?? (onMedia ? 0.6 : 1);
  const ms = reducedMotion ? 0 : duration;
  const slots = carouselDotWindow(count, index, maxDots);
  if (slots.length === 0) return null;

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: shape === 'pill' ? 6 : 5,
    minHeight: CAROUSEL_DOT_SIZE,
    '--bloom-carousel-ring': paint.ring,
    '--bloom-carousel-dots-ms': `${ms}ms`,
  };

  return (
    <View
      testID={testID}
      {...(onIndexChange
        ? {}
        : {
            'aria-hidden': true,
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          })}
      style={[rowStyle, onIndexChange ? null : pointerEventsStyles.none, style]}
    >
      {slots.map((slot) => (
        <Dot
          key={slot.index}
          slot={slot}
          pill={shape === 'pill'}
          activeWidth={activeWidth}
          opacity={slot.active ? activeOpacity : restOpacity}
          colors={colors}
          duration={ms}
          label={
            onIndexChange
              ? dotLabel
                ? dotLabel(slot.index + 1)
                : messages.goToSlide(slot.index + 1)
              : undefined
          }
          onPress={onIndexChange ? () => onIndexChange(slot.index) : undefined}
        />
      ))}
    </View>
  );
}

export const CarouselDots = memo(CarouselDotsComponent);
CarouselDots.displayName = 'CarouselDots';
