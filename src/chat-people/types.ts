import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { PresenceStatus } from '../chat-indicators/types';

/**
 * People, groups, channels and stories — the surfaces a messaging app has
 * BESIDE the conversation itself.
 *
 * Every time here is a pre-formatted string ("last seen recently", "12:41",
 * "2 h"): the app owns the locale, the timezone and what "recently" means, and
 * a component that reads the clock is wrong for every user who is not in the
 * timezone the data came from.
 */

/** An avatar source: a URL, an `ImageResolver` id, or an RN image source. */
export type PersonAvatarSource = string | ImageSourcePropType | null;

/** The smallest shape every list here accepts. */
export interface PersonSummary {
  id: string;
  name: string;
  avatar?: PersonAvatarSource;
  /** `ImageResolver` rendition for a bare-id `avatar`. */
  avatarVariant?: string;
  /** "last seen recently", "@ana", "+34 600 …" — pre-formatted. */
  subtitle?: string;
  status?: PresenceStatus;
}

// ---------------------------------------------------------------------------
//  ContactRow / ContactList
// ---------------------------------------------------------------------------

/**
 * What sits at the end of a contact row.
 *
 *   none      nothing — the row is a plain press target
 *   chevron   a disclosure mark, for a row that opens something
 *   checkbox  multi-select, driven by `selected` / `onSelectedChange`
 *   action    a small button ("Invite", "Add"), driven by `onAction`
 */
export type ContactRowTrailing = 'none' | 'chevron' | 'checkbox' | 'action';

export interface ContactRowProps extends PersonSummary {
  /** Defaults to `checkbox` with `onSelectedChange`, `action` with `onAction`, else `none`. */
  trailing?: ContactRowTrailing;
  /** Replaces the trailing slot entirely. */
  trailingSlot?: ReactNode;
  selected?: boolean;
  onSelectedChange?: (next: boolean) => void;
  /** The action button's label — "Invite", "Add". */
  actionLabel?: string;
  onAction?: () => void;
  /** Swaps the action button for a quiet "Added" mark. */
  actionDone?: boolean;
  actionDoneLabel?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** `medium` 44px avatar (default), `small` 36 for a dense picker. */
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export interface ContactSection {
  /** The heading — one letter, or "Frequently contacted". */
  letter: string;
  contacts: readonly ContactRowProps[];
}

export interface ContactListProps {
  sections: readonly ContactSection[];
  /** Draws the A–Z rail down the right edge. Default true when there are 2+ sections. */
  showIndex?: boolean;
  /** The rail's letters. Defaults to every section's `letter`, in order. */
  indexLetters?: readonly string[];
  /** Highlights one letter in the rail — the section currently at the top. */
  activeLetter?: string;
  /** Called with the letter the user pressed in the rail. */
  onJumpToLetter?: (letter: string) => void;
  /** Names a rail button. Default `"Jump to A"`. */
  formatJumpLabel?: (letter: string) => string;
  onContactPress?: (id: string) => void;
  onContactSelectedChange?: (id: string, next: boolean) => void;
  onContactAction?: (id: string) => void;
  /** Pins each section heading while its rows scroll under it. Default true. */
  stickyHeaders?: boolean;
  /** Fixes the scroller's height. Without it the list grows to its content. */
  height?: number;
  header?: ReactNode;
  footer?: ReactNode;
  /** Drawn when every section is empty. */
  emptyState?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  SelectedChipsRow
// ---------------------------------------------------------------------------

/** `scroll` — one row that scrolls sideways. `wrap` — as many rows as it takes. */
export type SelectedChipsLayout = 'scroll' | 'wrap';

export interface SelectedChipsRowProps {
  people: readonly PersonSummary[];
  onRemove?: (id: string) => void;
  /** Default `scroll`. */
  layout?: SelectedChipsLayout;
  /** Names the × on a chip. Default `"Remove Ana Restrepo"`. */
  formatRemoveLabel?: (name: string) => string;
  /** Drawn in place of the row when nobody is picked. */
  emptyState?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  NewGroupForm
// ---------------------------------------------------------------------------

export interface NewGroupFormLabels {
  photo: string;
  name: string;
  namePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  members: (count: number) => string;
  addMembers: string;
  remove: (name: string) => string;
}

export interface NewGroupFormProps {
  /** The picked photo. Without one the picker draws a camera glyph. */
  photo?: PersonAvatarSource;
  photoVariant?: string;
  onPickPhoto?: () => void;
  name: string;
  onNameChange: (value: string) => void;
  /** The counter's denominator, and the input's hard limit. Default 64. */
  nameMaxLength?: number;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  /** Default 255. */
  descriptionMaxLength?: number;
  members?: readonly PersonSummary[];
  onRemoveMember?: (id: string) => void;
  onAddMembers?: () => void;
  labels?: Partial<NewGroupFormLabels>;
  /** Extra rows between the fields and the member list — "Who can join". */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  MemberRow / MemberList
// ---------------------------------------------------------------------------

/** `owner` and `admin` wear a badge; `member` wears nothing. */
export type MemberRole = 'owner' | 'admin' | 'member';

export interface MemberRoleLabels {
  owner: string;
  admin: string;
  promote: string;
  restrict: string;
  remove: string;
  /** Names the more button: `actions('Ana Restrepo')`. */
  actions: (name: string) => string;
}

export interface MemberRowProps extends PersonSummary {
  /** Default `member`. */
  role?: MemberRole;
  /** Replaces the badge's text — "Creator". */
  roleLabel?: string;
  onPress?: () => void;
  onPromote?: () => void;
  onRestrict?: () => void;
  onRemove?: () => void;
  /** Replaces the whole trailing slot — your own menu, a button, nothing. */
  trailingSlot?: ReactNode;
  labels?: Partial<MemberRoleLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface MemberListItem extends Omit<MemberRowProps, 'onPress' | 'onPromote' | 'onRestrict' | 'onRemove'> {
  id: string;
}

export interface MemberListProps {
  members: readonly MemberListItem[];
  /** Draws the search field. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Draws the "Add members" row at the top. */
  onAddMembers?: () => void;
  addMembersLabel?: string;
  onMemberPress?: (id: string) => void;
  onPromote?: (id: string) => void;
  onRestrict?: (id: string) => void;
  onRemove?: (id: string) => void;
  /** A heading over the rows — "412 members". */
  title?: string;
  /** Drawn when `members` is empty (a search that found nobody). */
  emptyState?: ReactNode;
  labels?: Partial<MemberRoleLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChannelPostCard
// ---------------------------------------------------------------------------

export interface ChannelPostCardProps {
  channelName: string;
  channelAvatar?: PersonAvatarSource;
  channelAvatarVariant?: string;
  verified?: boolean;
  /** Pre-formatted — "12:41", "Yesterday". */
  time: string;
  /** The post body. A string is drawn as `body-regular`; anything else is rendered as-is. */
  children?: ReactNode;
  /** Media, a poll, a quoted post — drawn above the body, edge to edge. */
  media?: ReactNode;
  /** Pre-formatted counts — "12.4K", "318". The app owns the abbreviation. */
  views?: string;
  forwards?: string;
  /** The reactions row — usually a row of `Chip`s. */
  reactions?: ReactNode;
  /** The comments button's text — "128 comments". Without it there is no button. */
  comments?: string;
  onComments?: () => void;
  onShare?: () => void;
  shareLabel?: string;
  onPress?: () => void;
  /** Draws the pin mark beside the channel name. */
  pinned?: boolean;
  /** Draws the more button. */
  onMore?: () => void;
  moreLabel?: string;
  /** Names the two counts for assistive tech. */
  labels?: Partial<{ views: (count: string) => string; forwards: (count: string) => string; pinned: string }>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  StoryViewer
// ---------------------------------------------------------------------------

export interface StoryProgressBarsProps {
  /** How many stories there are. */
  count: number;
  /** Which one is playing, zero-based. */
  index: number;
  /**
   * The current bar's fill, 0–1. Passing it makes the component CONTROLLED and
   * turns off its own timer — use it when the app already drives playback.
   */
  progress?: number;
  /** How long an uncontrolled bar takes to fill. Default 5000ms. */
  duration?: number;
  /** Freezes an uncontrolled bar where it is. */
  paused?: boolean;
  /** Fires when an uncontrolled bar reaches the end. */
  onComplete?: () => void;
  /** Bar height. Default 3. */
  height?: number;
  /** Space between bars. Default 4. */
  gap?: number;
  /** The filled colour. Defaults to the on-stage white. */
  color?: string;
  /** The unfilled colour. */
  trackColor?: string;
  /** Names the whole strip. Default `"Story 2 of 5"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface StoryViewerLabels {
  close: string;
  previous: string;
  next: string;
  mute: string;
  unmute: string;
  more: string;
  replyPlaceholder: string;
  send: string;
  /** `progress(index, count)` names the progress strip. */
  progress: (index: number, count: number) => string;
  react: (emoji: string) => string;
}

export interface StoryItem {
  id: string;
  /** The media for this story — an `Image`, a video view, anything. */
  media?: ReactNode;
  /** Overrides the viewer's `duration` for this one story. */
  duration?: number;
}

export interface StoryViewerProps {
  stories: readonly StoryItem[];
  /** Which story is showing, zero-based. Controlled. */
  index: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  /** Freezes the progress bar — hold-to-pause is the app's gesture, this is its state. */
  paused?: boolean;
  /** Default 5000ms per story. */
  duration?: number;
  /** The current bar's fill, 0–1. Makes the strip controlled. */
  progress?: number;
  /** Author. */
  name: string;
  avatar?: PersonAvatarSource;
  avatarVariant?: string;
  /** Pre-formatted — "2 h". */
  time: string;
  muted?: boolean;
  onMutedChange?: (next: boolean) => void;
  onMore?: () => void;
  /** The reply field's value. Without `onReplyChange` no composer is drawn. */
  replyValue?: string;
  onReplyChange?: (value: string) => void;
  onReplySend?: () => void;
  /** Replaces the composer entirely. */
  composer?: ReactNode;
  /** Quick reactions, drawn over the composer. */
  reactions?: readonly string[];
  onReact?: (emoji: string) => void;
  /** Fixes the viewer's height. Without it it fills its parent. */
  height?: number;
  labels?: Partial<StoryViewerLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
