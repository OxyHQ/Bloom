import type { ReactNode } from 'react';
import {
  BrowseGrid as BloomBrowseGrid,
  type BrowseGridProps,
  type BrowseTile,
  type LibraryEntry,
  LibraryItem as BloomLibraryItem,
  type LibraryItemProps,
  LibraryPanel as BloomLibraryPanel,
  type LibraryPanelProps,
  RecentSearches as BloomRecentSearches,
  type RecentSearchEntry,
  type RecentSearchesProps,
  SearchField as BloomSearchField,
  type SearchFieldProps,
  type SearchResultTab,
  SearchResultTabs as BloomSearchResultTabs,
  type SearchResultTabsProps,
  type TopResultKind,
  TopResultCard as BloomTopResultCard,
  type TopResultCardProps,
} from '@oxy.so/bloom/music-library';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { LibraryItemStyle, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { length, product } from './product';

/** The music library: its panel and rows, and the search page's parts. */
export type MusicLibraryKind =
  | 'libraryPanel'
  | 'libraryItem'
  | 'searchField'
  | 'topResultCard'
  | 'searchResultTabs'
  | 'recentSearches'
  | 'browseGrid';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/**
 * Bloom `LibraryPanel`'s data (its filter, sort, view, query and rail, each
 * controlled when given, and their handlers); `emptyState` is a language
 * child, and `renderContextMenu` returns one.
 */
export type LibraryPanelOptions = Omit<
  LibraryPanelProps,
  Drawn | 'items' | 'emptyState' | 'renderContextMenu'
> & {
  readonly emptyState?: Child;
  readonly renderContextMenu?: (item: LibraryEntry) => Child;
};
export type LibraryItemOptions = Omit<
  LibraryItemProps,
  Drawn | 'item' | 'variant' | 'onPress' | 'contextMenu'
> & { readonly contextMenu?: Child };
export type SearchFieldOptions = Omit<SearchFieldProps, Drawn | 'value' | 'onChangeText'>;
export type TopResultCardOptions = Omit<TopResultCardProps, Drawn | 'title' | 'kind' | 'onPress'>;
export type SearchResultTabsOptions = Omit<
  SearchResultTabsProps,
  Drawn | 'tabs' | 'value' | 'onValueChange'
>;
export type RecentSearchesOptions = Omit<RecentSearchesProps, Drawn | 'items'>;
/** Bloom `BrowseGrid`'s data; its own cells (`children`) are a language child, its tile width a space token. */
export type BrowseGridOptions = Omit<
  BrowseGridProps,
  Drawn | 'items' | 'children' | 'gap' | 'minTileWidth'
> & { readonly children?: Child; readonly minTileWidth?: SpaceToken };

/** Bloom `LibraryPanel`: the Your Library side panel. */
export type LibraryPanelView = ViewModifiers<LibraryPanelView>;
/** Bloom `LibraryItem`; `.onPress()` opens the entry. */
export interface LibraryItemView extends ViewModifiers<LibraryItemView> {
  /** `compact`, `list` (default), `grid` or `rail`. */
  style(value: LibraryItemStyle): LibraryItemView;
}
/** Bloom `SearchField`, writing the query its binding holds. */
export type SearchFieldView = ViewModifiers<SearchFieldView>;
/** Bloom `TopResultCard`; `.onPress()` opens the result. */
export type TopResultCardView = ViewModifiers<TopResultCardView>;
/** Bloom `SearchResultTabs`, the chosen tab as its binding holds. */
export type SearchResultTabsView = ViewModifiers<SearchResultTabsView>;
export type RecentSearchesView = ViewModifiers<RecentSearchesView>;
export interface BrowseGridView extends ViewModifiers<BrowseGridView> {
  spacing(value: SpaceToken): BrowseGridView;
}

export function LibraryPanel(
  items: readonly LibraryEntry[],
  options: LibraryPanelOptions = {},
): LibraryPanelView {
  return new Node('libraryPanel', { items, options }, []);
}
export function LibraryItem(item: LibraryEntry, options: LibraryItemOptions = {}): LibraryItemView {
  return new Node('libraryItem', { item, options }, []);
}
export function SearchField(
  query: Binding<string>,
  options: SearchFieldOptions = {},
): SearchFieldView {
  return new Node('searchField', { binding: query, options }, []);
}
export function TopResultCard(
  title: string,
  kind: TopResultKind,
  options: TopResultCardOptions = {},
): TopResultCardView {
  return new Node('topResultCard', { title, kind, options }, []);
}
export function SearchResultTabs(
  tab: Binding<string>,
  tabs: readonly SearchResultTab[],
  options: SearchResultTabsOptions = {},
): SearchResultTabsView {
  return new Node('searchResultTabs', { binding: tab, tabs, options }, []);
}
export function RecentSearches(
  items: readonly RecentSearchEntry[],
  options: RecentSearchesOptions = {},
): RecentSearchesView {
  return new Node('recentSearches', { items, options }, []);
}
/** Bloom `BrowseGrid` of colour `items`, or of its own cells (`children`). */
export function BrowseGrid(
  items: readonly BrowseTile[],
  options: BrowseGridOptions = {},
): BrowseGridView {
  return new Node('browseGrid', { items, options }, []);
}

const optionsOf = <O,>(d: ControlDraw) => (d.node.props as { options: O }).options;

export const MUSIC_LIBRARY: Record<MusicLibraryKind, ControlRenderer> = {
  libraryPanel: product(BloomLibraryPanel, {
    slots: ['emptyState'],
    own: (d) => {
      const { renderContextMenu } = optionsOf<LibraryPanelOptions>(d);
      return {
        renderContextMenu:
          renderContextMenu === undefined
            ? undefined
            : (item: LibraryEntry): ReactNode => d.render(renderContextMenu(item)),
      };
    },
  }),
  libraryItem: product(BloomLibraryItem, {
    press: true,
    slots: ['contextMenu'],
    own: (d) => ({ variant: d.own('style')?.value }),
  }),
  searchField: product(BloomSearchField, { binding: ['value', 'onChangeText'] }),
  topResultCard: product(BloomTopResultCard, { press: true }),
  searchResultTabs: product(BloomSearchResultTabs, { binding: ['value', 'onValueChange'] }),
  recentSearches: product(BloomRecentSearches),
  browseGrid: product(BloomBrowseGrid, {
    slots: ['children'],
    lengths: ['minTileWidth'],
    own: (d) => ({ gap: length(d.own('spacing')?.value as SpaceToken | undefined) }),
  }),
};
