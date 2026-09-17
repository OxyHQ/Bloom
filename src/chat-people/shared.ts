import {
  ACCENT_TABLE,
  colorRamp,
  DANGER_TABLE,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { Theme } from '../theme/types';
import type {
  ContactSection,
  MemberRole,
  MemberRoleLabels,
  NewGroupFormLabels,
  StoryViewerLabels,
} from './types';

/**
 * Two palettes, because these components live in two places.
 *
 * The LIST surfaces (contacts, members, a channel post) are ordinary app
 * screens: theme surface, theme text, flip with the mode. The STORY VIEWER is
 * a stage over media Bloom does not own, so it takes the same deep neutral the
 * call stage does, for the same reason — white chrome is the only thing that
 * survives an arbitrary photo behind it.
 */
export interface ChatPeoplePaint {
  surface: string;
  surfaceRaised: string;
  /** A row under the pointer, and a selected one. */
  rowHighlight: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  onAccent: string;
  /** The accent-tinted fill a soft badge or chip sits on. */
  accentSubtle: string;
  onAccentSubtle: string;
  negative: string;
  /** The "owner" badge. */
  owner: string;
  ownerSubtle: string;
  /** The chip a picked person wears. */
  chip: string;
  onChip: string;
  /** The alphabet rail. */
  railText: string;
  railActive: string;

  // The story stage.
  stage: string;
  onStage: string;
  onStageMuted: string;
  stageControl: string;
  /** The unfilled part of a progress segment. */
  stageTrack: string;
}

export function resolveChatPeoplePaint(theme: Theme): ChatPeoplePaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  const dark = theme.isDark;
  const red = colorRamp(c.negative, DANGER_TABLE);
  const amber = colorRamp(c.warning, ACCENT_TABLE);
  const stage = dark ? n[950] : n[900];

  return {
    surface: c.background,
    surfaceRaised: c.card,
    rowHighlight: dark ? mixColor(c.background, n[700], 0.55) : n[100],
    border: dark ? n[700] : n[200],
    text: c.text,
    textSecondary: c.textSecondary,
    textTertiary: dark ? n[600] : n[400],
    accent: accent[500],
    onAccent: c.primaryForeground,
    accentSubtle: dark ? mixColor(c.background, accent[500], 0.22) : mixColor(c.background, accent[500], 0.12),
    onAccentSubtle: dark ? accent[300] : accent[700],
    negative: dark ? red[400] : red[500],
    owner: dark ? amber[300] : amber[700],
    ownerSubtle: dark
      ? mixColor(c.background, amber[500], 0.22)
      : mixColor(c.background, amber[500], 0.16),
    chip: dark ? n[800] : n[100],
    onChip: c.text,
    railText: c.textSecondary,
    railActive: accent[500],

    stage,
    onStage: n[50],
    onStageMuted: mixColor(stage, n[50], 0.72),
    stageControl: mixColor(stage, n[50], 0.18),
    // 0.45, not 0.32: the unplayed segments sit under the top scrim, over a
    // photo that may be bright, and at a third of the white they read as no bar
    // at all — which is a viewer that never says how many stories are left.
    stageTrack: mixColor(stage, n[50], 0.45),
  };
}

// ---------------------------------------------------------------------------
//  Contacts
// ---------------------------------------------------------------------------

/**
 * The rail the index draws when the caller gives none: A–Z plus `#`.
 *
 * `#` LAST, not first. It is where names that do not start with a letter go,
 * and putting it at the top of the rail puts the least-used target where the
 * thumb naturally lands.
 */
export const CONTACT_ALPHABET: readonly string[] = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  '#',
];

/** The letters the rail shows: the caller's, else each section's own heading. */
export function contactIndexLetters(
  sections: readonly ContactSection[],
  override?: readonly string[],
): readonly string[] {
  if (override !== undefined) return override;
  return sections.map((section) => section.letter);
}

/**
 * Where a letter's section starts in a flat list of [heading, ...rows] blocks —
 * the index `ScrollView.scrollTo` needs, and the one the sticky-header list
 * numbers its children by.
 *
 * `-1` for a letter with no section: a rail can show the whole alphabet over a
 * list that only has six letters in it, and pressing K must do nothing rather
 * than jump to whatever happens to be first.
 */
export function contactSectionIndex(
  sections: readonly ContactSection[],
  letter: string,
): number {
  return sections.findIndex((section) => section.letter === letter);
}

// ---------------------------------------------------------------------------
//  Groups and members
// ---------------------------------------------------------------------------

export const NEW_GROUP_LABELS: NewGroupFormLabels = {
  photo: 'Choose a group photo',
  name: 'Group name',
  namePlaceholder: 'Name this group',
  description: 'Description',
  descriptionPlaceholder: 'What is this group for?',
  members: (count) => (count === 1 ? '1 member' : `${count} members`),
  addMembers: 'Add members',
  remove: (name) => `Remove ${name}`,
};

export const MEMBER_LABELS: MemberRoleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  promote: 'Promote to admin',
  restrict: 'Restrict',
  remove: 'Remove from group',
  actions: (name) => `Actions for ${name}`,
};

/** `owner` and `admin` wear a badge; `member` wears nothing. */
export function memberBadgeLabel(
  role: MemberRole | undefined,
  labels: MemberRoleLabels,
  override?: string,
): string | undefined {
  if (override !== undefined) return override;
  if (role === 'owner') return labels.owner;
  if (role === 'admin') return labels.admin;
  return undefined;
}

/**
 * The name counter's state.
 *
 * `warn` at 90% of the limit rather than at the limit itself: the input's own
 * `maxLength` already stops the text, so a counter that only changes colour
 * once typing has been blocked is telling the user about something that has
 * already happened.
 */
export function nameCounterTone(length: number, max: number): 'quiet' | 'warn' | 'over' {
  if (max <= 0) return 'quiet';
  if (length > max) return 'over';
  return length >= max * 0.9 ? 'warn' : 'quiet';
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

export const STORY_VIEWER_LABELS: StoryViewerLabels = {
  close: 'Close story',
  previous: 'Previous story',
  next: 'Next story',
  mute: 'Mute story',
  unmute: 'Unmute story',
  more: 'Story options',
  replyPlaceholder: 'Reply…',
  send: 'Send reply',
  progress: (index, count) => `Story ${index + 1} of ${count}`,
  react: (emoji) => `React with ${emoji}`,
};

/** The default time one story plays for. */
export const STORY_DURATION_MS = 5000;

/**
 * How full segment `bar` is while story `index` is `progress` of the way
 * through: everything before it is FULL, everything after it is EMPTY, and only
 * the current one is partial.
 *
 * It is a pure function of three numbers, so the maths is testable without
 * rendering anything — and this is the part that has a wrong answer. Writing it
 * per-segment inside the map is how a viewer ends up drawing an empty bar for a
 * story the user has already watched: the segment knows its own position and
 * nothing about the sequence.
 *
 * `progress` is clamped, and an `index` outside the range answers honestly
 * rather than throwing — a viewer whose list shrinks under it (a story expired)
 * renders one frame with a stale index.
 */
export function storyProgressFill(bar: number, index: number, progress: number): number {
  if (bar < index) return 1;
  if (bar > index) return 0;
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress));
}

/** Where a tap at `x` over a `width`-wide viewer goes. */
export function storyTapZone(x: number, width: number): 'previous' | 'next' {
  // The BACK zone is the narrower third. Forward is the common intent and it
  // is the one that must not require aim; back is a correction.
  return width > 0 && x < width / 3 ? 'previous' : 'next';
}
