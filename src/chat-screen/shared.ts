import { useMemo } from 'react';
import { Platform, type ImageSourcePropType } from 'react-native';

import {
  colorRamp,
  DANGER_TABLE,
  mixColor,
  resolveButtonRamps,
  type Ramp,
} from '../button/shared';
import { useImageResolver } from '../image-resolver/context';
import { relativeLuminance } from '../styles/color-contrast';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { ChatBackgroundVariant } from './types';

/** `true` on every platform that is not the web. */
export const IS_NATIVE = Platform.OS !== 'web';

/**
 * Below this the chat header takes its compact form — a back button, tighter
 * gutters. It is the width at which a desktop list pane stops fitting beside a
 * conversation, which is the same question "is there anywhere to go back to".
 */
export const CHAT_COMPACT_BREAKPOINT = 1024;

/** Below this `ChatSplitLayout` shows ONE pane instead of two or three. */
export const CHAT_SPLIT_BREAKPOINT = 900;

/** The header's row height, both forms. */
export const CHAT_HEADER_HEIGHT = 60;

/** Default widths of the two fixed panes. */
export const CHAT_LIST_PANE_WIDTH = 340;
export const CHAT_INFO_PANE_WIDTH = 380;

/** The pattern's default ink opacity — also what `chatBackgroundExtremes` assumes. */
export const DEFAULT_PATTERN_OPACITY = 0.5;

/** Beyond this many pins the accent bar draws one solid rule, not segments. */
export const MAX_PIN_SEGMENTS = 8;

/** The pattern tile's side, in SVG user units AND in px (it is 1:1). */
export const CHAT_PATTERN_TILE = 120;

/**
 * Everything this family paints, resolved from the theme onto Bloom's ramps.
 *
 * Two families of surface, and they are not interchangeable:
 *
 *   - CHROME (`surface`) — the header, the pinned bar, the info panel. These sit
 *     in the page, so they take the card colour and separate from it with a
 *     hairline.
 *   - FLOATING (`floating*`) — the date pill and the two round jump buttons, which
 *     hover OVER a wallpaper Bloom does not own. Those come from
 *     `floating/menu-palette.ts`, the same recipe every menu and tooltip uses,
 *     so a pill over a photo is the same material as a menu over a page.
 */
export interface ChatScreenPaint {
  isDark: boolean;
  accent: Ramp;
  neutral: Ramp;
  /** The chrome surface: header, pinned bar, info panel. */
  surface: string;
  /** A quieter fill inside the chrome — a section, a search field, a thumbnail. */
  surfaceSubtle: string;
  /** The transcript page, under the wallpaper. */
  page: string;
  /** Hairlines and separators. */
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accentColor: string;
  onAccent: string;
  /** Exact opaque outgoing message fill. */
  outgoingSurface: string;
  /** A 10%-ish accent wash — an action tile, a role badge. */
  accentSubtle: string;
  /**
   * The pinned bar's UNVISITED segments. A step off the accent ramp rather than
   * `accentSubtle`: a 14% wash of the accent over white is invisible at 3px
   * wide, so the rule read as "one pin" however many there were.
   */
  accentTrack: string;
  destructive: string;
  destructiveSubtle: string;
  /** Floating surfaces (date pill, jump buttons) and their hairline/shadow. */
  floatingSurface: string;
  floatingBorder: string;
  floatingShadow: string;
  /** The wallpaper pattern's ink. */
  patternTint: string;
  /** The wallpaper gradient's stops, off the accent ramp. */
  gradient: readonly [string, string, string];
  /** The colour an image wallpaper is dimmed TOWARD. */
  imageDim: string;
  /** How hard, `0`–`1`. */
  imageDimOpacity: number;
}

export function resolveChatScreenPaint(theme: Theme): ChatScreenPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const red = colorRamp(theme.colors.negative, DANGER_TABLE);
  const menu = resolveMenuPalette(theme);
  const c = theme.colors;
  const dark = theme.isDark;

  return {
    isDark: dark,
    accent,
    neutral: n,
    surface: c.card,
    surfaceSubtle: c.backgroundSecondary,
    page: c.background,
    border: c.border,
    text: c.text,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    accentColor: dark ? accent[400] : accent[600],
    onAccent: c.primaryForeground,
    outgoingSurface: c.primary,
    accentSubtle: c.primarySubtle,
    accentTrack: dark ? accent[800] : accent[200],
    destructive: dark ? red[400] : red[600],
    destructiveSubtle: c.errorSubtle,
    floatingSurface: menu.surface,
    floatingBorder: menu.border,
    floatingShadow: menu.shadow,
    // Decorations stay below the bubble lightness range: darken the page in
    // both modes. Brightening the near-black tonal page approaches its cards.
    patternTint: dark ? '#000000' : c.backgroundTertiary,
    // Darkening the page preserves bubble separation in both modes. The old
    // light recipe brightened into cards (16/32 regressions); the later dark
    // recipe did the same once the tonal page moved close to black.
    gradient: dark
      ? [mixColor(c.background, '#000000', 0.5), c.background, mixColor(c.background, '#000000', 0.8)]
      : [mixColor(c.background, accent[300], 0.3), c.background, mixColor(c.background, n[300], 0.35)],
    // NOT white/black. Dimming a light wallpaper toward WHITE puts its lightest
    // possible pixel exactly on the card colour — a white incoming bubble over a
    // bright photo then separates by 1.00, i.e. not at all. Dimming toward a
    // mid-light neutral instead keeps the brightest pixel the wallpaper can
    // reach below the card, whatever the photo is. Measured table:
    // `docs/chat-screen.mdx`.
    imageDim: dark ? n[950] : n[300],
    imageDimOpacity: dark ? 0.62 : 0.55,
  };
}

export function useChatScreenPaint(): ChatScreenPaint {
  const theme = useTheme();
  return useMemo(() => resolveChatScreenPaint(theme), [theme]);
}

/**
 * The lightest and the darkest colour a wallpaper variant can paint.
 *
 * This is the only honest way to talk about contrast over a wallpaper. Bubbles,
 * the date pill and the jump buttons are all OPAQUE, so the wallpaper never gets
 * between a fill and its own text — what it can do is stop a bubble being told
 * apart from the page behind it. So the number to measure is the SEPARATION
 * between a surface and sampled wallpaper endpoints. For a continuous photo,
 * a bubble luminance between those endpoints can still match a pixel exactly;
 * endpoint ratios are NOT a full-range worst-case guarantee.
 *
 * `image` is the interesting case: a consumer photo has no knowable extremes, so
 * the dimming overlay supplies them. White and black dimmed toward
 * `imageDim` at `imageDimOpacity` ARE the bounds, which is the whole reason the
 * overlay is not optional.
 */
export function chatBackgroundExtremes(
  paint: ChatScreenPaint,
  variant: ChatBackgroundVariant,
): { lightest: string; darkest: string } {
  switch (variant) {
    case 'plain':
      return { lightest: paint.page, darkest: paint.page };
    case 'pattern':
      // The ink is drawn at `patternOpacity` over the page; the extremes are the
      // bare page and the page fully inked.
      return extremesOf([
        paint.page,
        mixColor(paint.page, paint.patternTint, DEFAULT_PATTERN_OPACITY),
      ]);
    case 'gradient':
      return extremesOf([...paint.gradient]);
    case 'image':
      return {
        lightest: mixColor('#ffffff', paint.imageDim, paint.imageDimOpacity),
        darkest: mixColor('#000000', paint.imageDim, paint.imageDimOpacity),
      };
  }
}

/**
 * The tile the `pattern` wallpaper repeats: four glyphs written directly in tile
 * coordinates (0–{@link CHAT_PATTERN_TILE}) rather than placed with transforms.
 * `react-native-svg`'s per-element transform props are deprecated and the string
 * form has to agree across two renderers; baked coordinates have nothing to
 * disagree about.
 */
export const CHAT_PATTERN_GLYPHS: readonly string[] = [
  // A speech bubble with a tail.
  'M18 26a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-9l-7 6v-6h-2a5 5 0 0 1-5-5z',
  // A soft diamond.
  'M40 70l9 9-9 9-9-9z',
  // An open ring, drawn as a circle path so the tile is one element type.
  'M84 26a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
  // A check pair — the delivery tick, at wallpaper weight.
  'M78 82l5 5 11-11M88 87l2 2 11-11',
];

/**
 * The lightest and darkest of a set of colours, by WCAG relative luminance.
 *
 * Sorted rather than indexed: which stop of a gradient is the light one depends
 * on the mode, and a recipe that changes direction would otherwise keep
 * reporting the old answer with nothing to say so.
 */
function extremesOf(colors: string[]): { lightest: string; darkest: string } {
  let lightest = colors[0] ?? '#000000';
  let darkest = lightest;
  let hi = relativeLuminance(lightest) ?? 0;
  let lo = hi;
  for (const color of colors) {
    const l = relativeLuminance(color);
    if (l === null) continue;
    if (l > hi) {
      hi = l;
      lightest = color;
    }
    if (l < lo) {
      lo = l;
      darkest = color;
    }
  }
  return { lightest, darkest };
}

/**
 * The two opaque bubble fills a wallpaper is measured AGAINST: an incoming
 * bubble (colors.card) and an outgoing one (colors.primary).
 *
 * Named here rather than inside the gate so the table in `docs/chat-screen.mdx`
 * and the number the test asserts come from ONE definition — a gate that picks
 * its own reference surfaces is measuring the gate.
 *
 * The FLOATING surfaces (the date pill, the two jump buttons) are deliberately
 * NOT in this set, and that is not an exemption: their separation from a
 * wallpaper historically reached 1.00 on dark patterns, which is why each
 * carries a 1px `floatingBorder` hairline. These samples measure bubble fills
 * independently of borders; image endpoints cannot guarantee separation for
 * every intermediate photo pixel (see the recorded limitation in the gate).
 */
export function chatBackgroundReferenceSurfaces(paint: ChatScreenPaint): string[] {
  return [paint.surface, paint.outgoingSurface];
}

/** A URL/URI string that needs no `ImageResolver`. */
export function isUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('file:')
  );
}

/**
 * Turns the `string | ImageSourcePropType` a caller may pass into something RN's
 * `Image` accepts, sending a bare ID through the registered `ImageResolver`.
 * `Avatar` already does this for itself, so this is for the plain images —
 * covers, pin thumbnails, the wallpaper.
 */
export function useResolvedImageSource(
  source: string | ImageSourcePropType | null | undefined,
  variant?: string,
): ImageSourcePropType | undefined {
  const resolver = useImageResolver();
  return useMemo(() => {
    if (source == null) return undefined;
    if (typeof source !== 'string') return source;
    if (source === '') return undefined;
    const uri = isUrl(source) ? source : resolver?.(source, variant);
    return uri ? { uri } : undefined;
  }, [resolver, source, variant]);
}

/** Default English strings. Every one of them is overridable by a prop. */
export const CHAT_SCREEN_LABELS = {
  back: 'Back',
  call: 'Call',
  videoCall: 'Video call',
  search: 'Search in conversation',
  more: 'More options',
  connecting: 'Connecting…',
  verified: 'Verified',
  bot: 'Bot',
  channel: 'Channel',
  clearSelection: 'Clear selection',
  forward: 'Forward',
  delete: 'Delete',
  copy: 'Copy',
  pin: 'Pin',
  pinnedList: 'Show pinned messages',
  pinnedClose: 'Hide the pinned bar',
  pinnedUnpin: 'Unpin this message',
  pinnedSingle: 'Pinned message',
  scrollToBottom: 'Scroll to latest messages',
  jumpToMention: 'Jump to mention',
  emptyTitle: 'No messages yet',
  info: 'Info',
  close: 'Close',
  members: 'Members',
  addMember: 'Add members',
  memberSearch: 'Search members',
  noMembers: 'No members found',
  owner: 'Owner',
  admin: 'Admin',
  resizeList: 'Resize the conversation list',
} as const;

/** `"Pinned message"` for one pin, `"Pinned message #2"` for several. */
export function formatPinTitle(index: number, total: number): string {
  return total <= 1 ? CHAT_SCREEN_LABELS.pinnedSingle : `${CHAT_SCREEN_LABELS.pinnedSingle} #${index + 1}`;
}

/** `"3 selected"`. */
export function formatSelectedCount(count: number): string {
  return `${count} selected`;
}

/**
 * A `data-*` attribute for the web only, as react-native-web's `dataSet` prop —
 * a browser hook for a puppeteer gate to read, and nothing native has to carry.
 */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_NATIVE ? {} : { dataSet: { [name]: value } };
}

/** Clamps `value` into `[min, max]`, tolerating a reversed or absent range. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), Math.max(min, max));
}
