/**
 * The theme-from-seed golden: what the TypeScript theme resolves a seed to, for every port of the
 * colour engine and policy to reproduce exactly (the Bloom engine, packages/bloom-theme-engine, on
 * each backend). One line per case, tab-separated:
 *
 *   <seed> <light|dark> <variant|-> <contrast> <secondary|-> <tertiary|-> <token>=<value>… colors.<field>=<value>…
 *
 * The tokens are `buildSeedScopeVars`' canonical tokens without the web's `--color-*` aliases (for a
 * preset's seed, exactly its golden-resolved-tokens.json entry); the colours are
 * `buildThemeFromSeed(…).colors`. Cases: every built-in preset derived from its seed (its variant
 * and accents), light and dark, then fixed seeds at three contrast levels. Rewritten on purpose
 * only, after an approved change to the engine or the policy.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemeFromSeed } from '../src/theme/build-theme-from-seed';
import { generateRoleColors, type SchemeVariant } from '../src/theme/color-engine';
import { buildPolicyTokens, isColourlessSeed } from '../src/theme/color-policy';
import { APP_COLOR_NAMES, APP_COLOR_PRESETS } from '../src/theme/color-presets';
import { roleColorsToPresetTokens } from '../src/theme/color-scope/seed-scope';
import { ROLE_SEEDS } from './generate-color-roles-golden';

export interface SeedCase {
  seed: string;
  mode: 'light' | 'dark';
  variant?: SchemeVariant;
  contrastLevel?: number;
  secondarySeed?: string;
  tertiarySeed?: string;
}

export const SEED_CONTRASTS = [-1, 0, 1];

export function seedCases(): SeedCase[] {
  const cases: SeedCase[] = [];
  for (const name of APP_COLOR_NAMES) {
    const preset = APP_COLOR_PRESETS[name];
    // A preset with hand-authored tokens is a drawn scheme, not a seed derivation.
    if (preset.tokens !== undefined) continue;
    for (const mode of ['light', 'dark'] as const) {
      cases.push({
        seed: preset.hex,
        mode,
        variant: preset.variant,
        secondarySeed: preset.secondaryHex,
        tertiarySeed: preset.tertiaryHex,
      });
    }
  }
  for (const seed of ROLE_SEEDS) {
    for (const contrastLevel of SEED_CONTRASTS) {
      for (const mode of ['light', 'dark'] as const) cases.push({ seed, mode, contrastLevel });
    }
  }
  return cases;
}

/** `buildSeedScopeVars`' tokens before the alias layer (seed-scope.ts' `solveSeedScopeVars`). */
export function seedTokens(c: SeedCase): Record<string, string> {
  const roles = generateRoleColors({
    seed: c.seed,
    variant: c.variant ?? (isColourlessSeed(c.seed) ? 'monochrome' : 'vivid'),
    isDark: c.mode === 'dark',
    contrastLevel: c.contrastLevel ?? 0,
    secondarySeed: c.secondarySeed,
    tertiarySeed: c.tertiarySeed,
  });
  return {
    ...roleColorsToPresetTokens(roles),
    ...buildPolicyTokens(c.seed, c.mode === 'dark', roles, {
      secondary: c.secondarySeed,
      tertiary: c.tertiarySeed,
    }),
  };
}

export function seedLine(c: SeedCase, tokenNames: string[], colorNames: string[]): string {
  const tokens = seedTokens(c);
  const { colors } = buildThemeFromSeed(c.seed, c.mode, c.variant, c.contrastLevel, {
    secondarySeed: c.secondarySeed,
    tertiarySeed: c.tertiarySeed,
  });
  const values = colors as unknown as Record<string, string>;
  if (Object.keys(tokens).join() !== tokenNames.join())
    throw new Error(`${c.seed}: tokens out of order`);
  if (Object.keys(values).join() !== colorNames.join())
    throw new Error(`${c.seed}: colours out of order`);
  return [
    c.seed,
    c.mode,
    c.variant ?? '-',
    String(c.contrastLevel ?? 0),
    c.secondarySeed ?? '-',
    c.tertiarySeed ?? '-',
    ...tokenNames.map((k) => tokens[k]),
    ...colorNames.map((k) => values[k]),
  ].join('\t');
}

if (import.meta.main) {
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(here, '..', 'src', 'theme', '__tests__', 'fixtures', 'seed-tokens-golden.txt');
  const cases = seedCases();
  const first = cases[0] as SeedCase;
  const tokenNames = Object.keys(seedTokens(first));
  const colorNames = Object.keys(buildThemeFromSeed(first.seed, first.mode).colors);
  const lines = cases.map((c) => seedLine(c, tokenNames, colorNames));
  const text = `# tokens\t${tokenNames.join('\t')}\n# colors\t${colorNames.join('\t')}\n${lines.join('\n')}\n`;
  writeFileSync(out, text);
  console.log(
    `[generate-seed-tokens-golden] wrote ${relative(join(here, '..'), out)} (${text.length} bytes)`,
  );
}
