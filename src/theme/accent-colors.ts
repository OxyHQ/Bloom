/**
 * The one resolver for "paint this thing in the success colour, filled/tinted/
 * outlined" — the question `Chip` and `Badge` each answered with their own copy
 * of the same function, and each answered wrongly in three different ways.
 *
 * All three defects were invisible to the suite because every one of them
 * produces a component that RENDERS, with a background style present and a label
 * on top of it. Only compositing the colours and computing the ratio can tell a
 * tinted control from an invisible one:
 *
 * 1. **Contrast 1.00.** Both tinted variants derived their surface by appending
 *    hex alpha to a fill — `base + '18'`, `base + '20'` — while the tokens
 *    resolve to `rgb(r g b)`. `"rgb(103 80 164)18"` is a malformed colour string
 *    that react-native-web reads back as fully OPAQUE, and the label was set to
 *    that same `base`. Every soft chip and subtle badge in the library painted
 *    text on its own colour. The `*Subtle`/`*SubtleForeground` pairs exist
 *    precisely so no component has to derive a tint: they are generated together
 *    by the colour policy and gated at AA over the page background.
 * 2. **A white label on a light neutral fill.** `default` used `textSecondary`
 *    as the fill with a hardcoded `'#fff'` on it. That is a mid-dark slate in
 *    light mode (9.4) and a LIGHT grey in dark mode — measured 1.70 across every
 *    preset. The page's own text colour on the page's own background is the
 *    guaranteed-legible neutral pair, and it is symmetric, so the inversion
 *    costs nothing: measured 8.37 at worst.
 * 3. **An outlined label in the FILL colour.** `--primary` is a FILL, sized to
 *    carry white text; the member legible as text ON the page is `--primary-text`
 *    (surfaced in JS as `primarySubtleForeground`). Using the fill as a label
 *    failed AA in 86 of the 170 preset x mode x family combinations, all in dark
 *    mode, worst 3.65.
 *
 * `theme/__tests__/accent-colors.test.ts` walks every tone x fill x preset x
 * mode and composites, so none of the three can come back.
 */
import type { ThemeColors } from './types';

/**
 * The semantic colour a chip/badge speaks in. `default` is the neutral one —
 * the only member with no hue, which is why it reads from the neutral surface
 * and text roles rather than from a `*Subtle` family.
 */
export type AccentTone = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

/**
 * How loudly it speaks: a full fill, a translucent tint, or an outline on the
 * page. One vocabulary — `Chip` used to call the middle one `soft` and `Badge`
 * called it `subtle`, two spellings of one concept.
 */
export type AccentFill = 'solid' | 'subtle' | 'outlined';

export interface AccentColors {
  /** Surface colour. `'transparent'` for `outlined`. */
  background: string;
  /** Label and icon colour, legible on `background` at AA. */
  foreground: string;
  /** Border colour. `'transparent'` where the variant draws no border. */
  border: string;
}

/**
 * Every status fill carries a WHITE label — the colour policy picks a fill tone
 * that white clears AA on, and `policy-legibility.test.ts` walks the whole
 * matrix asserting it. `primary` is the one family that does not always, because
 * a light brand (yellow, peach, `mono` in dark) keeps its own tone and takes a
 * black label instead, so it reads its own `primaryForeground` below.
 */
const STATUS_SOLID_FOREGROUND = '#fff';

/** The three members a tone answers with, before a variant picks among them. */
interface TonePalette {
  /** The opaque fill, sized to carry `fillForeground`. */
  fill: string;
  /** What is legible on `fill`. */
  fillForeground: string;
  /** The translucent tint, sized to carry `accent` over the page. */
  tint: string;
  /** What is legible on `tint`, and on the page background itself. */
  accent: string;
}

function tonePalette(colors: ThemeColors, tone: AccentTone): TonePalette {
  switch (tone) {
    case 'primary':
      return {
        fill: colors.primary,
        fillForeground: colors.primaryForeground,
        tint: colors.primarySubtle,
        accent: colors.primarySubtleForeground,
      };
    case 'success':
      return {
        fill: colors.success,
        fillForeground: STATUS_SOLID_FOREGROUND,
        tint: colors.successSubtle,
        accent: colors.successSubtleForeground,
      };
    case 'warning':
      return {
        fill: colors.warning,
        fillForeground: STATUS_SOLID_FOREGROUND,
        tint: colors.warningSubtle,
        accent: colors.warningSubtleForeground,
      };
    case 'error':
      return {
        fill: colors.error,
        fillForeground: STATUS_SOLID_FOREGROUND,
        tint: colors.errorSubtle,
        accent: colors.errorSubtleForeground,
      };
    case 'info':
      return {
        fill: colors.info,
        fillForeground: STATUS_SOLID_FOREGROUND,
        tint: colors.infoSubtle,
        accent: colors.infoSubtleForeground,
      };
    case 'default':
      // The neutral tone has no hue to tint, so it reads the neutral surface and
      // text roles instead: `contrast50` is `--muted` and `textSecondary` is its
      // `--muted-foreground`, the pair the palette already ships for exactly
      // this. The solid fill inverts the page's own reading pair, which is
      // legible by construction in both modes.
      return {
        fill: colors.textSecondary,
        fillForeground: colors.background,
        tint: colors.contrast50,
        accent: colors.textSecondary,
      };
  }
}

/**
 * Resolve the surface, label and border for one tone at one loudness.
 *
 * Pure — takes `theme.colors` rather than calling `useTheme()`, so it is
 * callable from a test that walks the whole preset matrix without rendering.
 */
export function resolveAccentColors(
  colors: ThemeColors,
  tone: AccentTone,
  fill: AccentFill,
): AccentColors {
  const palette = tonePalette(colors, tone);
  switch (fill) {
    case 'solid':
      return {
        background: palette.fill,
        foreground: palette.fillForeground,
        border: palette.fill,
      };
    case 'subtle':
      return {
        background: palette.tint,
        foreground: palette.accent,
        border: 'transparent',
      };
    case 'outlined':
      // The label and the outline are the same colour, so the control reads as
      // one thing — and that colour is the text member, not the fill.
      return {
        background: 'transparent',
        foreground: palette.accent,
        border: palette.accent,
      };
  }
}
