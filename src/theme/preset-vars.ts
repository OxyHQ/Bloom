import { APP_COLOR_PRESETS, type AppColorName, type PresetTokens } from './color-presets';
import { argbFromHex, generateRoleColors, type RoleColors } from './color-engine';
import { buildPolicyTokens, policyBackground } from './color-policy';

/**
 * Optional explicit accent-colour overrides (`#rrggbb`) that PIN the secondary
 * and/or tertiary palette app-wide, regardless of the active preset's own seed.
 * Threaded from `BloomThemeProvider`'s `secondaryColor` / `tertiaryColor` props
 * down through the whole token pipeline. When both are omitted, the preset's own
 * (usually derived) accents are used — output is unchanged.
 */
export interface ExplicitAccents {
  secondaryHex?: string;
  tertiaryHex?: string;
}
/**
 * Map a preset (seed + variant) and mode onto Bloom's canonical CSS-var token
 * set, sourcing EVERY colour from the colour engine's Material-3 role output.
 *
 * This replaces the old hand-authored HSL triples: the engine derives a full,
 * self-consistent, WCAG-legible role set from the seed for light and dark, and
 * this function assigns those roles to Bloom's token names. The token NAMES are
 * unchanged (see `CANONICAL_TOKENS` in `token-registry.ts`) — only the SOURCE of
 * each colour moved to the engine, so every downstream consumer keeps working.
 *
 * Values are full `rgb(r g b)` strings straight from the engine. `getResolvedTokens`
 * passes non-HSL-triple values through untouched, so these flow through the whole
 * pipeline (web document writes, native `rootVariables`, JS `ThemeColors`) unchanged.
 *
 * This is the single source of truth for extended theming vars — consumer apps
 * must not redefine these per-app.
 *
 * Every call returns a fresh object the caller may keep or change; the solve
 * behind it runs once per preset, mode and accent pair (see `PRESET_VARS_CACHE`).
 */
export function getPresetVars(
  colorName: AppColorName,
  mode: 'light' | 'dark',
  accents?: ExplicitAccents,
): PresetTokens {
  const key = JSON.stringify([
    colorName,
    mode,
    accents?.secondaryHex ?? null,
    accents?.tertiaryHex ?? null,
  ]);
  let tokens = PRESET_VARS_CACHE.get(key);
  if (tokens === undefined) {
    tokens = solvePresetVars(colorName, mode, accents);
    PRESET_VARS_CACHE.set(key, tokens);
    if (PRESET_VARS_CACHE.size > PRESET_VARS_CACHE_LIMIT) {
      PRESET_VARS_CACHE.delete(PRESET_VARS_CACHE.keys().next().value as string);
    }
  }
  return { ...tokens };
}

/**
 * Resolved token sets, by preset, mode and pinned accents. `generateRoleColors`
 * already caches the M3 roles, but the policy layer on top (`buildPolicyTokens`:
 * fill tones searched for a legible label, the accent, chart and status
 * families) is most of the cost — ~12 ms per set on a desktop CPU, ~50 ms on a
 * 4x-throttled mobile profile — and one theme asks for the same set more than
 * once: `BloomThemeProvider` resolves it for the scope vars and again for the
 * theme object on the same render, on every app's cold start. The inputs are
 * all static (presets are a fixed registry), so the result is too; the bound
 * only matters for apps that pin arbitrary accents.
 */
const PRESET_VARS_CACHE_LIMIT = 64;
const PRESET_VARS_CACHE = new Map<string, PresetTokens>();

function solvePresetVars(
  colorName: AppColorName,
  mode: 'light' | 'dark',
  accents?: ExplicitAccents,
): PresetTokens {
  const preset = APP_COLOR_PRESETS[colorName];
  const r: RoleColors = generateRoleColors({
    seed: preset.hex,
    variant: preset.variant,
    isDark: mode === 'dark',
    // Pinned accents: an explicit app-wide override (from the provider) wins,
    // else the preset's own declared accent, else undefined → derived rotation.
    // The built-in presets declare none, so with no override their generated
    // tokens stay byte-identical.
    secondarySeed: accents?.secondaryHex ?? preset.secondaryHex,
    tertiarySeed: accents?.tertiaryHex ?? preset.tertiaryHex,
  });

  const base: PresetTokens = {
    // --- base shadcn palette ---
    '--background': r.background,
    '--foreground': r.onBackground,
    '--surface': r.surfaceContainerLow,
    '--surface-foreground': r.onSurface,
    '--popover': r.surfaceContainer,
    '--popover-foreground': r.onSurface,
    '--primary': r.primary,
    '--primary-foreground': r.onPrimary,
    // shadcn `secondary`/`tertiary` are LOW-EMPHASIS TONAL SURFACES (the soft
    // filled look of a shadcn secondary button — `bg-secondary` fills inputs,
    // cards, chips, tabs), NOT the raw M3 accent. So they map to the M3 *container*
    // roles (soft, brand-tinted, legible), with the on-container as the foreground.
    // Mapping them to the raw accent (a dark tone-40 colour) turns every
    // `bg-secondary` surface into a dark slab — the exact bug this fixes. The raw
    // vivid accents remain available via the chart ramp (`--chart-2`/`--chart-3`).
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
    // The FIX: `card` is the LIGHTEST surface (lighter than `background` in
    // light, correctly darker than `background` in dark) via `surfaceContainerLowest`.
    '--card': r.surfaceContainerLowest,
    '--card-foreground': r.onSurface,
    // Chart series: a sensible 5-step ramp across the accent trio + containers.
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

  return {
    ...base,
    ...buildPolicyTokens(preset.hex, mode === 'dark', r, {
      secondary: accents?.secondaryHex ?? preset.secondaryHex,
      tertiary: accents?.tertiaryHex ?? preset.tertiaryHex,
    }),
    ...authoredTokens(preset.tokens?.[mode], accents),
  };
}

/**
 * A preset's page background (`--background`) for one mode — exactly what
 * `getPresetVars(colorName, mode)['--background']` returns, for one tone solve
 * instead of the whole set (~50 ms on a 4x-throttled mobile profile, before the
 * first paint). For UI drawn before the theme resolves, such as a boot splash,
 * which needs this one colour and often for the mode the device is NOT in. The
 * page colour does not depend on pinned accents, so it takes none.
 */
export function getPresetBackground(colorName: AppColorName, mode: 'light' | 'dark'): string {
  const preset = APP_COLOR_PRESETS[colorName];
  const authored = preset.tokens?.[mode]?.['--background'];
  if (authored !== undefined) return rgbFromHex(authored);
  return policyBackground(preset.hex, mode === 'dark');
}

/**
 * A preset's hand-authored values, as the same `rgb(r g b)` form the engine
 * emits. An app-wide accent override still wins over the authored accent it
 * replaces, so the `secondary*`/`tertiary*` family is dropped when pinned.
 */
function authoredTokens(
  authored: PresetTokens | undefined,
  accents: ExplicitAccents | undefined,
): PresetTokens {
  if (authored === undefined) return {};
  const out: PresetTokens = {};
  for (const [token, hex] of Object.entries(authored)) {
    if (accents?.secondaryHex !== undefined && token.startsWith('--secondary')) continue;
    if (accents?.tertiaryHex !== undefined && token.startsWith('--tertiary')) continue;
    out[token] = rgbFromHex(hex);
  }
  return out;
}

function rgbFromHex(hex: string): string {
  const argb = argbFromHex(hex);
  return `rgb(${(argb >> 16) & 255} ${(argb >> 8) & 255} ${argb & 255})`;
}
