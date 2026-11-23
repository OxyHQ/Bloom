import type { ThemeColors } from '@oxy.so/bloom/theme';

import { GLASS, GLASS_OPACITY } from '../generated/spec.generated';
import { paletteColor } from '../paint';
import type { GlassValue } from '../glass';
import type { RoleRef } from '../style';
import type { ColorName } from '../tokens';
import type { LensTriggerConfig } from './lens';

/**
 * A glass value as the lens engine draws it: the material's frost, and the
 * tint (a variant's `fill` while it holds, else the glass's own, else
 * `fallback`, the fill of the control it is under) at the named transparency,
 * or at the engine's own when none is named.
 */
export function glassTriggerConfig(
  glass: GlassValue,
  fallback: ColorName | undefined,
  colors: ThemeColors,
  fill?: RoleRef,
): LensTriggerConfig {
  const material = GLASS[glass.material];
  if (fill !== undefined)
    return {
      blur: material.lensBlur,
      tintColor: paletteColor(colors, fill.role),
      tintOpacity: fill.opacity,
    };
  const role = glass.tintColor ?? fallback;
  const opacity = glass.tintOpacity ?? (glass.tintColor ? material.tintOpacity : null);
  return {
    blur: material.lensBlur,
    tintColor: role === undefined ? undefined : paletteColor(colors, role),
    tintOpacity: opacity === null || opacity === undefined ? undefined : GLASS_OPACITY[opacity],
  };
}
