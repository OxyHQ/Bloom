import React, { memo, useMemo } from 'react';

import { ControlSurfaceProvider, useControlSurface } from './context';
import type { ControlSurfaceProps } from './types';

/**
 * Declare the presentation the controls inside should default to.
 *
 * Renders nothing of its own — no view, no layout node — so it can be dropped
 * anywhere without moving anything. Bloom's own containers (`ButtonGroup`'s
 * glass variant, `PageHeader`'s islands) mount it for you; this is the explicit
 * entry point for an app that wants the same effect around its own controls.
 *
 * ```tsx
 * <ControlSurface material="glass">
 *   <ButtonGroup accessibilityLabel="Playback">…</ButtonGroup>
 * </ControlSurface>
 * ```
 *
 * A field left `undefined` INHERITS rather than resetting, so a nested
 * `<ControlSurface density="sm">` inside a glass island stays glass. The
 * full precedence rule is in `control-surface/context.ts`.
 */
const ControlSurfaceComponent: React.FC<ControlSurfaceProps> = ({
  material,
  density,
  children,
}) => {
  const inherited = useControlSurface();
  const value = useMemo(
    () => ({
      material: material ?? inherited?.material ?? 'solid',
      density: density ?? inherited?.density ?? 'md',
    }),
    [material, density, inherited?.material, inherited?.density],
  );
  return <ControlSurfaceProvider value={value}>{children}</ControlSurfaceProvider>;
};

export const ControlSurface = memo(ControlSurfaceComponent);
ControlSurface.displayName = 'ControlSurface';
