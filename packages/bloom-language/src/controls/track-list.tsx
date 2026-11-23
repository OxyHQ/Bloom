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

import type { Binding, Bound } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { ColorToken, Density, SelectionBarPlacement, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

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
  | Drawn
  | 'tracks'
  | 'density'
  | 'headerBackground'
  | 'width'
  | 'stickyHeaderOffset'
  | 'selectedIds'
  | 'onSelectionChange'
> & { readonly width?: SpaceToken; readonly stickyHeaderOffset?: SpaceToken };
export type TrackListHeaderOptions = Omit<
  TrackListHeaderProps,
  Drawn | 'columns' | 'density' | 'background' | 'stickyOffset'
> & { readonly stickyOffset?: SpaceToken };
/** A track row's track: Bloom's `Track`, but its like, which is the row's `.liked()`. */
export type TrackRowData = Omit<Track, 'liked'>;
/** Bloom `TrackRow`'s data; the width it lays out for is a space token. */
export type TrackRowOptions = Omit<
  TrackRowProps,
  Drawn | 'track' | 'index' | 'density' | 'width' | 'onPress' | 'onLikedChange'
> & { readonly width?: SpaceToken };
export type TrackRowSkeletonOptions = Omit<TrackRowSkeletonProps, Drawn | 'density' | 'width'> & {
  readonly width?: SpaceToken;
};
export type TrackListEmptyOptions = Omit<TrackListEmptyProps, Drawn | 'title'>;
export type SelectionBarOptions = Omit<
  SelectionBarProps,
  Drawn | 'count' | 'actions' | 'placement' | 'width'
> & { readonly width?: SpaceToken };
/** An episode row's episode: Bloom's `Episode`, but its save and download, which are the row's `.saved()` and `.downloaded()`. */
export type EpisodeRowData = Omit<Episode, 'saved' | 'downloaded'>;
export type EpisodeRowOptions = Omit<
  EpisodeRowProps,
  Drawn | 'episode' | 'onPress' | 'width' | 'onSavedChange' | 'onDownloadedChange'
> & {
  readonly width?: SpaceToken;
};
export type EpisodeListOptions = Omit<EpisodeListProps, Drawn | 'episodes' | 'width'> & {
  readonly width?: SpaceToken;
};

/** Bloom `TrackList`; `.label()` names the grid. */
export interface TrackListView extends ViewModifiers<TrackListView> {
  /** `comfortable` rows (56 tall) or `compact` (40). */
  density(value: Density<'trackList'>): TrackListView;
  /** The header's background, so rows scrolling under it are covered (Bloom's: the page's). */
  tint(value: ColorToken): TrackListView;
  /** The selected tracks' ids: a binding, which makes the selection controlled. */
  selectedIds(value: Bound<TrackListProps, 'selectedIds'>): TrackListView;
}
export interface TrackListHeaderView extends ViewModifiers<TrackListHeaderView> {
  density(value: Density<'trackListHeader'>): TrackListHeaderView;
  /** The header's background. */
  tint(value: ColorToken): TrackListHeaderView;
}
/** Bloom `TrackRow`; `.onPress()` is its own (Bloom hands it the track, its index and the press). */
export interface TrackRowView extends ViewModifiers<TrackRowView> {
  density(value: Density<'trackRow'>): TrackRowView;
  /** Liked: a binding; bound, its like button draws and writes it. */
  liked(value: Binding<boolean>): TrackRowView;
}
export interface TrackRowSkeletonView extends ViewModifiers<TrackRowSkeletonView> {
  density(value: Density<'trackRowSkeleton'>): TrackRowSkeletonView;
}
export type TrackListEmptyView = ViewModifiers<TrackListEmptyView>;
export interface SelectionBarView extends ViewModifiers<SelectionBarView> {
  /** `floating` (default, at the bottom centre of its positioned parent) or `inline`. */
  style(value: SelectionBarPlacement): SelectionBarView;
}
/** Bloom `EpisodeRow`; `.onPress()` is its own: it opens the episode. */
export interface EpisodeRowView extends ViewModifiers<EpisodeRowView> {
  /** Saved: a binding; bound, its save toggle draws and writes it. */
  saved(value: Binding<boolean>): EpisodeRowView;
  /** Downloaded: a binding; bound, its download toggle draws and writes it. */
  downloaded(value: Binding<boolean>): EpisodeRowView;
}
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
/** Bloom `TrackRow` of `track`, at `index`; its like is its `.liked()`. */
export function TrackRow(
  track: TrackRowData,
  index: number,
  options: TrackRowOptions = {},
): TrackRowView {
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
/** Bloom `EpisodeRow` of `episode`; its save and download are its `.saved()` and `.downloaded()`. */
export function EpisodeRow(
  episode: EpisodeRowData,
  options: EpisodeRowOptions = {},
): EpisodeRowView {
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

/**
 * A row's toggles held in its item's data, as Bloom takes them: each bound
 * one's value drawn into the item (`key`), and its handler (`set`, which Bloom
 * calls with the item and the new value) writing the binding. One not bound
 * draws neither, so Bloom draws no toggle for it.
 */
function toggles(
  d: ControlDraw,
  item: 'track' | 'episode',
  bound: Readonly<Record<string, string>>,
): Record<string, unknown> {
  const data = { ...(d.node.props as Record<string, object>)[item] } as Record<string, unknown>;
  const props: Record<string, unknown> = {};
  for (const [key, set] of Object.entries(bound)) {
    const binding = d.own(key as 'liked' | 'saved' | 'downloaded')?.value as
      | Binding<boolean>
      | undefined;
    if (binding === undefined) continue;
    data[key] = binding[0];
    props[set] = (_item: unknown, value: boolean) => binding[1](value);
  }
  return Object.keys(props).length === 0 ? {} : { ...props, [item]: data };
}

export const TRACK_LISTS: Record<TrackListKind, ControlRenderer> = {
  trackList: product(BloomTrackList, {
    bindings: { selectedIds: ['selectedIds', 'onSelectionChange'] },
    lengths: ['width', 'stickyHeaderOffset'],
    own: (d) => ({ density: d.own('density')?.value }),
    colors: tinted('headerBackground'),
  }),
  trackListHeader: product(BloomTrackListHeader, {
    lengths: ['stickyOffset'],
    own: (d) => ({ density: d.own('density')?.value }),
    colors: tinted('background'),
  }),
  trackRow: product(BloomTrackRow, {
    press: true,
    lengths: ['width'],
    own: (d) => ({
      density: d.own('density')?.value,
      ...toggles(d, 'track', { liked: 'onLikedChange' }),
    }),
  }),
  trackRowSkeleton: product(BloomTrackRowSkeleton, {
    lengths: ['width'],
    own: (d) => ({ density: d.own('density')?.value }),
  }),
  trackListEmpty: product(BloomTrackListEmpty),
  selectionBar: product(BloomSelectionBar, {
    lengths: ['width'],
    own: (d) => ({ placement: d.own('style')?.value }),
  }),
  episodeRow: product(BloomEpisodeRow, {
    press: true,
    lengths: ['width'],
    own: (d) => toggles(d, 'episode', { saved: 'onSavedChange', downloaded: 'onDownloadedChange' }),
  }),
  episodeList: product(BloomEpisodeList, { lengths: ['width'] }),
};
