import { processColor } from 'react-native';
import { CANONICAL_TOKENS, type CanonicalToken } from '../token-registry';
import { chartColorsFromTokens } from '../chart-colors';
import type { ThemeColors } from '../types';
import type { ScopePalette } from './context';
import { withScopeAliases } from './seed-scope';
import type { BloomColorScopeTokens } from './types';

/** All JS aliases of an exact canonical override share the same supplied value. */
const COLOR_FIELDS = {
  background: ['background', 'primaryDark'],
  foreground: ['text'],
  surface: ['backgroundSecondary', 'primaryLight'],
  popover: ['backgroundTertiary'],
  'muted-foreground': ['textSecondary', 'textTertiary', 'icon'],
  border: ['border'],
  input: ['borderLight'],
  primary: ['primary', 'tint', 'iconActive'],
  'primary-foreground': ['primaryForeground'],
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
} satisfies Partial<Record<CanonicalToken, readonly (keyof ThemeColors)[]>>;

/** Preserve unspecified roles; rebuild the full CSS alias layer after exact overrides. */
export function applyScopeTokens(
  base: ScopePalette,
  overrides?: BloomColorScopeTokens,
): ScopePalette {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const vars = { ...base.vars };
  const colors = { ...base.theme.colors };
  let changedCharts = false;
  for (const [name, value] of Object.entries(overrides)) {
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
    vars: withScopeAliases(
      Object.fromEntries(Object.entries(vars).filter(([name]) => !name.startsWith('--color-'))),
    ),
    theme: {
      ...base.theme,
      colors,
      ...(changedCharts ? { chartColors: chartColorsFromTokens(vars) } : {}),
    },
  };
}
