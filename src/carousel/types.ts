import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ButtonProps } from '../button/types';

/** Visual options only; the carousel retains navigation, names and disabled state. */
export type CarouselArrowButtonProps = Pick<
  ButtonProps,
  'className' | 'material' | 'appearance' | 'tone' | 'size' | 'iconSize'
>;

export interface CarouselProps {
  /** `CarouselItem`s. Each is labelled "N of M" for assistive technology. */
  children: ReactNode;
  /**
   * Names the carousel for assistive technology (a required
   * `aria-label`). The region announces itself as a "carousel".
   */
  accessibilityLabel: string;
  /**
   * Leading content of the row above the track — typically the section title
   * and a "See all" link. It shares the row with the arrows (header at the
   * start, arrows at the end). With overlay arrows this row contains only the header.
   */
  header?: ReactNode;
  /** Leading content in an optional row below the track and dots. */
  footer?: ReactNode;
  /** Controls and track arrow keys wrap to the other end; no cloned slides. Default false. */
  loop?: boolean;
  /**
   * Arrow/track-key destinations are anchored at children 0, N, 2N, plus the
   * reachable end. Dots, direct index selection and swipe keep individual stops.
   * Default 1. Finite values truncate to integers and clamp to at least 1;
   * non-finite values use 1. May change responsively without moving selection.
   */
  slidesPerGroup?: number;
  /** Previous / next buttons. Defaults to `true`; callers may hide them at their mobile breakpoint. */
  showArrows?: boolean;
  /** Overlay control offsets from logical track edges. Negative values extend outside. Default 8. */
  arrowsInset?: number | { start?: number; end?: number };
  /** Controls share a header/footer row or overlay the track. Default header. */
  arrowsPlacement?: 'header' | 'overlay' | 'footer';
  /**
   * Defaults to 'always'. 'hover' reveals arrows on hover or focus within the
   * carousel on web with a fine, hover-capable pointer. Touch and native keep
   * them visible. showArrows still controls whether they are rendered.
   */
  arrowsVisibility?: 'always' | 'hover';
  /** Optional visual recipe for both arrow buttons. Navigation remains carousel-owned. */
  arrowButtonProps?: CarouselArrowButtonProps;
  /** Hide unavailable arrows without moving their slots; hidden controls are not focusable. Defaults to false. */
  hideUnavailableArrows?: boolean;
  /** Position indicator below the track. Defaults to `true`. */
  showDots?: boolean;
  /** Where a slide comes to rest when it snaps. Defaults to `'start'`. */
  align?: 'start' | 'center';
  /** Gap between slides, in px. Defaults to `16`. */
  gap?: number;
  /**
   * Horizontal inset, in px, of the header row, the dots and the first and
   * last slide. Slides still scroll under it to the carousel's edges (it is
   * padding INSIDE the track, not a margin around it), and a snapped slide
   * rests at the inset, not flush. Defaults to `0`.
   */
  inset?: number;
  /**
   * Controlled zero-based child index. Out-of-range values clamp to the list;
   * omitted keeps the carousel uncontrolled. Pair with `onIndexChange`.
   */
  index?: number;
  /**
   * Uncontrolled: the slide in view changed. Controlled: arrows/dots or a
   * settled swipe request a child index. Prop-driven scrolls do not echo here.
   */
  onIndexChange?: (index: number) => void;
  /** Accessible name of the previous button. Defaults to the localised `'Previous slide'` (in English). */
  previousLabel?: string;
  /** Accessible name of the next button. Defaults to the localised `'Next slide'` (in English). */
  nextLabel?: string;
  /** Accessible name of a dot. Defaults to the localised `` n => `Go to slide ${n}` `` (in English). */
  dotLabel?: (slide: number) => string;
  /** Style of the outer column (arrows, track, dots). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CarouselItemProps {
  children: ReactNode;
  /**
   * Slide width. Defaults to the track's full width, so exactly one slide is
   * in view; pass a smaller number for a gallery that peeks the next slide.
   */
  width?: number;
  /** Overrides the default "N of M" accessible name. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
