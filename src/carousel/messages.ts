import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the carousel family draws or announces, in each Bloom
 * language. `Carousel`'s `previousLabel`/`nextLabel`/`dotLabel` props and a
 * slide's own `accessibilityLabel` still win over these.
 */
export interface CarouselMessages {
  previousSlide: string;
  nextSlide: string;
  /** A dot's name, given the 1-based slide it scrolls to. */
  goToSlide: (slide: number) => string;
  /** A slide's default name: its 1-based position and the total. */
  slideOf: (position: number, total: number) => string;
  /** What the region and a slide announce themselves as (web `aria-roledescription`). */
  carouselRole: string;
  slideRole: string;
}

export const CAROUSEL_MESSAGES: MessageCatalog<CarouselMessages> = defineMessages<CarouselMessages>('CAROUSEL_MESSAGES', {
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  goToSlide: (n) => `Go to slide ${n}`,
  slideOf: (at, of) => `${at} of ${of}`,
  carouselRole: 'carousel',
  slideRole: 'slide',
});
