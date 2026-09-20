/**
 * What a note card is painted with, and how big it is.
 *
 * Split out of the component for one reason: the tint is the part that can be
 * wrong INVISIBLY. A note's colour is a subtle accent tint, which is a
 * TRANSLUCENT token — so the quiet metadata line under it is not sitting on the
 * page any more, it is sitting on the page WITH the tint over it, and a quiet
 * rung measured against the page reads a contrast the reader never gets. So the
 * tint is composited here first and every text rung is measured against the
 * composite. `NoteCard.test.tsx` pins the composite and the rungs over both
 * modes; nothing about it is visible in a render tree.
 */
import type { CardRadius } from '../card/types';
import { RADIUS } from '../design-tokens/scales';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import { mixColors } from '../styles/color-contrast';
import {
  hairlineOn,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import type { NoteCardDensity } from './types';

/**
 * The two arrangements, as numbers.
 *
 *                       grid   row
 *   padding             16     12
 *   gap (title→body)    8      4
 *   radius              12     8
 *   excerpt lines       4      1
 *   title lines         2      1
 *   tags drawn          3      2
 *   min height          —      72
 */
export interface NoteCardGeometry {
  padding: number;
  gap: number;
  /** A rung of the `RADIUS` scale — `Card` takes the rung, the focus ring takes its px. */
  radius: CardRadius;
  excerptLines: number;
  titleLines: number;
  maxTags: number;
  minHeight?: number;
  /** Rows of the checklist preview drawn before the "+N more" line. */
  checklistRows: number;
}

export const NOTE_CARD_GEOMETRY: Record<NoteCardDensity, NoteCardGeometry> = {
  grid: {
    padding: 16,
    gap: 8,
    radius: 'radius-12',
    excerptLines: 4,
    titleLines: 2,
    maxTags: 3,
    checklistRows: 4,
  },
  row: {
    padding: 12,
    gap: 4,
    radius: 'radius-8',
    excerptLines: 1,
    titleLines: 1,
    maxTags: 2,
    minHeight: 72,
    checklistRows: 2,
  },
};

export interface NoteCardPaint extends SurfaceTextPaint {
  /** The OPAQUE colour the card actually paints — the tint already composited over its parent. */
  background: string;
  /** The card's edge. */
  border: string;
  /** The edge while the card is the selected one. */
  selectedBorder: string;
  /** The fill while the card is selected or hovered — one surface step off the resting one. */
  selectedBackground: string;
  /** The tone's own label colour — the pin, the tinted glyphs. */
  accent: string;
}

/**
 * Composite a possibly-translucent colour over an opaque one.
 *
 * `resolveAccentColors(..., 'subtle')` hands back `rgba(r g b / a)`, which is
 * correct for a chip on a page and useless as the input to a contrast
 * measurement — `relativeLuminance` reads the channels and ignores the alpha, so
 * a 13%-alpha tint measures as if it were fully saturated. Flattening it first
 * is what makes every rung below honest.
 */
export function flattenOver(base: string, over: string): string {
  const parsed = parseRgba(over);
  if (!parsed) return base;
  if (parsed.a >= 1) return `rgb(${parsed.r} ${parsed.g} ${parsed.b})`;
  return mixColors(base, `rgb(${parsed.r} ${parsed.g} ${parsed.b})`, parsed.a);
}

/**
 * Everything one card paints, given the surface it lands on and its tone.
 *
 * Pure, so the test can walk it over every preset and mode without rendering.
 * `tone` `undefined` is the untinted note: the card is its parent's own next
 * rung, which is what an untinted card on a page has always been.
 */
export function resolveNoteCardPaint(
  theme: Theme,
  parent: string,
  tone: AccentTone | undefined,
): NoteCardPaint {
  const accentTone: AccentTone = tone ?? 'default';
  const accent = resolveAccentColors(theme.colors, accentTone, 'subtle');
  const background = tone === undefined ? theme.colors.card : flattenOver(parent, accent.background);
  const border = hairlineOn(theme, background);
  // The selected card is ONE SURFACE STEP off its own resting fill, not the tone
  // laid on twice. Laying the tint on again was the obvious move and it is
  // silently a no-op for any tone whose tint is OPAQUE — `default`'s is
  // (`contrast50`), so a selected neutral note painted itself exactly the colour
  // it already was and only the border moved. A step always moves.
  const selectedBackground = surfaceFillOn(theme, background);
  return {
    background,
    border,
    selectedBorder: tone === undefined ? theme.colors.primary : accent.foreground,
    selectedBackground,
    accent: accent.foreground,
    ...surfaceTextOn(theme, background),
  };
}

/**
 * How the tag pills are painted on a card of this tone.
 *
 * `subtle` everywhere except the NEUTRAL tone, where the pill's own tint
 * (`contrast50`) is byte-for-byte the wash the neutral card already painted —
 * so a `subtle` pill on a `tone="default"` card is a label floating on nothing,
 * with a background style present and a contrast of 1.00. It is the same trap as
 * `selectedBackground`, one component down: an OPAQUE tint laid over itself.
 * `outlined` draws the edge the fill cannot.
 */
export function noteTagVariant(tone: AccentTone | undefined): 'subtle' | 'outlined' {
  return tone === 'default' ? 'outlined' : 'subtle';
}

/** The focus ring hugs the card, so it needs the rung in pixels. */
export function noteCardRadiusPx(density: NoteCardDensity): number {
  return RADIUS[NOTE_CARD_GEOMETRY[density].radius];
}

/** The metadata trail as one string, for the card's composed accessible name. */
export function composeNoteName(parts: ReadonlyArray<string | number | false | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== undefined && part !== false && part !== '')
    .join(', ');
}
