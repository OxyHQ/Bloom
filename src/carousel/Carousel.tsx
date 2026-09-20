import React, {
  Children,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { CarouselContext, CarouselItemIndexContext } from './context';
import type { CarouselItemProps, CarouselProps } from './types';

/**
 * A gallery carousel: a horizontal run of slides you scroll through, with
 * prev/next buttons above and a position indicator below.
 *
 *   column     gap 16
 *   arrows     right-aligned row, gap 8, small secondary icon buttons
 *              (Bloom's pill `Button`, sized to a 32px square icon button)
 *   track      native horizontal scrolling that SNAPS to each slide — CSS
 *              `scroll-snap` on web, `snapToOffsets` on native — gap 16
 *   dots       centred row, gap 6; 6px tall pills, the active one 16 wide in
 *              `text-primary`, the rest 6 wide in `background-tertiary`
 *              (hover `border-button-active`), width/colour eased 200ms
 *
 * The track is a real scroller rather than a transformed strip, so swipe,
 * trackpad, momentum and (on web) keyboard scrolling all come free.
 * Slide positions are MEASURED (`onLayout`), never derived from a width, so
 * slides of different widths keep working. The two ends are pinned rather than
 * measured: at the far end the last slide can never reach the left edge, so a
 * nearest-slide search would never light the last dot.
 */

const IS_WEB = Platform.OS === 'web';

/** `transition-all duration-200 ease-out` on the dots. */
const DOT_TRANSITION_MS = 200;
const DOT_HEIGHT = 6;
const DOT_WIDTH = 6;
const DOT_ACTIVE_WIDTH = 16;

interface CarouselPaint {
  dotActive: string;
  dot: string;
  dotHover: string;
  ring: string;
}

/**
 * Every colour the carousel paints (the arrows are `Button`'s own). Pure.
 *
 *   dot active   text/primary
 *   dot          background/tertiary/default   neutral-200  (dark neutral-800)
 *   dot hover    border/button/active          neutral-400  (dark neutral-600)
 */
export function resolveCarouselPaint(theme: Theme): CarouselPaint {
  const { accent } = resolveButtonRamps(theme);
  return {
    dotActive: theme.colors.text,
    dot: theme.colors.backgroundSecondary,
    dotHover: theme.colors.textSecondary,
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Web CSS
//
//  Scroll snapping, the hidden scrollbar, the track's keyboard focus ring and
//  the dots' eased width/colour have no inline-style spelling, so they live in
//  an adopted sheet hanging off `dataSet` attributes (a class never reaches
//  the DOM through react-native-web). `adoptStyleSheet` no-ops without a
//  `document`, so native pays for a hook call and nothing else.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-carousel-web-css';
const TRACK = '[data-bloom-carousel-track]';
const DOT = '[data-bloom-carousel-dot]';

const BLOOM_CAROUSEL_CSS = `
${TRACK} {
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  outline: none;
}
${TRACK}::-webkit-scrollbar {
  display: none;
}
${TRACK}:focus-visible {
  outline: 2px solid var(--bloom-carousel-ring, currentColor);
  outline-offset: 2px;
}
${TRACK} [data-bloom-carousel-item] {
  scroll-snap-align: start;
}
${TRACK}[data-bloom-carousel-track="center"] [data-bloom-carousel-item] {
  scroll-snap-align: center;
}
${DOT} {
  cursor: pointer;
  outline: none;
  transition: width ${DOT_TRANSITION_MS}ms ease-out, background-color ${DOT_TRANSITION_MS}ms ease-out;
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

// ---------------------------------------------------------------------------
//  Slide
// ---------------------------------------------------------------------------

const CarouselItemComponent = function CarouselItem({
  children,
  width,
  accessibilityLabel,
  style,
  testID,
}: CarouselItemProps) {
  const ctx = useContext(CarouselContext);
  const index = useContext(CarouselItemIndexContext);
  const reportOffset = ctx?.reportOffset;

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, width: w } = event.nativeEvent.layout;
      reportOffset?.(index, x, w);
    },
    [reportOffset, index],
  );

  const slideWidth = width ?? (ctx && ctx.trackWidth > 0 ? ctx.trackWidth : undefined);

  return (
    <View
      {...webDataSet({ bloomCarouselItem: '' })}
      role="group"
      {...(IS_WEB ? { 'aria-roledescription': 'slide' } : {})}
      accessibilityLabel={accessibilityLabel ?? (ctx ? `${index + 1} of ${ctx.count}` : undefined)}
      onLayout={onLayout}
      style={[{ flexShrink: 0 }, slideWidth != null ? { width: slideWidth } : null, style]}
      testID={testID}
    >
      {children}
    </View>
  );
};

export const CarouselItem = memo(CarouselItemComponent);
CarouselItem.displayName = 'CarouselItem';

// ---------------------------------------------------------------------------
//  Dot
// ---------------------------------------------------------------------------

function CarouselDot({
  active,
  paint,
  label,
  reducedMotion,
  onPress,
}: {
  active: boolean;
  paint: CarouselPaint;
  label: string;
  reducedMotion: boolean;
  onPress: () => void;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  // Native has no stylesheet to carry the width transition, so it is driven.
  const width = useRef(new Animated.Value(active ? DOT_ACTIVE_WIDTH : DOT_WIDTH)).current;

  useEffect(() => {
    if (IS_WEB) return;
    const to = active ? DOT_ACTIVE_WIDTH : DOT_WIDTH;
    if (reducedMotion) {
      width.setValue(to);
      return;
    }
    Animated.timing(width, {
      toValue: to,
      duration: DOT_TRANSITION_MS,
      // `width` is a layout property, which the native driver cannot animate.
      useNativeDriver: false,
    }).start();
  }, [active, reducedMotion, width]);

  const background = active ? paint.dotActive : hovered ? paint.dotHover : paint.dot;

  return (
    <Pressable
      {...webDataSet({ bloomCarouselDot: '' })}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-current={active}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={
        IS_WEB
          ? {
              height: DOT_HEIGHT,
              width: active ? DOT_ACTIVE_WIDTH : DOT_WIDTH,
              borderRadius: borderRadius.full,
              backgroundColor: background,
            }
          : undefined
      }
    >
      {IS_WEB ? null : (
        <Animated.View
          style={{
            height: DOT_HEIGHT,
            width,
            borderRadius: borderRadius.full,
            backgroundColor: background,
          }}
        />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Carousel
// ---------------------------------------------------------------------------

interface SlideOffset {
  x: number;
  width: number;
}

const CarouselComponent = function Carousel({
  children,
  accessibilityLabel,
  showArrows = true,
  showDots = true,
  align = 'start',
  gap = 16,
  onIndexChange,
  previousLabel = 'Previous slide',
  nextLabel = 'Next slide',
  dotLabel,
  style,
  testID,
}: CarouselProps) {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, BLOOM_CAROUSEL_CSS);
  const reducedMotion = useReducedMotion();
  const paint = useMemo(() => resolveCarouselPaint(theme), [theme]);

  const slides = Children.toArray(children).filter(isValidElement);
  const count = slides.length;

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<SlideOffset[]>([]);
  const scroll = useRef({ x: 0, contentWidth: 0 });
  const [trackWidth, setTrackWidth] = useState(0);
  const [snapOffsets, setSnapOffsets] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const activeRef = useRef(active);

  const measure = useCallback(() => {
    const { x, contentWidth } = scroll.current;
    const viewport = trackWidth;
    // 1px of slack: offsets are fractional on hi-DPI displays, so an exact
    // comparison leaves the end arrow enabled on a fully scrolled track.
    const start = x <= 1;
    const end = viewport > 0 && contentWidth > 0 && x >= contentWidth - viewport - 1;
    setAtStart(start);
    setAtEnd(end);

    const all = offsets.current.slice(0, count);
    if (all.length === 0) return;

    let next: number;
    if (end) {
      next = count - 1;
    } else if (start) {
      next = 0;
    } else {
      next = 0;
      let shortest = Number.POSITIVE_INFINITY;
      all.forEach((item, index) => {
        if (!item) return;
        const distance = Math.abs(item.x - x);
        if (distance < shortest) {
          shortest = distance;
          next = index;
        }
      });
    }
    setActive(next);
    if (next !== activeRef.current) {
      activeRef.current = next;
      onIndexChangeRef.current?.(next);
    }
  }, [count, trackWidth]);

  const targetFor = useCallback(
    (item: SlideOffset) => {
      const raw = align === 'center' ? item.x - (trackWidth - item.width) / 2 : item.x;
      const max = Math.max(0, scroll.current.contentWidth - trackWidth);
      return Math.min(Math.max(0, raw), max);
    },
    [align, trackWidth],
  );

  const recomputeSnaps = useCallback(() => {
    if (IS_WEB) return; // CSS scroll-snap owns snapping on web.
    const all = offsets.current.slice(0, count);
    if (all.length !== count || all.some((o) => !o)) return;
    setSnapOffsets(all.map(targetFor));
  }, [count, targetFor]);

  const reportOffset = useCallback(
    (index: number, x: number, width: number) => {
      offsets.current[index] = { x, width };
      recomputeSnaps();
      measure();
    },
    [measure, recomputeSnaps],
  );

  useEffect(() => {
    recomputeSnaps();
    measure();
  }, [recomputeSnaps, measure]);

  const scrollToIndex = (index: number) => {
    const target = offsets.current[Math.max(0, Math.min(index, count - 1))];
    if (!target) return;
    scrollRef.current?.scrollTo({ x: targetFor(target), animated: !reducedMotion });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize } = event.nativeEvent;
    scroll.current = { x: contentOffset.x, contentWidth: contentSize.width };
    measure();
  };

  const onContentSizeChange = (width: number) => {
    scroll.current = { ...scroll.current, contentWidth: width };
    recomputeSnaps();
    measure();
  };

  const contextValue = useMemo(
    () => ({ trackWidth, count, reportOffset }),
    [trackWidth, count, reportOffset],
  );

  const trackStyle: WebCssStyle = {
    width: '100%',
    // The `:focus-visible` ring colour, read by the adopted sheet.
    '--bloom-carousel-ring': paint.ring,
  };

  return (
    <View
      role="group"
      {...(IS_WEB ? { 'aria-roledescription': 'carousel' } : {})}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: '100%', flexDirection: 'column', gap: 16 }, style]}
      testID={testID}
    >
      {showArrows && count > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="sm" icon={RiArrowLeftSLine} accessibilityLabel={previousLabel} disabled={atStart} onPress={() => scrollToIndex(active - 1)} appearance="subtle" tone="neutral" />
          <Button size="sm" icon={RiArrowRightSLine} accessibilityLabel={nextLabel} disabled={atEnd} onPress={() => scrollToIndex(active + 1)} appearance="subtle" tone="neutral" />
        </View>
      ) : null}

      <CarouselContext.Provider value={contextValue}>
        <ScrollView
          ref={scrollRef}
          {...webDataSet({ bloomCarouselTrack: align })}
          // Focusable so the arrow keys scroll it once it has focus, the
          // browser's own behaviour (`tabIndex={0}`).
          {...(IS_WEB ? { tabIndex: 0 } : {})}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onContentSizeChange={onContentSizeChange}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          snapToOffsets={IS_WEB ? undefined : snapOffsets}
          decelerationRate={IS_WEB ? undefined : 'fast'}
          disableIntervalMomentum
          style={trackStyle}
          contentContainerStyle={{ gap }}
        >
          {slides.map((child, index) => (
            <CarouselItemIndexContext.Provider key={child.key ?? index} value={index}>
              {child}
            </CarouselItemIndexContext.Provider>
          ))}
        </ScrollView>
      </CarouselContext.Provider>

      {showDots && count > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: count }, (_, index) => (
            <CarouselDot
              key={index}
              active={index === active}
              paint={paint}
              label={dotLabel ? dotLabel(index + 1) : `Go to slide ${index + 1}`}
              reducedMotion={reducedMotion}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const Carousel = memo(CarouselComponent);
Carousel.displayName = 'Carousel';
