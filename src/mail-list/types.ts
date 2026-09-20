import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';

/**
 * The two rungs of ONE row, not two components.
 *
 * `comfortable` is the phone inbox: avatar, three lines, 88 tall. `compact` is
 * the desktop list: one line, 40 tall, the same facts on a single baseline.
 * Nothing but the geometry table changes between them.
 */
export type MailDensity = 'comfortable' | 'compact';

/** Who a message is from, as a row draws them. */
export interface MailSender {
  /** The display name, or the address when there is no name. */
  name: string;
  /** An avatar URL, or an id the `ImageResolver` knows. */
  avatar?: string;
}

/**
 * A mailbox label — a first-class datum in this domain, which is why the prop
 * that carries them is `labels` and the i18n strings prop is `strings`.
 *
 * The COLOUR is a tone, never a hex: the chip paints it through
 * `resolveAccentColors`, so a label reads the same way a status badge does and
 * survives a preset change.
 */
export interface MailLabel {
  id: string;
  name: string;
  /** Defaults to `'default'`, the neutral tint. */
  tone?: AccentTone;
}

/** How loudly a row action is painted. */
export type MailActionTone = 'default' | 'accent' | 'negative';

/** One of the actions a row or the selection bar offers. */
export interface MailAction {
  key: string;
  /** The accessible name, and the selection bar's tooltip text. */
  label: string;
  icon: BloomIconComponent;
  /** Defaults to `'default'`. */
  tone?: MailActionTone;
  /** Called on its own, in addition to the list's `onMailAction`/`onBulkAction`. */
  onPress?: () => void;
}

/**
 * Where a row's `actions` are drawn AT REST.
 *
 * `hover` is the desktop rail: the buttons appear over the right column on
 * hover and keyboard focus, and are hidden outright where the pointer cannot
 * hover. `inline` draws them always — a kiosk or a tablet list with no pointer
 * and no gesture. `none` draws nothing.
 *
 * Defaults to `hover` on web and `none` on native. A touch list reaches its
 * actions by DRAGGING: pass `swipeActions`, never `inline`, or the phone row
 * carries three icons it does not need at rest.
 */
export type MailActionPlacement = 'hover' | 'inline' | 'none';

/**
 * The actions behind a row, per side. `left` is uncovered by dragging RIGHT and
 * `right` by dragging left — the side names the EDGE the pane is anchored to.
 *
 * It is a separate prop from `actions` because they answer different questions:
 * `actions` is the whole menu a pointer gets at once, and a pane is ONE action
 * a thumb reaches in one direction. Archive right, delete left is a convention
 * a mail app owns, not one this family should guess from an array's order.
 */
export interface MailSwipeActions {
  left?: readonly MailAction[];
  right?: readonly MailAction[];
}

/** Every string this family draws that is not app data. */
export interface MailStrings {
  /** Prefix on a draft's snippet. Default `'Draft:'`. */
  draft: string;
  /** Announced for an unread row. Default `'Unread'`. */
  unread: string;
  /** Announced for a starred row, and the star button's name when it is on. */
  starred: string;
  /** The star button's name when the row is not starred. Default `'Star'`. */
  star: string;
  /** Announced when the row carries an attachment. Default `'Has attachment'`. */
  attachment: string;
  /** The row's checkbox. Default `'Select'`. */
  select: string;
  /** `(3) => '3 messages'` — the thread count, read aloud. */
  threadCount: (count: number) => string;
  /** `(2) => '2 more labels'` — the label overflow chip. */
  moreLabels: (count: number) => string;
  /** `(3) => '3 selected'` — the selection bar's count. */
  selectedCount: (count: number) => string;
  /** The selection bar's select-all checkbox. Default `'Select all'`. */
  selectAll: string;
  /** The selection bar's clear button. Default `'Clear selection'`. */
  clearSelection: string;
  /** Empty-state heading. */
  emptyTitle: string;
  /** Empty-state body. */
  emptyDescription: string;
  /** The day buckets {@link groupMailByDay} names. */
  today: string;
  yesterday: string;
}

export interface MailRowProps {
  /** Who it is from. */
  sender: MailSender;
  /** The subject line. Drawn on its own line in `comfortable`, inline in `compact`. */
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
  labels?: readonly MailLabel[];
  /**
   * How many label MARKS the row draws before the rest go unsaid. Default 2.
   *
   * On a one-line row a mark is a chip and the overflow count is one of them
   * (`visibleLabels`); on a two-line row the first is a chip and the rest are
   * dots (`labelMarks`). Either way the composed name says every label.
   */
  maxLabels?: number;
  /** The row the reading pane is showing. */
  selected?: boolean;
  /**
   * The row's multi-selection state. Passing `onCheckedChange` is what makes
   * the checkbox appear at all — a list with no bulk actions draws avatars.
   */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  density?: MailDensity;
  onPress?: () => void;
  onLongPress?: () => void;
  /** A real href on web, so the row is a link and opens in a new tab. */
  href?: string;
  actions?: readonly MailAction[];
  actionsPlacement?: MailActionPlacement;
  /** What a drag uncovers on a touch pointer. */
  swipeActions?: MailSwipeActions;
  /**
   * Turns the drag on or off explicitly. Defaults to `useSwipeAvailable()` —
   * on for every touch pointer, off for a mouse, which has the rail instead.
   */
  swipeEnabled?: boolean;
  /** Called with the action's `key`, from the rail, the drag or the rotor alike. */
  onAction?: (key: string) => void;
  /** Overrides the composed name. Pass it only to translate the whole sentence. */
  accessibilityLabel?: string;
  strings?: Partial<MailStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One row's data, as a list holds it. */
export interface MailSummary
  extends Omit<
    MailRowProps,
    'onPress' | 'onLongPress' | 'onAction' | 'onCheckedChange' | 'onStarredChange' | 'density' | 'testID'
  > {
  id: string;
  /**
   * When the message arrived, in epoch milliseconds. Only
   * {@link groupMailByDay} reads it — a row draws {@link MailRowProps.time}.
   */
  date?: number;
}

export interface MailListSection {
  key: string;
  /** "Today", "Yesterday", "14 Mar". Absent renders one unlabelled run. */
  title?: string;
  mails: readonly MailSummary[];
}

export interface MailListProps {
  /** Day sections. {@link groupMailByDay} builds them from a flat list. */
  sections?: readonly MailListSection[];
  /** One unlabelled run, for a list that is not bucketed. */
  mails?: readonly MailSummary[];
  density?: MailDensity;
  /** The row the reading pane is showing. */
  selectedId?: string;
  /**
   * The multi-selection. Passing `onCheckedIdsChange` turns the checkboxes on
   * AND makes the selection bar appear — it is not a component the app places.
   */
  checkedIds?: readonly string[];
  onCheckedIdsChange?: (ids: string[]) => void;
  /** What the selection bar offers. */
  bulkActions?: readonly MailAction[];
  onBulkAction?: (key: string, ids: readonly string[]) => void;
  /** Row actions shared by every row. A row's own `actions` wins. */
  rowActions?: readonly MailAction[];
  /** Swipe actions shared by every row. A row's own `swipeActions` wins. */
  rowSwipeActions?: MailSwipeActions;
  actionsPlacement?: MailActionPlacement;
  /** Turns the drag on or off for every row. */
  swipeEnabled?: boolean;
  onMailPress?: (id: string) => void;
  onMailLongPress?: (id: string) => void;
  onMailAction?: (key: string, id: string) => void;
  onMailStarredChange?: (id: string, starred: boolean) => void;
  loading?: boolean;
  /** Placeholder rows while `loading`. Default 8. */
  loadingCount?: number;
  /** Replaces the built-in empty state. */
  empty?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  strings?: Partial<MailStrings>;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MailListSkeletonProps {
  count?: number;
  density?: MailDensity;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MailSelectionBarProps {
  /** How many rows are selected. The bar draws nothing at 0. */
  count: number;
  /** How many rows there are, for the select-all checkbox's indeterminate state. */
  total: number;
  onSelectAll?: (checked: boolean) => void;
  onClear?: () => void;
  actions?: readonly MailAction[];
  onAction?: (key: string) => void;
  density?: MailDensity;
  strings?: Partial<MailStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** What {@link groupMailByDay} needs that it cannot decide itself. */
export interface MailDayGroupingOptions {
  /** "Now", for the Today/Yesterday boundary. Defaults to `Date.now()`. */
  now?: number;
  /** The two bucket names. */
  strings?: Partial<Pick<MailStrings, 'today' | 'yesterday'>>;
  /** How an older bucket is titled. Defaults to a short local date. */
  formatDate?: (date: Date) => string;
}
