/**
 * Semantic color-role vocabulary for the Oxy Unified Design Language.
 *
 * Every role is an ALIAS onto one of Bloom's existing canonical theme tokens
 * (`--background`, `--surface`, `--primary`, …) — the SINGLE source of resolved
 * color values produced by `getResolvedTokens` and written to the document root
 * (web) / `rootVariables` (native) by `BloomThemeProvider`. No color VALUE is
 * invented here: a role's value is the `var(--canonical)` reference, so it stays
 * driven by the active light/dark mode and color preset automatically.
 *
 * The maps are consumed by the Bloom Tailwind preset (`tailwind-preset.ts`),
 * which slots them into `theme.extend.{backgroundColor,textColor,borderColor}`.
 * Because the values are `var(--x)` strings, the SAME class names resolve on
 * Tailwind (web) and NativeWind (native): web reads the CSS custom property from
 * `document.documentElement`; native reads it from react-native-css's
 * `rootVariables` family — both populated by Bloom from one pipeline.
 *
 * Web CSS-var contract (see Bloom AGENTS.md): base `--x` tokens already resolve
 * to a FULL `rgb(...)` color at runtime, so the role values reference them with
 * `var(--x)` directly — NEVER `hsl(var(--x))`.
 *
 * ADDITIVE: these are NEW utility names (`bg-fill`, `text-text-tertiary`,
 * `border-border-image`, …). They do not touch the existing app-defined color
 * utilities (`bg-background`, `text-muted-foreground`, …), which keep working.
 */

/** A `var(--canonical-token)` reference string. */
type TokenRef = `var(--${string})`;

const ref = (token: string): TokenRef => `var(--${token})`;

/**
 * Surface / fill roles → background-color utilities (`bg-<role>`).
 *
 * | role              | utility            | canonical token   | rationale                                   |
 * | ----------------- | ------------------ | ----------------- | ------------------------------------------- |
 * | bg                | bg-bg              | --background      | the page background                          |
 * | fill              | bg-fill            | --card            | default raised surface (cards/sheets)        |
 * | fill-secondary    | bg-fill-secondary  | --muted           | muted/secondary fill                         |
 * | fill-hover        | bg-fill-hover      | --accent          | hover state of a secondary fill              |
 * | fill-brand        | bg-fill-brand      | --primary         | brand-colored fill                           |
 * | fill-brand-hover  | bg-fill-brand-hover| --ring            | hover of brand fill (ring == primary hue)    |
 * | fill-inverse      | bg-fill-inverse    | --foreground      | inverse (high-contrast) fill                 |
 * | fill-inverse-hover| bg-fill-inverse-hov| --muted-foreground| hover of inverse fill                        |
 * | fill-placeholder  | bg-fill-placeholder| --muted           | disabled/placeholder surface                 |
 */
export const FILL_ROLES = {
  bg: ref('background'),
  fill: ref('card'),
  'fill-secondary': ref('muted'),
  'fill-hover': ref('accent'),
  'fill-brand': ref('primary'),
  'fill-brand-hover': ref('ring'),
  'fill-inverse': ref('foreground'),
  'fill-inverse-hover': ref('muted-foreground'),
  'fill-placeholder': ref('muted'),
} as const;

/**
 * Text roles → text-color utilities (`text-<role>`).
 *
 * Tailwind prefixes text-color utilities with `text-`, so a role literally
 * named `text` becomes the utility `text-text`, `text-secondary` → the utility
 * `text-text-secondary`, etc. (matches the namespaced spec).
 *
 * | role             | utility               | canonical token       | rationale                          |
 * | ---------------- | --------------------- | --------------------- | ---------------------------------- |
 * | text             | text-text             | --foreground          | primary text                        |
 * | text-secondary   | text-text-secondary   | --muted-foreground    | secondary text                      |
 * | text-tertiary    | text-text-tertiary    | --muted-foreground    | tertiary/least-emphasis text        |
 * | text-inverse     | text-text-inverse     | --primary-foreground  | text on a brand fill                |
 * | text-fixed-light | text-text-fixed-light | --primary-foreground  | always-light text (on brand)        |
 * | text-placeholder | text-text-placeholder | --muted-foreground    | placeholder/input hint              |
 */
export const TEXT_ROLES = {
  text: ref('foreground'),
  'text-secondary': ref('muted-foreground'),
  'text-tertiary': ref('muted-foreground'),
  'text-inverse': ref('primary-foreground'),
  'text-fixed-light': ref('primary-foreground'),
  'text-placeholder': ref('muted-foreground'),
} as const;

/**
 * Border roles → border-color utilities (`border-<role>`).
 *
 * | role               | utility                 | canonical token | rationale                                  |
 * | ------------------ | ----------------------- | --------------- | ------------------------------------------ |
 * | border             | border-border           | --border        | default border                              |
 * | border-image       | border-border-image     | --border        | hairline border color (0.5px width helper)  |
 * | border-secondary   | border-border-secondary | --input         | secondary/softer border                     |
 * | border-input       | border-border-input     | --input         | input field border                          |
 * | border-input-active| border-border-input-active | --ring       | focused input border (== primary)           |
 *
 * NOTE: the hairline 0.5px WIDTH for `border-image` is shipped as a separate
 * `borderWidth` scale entry (`border-hairline`) in the preset; the color role
 * above only provides the matching color. Consumers compose them:
 * `border-hairline border-border-image`.
 */
export const BORDER_ROLES = {
  border: ref('border'),
  'border-image': ref('border'),
  'border-secondary': ref('input'),
  'border-input': ref('input'),
  'border-input-active': ref('ring'),
} as const;

export type FillRole = keyof typeof FILL_ROLES;
export type TextRole = keyof typeof TEXT_ROLES;
export type BorderRole = keyof typeof BORDER_ROLES;
