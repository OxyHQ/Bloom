import { resolveAccentColors, type AccentColors, type AccentTone } from '../theme/accent-colors';
import type { ThemeColors } from '../theme/types';
import type { BloomAppearance, BloomTone } from './types';

const PALETTE: Record<BloomTone, AccentTone> = {
  neutral: 'default',
  accent: 'primary',
  vivid: 'vivid',
  support: 'secondary',
  action: 'tertiary',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
};

/** Every Bloom tone as itself, and every accent tone as the Bloom tone `PALETTE` maps onto it. */
const BLOOM_TONE = Object.fromEntries([
  ...Object.keys(PALETTE).map((tone) => [tone, tone]),
  ...Object.entries(PALETTE).map(([tone, accent]) => [accent, tone]),
]) as Record<AccentTone | BloomTone, BloomTone>;

/**
 * The Bloom tone an accent tone or a Bloom tone paints in: `PALETTE` read
 * backwards, so every `AccentTone` a chip or badge takes (`secondary` and
 * `tertiary` included) reaches the palette `resolveBloomColors` reads.
 */
export function bloomToneOf(tone: AccentTone | BloomTone): BloomTone {
  return BLOOM_TONE[tone];
}

/** Uses paired semantic colors; never manufactures alpha from a token. */
export function resolveBloomColors(
  colors: ThemeColors,
  tone: BloomTone,
  appearance: BloomAppearance,
): AccentColors {
  const fill = appearance === 'outline' || appearance === 'plain' ? 'outlined' : appearance;
  const resolved = resolveAccentColors(colors, PALETTE[tone], fill);
  return appearance === 'plain' ? { ...resolved, border: 'transparent' } : resolved;
}
