import { Platform } from 'react-native';

import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import {
  hairlineOn,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import type { SwipeRowAction, SwipeRowActions } from '../swipe-row';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
import type {
  MailAction,
  MailDayGroupingOptions,
  MailDensity,
  MailLabel,
  MailListSection,
  MailStrings,
  MailSummary,
  MailSwipeActions,
} from './types';

export const IS_WEB = Platform.OS === 'web';

/** The glyph an empty inbox draws. */
export const MAIL_EMPTY_ICON = RiInbox2Line;

// ---------------------------------------------------------------------------
//  Geometry — the whole difference between the two densities
// ---------------------------------------------------------------------------

export interface MailRowGeometry {
  /** `comfortable` grows with its label chips, so this is a floor. */
  minHeight: number;
  /** `compact` is a fixed single line, so it also has an exact height. */
  height?: number;
  paddingVertical: number;
  paddingHorizontal: number;
  avatar: number;
  /** Avatar → text column, and text column → right column. */
  gap: number;
  /** Between the stacked lines of a comfortable row. */
  lineGap: number;
  /** The inline glyphs — paperclip, star, draft. */
  glyph: number;
  /**
   * How wide the sender column is on a one-line row: a basis, a floor, and a
   * CEILING as a fraction of the row.
   *
   * The basis alone is not enough. A flex basis only shrinks when the bases
   * OVERFLOW, and the subject beside it has a zero basis (it is the `flex: 1`
   * child), so on a narrow pane there is no negative free space to shrink and
   * the sender keeps its full 180 while the subject is handed whatever is left
   * — measured at 420px: one character and an ellipsis. The ceiling is what
   * makes the row degrade instead of collapsing.
   */
  senderWidth: number;
  senderMinWidth: number;
  senderMaxWidth: `${number}%`;
  senderVariant: TypeScaleVariant;
  senderUnreadVariant: TypeScaleVariant;
  subjectVariant: TypeScaleVariant;
  subjectUnreadVariant: TypeScaleVariant;
  snippetVariant: TypeScaleVariant;
  timeVariant: TypeScaleVariant;
  /**
   * The round action buttons — the star, and the rail. `comfortable` is a TOUCH
   * target and so is 44; `compact` is a pointer-only density where 44 would not
   * fit a 40-tall row at all.
   */
  action: number;
  actionGlyph: number;
}

/**
 * 72 tall with two lines on a phone, 40 tall with one on a desktop. The avatar
 * is centred in both, so a row with no snippet is the same height as one with a
 * snippet and a label.
 *
 * The phone rung is the same 72/48 as a `chat-list` row on purpose: a mail row
 * and a conversation row are the same kind of object, and an inbox that stands
 * 16px taller per row than the messages screen reads as a different library.
 * Two lines is what pays for it — the sender and the time share the first, the
 * subject and the snippet the second.
 */
export const MAIL_ROW_GEOMETRY: Record<MailDensity, MailRowGeometry> = {
  comfortable: {
    minHeight: 72,
    paddingVertical: 12,
    paddingHorizontal: 16,
    avatar: 48,
    gap: 12,
    lineGap: 2,
    glyph: 16,
    senderWidth: 0,
    senderMinWidth: 0,
    senderMaxWidth: '100%',
    senderVariant: 'headline-regular',
    senderUnreadVariant: 'headline-semibold',
    subjectVariant: 'body-regular',
    subjectUnreadVariant: 'body-semibold',
    snippetVariant: 'body-regular',
    timeVariant: 'caption-1-regular',
    action: 44,
    actionGlyph: 18,
  },
  compact: {
    minHeight: 40,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 12,
    avatar: 24,
    gap: 10,
    lineGap: 0,
    glyph: 14,
    senderWidth: 180,
    senderMinWidth: 88,
    senderMaxWidth: '34%',
    senderVariant: 'body-2-regular',
    senderUnreadVariant: 'body-2-semibold',
    subjectVariant: 'body-2-regular',
    subjectUnreadVariant: 'body-2-semibold',
    snippetVariant: 'body-2-regular',
    timeVariant: 'caption-2-regular',
    action: 28,
    actionGlyph: 16,
  },
};

/** Corner radius of a row's hover/selected fill. A row is a surface, not a control. */
export const MAIL_ROW_RADIUS = 10;

/**
 * The label mark a two-line row draws when there is no width for a second chip.
 * A dot says "this one carries another label" in 8px; the row's composed name
 * is where its NAME is, and always was.
 */
export const MAIL_LABEL_DOT = 8;

/** The selection bar's height, per density. */
export const MAIL_SELECTION_BAR_HEIGHT: Record<MailDensity, number> = {
  comfortable: 56,
  compact: 44,
};

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

export interface MailPaint extends SurfaceTextPaint {
  /** The fill the rows sit ON — whatever the container published. */
  surface: string;
  /** A row under the pointer: one step off that. */
  hover: string;
  /** The row the reading pane is showing: one step further. */
  selected: string;
  /** Section headings, hairlines. */
  hairline: string;
  /** The accent a label-less star, an unread time and the focus ring take. */
  accent: string;
  /** The selection bar's own surface, and what is legible on it. */
  barFill: string;
  barText: string;
  /** A draft prefix and a destructive action. */
  negative: string;
}

/**
 * Every colour this family paints, derived from the fill it was handed.
 *
 * Nothing here is a ramp stop. The hovered and the selected row are the first
 * and second rungs of the surface ladder measured off the ACTUAL parent, so a
 * list inside a card and a list on the page each step off their own background;
 * the text rungs are floored against that same fill; and the accent, the
 * selection bar and the draft colour come from `resolveAccentColors`.
 */
export function resolveMailPaint(theme: Theme, surface: string): MailPaint {
  const hover = surfaceFillOn(theme, surface);
  const bar = resolveAccentColors(theme.colors, 'primary', 'subtle');
  return {
    surface,
    hover,
    selected: surfaceFillOn(theme, hover),
    hairline: hairlineOn(theme, surface),
    accent: resolveAccentColors(theme.colors, 'primary', 'outlined').foreground,
    barFill: bar.background,
    barText: bar.foreground,
    negative: resolveAccentColors(theme.colors, 'error', 'outlined').foreground,
    ...surfaceTextOn(theme, surface),
  };
}

/** A label dot's fill: the tone's SOLID pair, so it reads at 8px. */
export function labelDotColor(theme: Theme, label: MailLabel): string {
  return resolveAccentColors(theme.colors, label.tone ?? 'default', 'solid').background;
}

/** The glyph colour an action's tone paints on the row. */
export function mailActionColor(action: MailAction, paint: MailPaint): string {
  switch (action.tone) {
    case 'negative':
      return paint.negative;
    case 'accent':
      return paint.accent;
    default:
      return paint.textSecondary;
  }
}

// ---------------------------------------------------------------------------
//  Strings
// ---------------------------------------------------------------------------

export const DEFAULT_MAIL_STRINGS: MailStrings = {
  draft: 'Draft:',
  unread: 'Unread',
  starred: 'Starred',
  star: 'Star',
  attachment: 'Has attachment',
  select: 'Select',
  threadCount: (count) => `${count} messages`,
  moreLabels: (count) => `${count} more labels`,
  selectedCount: (count) => (count === 1 ? '1 selected' : `${count} selected`),
  selectAll: 'Select all',
  clearSelection: 'Clear selection',
  emptyTitle: 'Nothing here',
  emptyDescription: 'New mail lands in this folder.',
  today: 'Today',
  yesterday: 'Yesterday',
};

export function mailStrings(overrides?: Partial<MailStrings>): MailStrings {
  return overrides === undefined ? DEFAULT_MAIL_STRINGS : { ...DEFAULT_MAIL_STRINGS, ...overrides };
}

// ---------------------------------------------------------------------------
//  Pure logic
// ---------------------------------------------------------------------------

/**
 * The label chips a row draws, and how many it swallowed.
 *
 * `max` is a count of CHIPS, and the overflow chip is one of them: at `max = 2`
 * with four labels the row draws one label and a "+3", never two labels and a
 * "+2" in the space of three. Pure.
 */
export function visibleLabels(
  labels: readonly MailLabel[] | undefined,
  max: number,
): { shown: readonly MailLabel[]; overflow: number } {
  if (labels === undefined || labels.length === 0) return { shown: [], overflow: 0 };
  if (max <= 0) return { shown: [], overflow: labels.length };
  if (labels.length <= max) return { shown: labels, overflow: 0 };
  return { shown: labels.slice(0, max - 1), overflow: labels.length - (max - 1) };
}

/**
 * The label marks a TWO-LINE row draws: one chip, then a dot per label that did
 * not fit, `max` marks in all.
 *
 * A two-line row has one line for the subject and the snippet, and a second
 * chip on it costs more width than a second label is worth. So the first label
 * keeps its name and the rest become presence — the row still says "there are
 * three of these" without spending the subject's width on it, and
 * `composeMailRowName` still reads every one of them aloud.
 *
 * `max` counts MARKS, chip included, exactly as `maxLabels` counts chips on a
 * one-line row: at 2 with four labels the row draws one chip and one dot. Pure.
 */
export function labelMarks(
  labels: readonly MailLabel[] | undefined,
  max: number,
): { chip?: MailLabel; dots: readonly MailLabel[] } {
  if (labels === undefined || labels.length === 0 || max <= 0) return { dots: [] };
  return { chip: labels[0], dots: labels.slice(1, max) };
}

/**
 * This family's actions as the swipe rail's, which is the same list in the one
 * vocabulary `SwipeRow` speaks. Only the neutral tone is spelled differently —
 * a mail action has no tone or a `'default'` one, a pane calls that `'neutral'`
 * — and translating it here is what lets the two families share one drag
 * implementation instead of one of them renaming its own tones. Pure.
 */
export function toSwipeActions(actions: MailSwipeActions): SwipeRowActions {
  const side = (list: readonly MailAction[] | undefined): SwipeRowAction[] | undefined =>
    list === undefined
      ? undefined
      : list.map((action) => ({
          key: action.key,
          label: action.label,
          icon: action.icon,
          tone:
            action.tone === 'negative' ? 'negative' : action.tone === 'accent' ? 'accent' : 'neutral',
          onPress: action.onPress,
        }));
  return { left: side(actions.left), right: side(actions.right) };
}

export interface MailRowNameInput {
  sender: string;
  subject: string;
  snippet?: string;
  time?: string;
  unread?: boolean;
  starred?: boolean;
  draft?: boolean;
  hasAttachment?: boolean;
  threadCount?: number;
  labels?: readonly MailLabel[];
}

/**
 * Everything the row's glyphs say, as ONE name.
 *
 * The row is one target and the content is hidden from assistive technology, so
 * a reader that only got the sender and the subject would be missing the four
 * states nothing on the row spells out: unread, starred, an attachment and how
 * many messages the thread holds. The ORDER is the reading order — who, what,
 * the first words, when, then the states, then the labels. Pure.
 */
export function composeMailRowName(input: MailRowNameInput, strings: MailStrings): string {
  const snippet =
    input.draft === true
      ? [strings.draft, input.snippet].filter(Boolean).join(' ')
      : input.snippet;
  return [
    input.sender,
    input.subject,
    snippet,
    input.time,
    input.unread === true ? strings.unread : null,
    input.starred === true ? strings.starred : null,
    input.hasAttachment === true ? strings.attachment : null,
    (input.threadCount ?? 0) > 1 ? strings.threadCount(input.threadCount as number) : null,
    ...(input.labels ?? []).map((label) => label.name),
  ]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(', ');
}

/** Local-midnight day index, so "yesterday" is a calendar day and not 24 hours. */
function dayIndex(at: number): number {
  const d = new Date(at);
  return Math.floor(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1970, 0, 1)) / 86_400_000,
  );
}

/**
 * A flat list bucketed into day sections, newest bucket first, keeping each
 * bucket's input order.
 *
 * "Today" and "Yesterday" are CALENDAR days in the reader's own time zone, not
 * 24-hour windows — a message from 23:50 last night is yesterday's at 00:10,
 * which is what a person means by it. A mail with no `date` falls into one
 * trailing untitled bucket rather than being dropped.
 *
 * Pure, and every input it could decide for itself is a parameter: `now` and
 * the date format, so the same call is the same sections in a test in June as
 * in a test in December.
 */
export function groupMailByDay(
  mails: readonly MailSummary[],
  options: MailDayGroupingOptions = {},
): MailListSection[] {
  const {
    now = Date.now(),
    strings,
    formatDate = (date: Date) =>
      date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  } = options;
  const today = dayIndex(now);
  const todayLabel = strings?.today ?? DEFAULT_MAIL_STRINGS.today;
  const yesterdayLabel = strings?.yesterday ?? DEFAULT_MAIL_STRINGS.yesterday;

  const buckets = new Map<number, MailSummary[]>();
  const undated: MailSummary[] = [];
  for (const mail of mails) {
    if (mail.date === undefined) {
      undated.push(mail);
      continue;
    }
    const day = dayIndex(mail.date);
    const bucket = buckets.get(day);
    if (bucket === undefined) buckets.set(day, [mail]);
    else bucket.push(mail);
  }

  const sections: MailListSection[] = [...buckets.keys()]
    .sort((a, b) => b - a)
    .map((day) => {
      const title =
        day === today
          ? todayLabel
          : day === today - 1
            ? yesterdayLabel
            : formatDate(new Date(day * 86_400_000));
      return { key: `day-${day}`, title, mails: buckets.get(day) as MailSummary[] };
    });
  if (undated.length > 0) sections.push({ key: 'undated', mails: undated });
  return sections;
}

// ---------------------------------------------------------------------------
//  Web stylesheet
//
//  Hover and keyboard-focus affordances no inline style can carry. The hooks
//  are `data-*` attributes through `webDataSet`, and `adoptStyleSheet` no-ops
//  without a `document`, so this file stays universal.
// ---------------------------------------------------------------------------

export const MAIL_LIST_STYLE_ID = 'bloom-mail-list-web-css';

const ROW = '[data-bloom-mail-row]';
const FOCUSABLE = '[data-bloom-mail-focusable]';
const RAIL = '[data-bloom-mail-rail]';

export const MAIL_LIST_CSS = `
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
  user-select: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-mail-ring, currentColor);
  outline-offset: -2px;
}
${ROW}:hover,
${ROW}:focus-within {
  background-color: var(--bloom-mail-hover, transparent);
}
${ROW}[data-selected="true"],
${ROW}[data-selected="true"]:hover {
  background-color: var(--bloom-mail-selected, transparent);
}
${RAIL} {
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-out;
}
${ROW}:hover ${RAIL},
${ROW}:focus-within ${RAIL} {
  opacity: 1;
  pointer-events: auto;
}
@media (hover: none) {
  ${RAIL} {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  ${RAIL} {
    transition: none;
  }
}
`;
