import type { ThemeColors } from '@oxy.so/bloom/theme';

import { COLORS, GLASS, GLASS_OPACITY } from '../generated/spec.generated';
import type { GlassValue } from '../glass';
import type { ColorName } from '../tokens';
import type { LensNativeTriggerConfig } from './lens';

/**
 * A glass value as the lens engine draws it: the material's frost, and the
 * tint (the glass's own, else `fallback`, the fill of the control it is under)
 * at the named transparency, or at the engine's own when none is named.
 */
export function glassTriggerConfig(
  glass: GlassValue,
  fallback: ColorName | undefined,
  colors: ThemeColors,
): LensNativeTriggerConfig {
  const material = GLASS[glass.material];
  const role = glass.tintColor ?? fallback;
  const opacity = glass.tintOpacity ?? (glass.tintColor ? material.tintOpacity : null);
  return {
    blur: material.lensBlur,
    tintColor: role === undefined ? undefined : colors[COLORS[role].paint],
    tintOpacity: opacity === null || opacity === undefined ? undefined : GLASS_OPACITY[opacity],
  };
}
