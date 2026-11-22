import {
  PlaceReviewSummary as BloomPlaceReviewSummary,
  type PlaceReviewSummaryProps,
  WriteReviewPrompt as BloomWriteReviewPrompt,
  type WriteReviewPromptProps,
} from '@oxy.so/bloom/place-reviews';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** Reviews of a place: its summary, and the prompt to write one. */
export type PlaceReviewKind = 'placeReviewSummary' | 'writeReviewPrompt';

type Drawn = 'style' | 'testID';

export type PlaceReviewSummaryOptions = Omit<PlaceReviewSummaryProps, Drawn | 'rating'>;
export type WriteReviewPromptOptions = Omit<
  WriteReviewPromptProps,
  Drawn | 'buildingTitle' | 'media'
> & { readonly media?: Child };

/** Bloom `PlaceReviewSummary`: a place's rating, its categories and its rates. */
export type PlaceReviewSummaryView = ViewModifiers<PlaceReviewSummaryView>;
/** Bloom `WriteReviewPrompt`: asks someone who lived there to review the building. */
export type WriteReviewPromptView = ViewModifiers<WriteReviewPromptView>;

/** Bloom `PlaceReviewSummary` of `rating`. */
export function PlaceReviewSummary(
  rating: number | string,
  options: PlaceReviewSummaryOptions = {},
): PlaceReviewSummaryView {
  return new Node('placeReviewSummary', { rating, options }, []);
}
/** Bloom `WriteReviewPrompt` for `buildingTitle`; its `onStart` begins the review, its `media` a language child. */
export function WriteReviewPrompt(
  buildingTitle: string,
  options: WriteReviewPromptOptions,
): WriteReviewPromptView {
  return new Node('writeReviewPrompt', { buildingTitle, options }, []);
}

export const PLACE_REVIEWS: Record<PlaceReviewKind, ControlRenderer> = {
  placeReviewSummary: product(BloomPlaceReviewSummary),
  writeReviewPrompt: product(BloomWriteReviewPrompt, { slots: ['media'] }),
};
