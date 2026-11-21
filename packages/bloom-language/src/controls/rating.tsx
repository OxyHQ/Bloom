import {
  Rating as BloomRating,
  RatingBar as BloomRatingBar,
  RatingInput as BloomRatingInput,
  RatingSummary as BloomRatingSummary,
} from '@oxy.so/bloom/rating';
import type { MeterReveal } from '@oxy.so/bloom/stat-bar';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type {
  ColorName,
  ColorToken,
  RatingCountStyle,
  RatingInputSize,
  RatingSize,
  RatingStyle,
  SpaceToken,
} from '../tokens';
import { resolveSpace } from '../tokens';
import type { ControlRenderer } from './draw';

/** Ratings: the compact star and value, the stars a review form is written with, a breakdown's bar and summary. */
export type RatingKind = 'rating' | 'ratingInput' | 'ratingBar' | 'ratingSummary';

export interface RatingProps {
  readonly value: number | string | null | undefined;
}
export interface RatingBarProps {
  readonly label: string;
  readonly value: number;
}
export interface RatingSummaryProps {
  readonly average: number | null;
  readonly count: number;
  readonly distribution: Readonly<Partial<Record<number, number>>>;
}

/** Wording of your own for a rating's fixed words (Bloom speaks them in the provider's locale). */
export interface RatingLabels {
  /** The word after the count (`reviews`). */
  readonly reviews?: string;
  /** What is drawn with no rating yet (`New`). */
  readonly new?: string;
}
export interface RatingSummaryLabels {
  /** The count's words under the bars (`128 reviews`). */
  readonly count?: string;
  /** The scale under the average (`out of 5`). */
  readonly outOf?: string;
  /** What is drawn with no ratings (`No ratings yet`). */
  readonly noRatings?: string;
}

/** Bloom `Rating`: a star and the value (or a row of stars), with the review count. */
export interface RatingView extends ViewModifiers<RatingView> {
  /** The number of reviews; a string is drawn as given (`1.2k`). */
  count(value: number | string | undefined): RatingView;
  /** `parenthesis` (default) draws `(128)`; `reviews` draws `· 128 reviews`. */
  countStyle(value: RatingCountStyle): RatingView;
  /** `sm` or `md` (default). */
  size(value: RatingSize): RatingView;
  /** `compact` (default): one star; `stars`: five, filled to the value. */
  style(value: RatingStyle): RatingView;
  /** `false` hides the drawn number; the accessible name keeps it. */
  showsValue(value: boolean): RatingView;
  /** The star's edge, apart from the text's size. */
  starSize(value: SpaceToken): RatingView;
  /** The stars and the value (and the count, unless `countTint`): over a brand colour. */
  tint(value: ColorName): RatingView;
  /** The filled stars alone. */
  starTint(value: ColorToken): RatingView;
  /** The count alone. */
  countTint(value: ColorToken): RatingView;
  /** The unfilled part of each star (`stars`). */
  emptyTint(value: ColorToken): RatingView;
  /** What the stars fill to (`stars`), apart from the drawn value (a localised string). */
  fillValue(value: number): RatingView;
  labels(value: RatingLabels): RatingView;
}
/** Bloom `RatingInput`: the stars a review form is written with. */
export interface RatingInputView extends ViewModifiers<RatingInputView> {
  /** How many stars (5 by default). */
  max(value: number): RatingInputView;
  /** `sm` (24), `md` (32, default) or `lg` (40). */
  size(value: RatingInputSize): RatingInputView;
  disabled(value?: boolean): RatingInputView;
  /** Each star's own name (`4 stars` by default, in the locale). */
  starLabel(value: (value: number, max: number) => string): RatingInputView;
}
/** Bloom `RatingBar`: a labelled row of a rating breakdown. */
export interface RatingBarView extends ViewModifiers<RatingBarView> {
  /** The scale (5 by default; `1` for a fraction). */
  max(value: number): RatingBarView;
  /** The text at the end (`4.9`, `72%`). */
  valueLabel(value: string): RatingBarView;
  /** A fixed label width: the bar takes the free space (a distribution). */
  labelWidth(value: SpaceToken): RatingBarView;
  /** The bar's entrance, which never changes its accessible measurement. */
  reveal(value: MeterReveal): RatingBarView;
}
/** Bloom `RatingSummary`: the average, the bars of each star and the count. */
export interface RatingSummaryView extends ViewModifiers<RatingSummaryView> {
  labels(value: RatingSummaryLabels): RatingSummaryView;
}

/** Bloom `Rating`: a rating on a 5 scale (a string is drawn as given; none draws `New`). */
export function Rating(value: number | string | null | undefined): RatingView {
  return new Node('rating', { value } satisfies RatingProps, []);
}
/** Bloom `RatingInput`: the chosen rating the binding holds (`null` while none). */
export function RatingInput(selection: Binding<number | null>): RatingInputView {
  return new Node('ratingInput', { selection }, []);
}
/** Bloom `RatingBar`: what the row measures and its position on the scale. */
export function RatingBar(label: string, value: number): RatingBarView {
  return new Node('ratingBar', { label, value } satisfies RatingBarProps, []);
}
/** Bloom `RatingSummary`: the average (`null` when nobody rated), the count and each star's count. */
export function RatingSummary(
  average: number | null,
  count: number,
  distribution: Readonly<Partial<Record<number, number>>>,
): RatingSummaryView {
  return new Node(
    'ratingSummary',
    { average, count, distribution } satisfies RatingSummaryProps,
    [],
  );
}

const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);

export const RATINGS: Record<RatingKind, ControlRenderer> = {
  rating: (d) => {
    const labels = d.own('labels')?.value as RatingLabels | undefined;
    const props = d.props();
    Object.assign(props, {
      value: (d.node.props as RatingProps).value,
      count: d.own('count')?.value,
      countStyle: d.own('countStyle')?.value,
      size: d.own('size')?.value,
      variant: d.own('style')?.value,
      showValue: d.own('showsValue')?.value,
      starSize: space(d.own('starSize')?.value),
      fillValue: d.own('fillValue')?.value,
      reviewsLabel: labels?.reviews,
      newLabel: labels?.new,
    });
    return d.painted(BloomRating, props, {
      color: d.own('tint')?.value as ColorName | undefined,
      starColor: d.own('starTint')?.value,
      countColor: d.own('countTint')?.value,
      emptyStarColor: d.own('emptyTint')?.value,
    });
  },
  ratingInput: (d) => {
    const [value, onChange] = (d.node.props as { selection: Binding<number | null> }).selection;
    const props = d.props();
    Object.assign(props, {
      value,
      onChange,
      max: d.own('max')?.value,
      size: d.own('size')?.value,
      disabled: d.own('disabled')?.value,
      formatStarLabel: d.own('starLabel')?.value,
    });
    return d.component(BloomRatingInput, props);
  },
  ratingBar: (d) => {
    const { label, value } = d.node.props as RatingBarProps;
    const props = d.props();
    Object.assign(props, {
      label,
      value,
      max: d.own('max')?.value,
      display: d.own('valueLabel')?.value,
      labelWidth: space(d.own('labelWidth')?.value),
      reveal: d.own('reveal')?.value,
    });
    return d.component(BloomRatingBar, props);
  },
  ratingSummary: (d) => {
    const { average, count, distribution } = d.node.props as RatingSummaryProps;
    const labels = d.own('labels')?.value as RatingSummaryLabels | undefined;
    const props = d.props();
    Object.assign(props, {
      average,
      count,
      distribution,
      countLabel: labels?.count,
      outOfLabel: labels?.outOf,
      noRatingsLabel: labels?.noRatings,
    });
    return d.component(BloomRatingSummary, props);
  },
};
