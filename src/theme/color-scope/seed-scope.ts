import { generateRoleColors, type RoleColors, type SchemeVariant } from '../color-engine';
import { buildPolicyTokens } from '../color-policy';
import { CANONICAL_TOKENS } from '../token-registry';

/**
 * The canonical role → token assignment, sourced from an arbitrary seed's role
 * set instead of a named preset.
 *
 * This MUST stay byte-for-byte identical to the mapping in `getPresetVars`
 * (`preset-vars.ts`): a named preset is just a fixed seed, so scoping a subtree
 * to a preset via `buildScopeVars` and scoping it to that preset's seed hex via
 * `buildSeedScopeVars` are required to produce the same tokens. The parity test
 * (`__tests__/seed-scope-parity.test.ts`) fails CI if the two ever drift.
 *
 * Values are full `rgb(r g b)` strings straight from the engine — no HSL-triple
 * intermediate, so they flow through the scope pipeline unchanged (same as the
 * preset path after `getResolvedTokens`).
 */
export function roleColorsToPresetTokens(r: RoleColors): Record<string, string> {
  return {
    // --- base shadcn palette ---
    '--background': r.background,
    '--foreground': r.onBackground,
    '--surface': r.surfaceContainerLow,
    '--surface-foreground': r.onSurface,
    '--popover': r.surfaceContainer,
    '--popover-foreground': r.onSurface,
    '--primary': r.primary,
    '--primary-foreground': r.onPrimary,
    // shadcn `secondary`/`tertiary` are low-emphasis TONAL SURFACES → M3 container
    // roles (must stay identical to `getPresetVars`; the parity test enforces it).
    '--secondary': r.secondaryContainer,
    '--secondary-foreground': r.onSecondaryContainer,
    '--tertiary': r.tertiaryContainer,
    '--tertiary-foreground': r.onTertiaryContainer,
    '--muted': r.surfaceContainerHigh,
    '--muted-foreground': r.onSurfaceVariant,
    '--accent': r.secondaryContainer,
    '--accent-foreground': r.onSecondaryContainer,
    '--destructive': r.error,
    '--border': r.outlineVariant,
    '--input': r.outlineVariant,
    '--ring': r.primary,
    '--sidebar': r.surfaceContainerLow,

    // --- extended tokens ---
    '--card': r.surfaceContainerLowest,
    '--card-foreground': r.onSurface,
    '--chart-1': r.primary,
    '--chart-2': r.secondary,
    '--chart-3': r.tertiary,
    '--chart-4': r.primaryContainer,
    '--chart-5': r.tertiaryContainer,
    '--content-area': r.background,
    '--sidebar-foreground': r.onSurface,
    '--sidebar-primary': r.primary,
    '--sidebar-primary-foreground': r.onPrimary,
    '--sidebar-accent': r.secondaryContainer,
    '--sidebar-accent-foreground': r.onSecondaryContainer,
    '--sidebar-border': r.outlineVariant,
    '--sidebar-ring': r.primary,
  };
}

/** Options for deriving scope vars directly from a seed colour. */
export interface SeedScopeOptions {
  /** The seed colour, `#rrggbb`. */
  seed: string;
  mode: 'light' | 'dark';
  /**
   * The tonal scheme variant. Defaults to `'vivid'` — the same variant every
   * named Bloom preset uses, so a preset's seed reproduces that preset exactly
   * (and an artwork-extracted seed gets the same brand-vivid feel as the app).
   */
  variant?: SchemeVariant;
  /** −1 (low) … 0 (normal) … 1 (high). Defaults to 0. */
  contrastLevel?: number;
  /**
   * Optional explicit secondary-accent seed, `#rrggbb`. Pins the secondary palette
   * to this brand colour instead of the derived rotation (M3 role tones still
   * apply). Handy for an artwork-extracted theme: pass the second-ranked seed from
   * `seedsFromImagePixels` (`seeds[1]`) as a distinct secondary accent.
   */
  secondarySeed?: string;
  /**
   * Optional explicit tertiary-accent seed, `#rrggbb`. Same semantics; pass
   * `seedsFromImagePixels`' `seeds[2]` for a third artwork-derived accent.
   */
  tertiarySeed?: string;
}

/**
 * Build the CSS custom-property map for an ARBITRARY seed colour — the dynamic
 * (non-preset) counterpart of `buildScopeVars`. Feeds the seed through the
 * colour engine's `generateRoleColors` and assigns the roles to Bloom's
 * canonical token names, then adds the Tailwind v4 `--color-x` aliases (required
 * on web so scoped utilities resolve against the subtree instead of the document
 * root).
 *
 * Scope the returned record onto an element (web: inline `style`; native:
 * NativeWind `VariableContextProvider`) to tint just that subtree — e.g. the
 * ambient region behind album/artist artwork — without re-theming the whole app.
 */
export function buildSeedScopeVars(options: SeedScopeOptions): Record<string, string> {
  const roles = generateRoleColors({
    seed: options.seed,
    variant: options.variant ?? 'vivid',
    isDark: options.mode === 'dark',
    contrastLevel: options.contrastLevel ?? 0,
    secondarySeed: options.secondarySeed,
    tertiarySeed: options.tertiarySeed,
  });
  const tokens: Record<string, string> = {
    ...roleColorsToPresetTokens(roles),
    ...buildPolicyTokens(options.seed, options.mode === 'dark', roles, {
      secondary: options.secondarySeed,
      tertiary: options.tertiarySeed,
    }),
  };
  const vars: Record<string, string> = { ...tokens };

  // Policy tokens live outside CANONICAL_TOKENS, so alias every token present.
  for (const [key, value] of Object.entries(tokens)) {
    vars[`--color-${key.slice(2)}`] = value;
  }

  for (const token of CANONICAL_TOKENS) {
    const value = tokens[`--${token}`];
    if (value !== undefined) {
      vars[`--color-${token}`] = value;
    }
  }

  return vars;
}
