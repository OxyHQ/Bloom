import type { ImageSource } from '../shapes';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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

/** An avatar source: a URL, an `ImageResolver` id, or a portable Shapes image source. */
export type PersonAvatarSource = string | ImageSource | null;

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

/** Contacts grouped by the consumer's alphabet or category. */
export interface ContactSection {
  letter: string;
  contacts: readonly PersonSummary[];
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
  /** Names the × on a chip. Defaults to the app's locale (`"Remove Ana Restrepo"` in English). */
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
//  Member roles
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
  /** Names the whole strip. Defaults to the app's locale (`"Story 2 of 5"` in English). */
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
