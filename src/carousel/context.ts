import { createContext } from 'react';

export interface CarouselContextValue {
  /** Measured width of the scroll viewport, or 0 before the first layout. */
  trackWidth: number;
  count: number;
  /** Reports a slide's x offset inside the track's content (its `offsetLeft`). */
  reportOffset: (index: number, x: number, width: number) => void;
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

/** The position of the slide being rendered, provided per child by `Carousel`. */
export const CarouselItemIndexContext = createContext(0);
