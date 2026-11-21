import { createElement, useCallback, useRef, type ReactElement, type ReactNode } from 'react';
import {
  List as BloomList,
  ListItem as BloomListItem,
  ListSelectionBar as BloomListSelectionBar,
  VirtualList as BloomVirtualList,
  type ListAction,
  type ListCallData,
  type ListConversationData,
  type ListEntry,
  type ListMailData,
  type ListPersonData,
  type ListSection,
  type VirtualListProps,
} from '@oxy.so/bloom/list';
import type { MailStrings } from '@oxy.so/bloom/mail-list';
import type { SwipeRowActions, SwipeRowProps } from '@oxy.so/bloom/swipe-row';

import type { Binding } from '../binding';
import { Node, type Child, type ViewModifiers } from '../node';
import { resolveSpace, type ControlDensity, type ListSeparator, type SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** Rows, lists and the virtualized list (Bloom `list`). */
export type ListKind = 'listItem' | 'list' | 'virtualList' | 'listSelectionBar';

/** How many lines a row's supporting text takes: 1 to 3, or `adaptive` to the row's width. */
export type SupportingLines = 1 | 2 | 3 | 'adaptive';

/** A row's text: a string in the row's own type, or a view. */
export type ListText = string | Child;

type Recipe =
  | { readonly recipe: 'person'; readonly data: ListPersonData }
  | { readonly recipe: 'call'; readonly data: ListCallData }
  | { readonly recipe: 'conversation'; readonly data: ListConversationData }
  | { readonly recipe: 'mail'; readonly data: ListMailData };
export type ListItemProps =
  | { readonly recipe: 'row'; readonly title: ListText | undefined }
  | Recipe;

/** The engine's own tuning knobs, as Bloom's `VirtualList` takes them (FlashList's, FlatList's). */
export type VirtualListTuning = Pick<
  VirtualListProps<unknown>,
  | 'overscan'
  | 'removeClippedSubviews'
  | 'maxToRenderPerBatch'
  | 'windowSize'
  | 'initialNumToRender'
  | 'recycleItems'
  | 'maintainVisibleContentPosition'
  | 'drawDistance'
  | 'maxItemsInRecyclePool'
  | 'keyboardShouldPersistTaps'
  | 'keyboardDismissMode'
  | 'scrollbar'
>;

/** Bloom `ListItem`: the one row, its slots and its selection, actions and swipes. */
export interface ListItemView extends ViewModifiers<ListItemView> {
  /** The line under the title. */
  supporting(value: ListText): ListItemView;
  /** How many lines it takes: 1 to 3, or `adaptive` to the row's width. */
  supportingLines(value: SupportingLines): ListItemView;
  /** What leads the row (an avatar, an icon). */
  prefix(value: Child): ListItemView;
  /** What ends the row (a time, a chevron). */
  trailing(value: Child): ListItemView;
  /** A body of its own in place of the title and supporting line, in the row's geometry. */
  content(value: Child): ListItemView;
  /** What sits under the text (a progress, chips). */
  footnote(value: Child): ListItemView;
  /** Media under the row's text. */
  attachments(value: Child): ListItemView;
  /** `compact` rows (the default is comfortable). */
  density(value: ControlDensity): ListItemView;
  /** A compact row's own vertical padding. */
  compactPadding(value: SpaceToken): ListItemView;
  /** The current row (the open conversation). */
  active(value: boolean | undefined): ListItemView;
  disabled(value?: boolean): ListItemView;
  /** A link: an anchor on the web, opened on native unless `.onPress` is set. */
  link(href: string): ListItemView;
  /** Warm what the row opens (on hover, on press in). */
  onPrefetch(value: () => void): ListItemView;
  /** A checkbox that selects the row. */
  checkable(value: Binding<boolean>): ListItemView;
  /** Selection mode: every row shows its checkbox. */
  selecting(value: boolean): ListItemView;
  /** The checkbox's name. */
  selectionLabel(value: string): ListItemView;
  /** The row's trailing action buttons, and what choosing one does (by key). */
  rowActions(actions: readonly ListAction[], onAction: (key: string) => void): ListItemView;
  /** Actions revealed by a swipe, and the one a full swipe runs. */
  swipeActions(actions: SwipeRowActions, full?: SwipeRowProps['fullSwipeAction']): ListItemView;
  /** `false` keeps the row's swipe actions from a swipe (they stay in its menu). */
  swipeEnabled(value: boolean): ListItemView;
  /** The menu a right-click or a long press opens on the row. */
  contextMenu(value: Child): ListItemView;
}
/** Bloom `List`: rows from data, in sections or not, with its header, footer and empty state. */
export interface ListView extends ViewModifiers<ListView> {
  /** Between rows: `none`, a full `line`, or an `inset` line (default). */
  separator(value: ListSeparator): ListView;
  /** The list scrolls itself (it is laid out in the page by default). */
  scrollable(value?: boolean): ListView;
  /** A scrolling list's viewport height. */
  scrollHeight(value: SpaceToken): ListView;
  /** Section titles stick while their rows scroll. */
  stickyHeaders(value?: boolean): ListView;
  /** The index down the side that jumps between sections. */
  sectionIndex(
    value: NonNullable<import('@oxy.so/bloom/list').ListProps['sectionIndex']>,
  ): ListView;
  headerContent(value: Child): ListView;
  footerContent(value: Child): ListView;
  /** What shows with no rows. */
  emptyState(value: Child): ListView;
  /** Placeholder rows while loading (`count` of them). */
  loading(value?: boolean): ListView;
  loadingRows(value: number): ListView;
}
/** Bloom `VirtualList`: FlashList (or FlatList) on native, the virtualizer on the web. */
export interface VirtualListView extends ViewModifiers<VirtualListView> {
  /** Each item's key (its index by default). */
  itemKey(value: (item: never, index: number) => string): VirtualListView;
  /** Each item's recycling type (FlashList's `getItemType`). */
  itemType(value: (item: never, index: number) => string | number | undefined): VirtualListView;
  /** The engine's first estimate of a row's height, in px. */
  estimatedItemSize(value: number): VirtualListView;
  /** Items per row. */
  columns(value: number): VirtualListView;
  /** Called near the end, `threshold` viewports from it. */
  onEndReached(action: () => void, threshold?: number): VirtualListView;
  /** Pull to refresh: whether it is refreshing, and what a pull does. */
  refreshable(refreshing: boolean, onRefresh: () => void): VirtualListView;
  /** The indices whose rows stick to the top. */
  stickyIndices(value: readonly number[]): VirtualListView;
  /** Where its scroll position is kept across visits. */
  restorationKey(value: string): VirtualListView;
  headerContent(value: Child): VirtualListView;
  footerContent(value: Child): VirtualListView;
  emptyState(value: Child): VirtualListView;
  /** The engine's tuning knobs, honoured by the engine that knows them. */
  tuning(value: VirtualListTuning): VirtualListView;
}
/** Bloom `ListSelectionBar`: the count selected, select all, clear and the bulk actions. */
export interface ListSelectionBarView extends ViewModifiers<ListSelectionBarView> {
  selecting(value: boolean): ListSelectionBarView;
  onSelectAll(value: (checked: boolean) => void): ListSelectionBarView;
  onClear(value: () => void): ListSelectionBarView;
  rowActions(actions: readonly ListAction[], onAction: (key: string) => void): ListSelectionBarView;
  /** Wording of your own (Bloom speaks it in the locale). */
  labels(value: Partial<MailStrings>): ListSelectionBarView;
}

/** Bloom `ListItem`: a row, titled. */
export function ListItem(title?: ListText): ListItemView {
  return new Node('listItem', { recipe: 'row', title } satisfies ListItemProps, []);
}
/** Bloom `ListItem`'s person recipe: avatar, name, handle and its action. */
export function PersonRow(data: ListPersonData): ListItemView {
  return new Node('listItem', { recipe: 'person', data } satisfies ListItemProps, []);
}
/** Bloom `ListItem`'s call recipe: the call log's row. */
export function CallRow(data: ListCallData): ListItemView {
  return new Node('listItem', { recipe: 'call', data } satisfies ListItemProps, []);
}
/** Bloom `ListItem`'s conversation recipe: the chat list's row. */
export function ConversationRow(data: ListConversationData): ListItemView {
  return new Node('listItem', { recipe: 'conversation', data } satisfies ListItemProps, []);
}
/** Bloom `ListItem`'s mail recipe: the inbox's row. */
export function MailRow(data: ListMailData): ListItemView {
  return new Node('listItem', { recipe: 'mail', data } satisfies ListItemProps, []);
}
/** Bloom `List`: its rows (Bloom's `ListEntry` data, an `id` each), or `sections` of them. */
export function List(items: readonly ListEntry[]): ListView {
  return new Node('list', { items }, []);
}
/** Bloom `List` in sections. */
export function SectionedList(sections: readonly ListSection[]): ListView {
  return new Node('list', { sections }, []);
}
/** Bloom `VirtualList`: `row` draws each item; keep it stable (module scope, or a `useCallback`). */
export function VirtualList<T>(
  data: readonly T[] | null | undefined,
  row: (item: T, index: number) => Child,
): VirtualListView {
  return new Node('virtualList', { data, row }, []);
}
/** Bloom `ListSelectionBar`: `count` of `total` selected. */
export function ListSelectionBar(count: number, total: number): ListSelectionBarView {
  return new Node('listSelectionBar', { count, total }, []);
}

const text = (d: ControlDraw, value: ListText | undefined): ReactNode =>
  typeof value === 'string' || value === undefined ? value : d.render(value);
const slot = (d: ControlDraw, value: Child | undefined): ReactNode =>
  value === undefined ? undefined : d.render(value);
const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);

/** The props of a row whose name is `label` (`.label()`), its actions and its selection. */
function rowProps(d: ControlDraw): Record<string, unknown> {
  const props = d.props();
  if (props.accessibilityLabel !== undefined) {
    props.label = props.accessibilityLabel;
    delete props.accessibilityLabel;
  }
  const actions = d.own('rowActions')?.value;
  if (actions !== undefined) [props.actions, props.onAction] = actions;
  props.selecting = d.own('selecting')?.value;
  return props;
}

function listSlots(d: ControlDraw, props: Record<string, unknown>): void {
  const header = d.own('headerContent')?.value;
  const footer = d.own('footerContent')?.value;
  const empty = d.own('emptyState')?.value as Child | undefined;
  props.header = slot(d, header);
  props.footer = slot(d, footer);
  props.empty = slot(d, empty);
}

interface LanguageVirtualListProps {
  readonly row: (item: unknown, index: number) => Child;
  readonly render: (child: Child) => ReactNode;
  readonly [prop: string]: unknown;
}

/**
 * Bloom's `VirtualList` with a `renderItem` that keeps its identity while
 * `row` does, as an app's `useCallback` does: the engine re-renders a row only
 * when its item changes. The latest renderer draws it, in the list's environment.
 */
function LanguageVirtualList({ row, render, ...props }: LanguageVirtualListProps): ReactElement {
  const latest = useRef(render);
  latest.current = render;
  const renderItem = useCallback(
    ({ item, index }: { item: unknown; index: number }) =>
      latest.current(row(item, index)) as ReactElement | null,
    [row],
  );
  return createElement(BloomVirtualList as never, { ...props, renderItem });
}

export const LISTS: Record<ListKind, ControlRenderer> = {
  listItem: (d) => {
    const own = d.node.props as ListItemProps;
    const props = rowProps(d);
    if (own.recipe === 'row') props.title = text(d, own.title);
    else props[own.recipe] = own.data;
    const density = d.own('density')?.value;
    const checkable = d.own('checkable')?.value;
    const swipe = d.own('swipeActions')?.value;
    const trailing = d.own('trailing')?.value;
    Object.assign(props, {
      supporting: text(d, d.own('supporting')?.value),
      supportingLines: d.own('supportingLines')?.value,
      leading: slot(d, d.own('prefix')?.value),
      trailing: trailing === undefined ? undefined : d.render(trailing[0]),
      content: slot(d, d.own('content')?.value),
      footer: slot(d, d.own('footnote')?.value),
      attachments: slot(d, d.own('attachments')?.value),
      density:
        density === undefined ? undefined : density === 'compact' ? 'compact' : 'comfortable',
      compactPadding: space(d.own('compactPadding')?.value),
      active: d.own('active')?.value,
      disabled: d.own('disabled')?.value,
      href: d.own('link')?.value,
      onPrefetch: d.own('onPrefetch')?.value,
      selectionLabel: d.own('selectionLabel')?.value,
      swipeEnabled: d.own('swipeEnabled')?.value,
      contextMenu: slot(d, d.own('contextMenu')?.value),
    });
    if (checkable !== undefined) [props.checked, props.onCheckedChange] = checkable;
    if (swipe !== undefined) [props.swipeActions, props.fullSwipeAction] = swipe;
    return d.component(BloomListItem, props);
  },
  list: (d) => {
    const props = d.props();
    Object.assign(props, d.node.props as object, {
      separator: d.own('separator')?.value,
      scrollable: d.own('scrollable')?.value,
      height: space(d.own('scrollHeight')?.value),
      stickyHeaders: d.own('stickyHeaders')?.value,
      sectionIndex: d.own('sectionIndex')?.value,
      loading: d.own('loading')?.value,
      loadingCount: d.own('loadingRows')?.value,
    });
    listSlots(d, props);
    return d.component(BloomList, props);
  },
  virtualList: (d) => {
    const { data, row } = d.node.props as {
      data: readonly unknown[] | null | undefined;
      row: (item: unknown, index: number) => Child;
    };
    const props = d.props();
    const header = d.own('headerContent')?.value;
    const footer = d.own('footerContent')?.value;
    const empty = d.own('emptyState')?.value as Child | undefined;
    const end = d.own('onEndReached')?.value;
    const refresh = d.own('refreshable')?.value;
    Object.assign(props, d.own('tuning')?.value, {
      data,
      keyExtractor: d.own('itemKey')?.value,
      getItemType: d.own('itemType')?.value,
      estimatedItemSize: d.own('estimatedItemSize')?.value,
      numColumns: d.own('columns')?.value,
      stickyHeaderIndices: d.own('stickyIndices')?.value,
      restorationKey: d.own('restorationKey')?.value,
      ListHeaderComponent: header === undefined ? undefined : (d.render(header) as ReactElement),
      ListFooterComponent: footer === undefined ? undefined : (d.render(footer) as ReactElement),
      ListEmptyComponent: empty === undefined ? undefined : (d.render(empty) as ReactElement),
    });
    if (end !== undefined) [props.onEndReached, props.onEndReachedThreshold] = end;
    if (refresh !== undefined) [props.refreshing, props.onRefresh] = refresh;
    props.row = row;
    props.render = d.render;
    return d.component(LanguageVirtualList, props);
  },
  listSelectionBar: (d) => {
    const props = d.props();
    const { count, total } = d.node.props as { count: number; total: number };
    const actions = d.own('rowActions')?.value;
    if (actions !== undefined) [props.actions, props.onAction] = actions;
    Object.assign(props, {
      count,
      total,
      selecting: d.own('selecting')?.value,
      onSelectAll: d.own('onSelectAll')?.value,
      onClear: d.own('onClear')?.value,
      strings: d.own('labels')?.value,
    });
    return d.component(BloomListSelectionBar, props);
  },
};
