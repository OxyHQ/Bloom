/**
 * Tailwind v4 `@theme` block generator for the Oxy Unified Design Language.
 *
 * Tailwind v4 web apps (auth, console, website) configure their design tokens in
 * CSS via `@theme { --color-X: var(--X); … }` rather than a JS preset. This
 * module produces the exact `@theme` body that mirrors `bloomTailwindPreset`, so
 * a v4 app gets the SAME semantic utilities (`bg-fill`, `text-text-tertiary`,
 * `p-space-8`, `rounded-radius-20`, `text-body`, `font-body`, `shadow-s`) as the
 * NativeWind/Tailwind-v3 apps that consume the JS preset.
 *
 * Each color role is emitted as a `--color-<role>: var(--canonical)` alias.
 * Per Bloom's web CSS-var contract, the canonical `--x` token already resolves
 * to a full `rgb(...)` color at runtime, so the alias is a direct `var(--x)`
 * reference — NEVER `hsl(var(--x))`.
 *
 * Usage (web Tailwind v4, in the app's global stylesheet):
 *
 *   import { bloomThemeCss } from '@oxy.so/bloom/design-tokens';
 *   // build-time: write `@theme { ${bloomThemeCss()} }` into global.css, OR
 *   // paste the generated block once (see docs/design-tokens.md).
 *
 * A consumer that prefers a static stylesheet can copy the output of
 * `bloomThemeCss()` directly into their `@theme { … }` — the values are stable.
 */

import { ACCENT_TEXT_ROLES, BORDER_ROLES, FILL_ROLES, TEXT_ROLES } from './color-roles';
import { CANONICAL_TOKENS } from '../theme/token-registry';
import {
  BORDER_WIDTH,
  FONT_FAMILY_VARS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type TypeRoleName,
} from './scales';
import { SHADOW_BOX } from './shadows';
import { SURFACE_VAR } from '../styles/surface-var-names';

/**
 * A px line-height as the unitless ratio of its font-size, spelled the way
 * Tailwind spells its own type scale: `lineHeightRatio(22, 15)` → `calc(22 / 15)`.
 * Exact on both platforms (no rounded decimal), and the only form
 * react-native-css resolves correctly through `var()` — it multiplies any
 * number by the font-size.
 */
export function lineHeightRatio(lineHeightPx: number, fontSizePx: number): string {
  return `calc(${lineHeightPx} / ${fontSizePx})`;
}

/**
 * Produce the BODY of a Tailwind v4 `@theme` block (no surrounding braces) that
 * registers the full Bloom semantic vocabulary.
 *
 * - Colors → `--color-<role>: var(--canonical);`
 * - Spacing → `--spacing-<key>: <px>;`
 * - Radius  → `--radius-<key>: <px>;`
 * - Type    → `--text-<role>: <size>; --text-<role>--line-height: calc(<lh> / <size>);`
 *             `--font-<role>: var(--bloom-font-*);` (+ weight via utility doc)
 * - Shadow  → `--shadow-<s|m>: <box-shadow>;`
 */
export function bloomThemeCss(): string {
  const lines: string[] = [];

  // Bloom's namespaced semantic color roles (bg-fill, text-text-*, border-*).
  for (const [role, value] of Object.entries({
    ...FILL_ROLES,
    ...TEXT_ROLES,
    ...ACCENT_TEXT_ROLES,
    ...BORDER_ROLES,
  })) {
    lines.push(`  --color-${role}: ${value};`);
  }

  // shadcn-canonical color utilities (bg-card, bg-primary, bg-background,
  // text-muted-foreground, …). Emitted here — the SINGLE source of truth — for
  // every runtime token, so consumer apps get these utilities by importing
  // `@oxy.so/bloom/design-tokens/theme.css` and NEVER re-declare a per-app
  // `@theme { --color-*: var(--*) }` block (that per-app duplication is what let
  // `--color-card` drift to `var(--surface)`). Mirrors the `--color-<token>`
  // aliases `buildScopeVars` emits at runtime, so the static and runtime maps
  // agree. Each `--x` token already resolves to a full `rgb(...)` color, so the
  // alias is a direct `var(--x)` — never `hsl(var(--x))`.
  for (const token of CANONICAL_TOKENS) {
    lines.push(`  --color-${token}: var(--${token});`);
  }
  // `destructive` carries no themed foreground token; its text is always the
  // fixed light-on-error colour.
  lines.push('  --color-destructive-foreground: #ffffff;');
  // `divider` is a semantic alias of the border token (M3 outlineVariant) so
  // `bg-divider` / `border-divider` read intentionally in list/section UIs.
  lines.push('  --color-divider: var(--border);');

  // Spacing.
  for (const [key, value] of Object.entries(SPACING)) {
    lines.push(`  --spacing-${key}: ${value}px;`);
  }

  // Radius.
  for (const [key, value] of Object.entries(RADIUS)) {
    lines.push(`  --radius-${key}: ${value}px;`);
  }

  // Hairline border width.
  for (const [key, value] of Object.entries(BORDER_WIDTH)) {
    lines.push(`  --border-width-${key}: ${value}px;`);
  }

  // Typography: size + line-height + family per role.
  //
  // The line-height is a UNITLESS ratio (`calc(22 / 15)`), the form Tailwind's
  // own `--text-sm--line-height: calc(1.25 / 0.875)` takes — never px. On the
  // web the two are identical (a unitless line-height is a multiple of the
  // font-size: 15px × 22/15 = 22px). On native they are not: Tailwind v4 emits
  // `line-height: var(--tw-leading, var(--text-body--line-height))`,
  // react-native-css compiles that to `lineHeight(var(…, 22))`, and its runtime
  // `lineHeight` resolver treats EVERY number as an em multiplier — so a px
  // token rendered `text-body` at 22 × 15 = 330dp line-height on Android and
  // iOS. See `lineHeightRatio` and `docs/typography.mdx`.
  for (const name of Object.keys(TYPOGRAPHY) as TypeRoleName[]) {
    const role = TYPOGRAPHY[name];
    lines.push(`  --text-${name}: ${role.size}px;`);
    lines.push(`  --text-${name}--line-height: ${lineHeightRatio(role.lineHeight, role.size)};`);
    lines.push(`  --text-${name}--font-weight: ${role.weight};`);
    lines.push(`  --font-${name}: ${FONT_FAMILY_VARS[role.family]};`);
  }

  // Bloom raw families.
  lines.push(`  --font-bloom-sans: ${FONT_FAMILY_VARS.sans};`);
  lines.push(`  --font-bloom-display: ${FONT_FAMILY_VARS.display};`);
  lines.push(`  --font-bloom-mono: ${FONT_FAMILY_VARS.mono};`);

  // Shadows.
  lines.push(`  --shadow-s: ${SHADOW_BOX.s};`);
  lines.push(`  --shadow-m: ${SHADOW_BOX.m};`);

  return lines.join('\n');
}

/**
 * The AMBIENT-surface colours: what the nearest publishing container painted,
 * and what reads on it (`styles/surface-paint.ts` `surfaceVars`).
 *
 *   bg-ambient                   the surface you are on (sticky header, tab bar)
 *   bg-ambient-raised            one legible step up (a field, a tile, a track)
 *   border-ambient-hairline      the line that separates on it
 *   text-on-ambient-secondary    AA_TEXT_STRONG on it
 *   text-on-ambient-tertiary     AA_TEXT on it
 *   text-on-ambient-graphical    AA_GRAPHICAL on it (rules, disabled glyphs)
 *
 * These go in an `@theme inline` block, not the plain one. A plain `@theme`
 * alias is declared at `:root` and substitutes THERE, so `--color-ambient` would
 * be the page's surface everywhere; `inline` makes the utility read
 * `var(--bloom-surface)` itself, at the element — which is the whole point of a
 * value that changes per container.
 */
export function bloomAmbientThemeCss(): string {
  return [
    `  --color-ambient: var(${SURFACE_VAR.fill});`,
    `  --color-ambient-raised: var(${SURFACE_VAR.raised});`,
    `  --color-ambient-hairline: var(${SURFACE_VAR.hairline});`,
    `  --color-on-ambient-secondary: var(${SURFACE_VAR.textSecondary});`,
    `  --color-on-ambient-tertiary: var(${SURFACE_VAR.textTertiary});`,
    `  --color-on-ambient-graphical: var(${SURFACE_VAR.textGraphical});`,
  ].join('\n');
}

/** The full `@theme { … }` blocks, ready to inject into a v4 stylesheet. */
export function bloomThemeBlock(): string {
  return `@theme {\n${bloomThemeCss()}\n}\n\n@theme inline {\n${bloomAmbientThemeCss()}\n}`;
}
