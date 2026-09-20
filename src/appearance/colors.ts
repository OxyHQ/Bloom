import { resolveAccentColors, type AccentColors, type AccentTone } from '../theme/accent-colors';
import type { ThemeColors } from '../theme/types';
import type { BloomAppearance, BloomTone } from './types';

const PALETTE: Record<BloomTone, AccentTone> = {
  neutral: 'default', accent: 'primary', support: 'secondary', action: 'tertiary', success: 'success', warning: 'warning', danger: 'error', info: 'info',
};

/** Uses paired semantic colors; never manufactures alpha from a token. */
export function resolveBloomColors(colors: ThemeColors, tone: BloomTone, appearance: BloomAppearance): AccentColors {
  const fill = appearance === 'outline' || appearance === 'plain' ? 'outlined' : appearance;
  const resolved = resolveAccentColors(colors, PALETTE[tone], fill);
  return appearance === 'plain' ? { ...resolved, border: 'transparent' } : resolved;
}
