import { Platform } from 'react-native';

import { colorRamp, DANGER_TABLE, mixColor, resolveButtonRamps } from '../button/shared';
import { MESSAGE_STATUS_LABELS } from '../chat-indicators';
import type { MessageDeliveryStatus } from '../chat-indicators/types';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiContactsBookLine } from '../icons/remix/RiContactsBookLine';
import { RiFileGifLine } from '../icons/remix/RiFileGifLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiGroupFill } from '../icons/remix/RiGroupFill';
import { RiImageLine } from '../icons/remix/RiImageLine';
import { RiListCheck3 } from '../icons/remix/RiListCheck3';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiMegaphoneLine } from '../icons/remix/RiMegaphoneLine';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { RiRobot2Fill } from '../icons/remix/RiRobot2Fill';
import { RiUserSmileLine } from '../icons/remix/RiUserSmileLine';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
import type {
  ChatAttachmentKind,
  ChatIconComponent,
  ChatKind,
  ChatListDensity,
  ChatListItemLabels,
  ChatPreview,
  ChatSearchResult,
  ChatSearchResultKind,
  ChatSearchResultsLabels,
  HighlightedRun,
  StoryEntry,
} from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

export interface ChatRowGeometry {
  height: number;
  avatar: number;
  paddingHorizontal: number;
  /** Avatar → text, and text → right column. */
  gap: number;
  /** Space between the name line and the preview line. */
  lineGap: number;
  /** The inline glyphs — pin, mute, attachment, marker. */
  glyph: number;
  nameVariant: TypeScaleVariant;
  /** The name of a chat with something unread. */
  nameUnreadVariant: TypeScaleVariant;
  previewVariant: TypeScaleVariant;
  timeVariant: TypeScaleVariant;
}

/**
 * The two rungs. `comfortable` is the phone conversations screen (72 tall, a 48
 * avatar); `compact` is the 56-tall row a 360px desktop pane and the search
 * results use. Both keep the avatar vertically centred, so a one-line row (no
 * preview) has the same height as a two-line one.
 */
export const CHAT_ROW_GEOMETRY: Record<ChatListDensity, ChatRowGeometry> = {
  comfortable: {
    height: 72,
    avatar: 48,
    paddingHorizontal: 16,
    gap: 12,
    lineGap: 3,
    glyph: 16,
    nameVariant: 'headline-regular',
    nameUnreadVariant: 'headline-semibold',
    previewVariant: 'body-regular',
    timeVariant: 'caption-1-regular',
  },
  compact: {
    height: 56,
    avatar: 36,
    paddingHorizontal: 12,
    gap: 10,
    lineGap: 2,
    glyph: 14,
    nameVariant: 'body-regular',
    nameUnreadVariant: 'body-semibold',
    previewVariant: 'body-2-regular',
    timeVariant: 'caption-2-regular',
  },
};

/** Corner radius of a row's hover/selected fill. */
export const CHAT_ROW_RADIUS = 12;

// The swipe's thresholds and pane width live in `swipe-row/constants.ts` —
// this family drags through `SwipeRow` and owns none of that geometry.

// ---------------------------------------------------------------------------
//  Attachment glyphs
// ---------------------------------------------------------------------------

/**
 * The glyph per attachment kind. The LABEL always comes from the app — the
 * component draws a camera and writes whatever "Photo" is in that language.
 */
export const CHAT_ATTACHMENT_ICONS: Record<ChatAttachmentKind, ChatIconComponent> = {
  photo: RiImageLine,
  video: RiVideoLine,
  voice: RiMicLine,
  audio: RiMusic2Line,
  file: RiFileTextLine,
  sticker: RiUserSmileLine,
  gif: RiFileGifLine,
  location: RiMapPin2Line,
  contact: RiContactsBookLine,
  poll: RiListCheck3,
};

/** The glyph of an empty conversations list. */
export const CHAT_EMPTY_ICON = RiChat3Line;

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

export interface ChatListPaint {
  accent: string;
  onAccent: string;
  text: string;
  textMuted: string;
  /** The page behind the list — the presence ring's fallback, and the swipe pane's backdrop. */
  background: string;
  /** A row under the pointer. */
  hover: string;
  /** The open conversation in a split view. */
  selected: string;
  /** Section headings and the archived row's glyph. */
  heading: string;
  /** Hairlines: the folder strip's underline, a skeleton's placeholder blocks. */
  divider: string;
  /** A draft's "Draft:" prefix, and a destructive hover button's glyph. */
  negative: string;
  /** The destructive swipe pane's fill, which `onAccent` text sits on. */
  negativeFill: string;
  /** The neutral swipe pane / hover button. */
  neutralAction: string;
  /** Legible on `neutralAction`. */
  onNeutralAction: string;
  /** The focus ring. */
  ring: string;
  /** Behind a face with no image. */
  placeholder: string;
}

/**
 * Every colour this family paints, from the theme only.
 *
 * Surfaces are the page background moved toward the text colour, so a hovered
 * row and a selected row each read as a step off WHATEVER page they sit on, in
 * light and dark, rather than off a fixed ramp stop that only matches one page
 * colour. Text, accents and the destructive tone come from the ramps.
 */
export function resolveChatListPaint(theme: Theme): ChatListPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const { background, text } = theme.colors;
  const step = (light: number, darkAlpha: number) =>
    mixColor(background, text, dark ? darkAlpha : light);
  // The raw `error` token is tuned for a light page; on a dark one the same red
  // is the one a draft line and a delete pane are read AGAINST, so the ramp's
  // lighter step is taken instead.
  const danger = colorRamp(theme.colors.error, DANGER_TABLE);
  return {
    accent: accent[500],
    onAccent: theme.colors.primaryForeground,
    text,
    textMuted: theme.colors.textSecondary,
    background,
    hover: step(0.06, 0.09),
    selected: step(0.1, 0.14),
    heading: dark ? n[400] : n[500],
    divider: dark ? n[700] : n[200],
    negative: dark ? danger[400] : danger[600],
    negativeFill: dark ? danger[700] : danger[500],
    neutralAction: dark ? n[700] : n[300],
    onNeutralAction: dark ? n[100] : n[700],
    ring: accent[500],
    placeholder: step(0.11, 0.16),
  };
}

// ---------------------------------------------------------------------------
//  Pure logic
// ---------------------------------------------------------------------------

/** Case- and accent-insensitive folding, so "jose" finds "José". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase();
}

/**
 * `text` split into matched and unmatched runs. Every occurrence of `query`
 * matches, ignoring case and accents; an empty or whitespace-only query returns
 * the whole string as one unmatched run. The runs always concatenate back to
 * the ORIGINAL text — folding is used to find the offsets, never to replace
 * what is drawn. Pure.
 */
export function highlightRuns(text: string, query: string): HighlightedRun[] {
  const needle = fold(query.trim());
  if (needle.length === 0 || text.length === 0) return [{ text, match: false }];
  // Folding is not length-preserving (a combining mark is dropped), so the
  // offsets are mapped back through a per-character index rather than assumed
  // equal.
  const map: number[] = [];
  let folded = '';
  for (let i = 0; i < text.length; i += 1) {
    const piece = fold(text[i] as string);
    for (let k = 0; k < piece.length; k += 1) map.push(i);
    folded += piece;
  }
  map.push(text.length);

  const runs: HighlightedRun[] = [];
  let cursor = 0;
  let from = 0;
  while (from <= folded.length - needle.length) {
    const at = folded.indexOf(needle, from);
    if (at < 0) break;
    const start = map[at] as number;
    const end = map[at + needle.length] as number;
    if (start > cursor) runs.push({ text: text.slice(cursor, start), match: false });
    runs.push({ text: text.slice(start, end), match: true });
    cursor = end;
    from = at + needle.length;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), match: false });
  return runs.length > 0 ? runs : [{ text, match: false }];
}

/** The order search groups are drawn in. */
export const CHAT_SEARCH_KINDS: readonly ChatSearchResultKind[] = ['chat', 'message', 'contact'];

/**
 * `results` bucketed by `kind`, in {@link CHAT_SEARCH_KINDS} order, keeping each
 * bucket's input order. Empty buckets are dropped — a heading over nothing is a
 * dead end. Pure.
 */
export function groupSearchResults(
  results: readonly ChatSearchResult[],
): { kind: ChatSearchResultKind; results: ChatSearchResult[] }[] {
  return CHAT_SEARCH_KINDS.map((kind) => ({
    kind,
    results: results.filter((result) => result.kind === kind),
  })).filter((group) => group.results.length > 0);
}

/**
 * Stories with the unseen ones first, keeping the input order inside each half.
 * `none` counts as seen: a ring that is not there is not waiting to be opened.
 * Pure; never mutates `stories`.
 */
export function sortStories(stories: readonly StoryEntry[]): StoryEntry[] {
  return stories
    .map((story, index) => ({ story, index }))
    .sort((a, b) => {
      const rank = (entry: StoryEntry) => ((entry.state ?? 'unseen') === 'unseen' ? 0 : 1);
      return rank(a.story) - rank(b.story) || a.index - b.index;
    })
    .map(({ story }) => story);
}

/**
 * Whether a chat has anything unread — which is also what decides whether its
 * right column shows an unread badge or YOUR last message's delivery ticks.
 * They are mutually exclusive by construction: if their message is the last
 * one, yours has no place in this row. Pure.
 */
export function hasUnread(unreadCount?: number, unreadDot?: boolean): boolean {
  return Boolean(unreadDot) || (unreadCount ?? 0) > 0;
}

/** The default English names. Apps in other languages pass their own. */
export const DEFAULT_ITEM_LABELS: Required<ChatListItemLabels> = {
  draft: 'Draft:',
  pinned: 'Pinned',
  muted: 'Muted',
  verified: 'Verified',
  channel: 'Channel',
  bot: 'Bot',
  group: 'Group',
};

export const DEFAULT_SEARCH_LABELS: Required<ChatSearchResultsLabels> = {
  chat: 'Chats',
  message: 'Messages',
  contact: 'Contacts',
  empty: 'No results',
};

/** The marker a row draws beside the name, and what it is called. */
export function chatMarker(
  kind: ChatKind | undefined,
  verified: boolean | undefined,
  labels: Required<ChatListItemLabels>,
): { icon: ChatIconComponent; label: string; accent: boolean } | null {
  if (verified) return { icon: RiVerifiedBadgeFill, label: labels.verified, accent: true };
  switch (kind) {
    case 'channel':
      return { icon: RiMegaphoneLine, label: labels.channel, accent: false };
    case 'bot':
      return { icon: RiRobot2Fill, label: labels.bot, accent: false };
    case 'group':
      return { icon: RiGroupFill, label: labels.group, accent: false };
    default:
      return null;
  }
}

/** The preview line as ONE string, for the row's accessible name. Pure. */
export function previewSummary(
  preview: ChatPreview | undefined,
  labels: Required<ChatListItemLabels>,
): string {
  if (preview === undefined) return '';
  const body = [preview.attachment?.label, preview.text].filter(Boolean).join(' ');
  if (preview.draft) return [labels.draft, body].filter(Boolean).join(' ');
  if (preview.sender) return [`${preview.sender}:`, body].filter(Boolean).join(' ');
  return body;
}

export interface ChatRowNameInput {
  name: string;
  markerLabel?: string | null;
  typingLabel?: string;
  preview?: ChatPreview;
  time?: string;
  unreadCount?: number;
  unreadDot?: boolean;
  muted?: boolean;
  pinned?: boolean;
  outgoingStatus?: MessageDeliveryStatus;
}

/**
 * Everything the row's glyphs say, as one name — because the content is hidden
 * from assistive tech and the row announces itself ONCE. A pin, a mute bell, a
 * badge and a pair of ticks are four states no text on the row carries, so a
 * reader that only got "Ana Ferrer" would be missing all four.
 *
 * Pure, and the ORDER is the reading order: who, what kind, what was said, when,
 * then the states. Delivery ticks and an unread badge are mutually exclusive —
 * see {@link hasUnread}.
 */
export function composeChatRowName(
  input: ChatRowNameInput,
  labels: Required<ChatListItemLabels>,
  unreadLabel: (count: number) => string,
): string {
  const unread = hasUnread(input.unreadCount, input.unreadDot);
  return [
    input.name,
    input.markerLabel ?? null,
    input.typingLabel ?? previewSummary(input.preview, labels),
    input.time,
    unread ? unreadLabel(input.unreadCount ?? 0) : null,
    !unread && input.outgoingStatus ? MESSAGE_STATUS_LABELS[input.outgoingStatus] : null,
    input.muted ? labels.muted : null,
    input.pinned ? labels.pinned : null,
  ]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(', ');
}

// ---------------------------------------------------------------------------
//  Web stylesheet
//
//  Hover and keyboard-focus affordances no inline style can carry. The hooks
//  are `data-*` attributes through `dataSet` (a `className` never reaches the
//  DOM here — react-native-css consumes it into `style`), and
//  `adoptStyleSheet` no-ops without a `document`, so this file stays universal.
// ---------------------------------------------------------------------------

export const CHAT_LIST_STYLE_ID = 'bloom-chat-list-web-css';

const ROW = '[data-bloom-chat-row]';
const FOCUSABLE = '[data-bloom-chat-focusable]';
const ACTIONS = '[data-bloom-chat-actions]';

export const CHAT_LIST_CSS = `
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
  user-select: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-chat-ring, currentColor);
  outline-offset: -2px;
}
${ROW}:hover,
${ROW}:focus-within {
  background-color: var(--bloom-chat-hover, transparent);
}
${ROW}[data-selected="true"],
${ROW}[data-selected="true"]:hover {
  background-color: var(--bloom-chat-selected, transparent);
}
${ACTIONS} {
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-out;
}
${ROW}:hover ${ACTIONS},
${ROW}:focus-within ${ACTIONS} {
  opacity: 1;
  pointer-events: auto;
}
[data-bloom-chat-scroll-x] {
  scrollbar-width: none;
}
[data-bloom-chat-scroll-x]::-webkit-scrollbar {
  display: none;
}
[data-bloom-chat-input] {
  outline: none;
}
[data-bloom-chat-input]::-webkit-search-cancel-button {
  display: none;
}
[data-bloom-chat-search-pill] {
  cursor: text;
}
@media (hover: none) {
  ${ACTIONS} {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${ACTIONS} {
    transition: none;
  }
}
`;
