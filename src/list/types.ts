import type { PersonSummary } from '../chat-people/types';
import type { ReactElement } from 'react';
import type { PressableProps, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import type { ScrollAreaScrollbar } from '../layout/types';

/** Info passed to {@link VirtualListProps.renderItem} for each row. */
export interface VirtualListRenderItemInfo<T> {
  item: T;
  index: number;
}

/** Row renderer. Returns the element for a single item (or `null` to skip). */
export type VirtualListRenderItem<T> = (info: VirtualListRenderItemInfo<T>) => ReactElement | null;

/**
 * A header / empty / footer slot. Either a ready element or a thunk that
 * produces one — both `<X />` and `() => <X />` call sites are supported,
 * matching React Native `FlatList` slot ergonomics.
 */
export type VirtualListSlot = ReactElement | (() => ReactElement | null) | null | undefined;

/**
 * Props for {@link VirtualList} — the canonical cross-platform virtualized list
 * for the Oxy ecosystem. The shape is a precise drop-in for the `FlatList` /
 * `@legendapp/list` call sites it replaces: every accepted prop is listed
 * explicitly (no index signature, no `any`).
 */
export interface VirtualListProps<T> {
  /** Opt into the nearest Screen geometry/motion without wrapping this list in a ScrollView. */
  screen?: import('../screen/types').ScreenScrollOptions;
  /**
   * Web: retain measured row sizes across route unmounts in the nearest scroll
   * restoration scope. Use the same viewer/content identity as scroll offsets.
   * Combined with the route content id; native accepts it without extra behavior.
   */
  restorationKey?: string;
  /** Row data. */
  data?: readonly T[] | null;
  /** Renders one row. */
  renderItem?: VirtualListRenderItem<T>;
  /** Stable key for a row; strongly recommended for correct virtualization. */
  keyExtractor?: (item: T, index: number) => string;
  /** Rendered above the rows; scrolls away with the content. */
  ListHeaderComponent?: VirtualListSlot;
  /** Style for the view around `ListHeaderComponent`. */
  ListHeaderComponentStyle?: StyleProp<ViewStyle>;
  /** Rendered (in place of rows) when `data` is empty. */
  ListEmptyComponent?: VirtualListSlot;
  /** Rendered below the rows. */
  ListFooterComponent?: VirtualListSlot;
  /** Style for the outer list container. */
  style?: StyleProp<ViewStyle>;
  /** Style for the inner content wrapper (e.g. padding). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * First-paint row-height estimate (px) used before a row is measured. On web
   * each row is measured after mount and this is only the initial guess; native
   * FlashList v2 measures without one.
   */
  estimatedItemSize?: number;
  /** Web: extra rows mounted beyond the viewport (virtualization overscan). */
  overscan?: number;
  /**
   * Called once each time the end of the list (footer included) comes within
   * `onEndReachedThreshold` viewports — native from the list's own scroller, web
   * from the Screen's (the window, or an element-kind panel's own element). Re-arms when the user scrolls back out of range or the row
   * count changes; never fires while `data` is empty. Guard on your own
   * in-flight flag: a second approach can come before the first page lands.
   */
  onEndReached?: () => void;
  /** Viewport-relative distance from the end that fires `onEndReached`. Default 2, as `FlatList`. */
  onEndReachedThreshold?: number;
  /**
   * Indices into `data` (`ListHeaderComponent` is not counted) of the rows that
   * stay pinned once scrolled past, until the next one takes their place. They
   * pin below the header that overlaps the list (`useHeaderDockInset()`), not
   * under it. Native FlashList and web; the `FlatList` fallback pins at its top
   * edge.
   */
  stickyHeaderIndices?: number[];
  /** Lays rows out as a grid of this many equal columns. Default 1. */
  numColumns?: number;
  /**
   * Sets `layout.span`: how many of the `numColumns` an item takes (1 by
   * default), so a full-width header row can sit in a grid. An item that does
   * not fit the rest of its row starts the next one. FlashList and web; the
   * `FlatList` fallback gives every item one column.
   */
  overrideItemLayout?: (
    layout: { span?: number },
    item: T,
    index: number,
    maxColumns: number,
  ) => void;
  /** Pull-to-refresh active flag (native). */
  refreshing?: boolean;
  /** Pull-to-refresh handler (native). Its spinner takes the theme's primary colour. */
  onRefresh?: () => void;
  /**
   * When the native scroll indicator shows (`never` hides it), as `ScrollArea`.
   * Web: the list scrolls its Screen's scroller, which owns the bar.
   */
  scrollbar?: ScrollAreaScrollbar;
  /** Native: whether a tap outside a focused input reaches the row or dismisses the keyboard. */
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  /** Native: whether dragging the list dismisses the keyboard. */
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode'];
  /** Test id applied to the outer container. */
  testID?: string;

  // --- FlashList / FlatList / @legendapp/list tuning knobs ---------------------
  // Honored by the native engine that understands them (FlashList when the app
  // installs it, `FlatList` otherwise); accepted-but-ignored elsewhere, and on
  // web, where the virtualizer manages its own mounted-row budget. Declared so
  // one call site type-checks on every platform and engine.
  removeClippedSubviews?: boolean;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  initialNumToRender?: number;
  recycleItems?: boolean;
  /** FlashList keeps it on by default; `false` turns it off. */
  maintainVisibleContentPosition?: boolean;
  /** FlashList: rows of one type recycle into each other. Give each row shape its own. */
  getItemType?: (item: T, index: number) => string | number | undefined;
  /** FlashList: how far beyond the viewport (px) rows are drawn ahead of scrolling. */
  drawDistance?: number;
  /** FlashList: the most row views kept for recycling. */
  maxItemsInRecyclePool?: number;
}

/** Imperative handle exposed via `ref`. */
export interface VirtualListHandle {
  /** Scroll to an absolute offset (px). Web scrolls the Screen's scroller: the document or its panel. */
  scrollToOffset: (params?: { offset?: number; animated?: boolean }) => void;
  /** Scroll to a coordinate. Web scrolls the Screen's scroller to `y`. */
  scrollTo: (params?: { x?: number; y?: number; animated?: boolean }) => void;
}

/** One command shared by hover, right click, swipe and native accessibility actions. */
export type ListAction = import('../swipe-row/types').SwipeRowAction;

/** The shared compact row anatomy for conversations, mail, members and content. */
export interface ListCommonProps {
  /** Structured menu content for commands with groups, submenus or custom controls. */
  contextMenu?: import('react').ReactNode;
  /** Semantic choice role when a parent owns radio/listbox navigation. */
  role?: 'button' | 'link' | 'radio' | 'checkbox' | 'option' | 'listitem';
  accessibilityHint?: string;
  disabled?: boolean;
  /** Full accessible name, including any states represented only by glyphs. */
  label?: string;
  title?: import('react').ReactNode;
  supporting?: import('react').ReactNode;
  /** Supporting text clamp; adaptive uses 1–3 lines according to row width. */
  supportingLines?: 1 | 2 | 3 | 'adaptive';
  /** Custom text body; preserves shared row geometry. */
  content?: import('react').ReactNode;
  leading?: import('react').ReactNode;
  trailing?: import('react').ReactNode;
  footer?: import('react').ReactNode;
  /** File chips; the shared horizontal attachment rail owns its inset and swipe handoff. */
  attachments?: import('react').ReactNode;
  /** Destination currently open in the adjacent pane. */
  active?: boolean;
  onPress?: () => void;
  /** Warm destination data on hover, keyboard focus or touch intent without activating it. */
  onPrefetch?: () => void;
  href?: string;
  onLongPress?: () => void;
  /**
   * Optional replacement for the open target. A renderer receives the shared row
   * handlers, accessibility and geometry; spread them onto the custom Pressable
   * and compose only the additional behavior. A ready node remains supported.
   */
  trigger?:
    | import('react').ReactNode
    | ((
        props: PressableProps & { href?: string; 'aria-current'?: 'true' },
      ) => import('react').ReactNode);
  /** Controlled selection. The avatar becomes a checkbox only on hover or when checked. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  selectionLabel?: string;
  /** During bulk selection, tapping the row toggles its selection. */
  selecting?: boolean;
  actions?: readonly ListAction[];
  swipeActions?: import('../swipe-row/types').SwipeRowActions;
  fullSwipeAction?: import('../swipe-row/types').SwipeRowProps['fullSwipeAction'];
  onAction?: (key: string) => void;
  swipeEnabled?: boolean;
  /** Parent-facing row layout, applied to the swipe host exactly once. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Conversation display data; all interaction and geometry belongs to ListItem. */
export interface ListConversationData {
  /** The conversation's name — a person, a group or a channel. */
  name: string;

  /** A single avatar: a URL, an `{ uri }`-style URL string, or an ImageResolver id. */
  avatar?: string;

  /** 2–4 faces instead of `avatar`, drawn as a `AvatarGroup layout="conversation"` cluster. */
  faces?: readonly import('../chat-list/types').ChatFace[];

  /** import('../shapes').Shape of the avatar. Default `'circle'`. */
  avatarShape?: import('../shapes').Shape;

  /** Draws a presence dot on the avatar's corner. */
  status?: import('../chat-indicators/types').PresenceStatus;

  /** Decides the default marker beside the name. Default `'direct'`. */
  kind?: import('../chat-list/types').ChatKind;

  /** Draws the verified marker; wins over the `kind` marker. */
  verified?: boolean;

  /** Your own marker, in place of whatever `kind`/`verified` would draw. */
  marker?: import('react').ReactNode;

  /** The second line. Omit it for a one-line row. */
  preview?: import('../chat-list/types').ChatPreview;

  /**
   * Replaces the preview with bouncing dots and this text ("Ana is typing…",
   * "3 people are typing…"). PRE-FORMATTED — the component never composes it.
   */
  typingLabel?: string;

  /**
   * The relative time, PRE-FORMATTED ("12:41", "Yesterday", "Tue"). Never read
   * from the clock here: the app owns the locale and the refresh.
   */
  time?: string;

  /** Unread messages. `0` or absent draws no badge. */
  unreadCount?: number;

  /** Draw an unread DOT with no number (a muted chat, or a count you do not track). */
  unreadDot?: boolean;

  /** Notifications off: the mute glyph, and a neutral unread badge instead of the accent one. */
  muted?: boolean;

  /** Pinned to the top: draws the pin glyph. */
  pinned?: boolean;

  /**
   * Delivery state of YOUR last message. Drawn only when there is nothing
   * unread — an unread chat's last message is theirs, so it has no ticks.
   */
  outgoingStatus?: import('../chat-indicators/types').MessageDeliveryStatus;

  labels?: import('../chat-list/types').ChatListItemLabels;
}
/** Mail display data; selection, actions, attachments and layout use the shared row API. */
export interface ListMailData {
  /** Who it is from. */
  sender: import('../mail-list/types').MailSender;

  /** The subject line, followed by the snippet on the compact second line. */
  subject: string;

  /** The first words of the body. One line, always. */
  snippet?: string;

  /** Already formatted by the app — this family never formats a clock. */
  time?: string;

  /**
   * Nothing on this row is read yet. The WHOLE row changes weight: sender and
   * subject go semibold and every rung of text moves up to the primary colour.
   * There is no dot.
   */
  unread?: boolean;

  /** Starred/flagged. Pressable when {@link onStarredChange} is given. */
  starred?: boolean;

  onStarredChange?: (starred: boolean) => void;

  /** Draws the paperclip. The app decides what counts. */
  hasAttachment?: boolean;

  /** How many messages the thread holds. Drawn as a badge from 2 up. */
  threadCount?: number;

  /** An unsent draft is the newest message. Leads the snippet in the negative colour. */
  draft?: boolean;

  /** The mailbox labels. */
  labels?: readonly import('../mail-list/types').MailLabel[];

  /**
   * How many label MARKS the row draws before the rest go unsaid. Default 2.
   *
   * On a one-line row a mark is a chip and the overflow count is one of them
   * (`visibleLabels`); on a two-line row the first is a chip and the rest are
   * dots (`labelMarks`). Either way the composed name says every label.
   */
  maxLabels?: number;

  /** Show sender avatars. Selection checkboxes remain visible when enabled. */
  showAvatar?: boolean;

  strings?: Partial<import('../mail-list/types').MailStrings>;
}
export interface ListCallData {
  name: string;
  avatar?: import('../call-ui/types').CallAvatarSource;
  avatarVariant?: string;
  direction: import('../call-ui/types').CallDirection;
  mode?: import('../call-ui/types').CallMode;
  meta: string;
  count?: number;
  onCallBack?: () => void;
  labels?: Partial<import('../call-ui/types').CallHistoryLabels>;
  textStyle?: StyleProp<import('react-native').TextStyle>;
}
export interface ListPersonData extends Omit<PersonSummary, 'id'> {
  onAction?: () => void;
  actionLabel?: string;
  actionDone?: boolean;
  actionDoneLabel?: string;
  textStyle?: StyleProp<import('react-native').TextStyle>;
}
export interface ListItemProps extends ListCommonProps {
  person?: ListPersonData;
  /** Call display content; direction wording and callback control share the row shell. */
  call?: ListCallData;
  /** Optional conversation content recipe; custom slots still override individual parts. */
  conversation?: ListConversationData;
  /** Optional mail content recipe, including labels, draft, thread count and star. */
  mail?: ListMailData;
}
export interface ListEntry extends ListItemProps {
  id: string;
}
export interface ListSection {
  id: string;
  title?: string;
  items: readonly ListEntry[];
}
export interface ListProps {
  /** Optional separators between rows. Inset aligns with the shared text column. */
  separator?: 'none' | 'line' | 'inset';
  /** Opt into an owned scroller. A height or section index also enables it. */
  scrollable?: boolean;
  height?: number;
  /** Heading pinning in the owned scroller; Android opts in explicitly. */
  stickyHeaders?: boolean;
  sectionIndex?: {
    ids?: readonly string[];
    activeId?: string;
    onJump?: (id: string) => void;
    labelFor?: (id: string) => string;
  };
  items?: readonly ListEntry[];
  sections?: readonly ListSection[];
  header?: import('react').ReactNode;
  footer?: import('react').ReactNode;
  empty?: import('react').ReactNode;
  loading?: boolean;
  loadingCount?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Selection toolbar shared by mail, conversations and other list content. */
export interface ListSelectionBarProps {
  count: number;
  total: number;
  /** Keep the toolbar available while selection mode is active, including zero selected rows. */
  selecting?: boolean;
  onSelectAll?: (checked: boolean) => void;
  onClear?: () => void;
  actions?: readonly ListAction[];
  onAction?: (key: string) => void;
  strings?: Partial<import('../mail-list/types').MailStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
