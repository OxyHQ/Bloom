import type { ListCommonProps, ListConversationData } from '../list/types';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { PresenceStatus, StoryRingState } from '../chat-indicators/types';
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
  /** Leads a draft preview. `'Draft:'` in English (localised). */
  draft?: string;
  /** Names the pin glyph. `'Pinned'` in English (localised). */
  pinned?: string;
  /** Names the mute glyph. `'Muted'` in English (localised). */
  muted?: string;
  /** Names the verified marker. `'Verified'` in English (localised). */
  verified?: string;
  /** Names the channel marker. `'Channel'` in English (localised). */
  channel?: string;
  /** Names the bot marker. `'Bot'` in English (localised). */
  bot?: string;
  /** Names the group marker. `'Group'` in English (localised). */
  group?: string;
}

/** Conversation display data plus its identity and available actions. */
export interface ChatSummary
  extends ListConversationData,
    Pick<ListCommonProps, 'href' | 'swipeActions' | 'swipeEnabled' | 'label'> {
  id: string;
}

export interface ChatListSection {
  /** Stable identity. */
  key: string;
  /** The heading above the group ("Pinned", "All"). Omit for an unlabelled run. */
  title?: string;
  chats: readonly ChatSummary[];
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
  /**
   * The caption under your own entry. `'Your story'` in English (localised).
   * It is ALWAYS the caption, whether or not `own.name` is given; up to two
   * lines, so a short phrase is never truncated.
   */
  own?: string;
  /** Names the + badge. `'Add to your story'` in English (localised). */
  add?: string;
}

export interface StoriesRowProps {
  stories: readonly StoryEntry[];
  /**
   * Your own entry, drawn first with a `+` badge. Omit it and the row starts at
   * the first story. `name` and `avatar` are the ACCOUNT's (its display name and
   * picture) and draw only the avatar — its initial and tint, or the image; the
   * caption is `labels.own`. With neither, the avatar is the placeholder.
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
  /** Names the strip. `'Stories'` in English (localised). */
  accessibilityLabel?: string;
  labels?: StoriesRowLabels;
  style?: StyleProp<ViewStyle>;
  /**
   * Entries get `<testID>-story-<id>`, your own `<testID>-own` (its caption
   * `<testID>-own-caption`).
   */
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
  /** The input's accessible name. `'Search chats'` in English (localised). */
  accessibilityLabel?: string;
  /** `'Clear search'` in English (localised). */
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
  /** Shown when nothing matched. `'No results'` in English (localised). */
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
  /** Names the results region. `'Search results'` in English (localised). */
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

export interface NewChatButtonProps extends Omit<FabProps, 'icon' | 'label'> {
  /** Replaces the default pencil-on-a-square glyph. */
  icon?: FabProps['icon'];
  /** `'New chat'` in English (localised) — the name, and the extended FAB's text when `extended`. */
  accessibilityLabel?: string;
  /** Draw the extended pill (icon + `accessibilityLabel`) instead of the circle. */
  extended?: boolean;
}
