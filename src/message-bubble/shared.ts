import { surfaceFillOn, hairlineOn, surfaceTextOn } from '../styles/surface-levels';
import { Platform, type DimensionValue } from 'react-native';

import { ACCENT_TABLE, colorRamp, mixColor, resolveButtonRamps } from '../button/shared';
import { CHART_TONE_ORDER, chartHueTone } from '../chart-cards/palette';
import { contrastRatio } from '../styles/color-contrast';
import type { Theme } from '../theme/types';
import type {
  GroupedMessage,
  MessageBubbleLabels,
  MessageDirection,
  MessageEntity,
  MessageListEntry,
  MessageListItem,
  MessagePosition,
} from './types';

export const IS_WEB = Platform.OS === 'web';

/** WCAG AA for body text — every colour in this family is measured against it. */
const AA = 4.5;

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/**
 * The bubble radius, and the one corner that is cut.
 *
 *   radius        18   every corner of every bubble…
 *   tailRadius     4   …except the one the tail hangs off
 *   paddingX      12
 *   paddingY       7   (a 20px line in a 34px bubble)
 *   runGap         2   between bubbles of ONE run
 *   groupGap       8   between runs
 *   maxWidth     78%   of the transcript
 */
export const BUBBLE_RADIUS = 18;
export const BUBBLE_TAIL_RADIUS = 4;
export const BUBBLE_PADDING_X = 12;
export const BUBBLE_PADDING_Y = 7;
export const RUN_GAP = 2;
export const GROUP_GAP = 8;
export const DEFAULT_MAX_WIDTH: DimensionValue = '78%';
/** Width of the SVG notch, and how far it hangs outside the bubble. */
export const TAIL_WIDTH = 9;
export const TAIL_HEIGHT = 15;
/** The reply quote's left bar. */
export const QUOTE_BAR_WIDTH = 3;
/** A second press inside this window is a double press. */
export const DOUBLE_PRESS_MS = 280;

export interface BubbleRadii {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
}

/**
 * Which corner a bubble cuts.
 *
 * Only the LAST bubble of a run is cut — the one a tail would hang off — on the
 * side the run sits on. `'first'` and `'middle'` are fully round, which is what
 * makes a run read as one block with a single spout rather than as a column of
 * identical lozenges.
 */
export function bubbleRadii(
  direction: MessageDirection,
  position: MessagePosition = 'single',
): BubbleRadii {
  const cut = position === 'last' || position === 'single';
  const outgoing = direction === 'outgoing';
  return {
    borderTopLeftRadius: BUBBLE_RADIUS,
    borderTopRightRadius: BUBBLE_RADIUS,
    borderBottomLeftRadius: cut && !outgoing ? BUBBLE_TAIL_RADIUS : BUBBLE_RADIUS,
    borderBottomRightRadius: cut && outgoing ? BUBBLE_TAIL_RADIUS : BUBBLE_RADIUS,
  };
}

/** Whether a bubble at `position` carries the cut corner (and so may carry a tail). */
export function hasTail(position: MessagePosition = 'single'): boolean {
  return position === 'last' || position === 'single';
}

/**
 * The `position` of each bubble in a run of `count`.
 *
 *   0  []
 *   1  ['single']
 *   2  ['first', 'last']
 *   n  ['first', …'middle', 'last']
 */
export function bubblePositions(count: number): MessagePosition[] {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (n === 0) return [];
  if (n === 1) return ['single'];
  const out: MessagePosition[] = ['first'];
  for (let i = 1; i < n - 1; i++) out.push('middle');
  out.push('last');
  return out;
}

// ---------------------------------------------------------------------------
//  Sender colours
// ---------------------------------------------------------------------------

/** FNV-1a, so the same seed picks the same hue on every device and every run. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Stops walked away from the bubble, light and dark, until the name is legible.
 *
 * It is a LADDER, not a pair, because the hues are not equally light: the chart
 * yellow at 400 lands at 2.8:1 on a neutral-800 bubble while the indigo at the
 * same stop clears comfortably. Picking one stop per mode would ship eight
 * names of which two cannot be read, and the two would be different in every
 * preset — the failure a single measured pair hides.
 */
const NAME_STOPS_LIGHT = [600, 700, 800, 900] as const;
const NAME_STOPS_DARK = [400, 300, 200, 100] as const;

/**
 * The colour a sender's NAME is drawn in inside a group chat.
 *
 * It cycles the chart hues (`chart-cards/palette`), which rotate with the theme
 * preset, so a run of eight speakers keeps the hue spacing the chart series
 * were tuned for and a brand that is not blue does not end up with eight names
 * in the same family as its accent.
 *
 * The hue itself is a 400/500 stop, which is a FILL lightness — small text on
 * it clears nothing. So the picked hue is re-rammed and read at the first stop
 * that clears AA over the INCOMING bubble, which is the only surface a sender
 * name is ever drawn on. Deterministic: same seed, same theme, same colour.
 */
export function senderNameColor(seed: string, theme: Theme): string {
  const hue = CHART_TONE_ORDER[hashSeed(seed) % CHART_TONE_ORDER.length];
  const ramp = colorRamp(chartHueTone(theme, hue ?? 2).color, ACCENT_TABLE);
  const surface = theme.colors.card;
  const stops = theme.isDark ? NAME_STOPS_DARK : NAME_STOPS_LIGHT;
  for (const stop of stops) {
    if (contrastRatio(surface, ramp[stop]) >= AA) return ramp[stop];
  }
  return theme.colors.text;
}

// ---------------------------------------------------------------------------
//  Entities
// ---------------------------------------------------------------------------

/**
 * Links, `@mentions` and `#hashtags` in `text`, in order, non-overlapping.
 *
 * A deliberately small tokenizer: it finds the three things a transcript
 * styles and hands them back as RANGES, so the caller decides what pressing one
 * does. It is not a URL validator and it never fetches anything.
 */
const ENTITY_PATTERN =
  /(https?:\/\/[^\s<]+[^\s<.,:;"')\]]|www\.[^\s<]+[^\s<.,:;"')\]])|(^|[\s(])@([A-Za-z0-9_.]{1,30})|(^|[\s(])#([A-Za-z0-9_]{1,50})/g;

export function messageEntities(text: string): MessageEntity[] {
  const out: MessageEntity[] = [];
  ENTITY_PATTERN.lastIndex = 0;
  let match = ENTITY_PATTERN.exec(text);
  while (match !== null) {
    const [whole, link, mentionLead, mention, hashLead, hashtag] = match;
    if (link !== undefined) {
      out.push({ type: 'link', text: link, start: match.index, end: match.index + link.length });
    } else if (mention !== undefined) {
      const start = match.index + (mentionLead?.length ?? 0);
      out.push({ type: 'mention', text: `@${mention}`, start, end: start + mention.length + 1 });
    } else if (hashtag !== undefined) {
      const start = match.index + (hashLead?.length ?? 0);
      out.push({ type: 'hashtag', text: `#${hashtag}`, start, end: start + hashtag.length + 1 });
    }
    // A zero-length match would spin forever; `exec` with `g` never returns one
    // here, but the guard costs nothing and the alternative is a hung render.
    if (whole.length === 0) ENTITY_PATTERN.lastIndex += 1;
    match = ENTITY_PATTERN.exec(text);
  }
  return out;
}

/** `text` split into plain strings and entities, in order. */
export type MessageTextPart = { text: string; entity?: MessageEntity };

export function splitMessageText(text: string): MessageTextPart[] {
  const entities = messageEntities(text);
  if (entities.length === 0) return [{ text }];
  const parts: MessageTextPart[] = [];
  let cursor = 0;
  for (const entity of entities) {
    if (entity.start > cursor) parts.push({ text: text.slice(cursor, entity.start) });
    parts.push({ text: entity.text, entity });
    cursor = entity.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

// ---------------------------------------------------------------------------
//  Grouping
// ---------------------------------------------------------------------------

/**
 * The transcript as a flat list of rows: date separators, the unread rule,
 * service rows, and RUNS of consecutive bubbles with their corner geometry
 * already worked out.
 *
 * Pure — it reads no clock and formats nothing. A day boundary is a change of
 * `dateKey`, which the app decides; the label it draws is `dateLabel`.
 *
 * A run breaks on: a different `direction`, a different `senderId`, a date
 * separator, the unread rule, and any service row. That last one matters —
 * "Ana joined the group" between two of Ana's messages is a break, and a
 * grouper that ignored it would round the corners of a run that no longer
 * looks like one.
 */
export function groupMessages(items: readonly MessageListItem[]): MessageListEntry[] {
  const out: MessageListEntry[] = [];
  let run: MessageListItem[] = [];
  let runKey: string | null = null;

  const flush = (): void => {
    if (run.length === 0) return;
    const positions = bubblePositions(run.length);
    const messages: GroupedMessage[] = run.map((item, index) => ({
      item,
      position: positions[index] ?? 'single',
    }));
    const first = run[0];
    out.push({
      kind: 'group',
      key: `group-${first?.id ?? out.length}`,
      direction: first?.direction ?? 'incoming',
      messages,
    });
    run = [];
    runKey = null;
  };

  let day: string | null = null;
  for (const item of items) {
    const key = item.dateKey;
    if (key !== undefined && key !== day) {
      flush();
      out.push({ kind: 'date', key: `date-${key}`, label: item.dateLabel ?? key });
      day = key;
    }
    if (item.unreadBefore === true) {
      flush();
      out.push({ kind: 'unread', key: `unread-${item.id}` });
    }
    if (item.system !== undefined) {
      flush();
      out.push({ kind: 'system', key: `system-${item.id}`, item });
      continue;
    }
    if (item.call !== undefined) {
      flush();
      out.push({ kind: 'call', key: `call-${item.id}`, item });
      continue;
    }
    const identity = `${item.direction}:${item.senderId ?? ''}`;
    if (runKey !== null && runKey !== identity) flush();
    runKey = identity;
    run.push(item);
  }
  flush();
  return out;
}

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

/** WCAG AA for the 12px meta row, which is not large text either. */
const AA_META = 4.5;

/**
 * The most transparent mix of `ink` over `surface` that still clears `ratio`.
 *
 * A meta row is meant to sit BACK from the message it annotates, and the usual
 * way to do that — drop the ink to 60% — is the way timestamps inside a
 * coloured bubble end up at 2.8:1. This walks the mix from quiet to loud and
 * stops at the first step that clears, so the row is as quiet as it is allowed
 * to be rather than as quiet as it looked in one preset.
 */
function legibleInk(surface: string, ink: string, ratio: number): string {
  for (let alpha = 0.6; alpha < 1; alpha += 0.05) {
    const candidate = mixColor(surface, ink, alpha);
    if (contrastRatio(surface, candidate) >= ratio) return candidate;
  }
  return ink;
}

/** The on-colour for `fill`: the theme's own, white, or near-black — best first. */
function onFill(fill: string, theme: Theme, nearBlack: string): string {
  const candidates = [theme.colors.primaryForeground, 'rgb(255 255 255)', nearBlack];
  let best = candidates[0] ?? 'rgb(255 255 255)';
  let bestRatio = 0;
  for (const candidate of candidates) {
    const ratio = contrastRatio(fill, candidate);
    if (ratio >= AA) return candidate;
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best;
}

/** One side of the transcript, fully painted. */
export interface BubbleSidePaint {
  fill: string;
  /** The hairline, or `undefined` where the fill carries its own edge. */
  border: string | undefined;
  text: string;
  /** Time, ticks, "edited" — quiet, and still AA over `fill`. */
  meta: string;
  /** The reply quote's bar and name, and the link colour. */
  accent: string;
  /** The reply quote's own backing. */
  quoteFill: string;
  /** The meta pill over media. */
  overlayFill: string;
  overlayText: string;
}

export interface MessageBubblePaint {
  incoming: BubbleSidePaint;
  outgoing: BubbleSidePaint;
  /** The page behind the transcript — what a reaction pill rings itself against. */
  background: string;
  /** The selection band under a whole row. */
  selectedBand: string;
  /** The flash after jumping to a message. */
  highlightBand: string;
  /** A failed bubble's wash and its retry affordance. */
  failed: string;
  failedFill: string;
  /** Centred pills: the date rule, service lines. */
  pillFill: string;
  pillText: string;
  /** The unread rule. */
  unread: string;
  unreadLine: string;
  /** Reaction pills. */
  reactionFill: string;
  reactionText: string;
  reactionMineFill: string;
  reactionMineText: string;
  reactionMineBorder: string;
  /** The ring that lifts a reaction pill off the bubble it overlaps. */
  reactionRing: string;
  /** The keyboard focus ring on web. */
  focusRing: string;
  /** Typing dots and the deleted line. */
  muted: string;
}

export function resolveMessageBubblePaint(theme: Theme): MessageBubblePaint {
  const { accent } = resolveButtonRamps(theme);
  const { colors } = theme;
  const dark = theme.isDark;
  const background = colors.background;

  const outgoingFill = colors.primary;
  const onOutgoing = colors.primaryForeground;
  const incomingFill = colors.card;
  const onIncoming = colors.text;

  const outgoing: BubbleSidePaint = {
    fill: outgoingFill,
    border: undefined,
    text: onOutgoing,
    meta: legibleInk(outgoingFill, onOutgoing, AA_META),
    accent: legibleInk(outgoingFill, onOutgoing, AA),
    quoteFill: mixColor(outgoingFill, onOutgoing, 0.16),
    overlayFill: 'rgba(0, 0, 0, 0.45)',
    overlayText: 'rgb(255 255 255)',
  };

  const incoming: BubbleSidePaint = {
    fill: incomingFill,
    // Light mode only: a card on a near-white page needs an edge, a neutral-800
    // bubble on a neutral-950 page already has one.
    border: dark ? undefined : colors.borderLight,
    text: onIncoming,
    meta: surfaceTextOn(theme, incomingFill).textTertiary,
    accent: dark ? accent[400] : accent[600],
    quoteFill: surfaceFillOn(theme, incomingFill),
    overlayFill: 'rgba(0, 0, 0, 0.45)',
    overlayText: 'rgb(255 255 255)',
  };

  return {
    incoming,
    outgoing,
    background,
    selectedBand: mixColor(background, accent[500], dark ? 0.2 : 0.12),
    highlightBand: mixColor(background, accent[500], dark ? 0.34 : 0.24),
    failed: colors.error,
    failedFill: mixColor(background, colors.error, dark ? 0.22 : 0.1),
    pillFill: colors.backgroundSecondary,
    pillText: colors.textSecondary,
    unread: dark ? accent[400] : accent[600],
    unreadLine: dark ? mixColor(background, accent[400], 0.4) : mixColor(background, accent[600], 0.35),
    reactionFill: colors.backgroundTertiary,
    reactionText: colors.text,
    reactionMineFill: colors.primarySubtle,
    reactionMineText: colors.primarySubtleForeground,
    reactionMineBorder: dark ? accent[600] : accent[300],
    reactionRing: background,
    focusRing: accent[500],
    muted: colors.textSecondary,
  };
}

/** The side a direction paints in. */
export function sidePaint(paint: MessageBubblePaint, direction: MessageDirection): BubbleSidePaint {
  return direction === 'outgoing' ? paint.outgoing : paint.incoming;
}

// ---------------------------------------------------------------------------
//  Labels
// ---------------------------------------------------------------------------

export const DEFAULT_MESSAGE_LABELS: MessageBubbleLabels = {
  forwardedFrom: 'Forwarded from',
  deleted: 'This message was deleted',
  retry: 'Retry sending',
  addReaction: 'Add a reaction',
  replyTo: 'Go to the quoted message',
  selected: 'Selected',
  pending: 'Sending',
  failed: 'Not sent',
};

export function resolveLabels(labels?: Partial<MessageBubbleLabels>): MessageBubbleLabels {
  return labels === undefined ? DEFAULT_MESSAGE_LABELS : { ...DEFAULT_MESSAGE_LABELS, ...labels };
}

/**
 * The accessible name of a bubble, composed from the parts a sighted reader
 * gets from position, colour and a tick glyph: who wrote it, what it says, when
 * it was sent and what happened to it.
 */
export function bubbleAccessibleName(parts: {
  senderName?: string;
  text?: string;
  time?: string;
  extras?: readonly (string | undefined)[];
}): string {
  return [parts.senderName, parts.text, parts.time, ...(parts.extras ?? [])]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(', ');
}

/** The default name of a reaction pill. */
export function reactionLabel(emoji: string, count: number, mine: boolean): string {
  return `${emoji}, ${count}${mine ? ', selected' : ''}`;
}

// ---------------------------------------------------------------------------
//  Web CSS
//
//  Two things with no inline spelling: the keyboard focus ring on the bubble
//  (a `:focus-visible` rule) and the text selection colour inside a coloured
//  bubble, where the browser default paints selected text in a blue that is
//  invisible on an accent fill. The hooks are `data-*` attributes through
//  `dataSet`; `adoptStyleSheet` is a no-op without a `document`.
// ---------------------------------------------------------------------------

export const MESSAGE_BUBBLE_STYLE_ID = 'bloom-message-bubble-web-css';

const BUBBLE = '[data-bloom-message-bubble]';
/**
 * The PRESSABLE, which is the node the browser focuses — not the bubble box
 * inside it. Hanging the ring off the box drew nothing: `:focus-visible` never
 * matched, and a focus ring that silently does not exist is indistinguishable
 * from one nobody tabbed to.
 */
const PRESS = '[data-bloom-message-press]';

export const MESSAGE_BUBBLE_CSS = `
${PRESS} {
  outline: none;
}
${PRESS}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-message-ring);
}
${BUBBLE} ::selection {
  background-color: var(--bloom-message-selection);
}
`;
