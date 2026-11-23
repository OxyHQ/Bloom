import {
  createElement,
  isValidElement,
  useCallback,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { withRoom } from '../chrome/safe-area-inset';
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
  type VirtualListRenderItemInfo,
} from '@oxy.so/bloom/list';
import type { MailStrings } from '@oxy.so/bloom/mail-list';
import type { SwipeRowActions, SwipeRowProps } from '@oxy.so/bloom/swipe-row';

import { type Binding, type Refresh, refreshing } from '../binding';
import { Node, type Child, type ViewModifiers, type ViewNode } from '../node';
import {
  resolveSpace,
  type Density,
  type Edge,
  type InsetEdge,
  type KeyboardDismiss,
  type KeyboardTaps,
  type ListSeparator,
  type ScrollbarVisibility,
  type SpaceToken,
} from '../tokens';
import { DISMISS_MODE, containerStyle } from '../chrome/scroll-view-host';
import type { ControlDraw, ControlRenderer } from './draw';

/** Rows, lists and the virtualized list (Bloom `list`). */
export type ListKind = 'listItem' | 'mailRow' | 'list' | 'virtualList' | 'listSelectionBar';

/** How many lines a row's supporting text takes: 1 to 3, or `adaptive` to the row's width. */
export type SupportingLines = 1 | 2 | 3 | 'adaptive';

/** A row's text: a string in the row's own type, or a view. */
export type ListText = string | Child;

type Recipe =
  | { readonly recipe: 'person'; readonly data: ListPersonData }
  | { readonly recipe: 'call'; readonly data: ListCallData }
  | { readonly recipe: 'conversation'; readonly data: ListConversationData }
  | { readonly recipe: 'mail'; readonly data: MailRowData };
export type ListItemProps =
  | { readonly recipe: 'row'; readonly title: ListText | undefined }
  | Recipe;

/** The engine's own tuning knobs, as Bloom's `VirtualList` takes them (FlashList's, FlatList's, the web virtualizer's overscan). */
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
>;

/** How a list binds to its screen, as Bloom's `VirtualList` takes its `screen` (`ScreenScrollOptions`). */
export type VirtualListScreen = NonNullable<VirtualListProps<unknown>['screen']>;

/** What a list's row is handed: FlashList's `renderItem` argument as Bloom passes it, the item and its index. */
export type VirtualListRow<T> = VirtualListRenderItemInfo<T>;

/**
 * A list's row: the view of an item, or FlashList's own `renderItem` (an
 * app's named `renderPost`), whose element is drawn as it is (a language
 * root, `toElement(chain)`, as part of the list's tree).
 */
export type VirtualListRowFn<T> = (info: VirtualListRow<T>) => Child | ReactElement;

/** A mail row's data: Bloom's `ListMailData`, but its star, which is its `.starred()`. */
export type MailRowData = Omit<ListMailData, 'starred' | 'onStarredChange'>;

/** A `ListItem`'s modifiers: the one row, its slots and its selection, actions and swipes. */
export interface ListRowModifiers<Self> extends ViewModifiers<Self> {
  /** The line under the title. */
  supporting(value: ListText): Self;
  /** How many lines it takes: 1 to 3, or `adaptive` to the row's width. */
  supportingLines(value: SupportingLines): Self;
  /** What leads the row (an avatar, an icon). */
  prefix(value: Child): Self;
  /** What ends the row (a time, a chevron). */
  trailing(value: Child): Self;
  /** A body of its own in place of the title and supporting line, in the row's geometry. */
  content(value: Child): Self;
  /** What sits under the text (a progress, chips). */
  footnote(value: Child): Self;
  /** Media under the row's text. */
  attachments(value: Child): Self;
  /** `comfortable` or `compact` rows. */
  density(value: Density<'listItem'>): Self;
  /** A compact row's own vertical padding. */
  compactPadding(value: SpaceToken): Self;
  /** The current row (the open conversation). */
  active(value: boolean | undefined): Self;
  disabled(value?: boolean): Self;
  /** A link: an anchor on the web, opened on native unless `.onPress` is set. */
  link(href: string): Self;
  /** Warm what the row opens (on hover, on press in). */
  onPrefetch(value: () => void): Self;
  /** A checkbox that selects the row. */
  checkable(value: Binding<boolean>): Self;
  /** Selection mode: every row shows its checkbox. */
  selecting(value: boolean): Self;
  /** The checkbox's name. */
  selectionLabel(value: string): Self;
  /** The row's trailing action buttons, and what choosing one does (by key). */
  rowActions(actions: readonly ListAction[], onAction: (key: string) => void): Self;
  /** Actions revealed by a swipe, and the one a full swipe runs. */
  swipeActions(actions: SwipeRowActions, full?: SwipeRowProps['fullSwipeAction']): Self;
  /** `false` keeps the row's swipe actions from a swipe (they stay in its menu). */
  swipeEnabled(value: boolean): Self;
  /** The menu a right-click or a long press opens on the row. */
  contextMenu(value: Child): Self;
}
/** Bloom `ListItem`: the one row, its slots and its selection, actions and swipes. */
export type ListItemView = ListRowModifiers<ListItemView>;
/** Bloom `ListItem`'s mail recipe: a row, and its star (a node of its own, for its star). */
export interface MailRowView extends ListRowModifiers<MailRowView> {
  /** Starred: a binding; bound, its star is a button writing it. */
  starred(value: Binding<boolean>): MailRowView;
}
/** Bloom `List`: rows from data, in sections or not, with its header, footer and empty state. */
export interface ListView extends ViewModifiers<ListView> {
  /** A view pinned at the list's top or bottom, its scroller's content padded by its height (SwiftUI's `safeAreaInset`). */
  safeAreaInset(edge: InsetEdge, view: ViewNode, spacing?: SpaceToken): ListView;
  /** A `safeAreaInset` that is a bar, with Bloom's scroll edge scrim under it (SwiftUI's `safeAreaBar`). */
  safeAreaBar(edge: InsetEdge, view: ViewNode): ListView;
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
/** `T` is the data's item type, so `.itemKey()` and `.itemType()` take a typed item. */
export interface VirtualListView<T = unknown> extends ViewModifiers<VirtualListView<T>> {
  /** The content container grows to fill the list (`flexGrow: 1`): an empty state centres in it. */
  contentGrows(on?: boolean): VirtualListView<T>;
  /** Room around the rows inside the scroll: `contentContainerStyle`'s padding, on every edge or one (a later margin of an edge replaces the earlier). */
  contentMargins(value: SpaceToken): VirtualListView<T>;
  contentMargins(edge: Edge, value: SpaceToken): VirtualListView<T>;
  /** The gap between the rows: `contentContainerStyle`'s `gap`. */
  spacing(value: SpaceToken): VirtualListView<T>;
  /** A view pinned at the list's top or bottom, the content padded by its height (SwiftUI's `safeAreaInset`). */
  safeAreaInset(edge: InsetEdge, view: ViewNode, spacing?: SpaceToken): VirtualListView<T>;
  /** A `safeAreaInset` that is a bar, with Bloom's scroll edge scrim under it (SwiftUI's `safeAreaBar`). */
  safeAreaBar(edge: InsetEdge, view: ViewNode): VirtualListView<T>;
  /** Each item's key (its index by default). */
  itemKey(value: (item: T, index: number) => string): VirtualListView<T>;
  /** Each item's recycling type (FlashList's `getItemType`). */
  itemType(value: (item: T, index: number) => string | number | undefined): VirtualListView<T>;
  /** The engine's first estimate of a row's height, in px. */
  estimatedItemSize(value: number): VirtualListView<T>;
  /** Items per row. */
  columns(value: number): VirtualListView<T>;
  /** Called near the end, `threshold` viewports from it. */
  onEndReached(action: () => void, threshold?: number): VirtualListView<T>;
  /**
   * Pull to refresh: a binding a pull writes `true` (the app writes `false`
   * when done), or `{ refreshing, onRefresh }`, a refreshing value and the
   * action a pull runs (a query's `isRefetching` and `refetch`).
   */
  refreshable(value: Refresh): VirtualListView<T>;
  /** The indices whose rows stick to the top. */
  stickyIndices(value: readonly number[]): VirtualListView<T>;
  /** Where its scroll position is kept across visits. */
  restorationKey(value: string): VirtualListView<T>;
  headerContent(value: Child): VirtualListView<T>;
  footerContent(value: Child): VirtualListView<T>;
  emptyState(value: Child): VirtualListView<T>;
  /** The engine's tuning knobs, honoured by the engine that knows them. */
  tuning(value: VirtualListTuning): VirtualListView<T>;
  /**
   * The list is its screen's scroller, without a `ScrollView` around it: the
   * header's fade, the bottom bar's fold, the reselect and the insets bind to
   * it (Bloom's `screen`, `{}` by default). It must be inside a screen.
   */
  screen(options?: VirtualListScreen): VirtualListView<T>;
  /** When the native scroll indicator shows (`never` hides it); on the web the screen's scroller owns the bar. */
  scrollbar(value: ScrollbarVisibility): VirtualListView<T>;
  /** A drag `immediately` dismisses the keyboard, or drags it away `interactively`; `never` by default. */
  scrollDismissesKeyboard(value: KeyboardDismiss): VirtualListView<T>;
  /** Whether a tap with the keyboard up reaches the row: `handled` by a control, `always`, or `never` (default). */
  keyboardTaps(value: KeyboardTaps): VirtualListView<T>;
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
/** Bloom `ListItem`'s mail recipe: the inbox's row; its star is its `.starred()`. */
export function MailRow(data: MailRowData): MailRowView {
  return new Node('mailRow', { recipe: 'mail', data } satisfies ListItemProps, []);
}
/** Bloom `List`: its rows (Bloom's `ListEntry` data, an `id` each), or `sections` of them. */
export function List(items: readonly ListEntry[]): ListView {
  return new Node('list', { items }, []);
}
/** Bloom `List` in sections. */
export function SectionedList(sections: readonly ListSection[]): ListView {
  return new Node('list', { sections }, []);
}
/**
 * Bloom `VirtualList`: `row` draws each item from FlashList's `renderItem`
 * argument (`{ item, index }`), as a view or as the element FlashList's own
 * `renderItem` returns; keep it stable (module scope, or a `useCallback`): the
 * list's `renderItem` keeps its identity while `row` does.
 */
export function VirtualList<T>(
  data: readonly T[] | null | undefined,
  row: VirtualListRowFn<T>,
): VirtualListView<T> {
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
  readonly row: VirtualListRowFn<unknown>;
  readonly draw: Pick<ControlDraw, 'render' | 'embed'>;
  readonly [prop: string]: unknown;
}

/**
 * Bloom's `VirtualList` with a `renderItem` that keeps its identity while
 * `row` does, as an app's `useCallback` does: the engine re-renders a row only
 * when its item changes. The latest renderer draws a view, in the list's
 * environment; an element (FlashList's own `renderItem`) is the row as it is,
 * a language root (`toElement(chain)`) drawn as part of the list's tree, so a
 * row has no boundary of its own.
 */
function LanguageVirtualList({ row, draw, ...props }: LanguageVirtualListProps): ReactElement {
  const latest = useRef(draw);
  latest.current = draw;
  const renderItem = useCallback(
    (info: VirtualListRow<unknown>) => {
      const out = row(info);
      return (
        isValidElement(out) ? latest.current.embed(out) : latest.current.render(out)
      ) as ReactElement | null;
    },
    [row],
  );
  return createElement(BloomVirtualList as never, { ...props, renderItem });
}

/** A row: Bloom `ListItem`, titled or a recipe of its data (a mail row's star its binding). */
const listItem: ControlRenderer = (d) => {
  const own = d.node.props as ListItemProps;
  const props = rowProps(d);
  if (own.recipe === 'row') props.title = text(d, own.title);
  else props[own.recipe] = own.data;
  // A mail row's star is its binding, drawn into its data as Bloom takes it.
  const starred = d.own('starred')?.value as Binding<boolean> | undefined;
  if (own.recipe === 'mail' && starred !== undefined)
    props.mail = { ...own.data, starred: starred[0], onStarredChange: starred[1] };
  const checkable = d.own('checkable')?.value;
  const swipe = d.own('swipeActions')?.value;
  const trailing = d.own('trailing')?.value;
  Object.assign(props, {
    supporting: text(d, d.own('supporting')?.value),
    supportingLines: d.own('supportingLines')?.value,
    leading: slot(d, d.own('prefix')?.value as Child | undefined),
    trailing: trailing === undefined ? undefined : d.render(trailing[0]),
    content: slot(d, d.own('content')?.value as Child | undefined),
    footer: slot(d, d.own('footnote')?.value),
    attachments: slot(d, d.own('attachments')?.value),
    density: d.own('density')?.value,
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
};

export const LISTS: Record<ListKind, ControlRenderer> = {
  listItem,
  mailRow: listItem,
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
      // Views pinned at its edges: its scroller's content makes room for them.
      contentContainerStyle: withRoom(undefined, d.room),
    });
    listSlots(d, props);
    return d.component(BloomList, props);
  },
  virtualList: (d) => {
    const { data, row } = d.node.props as {
      data: readonly unknown[] | null | undefined;
      row: VirtualListRowFn<unknown>;
    };
    const props = d.props();
    const header = d.own('headerContent')?.value;
    const footer = d.own('footerContent')?.value;
    const empty = d.own('emptyState')?.value as Child | undefined;
    const end = d.own('onEndReached');
    const refresh = d.own('refreshable')?.value;
    const dismiss = d.own('scrollDismissesKeyboard')?.value;
    Object.assign(props, d.own('tuning')?.value, {
      data,
      keyExtractor: d.own('itemKey')?.value,
      getItemType: d.own('itemType')?.value,
      estimatedItemSize: d.own('estimatedItemSize')?.value,
      numColumns: d.own('columns')?.value,
      stickyHeaderIndices: d.own('stickyIndices')?.value,
      restorationKey: d.own('restorationKey')?.value,
      screen: d.own('screen')?.value,
      scrollbar: d.own('scrollbar')?.value,
      keyboardShouldPersistTaps: d.own('keyboardTaps')?.value,
      keyboardDismissMode: dismiss === undefined ? undefined : DISMISS_MODE[dismiss],
      ListHeaderComponent: header === undefined ? undefined : (d.render(header) as ReactElement),
      ListFooterComponent: footer === undefined ? undefined : (d.render(footer) as ReactElement),
      ListEmptyComponent: empty === undefined ? undefined : (d.render(empty) as ReactElement),
    });
    if (end !== undefined) {
      props.onEndReached = end.value;
      props.onEndReachedThreshold = end.threshold;
    }
    if (refresh !== undefined) Object.assign(props, refreshing(refresh));
    // Its content margins and gap, as every scroll of the language's, then the
    // room for views pinned at its edges.
    const container = withRoom(containerStyle(d.node, d.own('spacing')?.value), d.room);
    if (container !== undefined) props.contentContainerStyle = container;
    props.row = row;
    props.draw = d;
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
