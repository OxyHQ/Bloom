import { surfaceFillOn, hairlineOn, surfaceTextOn } from '../styles/surface-levels';
/**
 * What every file of the `chat-composer` family paints from: the palette
 * resolved onto Bloom's ramps, the geometry the parts share, the default data
 * and the pure helpers (`formatRecordingTime`, the emoji search and the skin
 * tone modifier).
 *
 * This family is the PERSON-TO-PERSON composer. `composer-panel` is the agent
 * one, and the two are not the same control: that one is two rows tall with a
 * permission mode, a model picker and an effort slider; this one is one pill
 * with a mic that becomes a send button, and its state lives above the bar
 * (reply, edit, attachments, slow mode) rather than beside the prompt. The
 * geometry that IS shared — the 36px round controls, the 56px attachment tile,
 * the progress ring arithmetic — is imported from `composer-panel/shared`
 * rather than retyped.
 */
import {
  BUTTON_SHADOW,
  colorRamp,
  ACCENT_TABLE,
  mixColor,
  resolveButtonPalette,
  resolveButtonRamps,
} from '../button/shared';
import type { ButtonPalette } from '../button/shared';
import { MENU_SHADOW } from '../floating/menu-palette';
import { RiBearSmileLine } from '../icons/remix/RiBearSmileLine';
import { RiBarChartHorizontalLine } from '../icons/remix/RiBarChartHorizontalLine';
import { RiCameraLine } from '../icons/remix/RiCameraLine';
import { RiContactsBookLine } from '../icons/remix/RiContactsBookLine';
import { RiCornerUpLeftLine } from '../icons/remix/RiCornerUpLeftLine';
import { RiEmotionLine } from '../icons/remix/RiEmotionLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiFlagLine } from '../icons/remix/RiFlagLine';
import { RiFlightTakeoffLine } from '../icons/remix/RiFlightTakeoffLine';
import { RiGalleryLine } from '../icons/remix/RiGalleryLine';
import { RiGolfBallLine } from '../icons/remix/RiGolfBallLine';
import { RiLightbulbLine } from '../icons/remix/RiLightbulbLine';
import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { RiHashtag } from '../icons/remix/RiHashtag';
import { RiPencilLine } from '../icons/remix/RiPencilLine';
import { RiRestaurantLine } from '../icons/remix/RiRestaurantLine';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { RiUserLine } from '../icons/remix/RiUserLine';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type {
  AttachmentMenuItem,
  ChatComposerIcon,
  ChatComposerLabels,
  ComposerBannerKind,
  EmojiEntry,
  EmojiGroup,
  VoiceRecorderLabels,
} from './types';

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

export interface ChatComposerPalette {
  /** The bar and every panel surface. */
  surface: string;
  /** The page behind the bar — what a translucent overlay falls back to. */
  page: string;
  /** Row / control highlight on hover, press and keyboard focus. */
  hover: string;
  /** A step further than `hover`, for the pressed state of a filled control. */
  hoverStrong: string;
  /** The quiet inset used by the attachment tile and the emoji search field. */
  inset: string;
  /** Hairlines: the bar's own border, panel separators, tile borders. */
  border: string;
  text: string;
  textSecondary: string;
  textPlaceholder: string;
  iconPrimary: string;
  iconSecondary: string;
  /** The accent, and the two tints derived from it — never a string-appended alpha. */
  accent: string;
  accentSoft: string;
  accentStrong: string;
  /** Legible over `accent`. */
  onAccent: string;
  /** The recording dot and the destructive menu row. */
  destructive: string;
  /** `bg-button-primary`, every state — the send disc. */
  send: ButtonPalette;
  shadow: string;
  shadowPanel: string;
  focusRing: string;
}

/** Re-emit a resolved colour at `alpha` (parse-and-re-emit, never concatenation). */
export function withAlpha(color: string, alpha: number): string {
  const rgba = parseRgba(color);
  if (!rgba) return color;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}

export function resolveChatComposerPalette(theme: Theme): ChatComposerPalette {
  const { accent } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  const surface = theme.colors.card;
  const textPaint = surfaceTextOn(theme, surface);
  return {
    surface,
    page: theme.colors.background,
    hover: surfaceFillOn(theme, surface),
    hoverStrong: hairlineOn(theme, surface),
    inset: theme.colors.backgroundSecondary,
    border: hairlineOn(theme, surface),
    text: theme.colors.text,
    textSecondary: textPaint.textSecondary,
    textPlaceholder: textPaint.textTertiary,
    iconPrimary: theme.colors.text,
    iconSecondary: textPaint.textSecondary,
    accent: accent[500],
    // A tint of the PAGE toward the accent, so a banner rail's wash keeps its
    // own surface's luminance instead of being an alpha of an unknown backdrop.
    accentSoft: mixColor(surface, accent[500], dark ? 0.2 : 0.12),
    accentStrong: dark ? accent[400] : accent[600],
    onAccent: theme.colors.primaryForeground,
    destructive: colorRamp(theme.colors.negative, ACCENT_TABLE)[dark ? 400 : 500],
    send: resolveButtonPalette('primary', theme),
    shadow: dark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    shadowPanel: dark ? MENU_SHADOW.dark : MENU_SHADOW.light,
    focusRing: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/**
 * The bar is a 24-radius pill and its controls are round, which is Bloom's
 * "full pill only on button-like controls" rule read twice: the bar is a field
 * WRAPPED in buttons, so its own corner matches the 48px one-line height and
 * the discs inside it are the pill.
 */
export const BAR_RADIUS = 24;
export const BAR_PADDING = 6;
/** 36px round controls: attach, emoji, camera, mic, send. */
export const CONTROL_SIZE = 36;
/** The field's own line box, and how far the bar grows per extra line. */
export const LINE_HEIGHT = 20;
/** Lines the field grows to before it scrolls. */
export const DEFAULT_MAX_LINES = 6;
/** Attachment tile edge, matching `composer-panel`'s strip. */
export const TILE = 56;
export const TILE_RADIUS = 12;
/** Banner rail: a 3px accent bar with a 2px radius, full height of the row. */
export const BANNER_RAIL_WIDTH = 3;
export const BANNER_RADIUS = 12;
/** Suggestion rows and their panel. */
export const SUGGESTION_ROW_HEIGHT = 44;
export const SUGGESTION_MAX_HEIGHT = 232;
export const PANEL_RADIUS = 16;
/** The emoji grid's cell edge, and the category bar's height. */
export const EMOJI_CELL = 36;
export const EMOJI_CATEGORY_SIZE = 32;
/** Voice recorder waveform: bar width, gap, and the tallest bar. */
export const WAVE_BAR_WIDTH = 2;
export const WAVE_BAR_GAP = 2;
export const WAVE_HEIGHT = 24;
/** State colours everywhere in the family. */
export const TRANSITION_MS = 150;
/** Mic ↔ send crossfade. Long enough to read as a swap, short enough to type through. */
export const SWAP_MS = 220;

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

/**
 * Elapsed time as a recorder draws it: `0:07`, `2:41`, `1:04:09`. Seconds are
 * FLOORED — a meter that rounds up shows `0:01` before a recording has a first
 * sample, which reads as a dropped frame.
 *
 * Negative and non-finite input formats as `0:00` rather than throwing: the
 * value is a clock reading an app computes, and a composer that crashes on a
 * bad one is worse than a composer that shows zero.
 */
export function formatRecordingTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** The glyph of an {@link EmojiEntry}, whichever form it arrived in. */
export function emojiChar(entry: EmojiEntry): string {
  return typeof entry === 'string' ? entry : entry.char;
}

/** The words the built-in search matches an entry on. A bare string has none. */
function emojiTerms(entry: EmojiEntry): string[] {
  if (typeof entry === 'string') return [];
  const out: string[] = [];
  if (entry.name) out.push(entry.name);
  if (entry.keywords) out.push(...entry.keywords);
  return out;
}

/**
 * `groups` narrowed to the entries matching `query`, with empty groups dropped.
 *
 * The match is a case-insensitive SUBSTRING over each entry's name and
 * keywords, plus an exact glyph match so pasting an emoji finds it. A bare
 * string entry carries no words, so a dataset of bare strings only ever matches
 * by glyph — which is the honest behaviour for a package that ships no emoji
 * names, and the reason {@link EmojiEntry} has an object form at all.
 *
 * An empty or whitespace query returns `groups` unchanged (the same array
 * reference), so the un-searched picker does no work.
 */
export function filterEmojiGroups(
  groups: ReadonlyArray<EmojiGroup>,
  query: string,
): ReadonlyArray<EmojiGroup> {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  const out: EmojiGroup[] = [];
  for (const group of groups) {
    const emojis = group.emojis.filter((entry) => {
      if (emojiChar(entry) === query.trim()) return true;
      return emojiTerms(entry).some((term) => term.toLowerCase().includes(needle));
    });
    if (emojis.length > 0) out.push({ ...group, emojis });
  }
  return out;
}

/** The five Fitzpatrick modifiers, index 1–5. Index 0 is "no modifier". */
export const SKIN_TONE_MODIFIERS = ['', '\u{1F3FB}', '\u{1F3FC}', '\u{1F3FD}', '\u{1F3FE}', '\u{1F3FF}'] as const;

/**
 * The swatch each tone is drawn as. A hand emoji rather than a coloured dot:
 * the dot would have to be a literal skin colour picked by Bloom, and the
 * glyph is the one the platform will actually render.
 */
export const SKIN_TONE_SWATCHES = SKIN_TONE_MODIFIERS.map((m) => `\u{270B}${m}`);

/**
 * Code point ranges whose emoji accept a Fitzpatrick modifier (Unicode's
 * `Emoji_Modifier_Base`). Written out because the alternative is appending a
 * modifier to anything, which produces a broken glyph — a modifier after a
 * non-base renders as a bare colour square next to the emoji.
 */
const MODIFIER_BASES: ReadonlyArray<readonly [number, number]> = [
  [0x261d, 0x261d], [0x26f9, 0x26f9], [0x270a, 0x270d], [0x1f385, 0x1f385],
  [0x1f3c2, 0x1f3c4], [0x1f3c7, 0x1f3c7], [0x1f3ca, 0x1f3cc], [0x1f442, 0x1f443],
  [0x1f446, 0x1f450], [0x1f466, 0x1f478], [0x1f47c, 0x1f47c], [0x1f481, 0x1f483],
  [0x1f485, 0x1f487], [0x1f48f, 0x1f48f], [0x1f491, 0x1f491], [0x1f4aa, 0x1f4aa],
  [0x1f574, 0x1f575], [0x1f57a, 0x1f57a], [0x1f590, 0x1f590], [0x1f595, 0x1f596],
  [0x1f645, 0x1f647], [0x1f64b, 0x1f64f], [0x1f6a3, 0x1f6a3], [0x1f6b4, 0x1f6b6],
  [0x1f6c0, 0x1f6c0], [0x1f6cc, 0x1f6cc], [0x1f90c, 0x1f90c], [0x1f90f, 0x1f90f],
  [0x1f918, 0x1f91f], [0x1f926, 0x1f926], [0x1f930, 0x1f939], [0x1f93c, 0x1f93e],
  [0x1f977, 0x1f977], [0x1f9b5, 0x1f9b6], [0x1f9b8, 0x1f9b9], [0x1f9bb, 0x1f9bb],
  [0x1f9cd, 0x1f9dd], [0x1fac3, 0x1fac5], [0x1faf0, 0x1faf8],
];

function acceptsSkinTone(char: string): boolean {
  const points = Array.from(char);
  // A sequence (a ZWJ family, a flag, a keycap) already carries its own
  // composition; splicing a modifier into it produces a different emoji or a
  // broken one, so only a lone base — optionally with VS16 — is modified.
  if (points.length > 2) return false;
  if (points.length === 2 && points[1] !== '️') return false;
  const cp = points[0]?.codePointAt(0);
  if (cp === undefined) return false;
  return MODIFIER_BASES.some(([lo, hi]) => cp >= lo && cp <= hi);
}

/**
 * `char` with the Fitzpatrick modifier for `tone` (1–5) applied, or `char`
 * unchanged when the emoji does not accept one — which is most of them.
 */
export function applySkinTone(char: string, tone: number): string {
  const modifier = SKIN_TONE_MODIFIERS[tone];
  if (!modifier || !acceptsSkinTone(char)) return char;
  const points = Array.from(char);
  return `${points[0] ?? ''}${modifier}`;
}

/**
 * `amplitudes` as the waveform draws them: the most recent `count` values,
 * clamped to `0.06`–`1`. Dropping from the FRONT is what makes a growing array
 * scroll left like a live meter; a floor keeps a silent passage as a row of
 * ticks rather than an invisible gap that reads as a dropped recording.
 */
export function waveformBars(
  amplitudes: ReadonlyArray<number>,
  count: number,
): number[] {
  const slice = amplitudes.slice(Math.max(0, amplitudes.length - count));
  return slice.map((value) =>
    Number.isFinite(value) ? Math.min(1, Math.max(0.06, value)) : 0.06,
  );
}

// ---------------------------------------------------------------------------
//  Default data
// ---------------------------------------------------------------------------

/** The plus menu's seven rows. Apps drop what does not apply. */
export const ATTACHMENT_MENU_ITEMS: ReadonlyArray<AttachmentMenuItem> = [
  { id: 'gallery', label: 'Gallery', icon: RiGalleryLine },
  { id: 'camera', label: 'Camera', icon: RiCameraLine },
  { id: 'file', label: 'File', icon: RiFileTextLine },
  { id: 'location', label: 'Location', icon: RiMapPinLine },
  { id: 'contact', label: 'Contact', icon: RiContactsBookLine },
  { id: 'poll', label: 'Poll', icon: RiBarChartHorizontalLine },
  { id: 'music', label: 'Music', icon: RiMusic2Line },
];

/** The quick reaction bar's six defaults. */
export const REACTION_PICKER_EMOJIS: ReadonlyArray<string> = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * The ten emoji categories, in the order a picker's tab bar shows them, with
 * the glyph each tab draws. The EMOJI THEMSELVES are not here — Bloom ships no
 * emoji dataset, and one would be tens of kilobytes that every app that has its
 * own would still pay for. This is the vocabulary a caller's `groups` keys into.
 */
export const EMOJI_CATEGORY_ICONS: Record<string, ChatComposerIcon> = {
  recent: RiTimeLine,
  frequent: RiTimeLine,
  smileys: RiEmotionLine,
  people: RiUserLine,
  animals: RiBearSmileLine,
  nature: RiBearSmileLine,
  food: RiRestaurantLine,
  activity: RiGolfBallLine,
  travel: RiFlightTakeoffLine,
  objects: RiLightbulbLine,
  symbols: RiHashtag,
  flags: RiFlagLine,
};

/** The glyph each banner kind draws when the caller passes none. */
export const BANNER_ICONS: Record<ComposerBannerKind, ChatComposerIcon> = {
  reply: RiCornerUpLeftLine,
  edit: RiPencilLine,
  forward: RiShareForwardLine,
  note: RiTimeLine,
};

export const CHAT_COMPOSER_LABELS: ChatComposerLabels = {
  attach: 'Attach',
  emoji: 'Emoji',
  camera: 'Camera',
  mic: 'Record a voice message',
  send: 'Send',
  input: 'Message',
  enterHint: 'Enter to send · Shift + Enter for a new line',
  modEnterHint: '⌘ + Enter to send · Enter for a new line',
};

export const VOICE_RECORDER_LABELS: VoiceRecorderLabels = {
  cancel: 'Cancel recording',
  send: 'Send voice message',
  delete: 'Delete recording',
  play: 'Play recording',
  pause: 'Pause recording',
  lock: 'Lock recording',
  slideToCancel: 'Slide to cancel',
  recording: 'Recording',
};

// ---------------------------------------------------------------------------
//  Web stylesheet
//
//  Only what inline style cannot say. Hover paint is state-driven so it also
//  works on native; every hook here is a `dataSet` attribute, because a class
//  never reaches the DOM through react-native-web.
// ---------------------------------------------------------------------------

export const CHAT_COMPOSER_STYLE_ID = 'bloom-chat-composer-web-css';

export const CHAT_COMPOSER_WEB_CSS = `
[data-bloom-chat-composer-control] {
  outline: none;
  transition: background-color ${TRANSITION_MS}ms ease, color ${TRANSITION_MS}ms ease, opacity ${TRANSITION_MS}ms ease;
}
[data-bloom-chat-composer-control]:focus-visible {
  outline: 2px solid var(--bloom-chat-composer-ring);
  outline-offset: 2px;
}
[data-bloom-chat-composer-control="inset"]:focus-visible {
  outline-offset: -2px;
}
[data-bloom-chat-composer-row] {
  outline: none;
  transition: background-color ${TRANSITION_MS}ms ease;
}
[data-bloom-chat-composer-row]:focus-visible {
  outline: 2px solid var(--bloom-chat-composer-ring);
  outline-offset: -2px;
}
[data-bloom-chat-composer-input] {
  outline: none;
  resize: none;
  field-sizing: content;
}
[data-bloom-chat-composer-scroll] {
  scrollbar-width: none;
}
[data-bloom-chat-composer-scroll]::-webkit-scrollbar {
  display: none;
}
[data-bloom-chat-composer-clamp] {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@keyframes bloom-chat-composer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-chat-composer-control],
  [data-bloom-chat-composer-row] { transition: none; }
}
`;
