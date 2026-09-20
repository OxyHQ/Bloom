import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { MailLabel } from '../mail-list/types';

/** One person on a message, as a header line draws them. */
export interface MailAddress {
  /** The display name. With none, the address itself is drawn. */
  name?: string;
  address: string;
  /** An avatar URL, or an id the `ImageResolver` knows. */
  avatar?: string;
}

/**
 * A file that ARRIVED with a message. Deliberately not the composer's
 * attachment type: this one has a size and a download and no upload progress,
 * and the composer's has progress and a remove and no size.
 */
export interface MailThreadAttachment {
  id: string;
  name: string;
  /** Already formatted by the app — "248 KB". This family never formats bytes. */
  size?: string;
  /** Defaults to a document glyph. */
  icon?: BloomIconComponent;
  onPress?: () => void;
}

/** Every string this family draws that is not app data. */
export interface MailThreadStrings {
  to: string;
  cc: string;
  bcc: string;
  reply: string;
  replyAll: string;
  forward: string;
  /** The per-message overflow trigger's name, when `menu` is given. */
  more: string;
  /** `(3) => '3 more'` — the address-line overflow. */
  moreAddresses: (count: number) => string;
  /** `(4) => '4 earlier messages'` — the middle collapse. */
  earlierMessages: (count: number) => string;
  /** The trimmed-content toggle, in both directions. */
  showTrimmed: string;
  hideTrimmed: string;
  /** Announced on a message that has not been read. */
  unread: string;
  /** The star, in both directions. */
  starred: string;
  star: string;
  /** Names the attachment row. */
  attachments: string;
  /** `(2) => '2 attachments'` — the collapsed row's attachment marker. */
  attachmentCount: (count: number) => string;
  /** Prefixes the expand/collapse control's name. */
  expand: string;
  collapse: string;
}

export interface MailMessageProps {
  sender: MailAddress;
  to?: readonly MailAddress[];
  cc?: readonly MailAddress[];
  /** The full date, drawn in the expanded header. Already formatted. */
  date?: string;
  /** The short time, drawn on the collapsed row. Already formatted. */
  time?: string;
  /** The one line a collapsed message shows. */
  preview?: string;
  /** Controlled. With neither this nor `defaultExpanded` the message is closed. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  unread?: boolean;
  starred?: boolean;
  onStarredChange?: (starred: boolean) => void;
  attachments?: readonly MailThreadAttachment[];
  /**
   * THE BODY. A slot, and only a slot: this family does not render HTML, rich
   * text or a sanitizer, because a mail body is the one thing in the domain
   * that is entirely the app's problem.
   */
  children?: ReactNode;
  /**
   * The quoted or trimmed tail of the body, behind the "show trimmed content"
   * toggle. The CONTENT is the app's; the toggle's presentation is this
   * family's.
   */
  trimmed?: ReactNode;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  /** A slot for the per-message overflow — a `DropdownMenu`, usually. */
  menu?: ReactNode;
  strings?: Partial<MailThreadStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One message, as a thread holds it. */
export interface MailThreadMessage
  extends Omit<
    MailMessageProps,
    'expanded' | 'onExpandedChange' | 'defaultExpanded' | 'testID' | 'style'
  > {
  id: string;
}

export interface MailThreadProps {
  /** The conversation's subject, drawn once above the stack. */
  subject?: string;
  /** The thread's labels, beside the subject. */
  labels?: readonly MailLabel[];
  starred?: boolean;
  onStarredChange?: (starred: boolean) => void;
  messages: readonly MailThreadMessage[];
  /**
   * Which messages are open. Uncontrolled, the NEWEST is open and the rest are
   * closed — the one arrangement that is right on arrival every time.
   */
  expandedIds?: readonly string[];
  onExpandedIdsChange?: (ids: string[]) => void;
  /**
   * How many messages stay visible before the MIDDLE collapses behind an
   * "N earlier messages" button. The first and the last two are always drawn.
   * Default 4; `0` never collapses.
   */
  collapseAfter?: number;
  /** A slot under the stack — the quick-reply box, or a row of reply buttons. */
  quickReply?: ReactNode;
  /** A slot above the subject — a back button, the mailbox chrome. */
  header?: ReactNode;
  strings?: Partial<MailThreadStrings>;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MailAddressLineProps {
  /** "To", "Cc". */
  label: string;
  addresses: readonly MailAddress[];
  /** How many names before the rest collapse into a "+N more". Default 3. */
  maxVisible?: number;
  /** Controlled overflow. Uncontrolled, pressing "+N more" opens it. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  strings?: Partial<MailThreadStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MailQuoteToggleProps {
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** The trimmed content. Rendered only while open. */
  children?: ReactNode;
  strings?: Partial<MailThreadStrings>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
