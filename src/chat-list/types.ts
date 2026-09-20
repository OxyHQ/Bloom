import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { AvatarShape } from '../avatar/types';
import type {
  MessageDeliveryStatus,
  PresenceStatus,
  StoryRingState,
} from '../chat-indicators/types';
import type { FabProps } from '../fab/types';
import type { TypeScaleVariant } from '../typography/scale';

import type { ChatIconComponent } from '../chat-indicators/types';
export type { ChatIconComponent };

// ---------------------------------------------------------------------------
//  Row geometry
// ---------------------------------------------------------------------------

/**
 * `comfortable` — 72 tall with a 48 avatar, the phone conversations screen.
 * `compact` — 56 tall with a 36 avatar, for a desktop split view's narrow pane
 * or a dense search result list.
 */
export type ChatListDensity = 'comfortable' | 'compact';

// ---------------------------------------------------------------------------
//  Identity
// ---------------------------------------------------------------------------

/**
 * What a chat IS, which decides the default marker beside its name: a group
 * gets no marker (its avatar already says so), a `channel` a megaphone and a
 * `bot` a robot. `direct` is the default and draws nothing unless `verified`.
 */
export type ChatKind = 'direct' | 'group' | 'channel' | 'bot';

/** One face of a group avatar. */
export interface ChatFace {
  /** A URL, an `{ uri }`-style URL string, or an ImageResolver id. */
  source?: string;
  /** Used for the initials disc and its deterministic tint when no image resolves. */
  name?: string;
  /** Overrides the letter derived from `name`. */
  initials?: string;
}

export interface GroupAvatarProps {
  /**
   * 2–4 faces. A longer array is truncated (the extra members are not summarised
   * — the row's name already says who the group is); a single face renders as a
   * plain avatar at the full size.
   */
  faces: readonly ChatFace[];
  /** Diameter of the whole cluster. Default `48`. */
  size?: number;
  /** Shape of each face. Default `'circle'`. */
  shape?: AvatarShape;
  /**
   * The colour of the hairline that separates overlapping faces — the surface
   * behind the cluster. Default the page background.
   */
  ringColor?: string;
  /**
   * Names the cluster for assistive tech. Omitted, it is decorative: inside a
   * `ChatListItem` the row's own name already says which group this is, and a
   * second announcement of the same thing is noise.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Preview line
// ---------------------------------------------------------------------------

/** What an attachment preview draws as its glyph. */
export type ChatAttachmentKind =
  | 'photo'
  | 'video'
  | 'voice'
  | 'audio'
  | 'file'
  | 'sticker'
  | 'gif'
  | 'location'
  | 'contact'
  | 'poll';

export interface ChatAttachment {
  kind: ChatAttachmentKind;
  /**
   * The words beside the glyph — `"Photo"`, `"Voice message 0:12"`. PRE-FORMATTED:
   * the app owns the wording, the pluralisation and the duration format, and the
   * component never reads a clock.
   */
  label: string;
}

/**
 * The second line of a chat row. Exactly one of its shapes wins, in this order:
 * a `draft`, then an `attachment`, then `text` — so a half-written reply is
 * never hidden behind the message it answers.
 */
export interface ChatPreview {
  /** The message body. */
  text?: string;
  /**
   * The prefix before the message, drawn in the muted colour and followed by a
   * colon: `"You"` for your own last message, a member's name in a group.
   */
  sender?: string;
  /** An attachment instead of (or before) the text. */
  attachment?: ChatAttachment;
  /** An unsent draft: the whole line turns italic and negative, led by "Draft:". */
  draft?: boolean;
}

// ---------------------------------------------------------------------------
//  Swipe / hover actions
// ---------------------------------------------------------------------------

/**
 * `neutral` — the quiet grey action (mute, read). `accent` — the affirmative one
 * (archive, pin). `negative` — destructive (delete). The tone paints the swipe
 * pane's fill and the hover button's glyph.
 */
export type ChatActionTone = 'neutral' | 'accent' | 'negative';

/**
 * Structurally `SwipeRowAction` — this family drags through `SwipeRow`, and
 * `ChatListItem` handing one array to the other is what keeps the two spellings
 * from drifting. The names stay because they are this family's published API.
 */
export interface ChatAction {
  /** Stable identity, and what `onAction` reports. */
  key: string;
  /** The caption under the swipe glyph AND the action's accessible name. */
  label: string;
  icon: ChatIconComponent;
  /** Default `'neutral'`. */
  tone?: ChatActionTone;
  /** Called on its own, in addition to the row's `onAction`. */
  onPress?: () => void;
}

/**
 * Actions revealed by dragging the row. `left` is uncovered by dragging RIGHT
 * (the pane enters from the left edge) and `right` by dragging left.
 */
export interface ChatSwipeActions {
  left?: readonly ChatAction[];
  right?: readonly ChatAction[];
}

// ---------------------------------------------------------------------------
//  ChatListItem
// ---------------------------------------------------------------------------

export interface ChatListItemLabels {
  /** Leads a draft preview. Default `'Draft:'`. */
  draft?: string;
  /** Names the pin glyph. Default `'Pinned'`. */
  pinned?: string;
  /** Names the mute glyph. Default `'Muted'`. */
  muted?: string;
  /** Names the verified marker. Default `'Verified'`. */
  verified?: string;
  /** Names the channel marker. Default `'Channel'`. */
  channel?: string;
  /** Names the bot marker. Default `'Bot'`. */
  bot?: string;
  /** Names the group marker. Default `'Group'`. */
  group?: string;
}

export interface ChatListItemProps {
  /** The conversation's name — a person, a group or a channel. */
  name: string;
  /** A single avatar: a URL, an `{ uri }`-style URL string, or an ImageResolver id. */
  avatar?: string;
  /** 2–4 faces instead of `avatar`, drawn as a {@link GroupAvatarProps} cluster. */
  faces?: readonly ChatFace[];
  /** Shape of the avatar. Default `'circle'`. */
  avatarShape?: AvatarShape;
  /** Draws a presence dot on the avatar's corner. */
  status?: PresenceStatus;
  /** Decides the default marker beside the name. Default `'direct'`. */
  kind?: ChatKind;
  /** Draws the verified marker; wins over the `kind` marker. */
  verified?: boolean;
  /** Your own marker, in place of whatever `kind`/`verified` would draw. */
  marker?: ReactNode;
  /** The second line. Omit it for a one-line row. */
  preview?: ChatPreview;
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
  outgoingStatus?: MessageDeliveryStatus;
  /** Default `'comfortable'`. */
  density?: ChatListDensity;
  /** The open conversation in a desktop split view. */
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Renders the row as a link on web, and opens the URL on native when there is no `onPress`. */
  href?: string;
  /**
   * Row actions. On touch they are revealed by a swipe; on web they appear as
   * icon buttons on hover and keyboard focus (see the doc).
   */
  swipeActions?: ChatSwipeActions;
  /** Called with the action's `key` when one is triggered, from either affordance. */
  onAction?: (key: string) => void;
  /**
   * Turns the drag gesture on or off explicitly. It defaults to
   * `useSwipeAvailable()` — on for every touch pointer, off for a mouse, which
   * keeps the hover buttons instead.
   */
  swipeEnabled?: boolean;
  /**
   * Replaces the composed row name entirely. By default the row announces
   * everything its glyphs say — "Ana Ferrer, Verified, Draft: see you at, 12:41,
   * 3 unread messages, Muted, Pinned".
   */
  accessibilityLabel?: string;
  labels?: ChatListItemLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ChatListItemSkeletonProps {
  /** How many placeholder rows. Default `1`. */
  count?: number;
  /** Matches the rows it stands in for. Default `'comfortable'`. */
  density?: ChatListDensity;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatList
// ---------------------------------------------------------------------------

/** One chat, as the list takes it. Everything a row draws, plus its identity. */
export interface ChatSummary
  extends Omit<
    ChatListItemProps,
    'density' | 'selected' | 'onPress' | 'onLongPress' | 'onAction' | 'style' | 'testID'
  > {
  id: string;
}

export interface ChatListSection {
  /** Stable identity. */
  key: string;
  /** The heading above the group ("Pinned", "All"). Omit for an unlabelled run. */
  title?: string;
  chats: readonly ChatSummary[];
}

export interface ArchivedRowProps {
  /** Chats in the archive. `0` or absent draws no badge. */
  count?: number;
  /** Default `'Archived'`. */
  label?: string;
  /** The folder glyph. Default an archive box. */
  icon?: ReactNode;
  onPress?: () => void;
  href?: string;
  /** Default `'comfortable'`. */
  density?: ChatListDensity;
  /**
   * Paints the count neutral rather than accent. Default `true` — the archive is
   * a place you visit, not a chat shouting for attention.
   */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ChatListLabels {
  /** The empty state's heading. Default `'No conversations yet'`. */
  emptyTitle?: string;
  /** The line under it. Default `'Start a chat and it will show up here.'`. */
  emptyDescription?: string;
}

export interface ChatListProps {
  /** Grouped chats. Sections render in order, each under its own heading. */
  sections?: readonly ChatListSection[];
  /** One unlabelled run of chats — shorthand for a single section. Ignored when `sections` is set. */
  chats?: readonly ChatSummary[];
  /** Default `'comfortable'`. */
  density?: ChatListDensity;
  /** The open conversation's `id` (desktop split view). */
  selectedId?: string;
  onChatPress?: (id: string) => void;
  onChatLongPress?: (id: string) => void;
  /** Called with the action key and the chat it was triggered on. */
  onChatAction?: (actionKey: string, id: string) => void;
  /** Turns the drag gesture off for every row. */
  swipeEnabled?: boolean;
  /** The archived folder row, pinned above the first section. */
  archived?: ArchivedRowProps;
  /** Draw placeholder rows instead of the chats. */
  loading?: boolean;
  /** Placeholder rows while `loading`. Default `8`. */
  loadingCount?: number;
  /** Rendered above the first section — a stories row, folder tabs, a search field. */
  header?: ReactNode;
  /** Rendered below the last section. */
  footer?: ReactNode;
  /** Replaces the built-in empty state. */
  empty?: ReactNode;
  labels?: ChatListLabels;
  /** Names the list. Default `'Chats'`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatFolderTabs
// ---------------------------------------------------------------------------

export interface ChatFolder {
  /** Stable identity, and what `onValueChange` speaks. */
  key: string;
  label: string;
  /** Unread chats in the folder. `0` or absent draws no badge. */
  unreadCount?: number;
  /** Paints the folder's badge neutral (a folder of muted chats). */
  muted?: boolean;
}

export interface ChatFolderTabsProps {
  folders: readonly ChatFolder[];
  /** The selected folder's `key` (controlled). */
  value?: string;
  /** The initially selected `key` (uncontrolled). Default: the first folder. */
  defaultValue?: string;
  onValueChange?: (key: string) => void;
  /** Names the tablist ("Chat folders"). */
  accessibilityLabel: string;
  /** Space between tabs. Default `4`. */
  gap?: number;
  /** Inline padding of the scrolling strip. Default `8`. */
  paddingHorizontal?: number;
  /** Draws the hairline under the strip. Default `true`. */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Tabs get `<testID>-tab-<key>`. */
  testID?: string;
}

// ---------------------------------------------------------------------------
//  StoriesRow
// ---------------------------------------------------------------------------

export interface StoryEntry {
  id: string;
  /** The name under the ring. */
  name: string;
  /** A URL, an `{ uri }`-style URL string, or an ImageResolver id. */
  avatar?: string;
  /** Default `'unseen'`. */
  state?: StoryRingState;
}

export interface StoriesRowLabels {
  /** The first entry's name. Default `'Your story'`. */
  own?: string;
  /** Names the + badge. Default `'Add to your story'`. */
  add?: string;
}

export interface StoriesRowProps {
  stories: readonly StoryEntry[];
  /**
   * Your own entry, drawn first with a `+` badge. Omit it and the row starts at
   * the first story.
   */
  own?: Omit<StoryEntry, 'id' | 'name'> & { name?: string };
  onStoryPress?: (id: string) => void;
  onOwnPress?: () => void;
  /** Avatar diameter. The ring sits outside it. Default `60`. */
  size?: number;
  /** Put the seen stories after the unseen ones. Default `true`. */
  seenLast?: boolean;
  /** Space between entries. Default `12`. */
  gap?: number;
  /** Inline padding of the scrolling strip. Default `16`. */
  paddingHorizontal?: number;
  /** Names the strip. Default `'Stories'`. */
  accessibilityLabel?: string;
  labels?: StoriesRowLabels;
  style?: StyleProp<ViewStyle>;
  /** Entries get `<testID>-story-<id>`, your own `<testID>-own`. */
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Search
// ---------------------------------------------------------------------------

export interface ChatSearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  /** Called by the clear (×) button, which appears once there is text. */
  onClear?: () => void;
  onSubmit?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Default `'Search'`. */
  placeholder?: string;
  /** The input's accessible name. Default `'Search chats'`. */
  accessibilityLabel?: string;
  /** Default `'Clear search'`. */
  clearLabel?: string;
  /** Drawn at the right edge — a cancel button, a filter glyph. */
  trailing?: ReactNode;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  /** The input gets `<testID>-input`, the clear button `<testID>-clear`. */
  testID?: string;
}

/** Which group a hit belongs to. Groups render in this order. */
export type ChatSearchResultKind = 'chat' | 'message' | 'contact';

export interface ChatSearchResult {
  id: string;
  kind: ChatSearchResultKind;
  /** The conversation, the contact, or the chat a message was found in. */
  name: string;
  avatar?: string;
  faces?: readonly ChatFace[];
  status?: PresenceStatus;
  /** The chat kind, for the marker beside the name. */
  chatKind?: ChatKind;
  verified?: boolean;
  /**
   * The second line: the matched message for a `message` hit, "last seen
   * recently" or a handle for a `contact`. The query is highlighted inside it.
   */
  detail?: string;
  /** PRE-FORMATTED, like every other time in this family. */
  time?: string;
  href?: string;
}

export interface ChatSearchResultsLabels {
  chat?: string;
  message?: string;
  contact?: string;
  /** Shown when nothing matched. Default `'No results'`. */
  empty?: string;
}

export interface ChatSearchResultsProps {
  /** What was typed. The matched run is highlighted in every name and detail. */
  query: string;
  /** Hits in any order; the component groups them by `kind` and keeps each group's input order. */
  results: readonly ChatSearchResult[];
  /** Group headings, and the empty line. */
  labels?: ChatSearchResultsLabels;
  onResultPress?: (id: string) => void;
  /** Placeholder rows instead of results. */
  loading?: boolean;
  /** Placeholder rows while `loading`. Default `6`. */
  loadingCount?: number;
  /** Default `'comfortable'`. */
  density?: ChatListDensity;
  /** Names the results region. Default `'Search results'`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One run of `text`, and whether it matched the query. */
export interface HighlightedRun {
  text: string;
  match: boolean;
}

export interface HighlightedTextProps {
  text: string;
  /**
   * The needle. Matching ignores case and accents, and every occurrence is
   * highlighted — an empty or whitespace-only query highlights nothing.
   */
  query: string;
  /** Type ramp step. Default `'body-regular'`. */
  variant?: TypeScaleVariant;
  /** Colour of the unmatched runs. Default the primary text colour. */
  color?: string;
  /** Colour of the matched runs. Default the accent. */
  highlightColor?: string;
  /**
   * Fill behind the matched runs. Default none — the accent colour alone marks
   * the match, and a tinted band inside a one-line row reads as a second badge.
   */
  highlightBackground?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  NewChatButton
// ---------------------------------------------------------------------------

export interface NewChatButtonProps extends Omit<FabProps, 'icon' | 'children' | 'label'> {
  /** Replaces the default pencil-on-a-square glyph. */
  icon?: ReactNode;
  /** Default `'New chat'` — the name, and the extended FAB's text when `extended`. */
  accessibilityLabel?: string;
  /** Draw the extended pill (icon + `accessibilityLabel`) instead of the circle. */
  extended?: boolean;
}
