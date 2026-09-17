/**
 * WCAG relative luminance and contrast ratio — ONE copy for every family that
 * picks a readable text colour over a computed surface (artwork tints, energy
 * labels, generated covers). Seven families had grown their own copy.
 */
import { parseRgba } from '../theme/color-utils';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance (0..1) of an opaque colour; `null` if it does not parse. */
export function relativeLuminance(color: string): number | null {
  const c = parseRgba(color);
  if (!c) return null;
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** Composite `top` at `alpha` over opaque `base` — CSS `color-mix(in srgb)`. */
export function mixColors(base: string, top: string, alpha: number): string {
  const b = parseRgba(base);
  const t = parseRgba(top);
  if (!b || !t) return base;
  const ch = (x: number, y: number) => Math.round(y * alpha + x * (1 - alpha));
  return `rgb(${ch(b.r, t.r)} ${ch(b.g, t.g)} ${ch(b.b, t.b)})`;
}

/**
 * The quietest blend of `text` over `surface` that still clears `minRatio`.
 *
 * Contrast rises monotonically with the blend, so a bisection finds the rung —
 * and then the QUANTIZED colour is re-checked and nudged upward, because an
 * 8-bit round turns a nominal 4.50 into a measured 4.49. What a caller gets back
 * therefore clears the floor as RENDERED, not as computed.
 *
 * This is the one way Bloom builds a quiet text colour. A ramp STOP cannot do
 * the job: `neutral-400` clears AA on the page and measures 2.42:1 on a chart
 * card, because the card is not the page. Reading the rung off the fill it
 * actually lands on is the whole difference — and it needs no new colours, since
 * every rung is the theme's own `text` over the theme's own surface.
 */
export function quietText(surface: string, text: string, minRatio: number): string {
  if (contrastRatio(surface, text) <= minRatio) return text;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i += 1) {
    const midpoint = (lo + hi) / 2;
    if (contrastRatio(mixColors(surface, text, midpoint), surface) >= minRatio) hi = midpoint;
    else lo = midpoint;
  }
  for (let t = hi; t <= 1; t += 1 / 255) {
    const candidate = mixColors(surface, text, t);
    if (contrastRatio(candidate, surface) >= minRatio) return candidate;
  }
  return text;
}

/**
 * One quiet colour for SEVERAL surfaces — the rung that clears `minRatio` on the
 * hardest of them.
 *
 * A family's caption grey usually lands on more than one fill: a chart card's
 * ticks sit on the card AND on the stat tiles inset into it, and those two are
 * on opposite sides of the text in dark mode. Flooring against one of them is
 * how `2.42:1` happened in the first place, one level up.
 *
 * Each surface proposes its own rung and the one with the best WORST case wins,
 * rather than assuming which surface is hardest — that assumption flips between
 * light and dark for exactly these pairs. Falls back to `text` if no rung clears
 * every surface, which is the honest answer: there is no quiet colour there.
 */
export function quietTextOver(
  surfaces: readonly string[],
  text: string,
  minRatio: number,
): string {
  let best = text;
  let bestWorstCase = -1;
  for (const surface of surfaces) {
    const candidate = quietText(surface, text, minRatio);
    const worstCase = Math.min(...surfaces.map((s) => contrastRatio(candidate, s)));
    if (worstCase > bestWorstCase) {
      bestWorstCase = worstCase;
      best = candidate;
    }
  }
  return bestWorstCase >= minRatio ? best : text;
}

/** WCAG contrast ratio between two opaque colours (1..21); `1` if either does not parse. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------------------------------------------------------------------------
//  The bars
//
//  Four families had each named 4.5 for themselves (`COVER_TEXT_CONTRAST`,
//  `IMMERSIVE_TEXT_TARGET`, `LYRICS_UPCOMING_CONTRAST`, `MIN_TEXT_CONTRAST`),
//  which made "do these two surfaces hold text to the same bar?" a question you
//  had to answer by reading five files.
// ---------------------------------------------------------------------------

/** WCAG AA for body text. The bar every label on a computed surface is held to. */
export const AA_TEXT_CONTRAST = 4.5;

/** WCAG AA for LARGE text — 24px and up, or 19px bold. */
export const AA_LARGE_TEXT_CONTRAST = 3;

/** WCAG AAA for body text. What a surface holds its most important line to. */
export const AAA_TEXT_CONTRAST = 7;

/**
 * Of `candidates`, the colour whose WORST contrast over every surface in `over`
 * is highest — text laid over a gradient has to read at both ends, and text on
 * a computed tint has to read on whatever the tint turned out to be.
 *
 * Returns the first candidate when none is better than another, so the caller's
 * order is its preference order.
 */
export function readableOn(over: string | readonly string[], candidates: readonly string[]): string {
  const surfaces = typeof over === 'string' ? [over] : over;
  let best = candidates[0]!;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = Math.min(...surfaces.map((surface) => contrastRatio(candidate, surface)));
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/**
 * `color` pulled toward black by `amount` (0..1), as `#rrggbb`; `null` if it
 * does not parse.
 *
 * Scaling every channel by the same factor keeps their RATIO, so the hue and
 * the saturation survive — this is why a darkened teal is still teal. It is
 * exactly `mixColor(color, '#000000', amount)`, which is how two of the copies
 * spelled it.
 */
export function darken(color: string, amount: number): string | null {
  const c = parseRgba(color);
  if (!c) return null;
  const k = 1 - amount;
  const hex = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v * k)))
      .toString(16)
      .padStart(2, '0');
  return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
}

/**
 * The lightest shade of `color` on which EVERY colour in `foreground` clears
 * `ratio`: the colour itself when it already does, else pulled toward black in
 * `1 / steps` increments until it does.
 *
 * `null` when `color` does not parse — the caller falls back to its own
 * neutral surface rather than being handed a colour it did not ask for. Black
 * clears any light foreground, so the walk always ends somewhere.
 *
 * **Darken the COLOUR, never walk its ramp.** A generated ramp re-derives every
 * stop's lightness and chroma from the hue, so a near-black input comes back
 * ten times lighter than it went in and a vivid one has a channel zeroed. This
 * keeps what it was handed and only removes light from it.
 */
export function darkenUntilContrast(
  color: string,
  foreground: string | readonly string[],
  ratio: number = AA_TEXT_CONTRAST,
  steps = 20,
): { color: string; amount: number } | null {
  if (!parseRgba(color)) return null;
  const fgs = typeof foreground === 'string' ? [foreground] : foreground;
  for (let step = 0; step <= steps; step++) {
    const amount = step / steps;
    const shade = darken(color, amount) as string;
    if (fgs.every((fg) => contrastRatio(shade, fg) >= ratio)) return { color: shade, amount };
  }
  return { color: '#000000', amount: 1 };
}
