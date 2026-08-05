import { generateRoleColors, type RoleColors, type SchemeVariant } from '../color-engine';
import { buildPolicyTokens, isColourlessSeed } from '../color-policy';
import { BORDER_ROLES, FILL_ROLES, TEXT_ROLES } from '../../design-tokens/color-roles';

/**
 * Every alias `theme.css` declares at `:root` as a reference to a canonical
 * token, keyed by the alias name. `--color-divider` is one of these and does not
 * come from the role maps, so it is named here.
 *
 * An alias declared at the document root substitutes THERE, so a subtree that
 * overrides `--foreground` cannot move a `--color-text: var(--foreground)` the
 * root already computed — the subtree keeps painting the app-wide palette while
 * every canonical token around it says otherwise. Re-declaring each alias inside
 * the scope, against the scope's own values, is what closes that.
 *
 * An alias whose value is a literal (`--color-destructive-foreground: #ffffff`)
 * is unaffected and deliberately absent.
 */
const SCOPED_ALIASES: Readonly<Record<string, string>> = {
  ...FILL_ROLES,
  ...TEXT_ROLES,
  ...BORDER_ROLES,
  divider: 'var(--border)',
};

/**
 * Give a resolved token map the `--color-x` alias layer, so utilities resolve
 * against the scope instead of the document root.
 *
 * Shared by both scope builders — the preset path (`buildScopeVars`) and the
 * seed path (`buildSeedScopeVars`) — because a gap here is invisible until a
 * scoped page paints the wrong colour in one mode only.
 */
export function withScopeAliases(tokens: Record<string, string>): Record<string, string> {
  const vars: Record<string, string> = { ...tokens };

  // Policy tokens live outside the canonical set, so alias every token present.
  for (const [key, value] of Object.entries(tokens)) {
    vars[`--color-${key.slice(2)}`] = value;
  }

  for (const [alias, reference] of Object.entries(SCOPED_ALIASES)) {
    const canonical = /^var\(--(.+)\)$/.exec(reference)?.[1];
    const resolved = canonical === undefined ? undefined : tokens[`--${canonical}`];
    if (resolved !== undefined) vars[`--color-${alias}`] = resolved;
  }

  return vars;
}

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
  return withScopeAliases(tokens);
}
