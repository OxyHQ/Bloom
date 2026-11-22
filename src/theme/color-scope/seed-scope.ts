import { generateRoleColors, type RoleColors, type SchemeVariant } from '../color-engine';
import { buildPolicyTokens, isColourlessSeed } from '../color-policy';

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
 * canonical token names.
 *
 * A scope publishes the returned record (web: inline `style` on its element;
 * native: the scope context `useColorTokens` reads) to tint just that subtree — e.g. the
 * ambient region behind album/artist artwork — without re-theming the whole app.
 */
export function buildSeedScopeVars(options: SeedScopeOptions): Record<string, string> {
  const key = cacheKey(options);
  let tokens = CACHE.get(key);
  if (tokens !== undefined) {
    // Refresh recency: Map iterates in insertion order, so re-insert on hit.
    CACHE.delete(key);
  } else {
    tokens = solveSeedScopeVars(options);
  }
  CACHE.set(key, tokens);
  if (CACHE.size > CACHE_LIMIT) CACHE.delete(CACHE.keys().next().value as string);
  // A copy: callers have always received a map of their own.
  return { ...tokens };
}

/**
 * The policy tokens on top of the role colours (`buildPolicyTokens`, its accent
 * hues) are recomputed for every call, and every `BloomColorScope` with a seed
 * resolves its seed twice when it mounts (the theme object and the scope vars).
 * On the OxyOS host a launcher of scoped cards spent over a third of its opening
 * here, for the same few seeds. Results are pure functions of the options, so they
 * are kept, bounded as `generateRoleColors`' are.
 */
const CACHE_LIMIT = 128;
const CACHE = new Map<string, Readonly<Record<string, string>>>();

function cacheKey(o: SeedScopeOptions): string {
  return JSON.stringify([
    o.seed,
    o.mode,
    o.variant ?? null,
    o.contrastLevel ?? null,
    o.secondarySeed ?? null,
    o.tertiarySeed ?? null,
  ]);
}

function solveSeedScopeVars(options: SeedScopeOptions): Record<string, string> {
  const roles = generateRoleColors({
    seed: options.seed,
    // A seed with no chroma has no colour for a chromatic variant to work with,
    // so it takes the greyscale scheme unless the caller asked for something else.
    // This is what makes a grey picked in a colour wheel produce the SAME
    // black-and-white theme as the `mono` preset instead of a tinted near-grey.
    variant: options.variant ?? (isColourlessSeed(options.seed) ? 'monochrome' : 'vivid'),
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
  return tokens;
}
