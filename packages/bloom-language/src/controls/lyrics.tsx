import {
  type LyricLine,
  LyricsPreviewCard as BloomLyricsPreviewCard,
  type LyricsPreviewCardProps,
  LyricsView as BloomLyricsView,
  type LyricsViewProps,
} from '@oxy.so/bloom/lyrics';

import { type Child, Node, type ViewModifiers } from '../node';
import type { LyricsSize } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** Synced lyrics that follow playback, and their preview card. */
export type LyricsKind = 'lyricsView' | 'lyricsPreviewCard';

/**
 * Bloom `LyricsView`'s data: the playback position, the seek handler, the
 * artwork's colour from the backend, plain `text` when there are no lines,
 * its words; its `footer` is a language child.
 */
export type LyricsViewOptions = Omit<
  LyricsViewProps,
  'style' | 'testID' | 'accessibilityLabel' | 'lines' | 'size' | 'footer'
> & { readonly footer?: Child };
export type LyricsPreviewCardOptions = Omit<
  LyricsPreviewCardProps,
  'style' | 'testID' | 'lines' | 'visibleLines'
>;

/** Bloom `LyricsView`; `.label()` names its region. */
export interface LyricsViewView extends ViewModifiers<LyricsViewView> {
  /** `large`, `medium` or `small`; with none, by the view's width. */
  size(value: LyricsSize): LyricsViewView;
}
export interface LyricsPreviewCardView extends ViewModifiers<LyricsPreviewCardView> {
  /** How many lines the card shows: 4 or 5 (default). */
  lines(value: 4 | 5): LyricsPreviewCardView;
}

export function LyricsView(
  lines: readonly LyricLine[],
  options: LyricsViewOptions = {},
): LyricsViewView {
  return new Node('lyricsView', { lines, options }, []);
}
export function LyricsPreviewCard(
  lines: readonly LyricLine[],
  options: LyricsPreviewCardOptions = {},
): LyricsPreviewCardView {
  return new Node('lyricsPreviewCard', { lines, options }, []);
}

export const LYRICS: Record<LyricsKind, ControlRenderer> = {
  lyricsView: product(BloomLyricsView, {
    slots: ['footer'],
    own: (d) => ({ size: d.own('size')?.value }),
  }),
  lyricsPreviewCard: product(BloomLyricsPreviewCard, {
    own: (d) => ({ visibleLines: d.own('lines')?.value }),
  }),
};
