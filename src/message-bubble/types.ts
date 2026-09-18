import type { ReactNode } from 'react';
import type { DimensionValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { MessageDeliveryStatus } from '../chat-indicators';

/** Which side of the transcript a message sits on. */
export type MessageDirection = 'incoming' | 'outgoing';

/**
 * Where a bubble sits in a run of consecutive messages from the same sender.
 * It decides ONE thing — which corner is cut — and the cut is on the LAST
 * bubble of a run, the one the tail would hang off.
 */
export type MessagePosition = 'single' | 'first' | 'middle' | 'last';

/**
 * How the `media` slot is fitted inside the bubble.
 *
 *   bleed   the bubble's padding is CANCELLED and the block runs to the radius
 *           — a photo, a video, an album, a sticker: something with its own
 *           edge, which an inset would frame twice
 *   inset   the block keeps the bubble's padding — a poll, a place, a contact
 *           card: typography with no padding of its own, which bled means a
 *           question clipped against the top edge and an avatar on the left one
 *
 * It also decides where the meta row lands by default: over a bled block on a
 * translucent pill, under an inset one where it cannot cover a line of text.
 */
export type MessageMediaFit = 'bleed' | 'inset';

/** A text span the bubble hands back to the caller to render. */
export type MessageEntityType = 'link' | 'mention' | 'hashtag';

export interface MessageEntity {
  type: MessageEntityType;
  /** The matched text, including the `@`, `#` or scheme. */
  text: string;
  /** Character offsets into the message text. */
  start: number;
  end: number;
}

/** One reaction pill: an emoji, how many people picked it, and whether you did. */
export interface MessageReaction {
  emoji: string;
  count: number;
  /** Highlights the pill in the accent and flips the toggle's pressed state. */
  mine?: boolean;
  /** Accessible name. Default: `"<emoji>, <count>"` (plus ", selected"). */
  label?: string;
}

/** The quoted message above a reply. */
export interface MessageReplyPreview {
  /** Who wrote the quoted message. */
  senderName: string;
  /** One line of it — already truncated by the caller if it needs to be. */
  preview: string;
  /** Overrides the left bar and name colour (a per-sender hue, usually). */
  color?: string;
}

/** An incoming, outgoing or missed call, as a row in the transcript. */
export type CallOutcome = 'incoming' | 'outgoing' | 'missed';

export interface MessageBubbleLabels {
  /** Prefixes the forwarded line. Default `"Forwarded from"`. */
  forwardedFrom: string;
  /** What a deleted bubble says. */
  deleted: string;
  /** Names the retry control on a failed message. */
  retry: string;
  /** Names the `+` reaction control. */
  addReaction: string;
  /** Names the reply quote when it is pressable. */
  replyTo: string;
  /** Announced on a selected bubble. */
  selected: string;
  /** Announced on a message that has not been sent yet. */
  pending: string;
  /** Announced on a message that failed to send. */
  failed: string;
}

export interface MessageBubbleProps {
  direction: MessageDirection;
  /** Default `'single'`. See {@link MessagePosition}. */
  position?: MessagePosition;
  /** The message text. Ignored when `children` is given. */
  text?: string;
  /** Arbitrary bubble content, in place of `text`. */
  children?: ReactNode;
  /**
   * The rich-media slot — an image, a voice note, a file row, a poll. It is
   * rendered ABOVE the text; `mediaFit` decides whether it bleeds to the
   * bubble's radius or keeps its padding.
   */
  media?: ReactNode;
  /**
   * How `media` is fitted. Default `'bleed'` — today's photo. Pass `'inset'`
   * for a block that draws no padding of its own (`PollMessage`,
   * `LocationMessage`, `ContactMessage`). See {@link MessageMediaFit}.
   */
  mediaFit?: MessageMediaFit;
  /**
   * Floats the meta row over the media on a translucent pill instead of
   * tucking it after the text. Defaults to true on a BLED media-only bubble,
   * and false on an inset one — an inset block's last line is text, and a pill
   * over "0 votes" or over an address is the same defect twice. Set it either
   * way to override.
   */
  metaOverlay?: boolean;
  /** Draws the notch on the small corner. Off by default. */
  tail?: boolean;
  /** The sender line above the text, in groups. */
  senderName?: string;
  /** What {@link senderNameColor} hashes. Defaults to `senderName`. */
  senderColorSeed?: string;
  /** An explicit sender colour, in place of the hashed one. */
  senderColor?: string;
  /** Renders `link` / `mention` / `hashtag` spans of `text` yourself. */
  renderEntity?: (entity: MessageEntity) => ReactNode;
  /** The quote block above the text. */
  replyTo?: MessageReplyPreview;
  onPressReply?: () => void;
  /** Draws "Forwarded from <name>" above the content. */
  forwardedFrom?: string;
  /** Shown in the meta row. Pass `""` (or omit) for a message that was not edited. */
  editedLabel?: string;
  /** A pre-formatted time — `"12:41"`. Never computed here. */
  time?: string;
  /** The delivery ticks. Outgoing only; ignored on an incoming bubble. */
  status?: MessageDeliveryStatus;
  /** A pre-formatted view count for a channel post — `"12.4K"`. */
  channelViews?: string;
  /** The author signature on a channel post. */
  authorSignature?: string;
  reactions?: readonly MessageReaction[];
  onToggleReaction?: (emoji: string) => void;
  onAddReaction?: () => void;
  /** Dimmed: queued, not acknowledged. */
  pending?: boolean;
  /** Negative tint plus a retry affordance. */
  failed?: boolean;
  onRetry?: () => void;
  /**
   * Selection mode. `undefined` means the transcript is not in selection mode;
   * `true`/`false` draw the full-row band and make the bubble a toggle.
   */
  selected?: boolean;
  /** The flash after jumping to a message. */
  highlighted?: boolean;
  /** Replaces the content with the "This message was deleted" line. */
  deleted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Web only — right-click. The event is defaulted for you. */
  onContextMenu?: () => void;
  onDoublePress?: () => void;
  /** Native only — a short drag towards the reply direction. */
  onSwipeReply?: () => void;
  /** How wide the bubble may grow. Default `'78%'`. */
  maxWidth?: DimensionValue;
  labels?: Partial<MessageBubbleLabels>;
  /** Names the bubble for assistive tech. Composed from its parts by default. */
  accessibilityLabel?: string;
  /** The ROW — the full-width band, not the bubble. */
  style?: StyleProp<ViewStyle>;
  /** The bubble itself. */
  bubbleStyle?: StyleProp<ViewStyle>;
  /** The message text. */
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Group
// ---------------------------------------------------------------------------

export interface MessageGroupProps {
  direction: MessageDirection;
  /** The bubbles. `position` is computed and injected for each. */
  children: ReactNode;
  /** The name above the run. Also the default avatar name and colour seed. */
  senderName?: string;
  senderColorSeed?: string;
  senderColor?: string;
  /** A URL, an `ImageResolver` id, or an `{ uri }` source. */
  avatarSource?: string | { uri: string };
  /** Default `true` for incoming runs; a 1:1 chat passes `false`. */
  showAvatar?: boolean;
  /** Avatar diameter. Default 28. */
  avatarSize?: number;
  onPressAvatar?: () => void;
  /** Draws the sender line above the first bubble. Default: whenever `senderName` is set and the run is incoming. */
  showSenderName?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Separators and service rows
// ---------------------------------------------------------------------------

export interface DateSeparatorProps {
  /** Pre-formatted — `"Today"`, `"12 March"`. */
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface UnreadSeparatorProps {
  /** Default `"Unread messages"`. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SystemMessageProps {
  /** The service line — `"Ana joined the group"`. */
  children?: ReactNode;
  /** Plain-text form, used when there are no `children`. */
  text?: string;
  /** A glyph before the text, e.g. a pin. */
  icon?: ReactNode;
  onPress?: () => void;
  /** Required when `onPress` is set and the row draws no text of its own. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CallSummaryRowProps {
  direction: MessageDirection;
  outcome: CallOutcome;
  /** `"Outgoing call"`, `"Missed voice call"` — pre-formatted. */
  title: string;
  /** `"12:04"` or `"4 min"` — pre-formatted. */
  duration?: string;
  /** The time in the meta row. */
  time?: string;
  /** Marks the call as video rather than voice (changes the icon only). */
  video?: boolean;
  onPress?: () => void;
  position?: MessagePosition;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TypingBubbleProps {
  /** Default `'incoming'`. */
  direction?: MessageDirection;
  senderName?: string;
  avatarSource?: string | { uri: string };
  showAvatar?: boolean;
  avatarSize?: number;
  /** Default `"Typing…"` — the bubble draws dots and no text, so it needs one. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  List
// ---------------------------------------------------------------------------

/**
 * One entry a caller hands {@link MessageListProps.items}. Everything a bubble
 * takes, plus what the LIST needs to place it: who sent it, which day it is on,
 * and whether it is a service row rather than a message.
 */
export interface MessageListItem
  extends Omit<MessageBubbleProps, 'position' | 'style' | 'testID'> {
  id: string;
  /**
   * Who sent it. Two consecutive messages group only when this matches — omit
   * it in a 1:1 chat, where `direction` is enough.
   */
  senderId?: string;
  /** A stable key for the day. A change inserts a {@link DateSeparator}. */
  dateKey?: string;
  /** The separator's text. Pre-formatted; defaults to `dateKey`. */
  dateLabel?: string;
  /** Puts an {@link UnreadSeparator} directly above this message. */
  unreadBefore?: boolean;
  /** Renders a {@link SystemMessage} instead of a bubble, and breaks the run. */
  system?: string;
  /** Renders a {@link CallSummaryRow} instead of a bubble. */
  call?: Omit<CallSummaryRowProps, 'direction' | 'position' | 'style' | 'testID'>;
  /** Group chrome for the run this message starts. */
  avatarSource?: string | { uri: string };
  onPressAvatar?: () => void;
}

/** A message with the corner geometry the list worked out for it. */
export interface GroupedMessage {
  item: MessageListItem;
  position: MessagePosition;
}

/** What {@link groupMessages} emits, in render order. */
export type MessageListEntry =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'unread'; key: string }
  | { kind: 'system'; key: string; item: MessageListItem }
  | { kind: 'call'; key: string; item: MessageListItem }
  | { kind: 'group'; key: string; direction: MessageDirection; messages: GroupedMessage[] };

export interface MessageListProps {
  items: readonly MessageListItem[];
  /** Hides every run avatar — a 1:1 chat. */
  showAvatars?: boolean;
  /** Hides the sender line above each run — a 1:1 chat. */
  showSenderNames?: boolean;
  avatarSize?: number;
  /** Default `"Unread messages"`. */
  unreadLabel?: string;
  labels?: Partial<MessageBubbleLabels>;
  /** Padding around the stack. Default `{ paddingHorizontal: 12, paddingVertical: 8 }`. */
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
