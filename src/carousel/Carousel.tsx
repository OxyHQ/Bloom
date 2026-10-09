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
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useMessages } from '../locale/messages';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { CarouselContext, CarouselItemIndexContext } from './context';
import { CAROUSEL_MESSAGES } from './messages';
import type { CarouselItemProps, CarouselProps } from './types';

/**
 * A gallery carousel: a horizontal run of slides you scroll through, with
 * prev/next buttons above and a position indicator below.
 *
 *   column     gap 16
 *   header     optional leading content of the arrows row (a title)
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
  scroll-padding-inline: var(--bloom-carousel-inset, 0px);
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
  const { messages } = useMessages(CAROUSEL_MESSAGES);
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
      {...(IS_WEB ? { 'aria-roledescription': messages.slideRole } : {})}
      accessibilityLabel={accessibilityLabel ?? (ctx ? messages.slideOf(index + 1, ctx.count) : undefined)}
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

/**
 * A place the track can come to rest, and the slide it stands for. Slides
 * narrower than the track share one: every slide that cannot reach the start
 * edge clamps to the same end offset, so the end is ONE stop however many slides
 * it holds.
 */
interface Stop {
  offset: number;
  slide: number;
}

/**
 * Collapse per-slide resting offsets (ascending) into distinct stops, 1px of
 * slack for fractional hi-DPI offsets. A shared stop stands for its FIRST slide,
 * except the end, which stands for the LAST — the far end is where the last
 * slide is, and naming anything else would leave it unreachable.
 */
function toStops(resting: readonly number[]): Stop[] {
  const stops: Stop[] = [];
  resting.forEach((offset, slide) => {
    const last = stops[stops.length - 1];
    if (last && Math.abs(offset - last.offset) <= 1) return;
    stops.push({ offset, slide });
  });
  const end = stops[stops.length - 1];
  if (end) end.slide = resting.length - 1;
  return stops;
}

const CarouselComponent = function Carousel({
  children,
  accessibilityLabel,
  header,
  showArrows = true,
  arrowsPlacement = 'header',
  showDots = true,
  align = 'start',
  gap = 16,
  inset = 0,
  onIndexChange,
  previousLabel: previousLabelProp,
  nextLabel: nextLabelProp,
  dotLabel,
  style,
  testID,
}: CarouselProps) {
  const { messages } = useMessages(CAROUSEL_MESSAGES);
  const previousLabel = previousLabelProp ?? messages.previousSlide;
  const nextLabel = nextLabelProp ?? messages.nextSlide;
  const theme = useTheme();
  const rtl = useIsRtl();
  const directionProps = useDirectionProps();
  useInteractiveWebCss(STYLE_ID, BLOOM_CAROUSEL_CSS);
  const reducedMotion = useReducedMotion();
  const paint = useMemo(() => resolveCarouselPaint(theme), [theme]);

  const slides = Children.toArray(children).filter(isValidElement);
  const count = slides.length;

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<SlideOffset[]>([]);
  const scroll = useRef({ x: 0, contentWidth: 0 });
  const [trackWidth, setTrackWidth] = useState(0);
  const [stops, setStops] = useState<Stop[]>([]);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const activeSlideRef = useRef(0);

  const targetFor = useCallback(
    (item: SlideOffset) => {
      const start = rtl ? scroll.current.contentWidth - item.x - item.width : item.x;
      const raw = align === 'center' ? start - (trackWidth - item.width) / 2 : start - inset;
      const max = Math.max(0, scroll.current.contentWidth - trackWidth);
      return Math.min(Math.max(0, raw), max);
    },
    [align, inset, trackWidth, rtl],
  );

  /**
   * The distinct places the track can rest — or `null` until every slide has
   * been measured. Arrows, dots, snapping and the active slide all read this
   * ONE list, so they cannot disagree about where the track can go.
   */
  const computeStops = useCallback((): Stop[] | null => {
    const all = offsets.current.slice(0, count);
    if (all.length !== count || all.some((o) => !o)) return null;
    return toStops(all.map(targetFor));
  }, [count, targetFor]);

  const measure = useCallback(() => {
    const { x, contentWidth } = scroll.current;
    const viewport = trackWidth;
    // 1px of slack: offsets are fractional on hi-DPI displays, so an exact
    // comparison leaves the end arrow enabled on a fully scrolled track.
    const start = x <= 1;
    const end = viewport > 0 && contentWidth > 0 && x >= contentWidth - viewport - 1;
    setAtStart(start);
    setAtEnd(end);

    const all = computeStops();
    if (!all || all.length === 0) return;

    // The ends are pinned, not measured: within 1px of either end the first/last
    // stop is active. Between them, the stop nearest the scroll offset — compared
    // against where each stop RESTS (inset and centring included), not where its
    // slide sits in the content.
    let next = 0;
    if (end) {
      next = all.length - 1;
    } else if (!start) {
      let shortest = Number.POSITIVE_INFINITY;
      all.forEach((stop, index) => {
        const distance = Math.abs(stop.offset - x);
        if (distance < shortest) {
          shortest = distance;
          next = index;
        }
      });
    }
    setActive(next);
    const slide = all[next]?.slide ?? 0;
    if (slide !== activeSlideRef.current) {
      activeSlideRef.current = slide;
      onIndexChangeRef.current?.(slide);
    }
  }, [computeStops, trackWidth]);

  const recomputeStops = useCallback(() => {
    const next = computeStops();
    if (next) setStops(next);
  }, [computeStops]);

  const reportOffset = useCallback(
    (index: number, x: number, width: number) => {
      offsets.current[index] = { x, width };
      recomputeStops();
      measure();
    },
    [measure, recomputeStops],
  );

  useEffect(() => {
    recomputeStops();
    measure();
  }, [recomputeStops, measure]);

  const scrollToStop = (stop: Stop | undefined) => {
    if (!stop) return;
    // Web exposes negative scrollLeft in RTL; Android uses physical x, while
    // iOS's ScrollView command already converts a logical offset internally.
    const max = Math.max(0, scroll.current.contentWidth - trackWidth);
    const x = !rtl ? stop.offset : IS_WEB ? -stop.offset
      : Platform.OS === 'android' ? max - stop.offset : stop.offset;
    scrollRef.current?.scrollTo({ x, animated: !reducedMotion });
  };

  /**
   * The arrows step from where the track IS, to the nearest stop before or after
   * it (1px of slack, as in `measure`) — never by slide index, which near the
   * end names a slide whose stop the track already rests at.
   */
  const step = (direction: -1 | 1) => {
    const all = computeStops();
    if (!all) return;
    const x = scroll.current.x;
    scrollToStop(
      direction === 1
        ? all.find((stop) => stop.offset > x + 1)
        : [...all].reverse().find((stop) => stop.offset < x - 1),
    );
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize } = event.nativeEvent;
    const max = Math.max(0, contentSize.width - trackWidth);
    const x = !rtl ? contentOffset.x : IS_WEB ? -contentOffset.x
      : Platform.OS === 'android' ? max - contentOffset.x : contentOffset.x;
    scroll.current = { x, contentWidth: contentSize.width };
    measure();
  };

  const onContentSizeChange = (width: number) => {
    scroll.current = { ...scroll.current, contentWidth: width };
    recomputeStops();
    measure();
  };

  const dotCount = stops.length > 0 ? stops.length : count;

  const contextValue = useMemo(
    () => ({ trackWidth, count, reportOffset }),
    [trackWidth, count, reportOffset],
  );

  const trackStyle: WebCssStyle = {
    width: '100%',
    // The `:focus-visible` ring colour, read by the adopted sheet.
    '--bloom-carousel-ring': paint.ring,
    // Where a start-aligned slide snaps to on web, matching `inset` on native.
    '--bloom-carousel-inset': `${inset}px`,
  };

  const overlay = arrowsPlacement === 'overlay';
  const arrowsVisible = showArrows && count > 0;
  const arrowButtons = <>
    <Button size={overlay ? 'lg' : 'sm'} icon={rtl ? RiArrowRightSLine : RiArrowLeftSLine}
      accessibilityLabel={previousLabel} disabled={atStart} onPress={() => step(-1)}
      appearance="subtle" tone="neutral" />
    <Button size={overlay ? 'lg' : 'sm'} icon={rtl ? RiArrowLeftSLine : RiArrowRightSLine}
      accessibilityLabel={nextLabel} disabled={atEnd} onPress={() => step(1)}
      appearance="subtle" tone="neutral" />
  </>;
  // iOS snapping reads physical offsets even though its imperative command and
  // scroll events use logical offsets. Android converts snap offsets internally.
  const snapOffsets = rtl && Platform.OS === 'ios'
    ? stops.map(stop => Math.max(0, scroll.current.contentWidth - trackWidth) - stop.offset).reverse()
    : stops.map(stop => stop.offset);

  const track = (
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
        contentContainerStyle={{ gap, paddingHorizontal: inset }}
      >
        {slides.map((child, index) => (
          <CarouselItemIndexContext.Provider key={child.key ?? index} value={index}>
            {child}
          </CarouselItemIndexContext.Provider>
        ))}
      </ScrollView>
    </CarouselContext.Provider>
  );

  return (
    <View
      role="group"
      {...directionProps}
      {...(IS_WEB ? { 'aria-roledescription': messages.carouselRole } : {})}
      accessibilityLabel={accessibilityLabel}
      style={[{ width: '100%', flexDirection: 'column', gap: 16 }, style]}
      testID={testID}
    >
      {header != null || (arrowsVisible && !overlay) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: inset }}>
          <View style={{ flex: 1, minWidth: 0 }}>{header}</View>
          {arrowsVisible && !overlay ? arrowButtons : null}
        </View>
      ) : null}

      {overlay ? <View style={{ position: 'relative', width: '100%' }} testID={testID ? `${testID}-track-frame` : undefined}>
        {track}
        {arrowsVisible && overlay ? <View pointerEvents="box-none"
          testID={testID ? `${testID}-overlay-arrows` : undefined}
          style={{ position: 'absolute', top: 0, bottom: 0, insetInlineStart: 8, insetInlineEnd: 8,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {arrowButtons}
        </View> : null}
      </View> : track}

      {showDots && dotCount > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: inset }}>
          {Array.from({ length: dotCount }, (_, index) => {
            // One dot per STOP: slides that share a resting place share a dot,
            // so no dot scrolls nowhere. Until the slides are measured there is
            // one per slide, which is what full-width slides settle on anyway.
            const slide = stops[index]?.slide ?? index;
            return (
              <CarouselDot
                key={index}
                active={index === active}
                paint={paint}
                label={dotLabel ? dotLabel(slide + 1) : messages.goToSlide(slide + 1)}
                reducedMotion={reducedMotion}
                onPress={() => scrollToStop(stops[index])}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

export const Carousel = memo(CarouselComponent);
Carousel.displayName = 'Carousel';
