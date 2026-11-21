import {
  Carousel as BloomCarousel,
  CarouselDots as BloomCarouselDots,
  CarouselItem as BloomCarouselItem,
} from '@oxy.so/bloom/carousel';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import {
  resolveSpace,
  type ArrowsPlacement,
  type ArrowsVisibility,
  type CarouselAlign,
  type DotsShape,
  type DotsStyle,
  type SpaceToken,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** Slides that snap into place, with arrows and dots (Bloom `carousel`). */
export type CarouselKind = 'carousel' | 'carouselItem' | 'carouselDots';

/** Wording of your own for a carousel's controls (Bloom speaks them in the locale). */
export interface CarouselLabels {
  readonly previous?: string;
  readonly next?: string;
  /** Each dot's name (`Slide 3`). */
  readonly dot?: (slide: number) => string;
}

/** Bloom `Carousel`: its slides, named with `.label()`. */
export interface CarouselView extends ViewModifiers<CarouselView> {
  /** Above the slides (a title; the arrows' place when they sit in the header). */
  headerContent(value: Child): CarouselView;
  footerContent(value: Child): CarouselView;
  /** The last slide leads back to the first. */
  loop(): CarouselView;
  /** Slides one arrow press moves. */
  groupSize(value: number): CarouselView;
  /** Where the prev/next arrows sit (`overlay` by default), or `false` for none. */
  arrows(value: ArrowsPlacement | false): CarouselView;
  /** `hover` shows overlay arrows only under the pointer. */
  arrowsVisibility(value: ArrowsVisibility): CarouselView;
  /** How far overlay arrows sit from the edges. */
  arrowsInset(value: SpaceToken): CarouselView;
  /** Hide an arrow that has nowhere to go (kept, disabled, by default). */
  hidesUnavailableArrows(): CarouselView;
  /** The position dots under the slides. */
  dots(value?: boolean): CarouselView;
  /** Where a slide snaps: `start` (default) or `center`. */
  align(value: CarouselAlign): CarouselView;
  /** The gap between slides. */
  spacing(value: SpaceToken): CarouselView;
  /** The room before the first slide and after the last. */
  contentInset(value: SpaceToken): CarouselView;
  /** The slide shown, and what a move sets. */
  page(value: Binding<number>): CarouselView;
  labels(value: CarouselLabels): CarouselView;
}
/** Bloom `CarouselItem`: one slide; the carousel's width unless it sets its own. */
export interface CarouselItemView extends ViewModifiers<CarouselItemView> {
  width(value: SpaceToken): CarouselItemView;
}
/** Bloom `CarouselDots`: the position dots alone. */
export interface CarouselDotsView extends ViewModifiers<CarouselDotsView> {
  /** `pill` (the active dot stretched, default) or `dot`. */
  shape(value: DotsShape): CarouselDotsView;
  /** `default`, or `onMedia` over a photo. */
  style(value: DotsStyle): CarouselDotsView;
  /** The most dots drawn; more slides scroll them. */
  max(value: number): CarouselDotsView;
  labels(value: Pick<CarouselLabels, 'dot'>): CarouselDotsView;
}

/** Bloom `Carousel`: its `CarouselItem`s. */
export function Carousel(...slides: Child[]): CarouselView {
  return new Node('carousel', null, slides);
}
/** Bloom `CarouselItem`: a slide's content. */
export function CarouselItem(...children: Child[]): CarouselItemView {
  return new Node('carouselItem', null, children);
}
/** Bloom `CarouselDots`: `count` dots, the binding's index the current one. */
export function CarouselDots(count: number, page: Binding<number>): CarouselDotsView {
  return new Node('carouselDots', { count, page }, []);
}

const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);
const slot = (d: ControlDraw, value: Child | undefined) =>
  value === undefined ? undefined : d.render(value);

export const CAROUSELS: Record<CarouselKind, ControlRenderer> = {
  carousel: (d) => {
    const props = d.props();
    const arrows = d.own('arrows')?.value;
    const page = d.own('page')?.value;
    const labels = d.own('labels')?.value as CarouselLabels | undefined;
    Object.assign(props, {
      header: slot(d, d.own('headerContent')?.value),
      footer: slot(d, d.own('footerContent')?.value),
      loop: d.own('loop') === undefined ? undefined : true,
      slidesPerGroup: d.own('groupSize')?.value,
      showArrows: arrows === false ? false : undefined,
      arrowsPlacement: arrows === false ? undefined : arrows,
      arrowsVisibility: d.own('arrowsVisibility')?.value,
      arrowsInset: space(d.own('arrowsInset')?.value),
      hideUnavailableArrows: d.own('hidesUnavailableArrows') === undefined ? undefined : true,
      showDots: d.own('dots')?.value,
      align: d.own('align')?.value,
      gap: space(d.own('spacing')?.value),
      inset: space(d.own('contentInset')?.value),
      previousLabel: labels?.previous,
      nextLabel: labels?.next,
      dotLabel: labels?.dot,
    });
    if (page !== undefined) [props.index, props.onIndexChange] = page;
    return d.component(BloomCarousel, props, ...d.children(d.node.children));
  },
  carouselItem: (d) => {
    const props = d.props();
    props.width = space(d.own('width')?.value as SpaceToken | undefined);
    return d.component(BloomCarouselItem, props, ...d.children(d.node.children));
  },
  carouselDots: (d) => {
    const { count, page } = d.node.props as { count: number; page: Binding<number> };
    const props = d.props();
    Object.assign(props, {
      count,
      index: page[0],
      onIndexChange: page[1],
      shape: d.own('shape')?.value,
      appearance: d.own('style')?.value,
      maxDots: d.own('max')?.value,
      dotLabel: (d.own('labels')?.value as CarouselLabels | undefined)?.dot,
    });
    return d.component(BloomCarouselDots, props);
  },
};
