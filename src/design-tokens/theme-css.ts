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
 *   import { bloomThemeCss } from '@oxyhq/bloom/design-tokens';
 *   // build-time: write `@theme { ${bloomThemeCss()} }` into global.css, OR
 *   // paste the generated block once (see docs/design-tokens.md).
 *
 * A consumer that prefers a static stylesheet can copy the output of
 * `bloomThemeCss()` directly into their `@theme { … }` — the values are stable.
 */

import { BORDER_ROLES, FILL_ROLES, TEXT_ROLES } from './color-roles';
import {
  BORDER_WIDTH,
  FONT_FAMILY_VARS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type TypeRoleName,
} from './scales';
import { SHADOW_BOX } from './shadows';

/**
 * Produce the BODY of a Tailwind v4 `@theme` block (no surrounding braces) that
 * registers the full Bloom semantic vocabulary.
 *
 * - Colors → `--color-<role>: var(--canonical);`
 * - Spacing → `--spacing-<key>: <px>;`
 * - Radius  → `--radius-<key>: <px>;`
 * - Type    → `--text-<role>: <size>; --text-<role>--line-height: <lh>;`
 *             `--font-<role>: var(--bloom-font-*);` (+ weight via utility doc)
 * - Shadow  → `--shadow-<s|m>: <box-shadow>;`
 */
export function bloomThemeCss(): string {
  const lines: string[] = [];

  // Color roles.
  for (const [role, value] of Object.entries({
    ...FILL_ROLES,
    ...TEXT_ROLES,
    ...BORDER_ROLES,
  })) {
    lines.push(`  --color-${role}: ${value};`);
  }

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
  for (const name of Object.keys(TYPOGRAPHY) as TypeRoleName[]) {
    const role = TYPOGRAPHY[name];
    lines.push(`  --text-${name}: ${role.size}px;`);
    lines.push(`  --text-${name}--line-height: ${role.lineHeight}px;`);
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

/** The full `@theme { … }` block, ready to inject into a v4 stylesheet. */
export function bloomThemeBlock(): string {
  return `@theme {\n${bloomThemeCss()}\n}`;
}
