import {
  type Episode,
  EpisodeList as BloomEpisodeList,
  type EpisodeListProps,
  EpisodeRow as BloomEpisodeRow,
  type EpisodeRowProps,
  SelectionBar as BloomSelectionBar,
  type SelectionBarAction,
  type SelectionBarProps,
  type Track,
  TrackList as BloomTrackList,
  type TrackListColumn,
  TrackListEmpty as BloomTrackListEmpty,
  type TrackListEmptyProps,
  TrackListHeader as BloomTrackListHeader,
  type TrackListHeaderProps,
  type TrackListProps,
  TrackRow as BloomTrackRow,
  type TrackRowProps,
  TrackRowSkeleton as BloomTrackRowSkeleton,
  type TrackRowSkeletonProps,
} from '@oxy.so/bloom/track-list';

import { Node, type ViewModifiers } from '../node';
import type { ColorToken, ControlDensity, SelectionBarPlacement, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** The table of tracks, its parts, the bar for a selection, and podcast episodes. */
export type TrackListKind =
  | 'trackList'
  | 'trackListHeader'
  | 'trackRow'
  | 'trackRowSkeleton'
  | 'trackListEmpty'
  | 'selectionBar'
  | 'episodeRow'
  | 'episodeList';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/**
 * Bloom `TrackList`'s data: its columns, groups, the loaded track, its
 * selection (controlled when given) and its handlers; the width it lays out
 * for and its sticky header's offset are space tokens.
 */
export type TrackListOptions = Omit<
  TrackListProps,
  Drawn | 'tracks' | 'density' | 'headerBackground' | 'width' | 'stickyHeaderOffset'
> & { readonly width?: SpaceToken; readonly stickyHeaderOffset?: SpaceToken };
export type TrackListHeaderOptions = Omit<
  TrackListHeaderProps,
  Drawn | 'columns' | 'density' | 'background' | 'stickyOffset'
> & { readonly stickyOffset?: SpaceToken };
/** Bloom `TrackRow`'s data; the width it lays out for is a space token. */
export type TrackRowOptions = Omit<
  TrackRowProps,
  Drawn | 'track' | 'index' | 'density' | 'width' | 'onPress'
> & { readonly width?: SpaceToken };
export type TrackRowSkeletonOptions = Omit<TrackRowSkeletonProps, Drawn | 'density' | 'width'> & {
  readonly width?: SpaceToken;
};
export type TrackListEmptyOptions = Omit<TrackListEmptyProps, Drawn | 'title'>;
export type SelectionBarOptions = Omit<
  SelectionBarProps,
  Drawn | 'count' | 'actions' | 'placement' | 'width'
> & { readonly width?: SpaceToken };
export type EpisodeRowOptions = Omit<EpisodeRowProps, Drawn | 'episode' | 'onPress' | 'width'> & {
  readonly width?: SpaceToken;
};
export type EpisodeListOptions = Omit<EpisodeListProps, Drawn | 'episodes' | 'width'> & {
  readonly width?: SpaceToken;
};

/** Bloom `TrackList`; `.label()` names the grid. */
export interface TrackListView extends ViewModifiers<TrackListView> {
  /** `default` (Bloom's comfortable rows, 56 tall) or `compact` (40). */
  density(value: ControlDensity): TrackListView;
  /** The header's background, so rows scrolling under it are covered (Bloom's: the page's). */
  tint(value: ColorToken): TrackListView;
}
export interface TrackListHeaderView extends ViewModifiers<TrackListHeaderView> {
  density(value: ControlDensity): TrackListHeaderView;
  /** The header's background. */
  tint(value: ColorToken): TrackListHeaderView;
}
/** Bloom `TrackRow`; `.onPress()` is its own (Bloom hands it the track, its index and the press). */
export interface TrackRowView extends ViewModifiers<TrackRowView> {
  density(value: ControlDensity): TrackRowView;
}
export interface TrackRowSkeletonView extends ViewModifiers<TrackRowSkeletonView> {
  density(value: ControlDensity): TrackRowSkeletonView;
}
export type TrackListEmptyView = ViewModifiers<TrackListEmptyView>;
export interface SelectionBarView extends ViewModifiers<SelectionBarView> {
  /** `floating` (default, at the bottom centre of its positioned parent) or `inline`. */
  style(value: SelectionBarPlacement): SelectionBarView;
}
/** Bloom `EpisodeRow`; `.onPress()` is its own: it opens the episode. */
export type EpisodeRowView = ViewModifiers<EpisodeRowView>;
/** Bloom `EpisodeList`; `.label()` names it. */
export type EpisodeListView = ViewModifiers<EpisodeListView>;

export function TrackList(tracks: readonly Track[], options: TrackListOptions = {}): TrackListView {
  return new Node('trackList', { tracks, options }, []);
}
export function TrackListHeader(
  columns: readonly TrackListColumn[],
  options: TrackListHeaderOptions = {},
): TrackListHeaderView {
  return new Node('trackListHeader', { columns, options }, []);
}
export function TrackRow(track: Track, index: number, options: TrackRowOptions = {}): TrackRowView {
  return new Node('trackRow', { track, index, options }, []);
}
export function TrackRowSkeleton(options: TrackRowSkeletonOptions = {}): TrackRowSkeletonView {
  return new Node('trackRowSkeleton', { options }, []);
}
export function TrackListEmpty(
  title: string,
  options: TrackListEmptyOptions = {},
): TrackListEmptyView {
  return new Node('trackListEmpty', { title, options }, []);
}
export function SelectionBar(
  count: number,
  actions: readonly SelectionBarAction[],
  options: SelectionBarOptions,
): SelectionBarView {
  return new Node('selectionBar', { count, actions, options }, []);
}
export function EpisodeRow(episode: Episode, options: EpisodeRowOptions = {}): EpisodeRowView {
  return new Node('episodeRow', { episode, options }, []);
}
export function EpisodeList(
  episodes: readonly Episode[],
  options: EpisodeListOptions = {},
): EpisodeListView {
  return new Node('episodeList', { episodes, options }, []);
}

const tinted = (prop: string) => (d: Parameters<ControlRenderer>[0]) => ({
  [prop]: d.own('tint')?.value as ColorToken | undefined,
});

export const TRACK_LISTS: Record<TrackListKind, ControlRenderer> = {
  trackList: product(BloomTrackList, {
    lengths: ['width', 'stickyHeaderOffset'],
    own: (d) => ({ density: rowDensity(d) }),
    colors: tinted('headerBackground'),
  }),
  trackListHeader: product(BloomTrackListHeader, {
    lengths: ['stickyOffset'],
    own: (d) => ({ density: rowDensity(d) }),
    colors: tinted('background'),
  }),
  trackRow: product(BloomTrackRow, {
    press: true,
    lengths: ['width'],
    own: (d) => ({ density: rowDensity(d) }),
  }),
  trackRowSkeleton: product(BloomTrackRowSkeleton, {
    lengths: ['width'],
    own: (d) => ({ density: rowDensity(d) }),
  }),
  trackListEmpty: product(BloomTrackListEmpty),
  selectionBar: product(BloomSelectionBar, {
    lengths: ['width'],
    own: (d) => ({ placement: d.own('style')?.value }),
  }),
  episodeRow: product(BloomEpisodeRow, { press: true, lengths: ['width'] }),
  episodeList: product(BloomEpisodeList, { lengths: ['width'] }),
};
