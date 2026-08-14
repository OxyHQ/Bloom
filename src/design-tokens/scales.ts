/**
 * Numeric design-token scales for the Oxy Unified Design Language.
 *
 * These are platform-agnostic plain numbers / CSS strings consumed by the Bloom
 * Tailwind preset (`tailwind-preset.ts`). The SAME keys produce the SAME utility
 * class names on Tailwind (web) and NativeWind (native):
 *   - spacing  → `p-space-8`, `gap-space-20`, `px-screen-margin`, `m-space-16`
 *   - radius   → `rounded-radius-20`
 *   - type     → `font-body` (family/weight) + `text-body` (size/lineHeight)
 *   - shadow   → `shadow-s`, `shadow-m`
 *
 * ADDITIVE: every key is namespaced (`space-*`, `radius-*`, the typography role
 * names, `shadow-s/m`) and does not collide with Tailwind's built-in numeric
 * scale (`p-4`, `rounded-lg`, `text-sm`) — those keep working unchanged.
 */

/* -------------------------------------------------------------------------- */
/*  Spacing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Spacing scale (px). Consumed via every Tailwind spacing utility:
 * `p-space-8`, `px-space-16`, `gap-space-20`, `m-space-24`, `py-space-12`, …
 *
 * `screen-margin` is the standard page gutter (left/right inset). Default 20px —
 * the same rung as `space-20`, which is also the `Dialog` default `contentPadding`.
 *
 * THIS IS THE ONE PLACE A SPACING NUMBER IS WRITTEN DOWN. `styles/tokens.ts`'s
 * t-shirt-keyed `space` is a VIEW of this object, not a second copy: the class
 * vocabulary (`p-space-12`) and the inline-style vocabulary (`space.md`) name the
 * same rung in two spellings, and neither can drift from the other.
 */
export const SPACING = {
  'space-2': 2,
  'space-4': 4,
  'space-8': 8,
  'space-12': 12,
  'space-16': 16,
  'space-20': 20,
  'space-24': 24,
  'space-32': 32,
  'space-40': 40,
  'space-60': 60,
  'screen-margin': 20,
} as const;

/* -------------------------------------------------------------------------- */
/*  Radius                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Corner-radius scale (px). Consumed via `rounded-radius-*`:
 * `rounded-radius-2` … `rounded-radius-28`, `rounded-radius-max` (pill / circle).
 *
 * Same rule as `SPACING`: the one place a radius number is written down, viewed
 * under t-shirt keys by `styles/tokens.ts`'s `borderRadius`.
 *
 * `radius-max` is 9999 and not 999. Both render identically everywhere Bloom can
 * reach — a corner radius is clamped to half the element's SMALLER dimension, so
 * the two only diverge on a control at least 1998px tall AND wide — but one
 * number had to win, this file is the authority the Tailwind preset and the CSS
 * layer are already built from, and 9999 is the idiom the `rounded-radius-max`
 * utility has been publishing all along.
 */
export const RADIUS = {
  'radius-2': 2,
  'radius-4': 4,
  'radius-8': 8,
  'radius-12': 12,
  'radius-16': 16,
  'radius-20': 20,
  'radius-24': 24,
  'radius-28': 28,
  'radius-max': 9999,
} as const;

/* -------------------------------------------------------------------------- */
/*  Border width (hairline)                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Border-width helpers. `border-hairline` is the 0.5px hairline that pairs with
 * the `border-border-image` color role. (Tailwind's default `border` = 1px
 * stays untouched.)
 */
export const BORDER_WIDTH = {
  hairline: 0.5,
} as const;

/* -------------------------------------------------------------------------- */
/*  Typography                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One typography role. `size`/`lineHeight` are px; `weight` is a CSS font-weight
 * string; `family` selects the Bloom font CSS var (`sans` = body/UI,
 * `display` = headings/serif).
 *
 * The Tailwind preset splits each role into TWO utilities so a consumer can
 * apply the size/leading and the family/weight independently or together:
 *   - `text-<role>`  → `fontSize` + `lineHeight`   (via theme.fontSize)
 *   - `font-<role>`  → `fontFamily` + `fontWeight` (via theme.fontFamily, which
 *                       maps a key to a [family, { fontWeight }] tuple)
 */
export interface TypeRole {
  /** Font size in px. */
  size: number;
  /** Line height in px. */
  lineHeight: number;
  /** CSS font-weight (string for Tailwind/RN parity). */
  weight: '400' | '500' | '600' | '700';
  /** Which Bloom font family CSS var to use. */
  family: 'sans' | 'display';
}

/**
 * The coherent Oxy type scale. Sizes climb 11 → 28; line-heights use a ~1.3–1.5
 * leading for body roles and tighter leading for large titles.
 *
 * | role            | size/line | weight | family  | usage                          |
 * | --------------- | --------- | ------ | ------- | ------------------------------ |
 * | caption         | 11 / 14   | 400    | sans    | timestamps, meta, fine print   |
 * | bodySmall       | 13 / 18   | 400    | sans    | secondary body, captions       |
 * | bodyTitleSmall  | 13 / 18   | 600    | sans    | small emphasized labels        |
 * | body            | 15 / 22   | 400    | sans    | default body text              |
 * | subtitle        | 17 / 24   | 500    | sans    | list subtitles, lead-ins       |
 * | sectionTitle    | 20 / 26   | 600    | sans    | section headers                |
 * | headerBold      | 28 / 34   | 700    | display | screen / page titles           |
 * | buttonLarge     | 17 / 22   | 600    | sans    | primary button label           |
 */
export const TYPOGRAPHY = {
  caption: { size: 11, lineHeight: 14, weight: '400', family: 'sans' },
  bodySmall: { size: 13, lineHeight: 18, weight: '400', family: 'sans' },
  bodyTitleSmall: { size: 13, lineHeight: 18, weight: '600', family: 'sans' },
  body: { size: 15, lineHeight: 22, weight: '400', family: 'sans' },
  subtitle: { size: 17, lineHeight: 24, weight: '500', family: 'sans' },
  sectionTitle: { size: 20, lineHeight: 26, weight: '600', family: 'sans' },
  headerBold: { size: 28, lineHeight: 34, weight: '700', family: 'display' },
  buttonLarge: { size: 17, lineHeight: 22, weight: '600', family: 'sans' },
} as const satisfies Record<string, TypeRole>;

export type TypeRoleName = keyof typeof TYPOGRAPHY;

/**
 * Bloom font-family CSS-var stacks, keyed by the `family` field above. Web reads
 * `var(--bloom-font-*)` (set by `applyFontFaces`); the preset falls back to the
 * literal stack so utilities still resolve before the vars are injected and on
 * native (where NativeWind passes the family string straight through).
 */
export const FONT_FAMILY_VARS = {
  sans: 'var(--bloom-font-sans)',
  display: 'var(--bloom-font-display)',
  mono: 'var(--bloom-font-mono)',
} as const;
