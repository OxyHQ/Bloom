import { type ComponentRef, useContext, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useIsRtl } from '../hooks/use-is-rtl';
import { dataHook } from '../styles/data-hook';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { offsetOfThumb, thumbOf, type ScrollAxis } from './scroll-area-geometry';
import type { ScrollAreaScrollbar } from './types';

/** How long the bar stays after the last scroll event in `scroll` mode. */
const LINGER_MS = 900;
/** Room between the bar and the container's edge. */
const EDGE = 2;
/** The grab strip is wider than the thumb, so a 4px bar is still easy to take hold of. */
const GRAB = 6;

export interface ScrollAreaBarProps {
  /** The element that scrolls; `null` until it is mounted. */
  scroller: HTMLElement | null;
  /** The container the pointer must be over for `hover`. */
  area: HTMLElement | null;
  horizontal: boolean;
  mode: ScrollAreaScrollbar;
  /** The thumb's resting thickness in px; it grows 2px under the pointer. */
  thickness: number;
  /** Room kept free at the track's ends, for chrome that floats over the scroller. */
  insets?: { start?: number; end?: number };
}

function axisOf(scroller: HTMLElement, horizontal: boolean): ScrollAxis {
  return horizontal
    ? {
        viewport: scroller.clientWidth,
        content: scroller.scrollWidth,
        offset: Math.abs(scroller.scrollLeft),
      }
    : {
        viewport: scroller.clientHeight,
        content: scroller.scrollHeight,
        offset: scroller.scrollTop,
      };
}

/**
 * One overlay bar. It floats over the scroller, so it never takes room from the content and
 * the content never moves when it appears; the native bar is hidden by the scroller itself. The
 * thumb's size and place are written straight to its element on every scroll event, so scrolling
 * renders nothing in React: only showing, hiding and growing do.
 */
export function ScrollAreaBar({
  scroller,
  area,
  horizontal,
  mode,
  thickness,
  insets,
}: ScrollAreaBarProps) {
  // Optional, like the native fork: outside a provider the bar is a plain grey.
  const color = useContext(BloomThemeContext)?.theme.colors.textTertiary ?? '#888888';
  const reduced = useReducedMotion();
  const rtl = useIsRtl();
  const track = useRef<ComponentRef<typeof View>>(null);
  const thumb = useRef<ComponentRef<typeof View>>(null);
  const [scrollable, setScrollable] = useState(false);
  const [lingering, setLingering] = useState(false);
  const [inside, setInside] = useState(false);
  const [onBar, setOnBar] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const geometry = useRef({ size: 0, position: 0, track: 0 });

  useEffect(() => {
    const trackEl = track.current as unknown as HTMLElement | null;
    const thumbEl = thumb.current as unknown as HTMLElement | null;
    if (!scroller || !trackEl || !thumbEl) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const measure = () => {
      const length = horizontal ? trackEl.clientWidth : trackEl.clientHeight;
      const next = thumbOf(axisOf(scroller, horizontal), length);
      geometry.current = { size: next.size, position: next.position, track: length };
      setScrollable((was) => (was === next.scrollable ? was : next.scrollable));
      if (horizontal) {
        thumbEl.style.width = `${next.size}px`;
        thumbEl.style.transform = `translateX(${rtl ? -next.position : next.position}px)`;
      } else {
        thumbEl.style.height = `${next.size}px`;
        thumbEl.style.transform = `translateY(${next.position}px)`;
      }
    };
    const onScroll = () => {
      measure();
      setLingering(true);
      clearTimeout(timer);
      timer = setTimeout(() => setLingering(false), LINGER_MS);
    };
    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    // Without it (an old browser, a test DOM) the thumb follows scroll events alone.
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resize?.observe(scroller);
    if (scroller.firstElementChild) resize?.observe(scroller.firstElementChild);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      resize?.disconnect();
      clearTimeout(timer);
    };
  }, [scroller, horizontal, rtl]);

  useEffect(() => {
    if (!area) return;
    const enter = () => setInside(true);
    const leave = () => setInside(false);
    area.addEventListener('pointerenter', enter);
    area.addEventListener('pointerleave', leave);
    return () => {
      area.removeEventListener('pointerenter', enter);
      area.removeEventListener('pointerleave', leave);
    };
  }, [area]);

  useEffect(() => {
    const trackEl = track.current as unknown as HTMLElement | null;
    const thumbEl = thumb.current as unknown as HTMLElement | null;
    if (!scroller || !trackEl || !thumbEl) return;
    const coordinate = (event: PointerEvent) => {
      const box = trackEl.getBoundingClientRect();
      return horizontal ? event.clientX - box.left : event.clientY - box.top;
    };
    const scrollTo = (position: number) => {
      const next = offsetOfThumb(
        position,
        axisOf(scroller, horizontal),
        geometry.current.track,
        geometry.current.size,
      );
      if (horizontal) scroller.scrollLeft = rtl ? -next : next;
      else scroller.scrollTop = next;
    };
    let anchor = 0;
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      // The bar's drag is the bar's: a pan gesture further up (the bottom sheet's) would take the
      // pointer's capture from the bar on the same press and drag the sheet instead.
      event.stopPropagation();
      trackEl.setPointerCapture(event.pointerId);
      // On the thumb the drag keeps its grip; on the bare track the thumb jumps under the pointer.
      const onThumb = event.target === thumbEl;
      anchor = onThumb ? coordinate(event) - geometry.current.position : geometry.current.size / 2;
      if (!onThumb) scrollTo(coordinate(event) - anchor);
      setGrabbed(true);
    };
    const move = (event: PointerEvent) => {
      if (trackEl.hasPointerCapture(event.pointerId)) scrollTo(coordinate(event) - anchor);
    };
    const up = (event: PointerEvent) => {
      if (trackEl.hasPointerCapture(event.pointerId))
        trackEl.releasePointerCapture(event.pointerId);
      setGrabbed(false);
    };
    const enter = () => setOnBar(true);
    const leave = () => setOnBar(false);
    trackEl.addEventListener('pointerdown', down);
    trackEl.addEventListener('pointermove', move);
    trackEl.addEventListener('pointerup', up);
    trackEl.addEventListener('pointercancel', up);
    trackEl.addEventListener('pointerenter', enter);
    trackEl.addEventListener('pointerleave', leave);
    return () => {
      trackEl.removeEventListener('pointerdown', down);
      trackEl.removeEventListener('pointermove', move);
      trackEl.removeEventListener('pointerup', up);
      trackEl.removeEventListener('pointercancel', up);
      trackEl.removeEventListener('pointerenter', enter);
      trackEl.removeEventListener('pointerleave', leave);
    };
  }, [scroller, horizontal, rtl]);

  const shown =
    scrollable &&
    (grabbed ||
      mode === 'always' ||
      (mode === 'hover' && inside) ||
      (mode === 'scroll' && (lingering || onBar)));
  const active = grabbed || onBar;
  const width = thickness + (active ? 2 : 0);
  const motion = reduced ? 'none' : 'opacity 150ms ease, width 120ms ease, height 120ms ease';

  return (
    <View
      ref={track}
      aria-hidden
      {...dataHook('bloomScrollbar')}
      style={
        {
          position: 'absolute',
          zIndex: 1,
          // The grab strip is live whenever there is something to scroll, shown or not: a hidden
          // bar that took no pointer could never be woken by moving to the edge, only caught in
          // the moment after a scroll.
          pointerEvents: scrollable ? 'auto' : 'none',
          touchAction: 'none',
          ...(horizontal
            ? {
                insetInlineStart: EDGE + (insets?.start ?? 0),
                insetInlineEnd: EDGE + (insets?.end ?? 0),
                bottom: EDGE,
                height: thickness + GRAB,
                justifyContent: 'flex-end',
              }
            : {
                top: EDGE + (insets?.start ?? 0),
                bottom: EDGE + (insets?.end ?? 0),
                insetInlineEnd: EDGE,
                width: thickness + GRAB,
                alignItems: 'flex-end',
              }),
        } as never
      }
    >
      <View
        ref={thumb}
        {...dataHook('bloomScrollbarThumb')}
        style={
          {
            borderRadius: 999,
            backgroundColor: color,
            opacity: shown ? (grabbed ? 0.9 : onBar ? 0.75 : 0.5) : 0,
            transition: motion,
            ...(horizontal ? { height: width } : { width }),
          } as never
        }
      />
    </View>
  );
}
