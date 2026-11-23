import type { ThemeColors } from '@oxy.so/bloom/theme';

import { COLORS, GLASS, GLASS_OPACITY } from '../generated/spec.generated';
import type { GlassValue } from '../glass';
import type { RoleRef } from '../style';
import type { ColorName } from '../tokens';
import type { LensTriggerConfig } from './lens';

/**
 * How much of a solid control's fill tints the glass it is on: Bloom's own lens
 * control (`LensButtonHost`) tints with a solid fill at 0.96, Apple's
 * `glassProminent`. The engine's own for a control is 0, which left a FAB and a
 * `glassProminent` button untinted on Android while iOS and the web drew them
 * filled.
 */
const CONTROL_FILL_OPACITY = 0.96;

/**
 * A glass value as the lens engine draws it: the material's frost (its blur
 * radius in dp at rest, the spec's `lensBlur`), and the
 * tint (a variant's `fill` while it holds, else the glass's own, else
 * `fallback`, the fill of the control it is under) at the named transparency,
 * at the solid control's own for its fill, or at the engine's own when none is
 * named.
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
      tintColor: colors[COLORS[fill.role].paint],
      tintOpacity: fill.opacity,
    };
  const role = glass.tintColor ?? fallback;
  const opacity = glass.tintOpacity ?? (glass.tintColor ? material.tintOpacity : null);
  return {
    blur: material.lensBlur,
    tintColor: role === undefined ? undefined : colors[COLORS[role].paint],
    tintOpacity:
      opacity !== null && opacity !== undefined
        ? GLASS_OPACITY[opacity]
        : glass.tintColor === undefined && fallback !== undefined
          ? CONTROL_FILL_OPACITY
          : undefined,
  };
}
