import { processColor } from 'react-native';
import { CANONICAL_TOKENS, type CanonicalToken } from '../token-registry';
import { chartColorsFromTokens } from '../chart-colors';
import type { ThemeColors } from '../types';
import type { ScopePalette } from './context';
import { withScopeAliases } from './seed-scope';
import type { BloomColorScopeTokens } from './types';

/**
 * The `theme.colors` fields each canonical token feeds. The first is the
 * token's own field, the one `buildTheme` reads from it (`--muted-foreground`
 * is `textSecondary`); the rest are aliases an exact override also sets.
 */
export const COLOR_FIELDS = {
  background: ['background', 'primaryDark'],
  foreground: ['text'],
  surface: ['backgroundSecondary', 'primaryLight'],
  popover: ['backgroundTertiary'],
  'muted-foreground': ['textSecondary', 'icon'],
  'faint-foreground': ['textTertiary'],
  border: ['border'],
  input: ['borderLight'],
  primary: ['primary', 'tint', 'iconActive'],
  'primary-foreground': ['primaryForeground'],
  vivid: ['vivid'],
  'vivid-foreground': ['vividForeground'],
  'primary-subtle': ['primarySubtle'],
  'primary-text': ['primarySubtleForeground'],
  secondary: ['secondary'],
  'secondary-foreground': ['secondaryForeground'],
  'secondary-subtle': ['secondarySubtle'],
  'secondary-text': ['secondarySubtleForeground'],
  tertiary: ['tertiary'],
  'tertiary-foreground': ['tertiaryForeground'],
  'tertiary-subtle': ['tertiarySubtle'],
  'tertiary-text': ['tertiarySubtleForeground'],
  success: ['success'],
  'success-foreground': ['successForeground'],
  'success-subtle': ['successSubtle'],
  'success-text': ['successSubtleForeground'],
  error: ['error', 'negative'],
  'error-foreground': ['errorForeground', 'negativeForeground'],
  'error-subtle': ['errorSubtle', 'negativeSubtle'],
  'error-text': ['errorSubtleForeground', 'negativeSubtleForeground'],
  warning: ['warning'],
  'warning-foreground': ['warningForeground'],
  'warning-subtle': ['warningSubtle'],
  'warning-text': ['warningSubtleForeground'],
  info: ['info'],
  'info-foreground': ['infoForeground'],
  'info-subtle': ['infoSubtle'],
  'info-text': ['infoSubtleForeground'],
  muted: ['contrast50'],
  card: ['card'],
  destructive: ['destructive'],
  'surface-foreground': ['surfaceForeground'],
  accent: ['accent'],
} satisfies Partial<Record<CanonicalToken, readonly [keyof ThemeColors, ...(keyof ThemeColors)[]]>>;

/** A token record without its `--color-*` aliases, rebuilt after its tokens change. */
function withoutAliases(vars: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(vars).filter(([name]) => !name.startsWith('--color-')));
}

/**
 * A token record whose tokens take the colours `colors` holds, each the colour
 * of the token's own field (`COLOR_FIELDS`), with the aliases rebuilt. The
 * provider's record in an adaptive theme, so `useColorTokens()` paints the
 * platform's colours exactly where `useTheme().colors` holds them.
 */
export function withFieldColors(
  vars: Record<string, string>,
  colors: Partial<ThemeColors>,
): Record<string, string> {
  const next = withoutAliases(vars);
  for (const [name, [field]] of Object.entries(COLOR_FIELDS)) {
    const value = colors[field];
    if (value !== undefined) next[`--${name}`] = value;
  }
  return withScopeAliases(next);
}

/**
 * The tertiary text follows an exact `muted-foreground`, unless the scope names
 * `faint-foreground` too. Every preset holds the two at one colour (the one
 * legible quiet text), so a scope that sets its quiet text on its own fill
 * keeps its tertiary text legible there, as it did before the token existed,
 * instead of painting the preset's grey on a fill it was never measured on.
 */
function withFaintText(overrides: BloomColorScopeTokens): BloomColorScopeTokens {
  const muted = overrides['muted-foreground'];
  if (muted === undefined || overrides['faint-foreground'] !== undefined) return overrides;
  return { ...overrides, 'faint-foreground': muted };
}

/** Preserve unspecified roles; rebuild the full CSS alias layer after exact overrides. */
export function applyScopeTokens(
  base: ScopePalette,
  overrides?: BloomColorScopeTokens,
): ScopePalette {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const vars = { ...base.vars };
  const colors = { ...base.theme.colors };
  let changedCharts = false;
  for (const [name, value] of Object.entries(withFaintText(overrides))) {
    if (value === undefined) continue;
    if (!(CANONICAL_TOKENS as readonly string[]).includes(name)) {
      throw new Error(`BloomColorScope: unknown canonical token "${name}".`);
    }
    if (typeof value !== 'string' || !value.trim() || processColor(value) == null) {
      throw new Error(`BloomColorScope: "${name}" requires a resolved color value.`);
    }
    vars[`--${name}`] = value;
    const fields = COLOR_FIELDS[name as keyof typeof COLOR_FIELDS];
    for (const field of fields ?? []) colors[field] = value;
    if (name.startsWith('chart-')) changedCharts = true;
  }
  return {
    vars: withScopeAliases(withoutAliases(vars)),
    theme: {
      ...base.theme,
      colors,
      ...(changedCharts ? { chartColors: chartColorsFromTokens(vars) } : {}),
    },
  };
}
