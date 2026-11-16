import type { ListCommonProps, ListMailData } from '../list/types';

import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';

/**
 * One row at three densities: compact is a single 40px baseline, comfortable
 * stacks two lines at a 64px floor, cozy keeps those lines with an 80px floor
 * and a larger avatar and insets. All share the same content and actions.
 */
export type MailDensity = 'comfortable' | 'cozy' | 'compact';

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
export type MailActionTone = import('../list/types').ListAction['tone'];

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
 * `hover` is the desktop rail: the buttons replace the right column on
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

/** Every string this family draws that is not app data — in the locale (`BloomProvider locale`); `strings` overrides any. */
export interface MailStrings {
  /** Prefix on a draft's snippet (`'Draft:'` in English). */
  draft: string;
  /** Announced for an unread row (`'Unread'` in English). */
  unread: string;
  /** Announced for a starred row, and the star button's name when it is on. */
  starred: string;
  /** The star button's name when the row is not starred (`'Star'` in English). */
  star: string;
  /** Announced when the row carries an attachment (`'Has attachment'` in English). */
  attachment: string;
  /** The row's checkbox (`'Select'` in English). */
  select: string;
  /** `(3) => '3 messages'` — the thread count, read aloud. */
  threadCount: (count: number) => string;
  /** `(2) => '2 more labels'` — the label overflow chip. */
  moreLabels: (count: number) => string;
  /** `(3) => '3 selected'` — the selection bar's count. */
  selectedCount: (count: number) => string;
  /** The selection bar's select-all checkbox (`'Select all'` in English). */
  selectAll: string;
  /** The selection bar's clear button (`'Clear selection'` in English). */
  clearSelection: string;
  /** Empty-state heading. */
  emptyTitle: string;
  /** Empty-state body. */
  emptyDescription: string;
  /** The day buckets {@link groupMailByDay} names. */
  today: string;
  yesterday: string;
}

/** One row's data, as a list holds it. */
export interface MailSummary
  extends ListMailData,
    Pick<
      ListCommonProps,
      'actions' | 'swipeActions' | 'swipeEnabled' | 'href' | 'attachments' | 'footer'
    > {
  id: string;
  date?: number;
}

export interface MailListSection {
  key: string;
  /** "Today", "Yesterday", "14 Mar". Absent renders one unlabelled run. */
  title?: string;
  mails: readonly MailSummary[];
}

/** What {@link groupMailByDay} needs that it cannot decide itself. */
export interface MailDayGroupingOptions {
  /** "Now", for the Today/Yesterday boundary. Defaults to `Date.now()`. */
  now?: number;
  /** The two bucket names. Default: the locale's words ("Today", "Yesterday" in English). */
  strings?: Partial<Pick<MailStrings, 'today' | 'yesterday'>>;
  /**
   * The BCP 47 locale for the bucket names and the default date format — pass
   * the app's (`BloomProvider locale`); a pure helper cannot read the provider.
   * Defaults to the runtime's.
   */
  locale?: string;
  /** How an older bucket is titled. Defaults to a short Gregorian date in `locale`. */
  formatDate?: (date: Date) => string;
}
