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
  /** Previous / next buttons above the track. Defaults to `true`. */
  showArrows?: boolean;
  /** Position indicator below the track. Defaults to `true`. */
  showDots?: boolean;
  /** Where a slide comes to rest when it snaps. Defaults to `'start'`. */
  align?: 'start' | 'center';
  /** Gap between slides, in px. Defaults to `16`. */
  gap?: number;
  /** Called when the slide in view changes. */
  onIndexChange?: (index: number) => void;
  /** Accessible name of the previous button. Defaults to `'Previous slide'`. */
  previousLabel?: string;
  /** Accessible name of the next button. Defaults to `'Next slide'`. */
  nextLabel?: string;
  /** Accessible name of a dot. Defaults to `` n => `Go to slide ${n}` ``. */
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
