import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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
  /** Previous / next buttons. Defaults to `true`; callers may hide them at their mobile breakpoint. */
  showArrows?: boolean;
  /** Arrows share the header row or overlay the track's edges. Defaults to `'header'`. */
  arrowsPlacement?: 'header' | 'overlay';
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
  /** Called when the slide in view changes. */
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
