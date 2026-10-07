import React, { useContext, useMemo } from 'react';
import { BloomAppearanceContext } from './context';
import type { BloomScopeProps } from './types';

/** A visual environment only: never inherits actions, selection or disabled state. */
export function BloomScope({ children, size, tone, panelRadius }: BloomScopeProps) {
  if (panelRadius !== undefined && (!Number.isFinite(panelRadius) || panelRadius < 0)) {
    throw new RangeError('panelRadius must be a finite, non-negative number.');
  }
  const parent = useContext(BloomAppearanceContext);
  const value = useMemo(() => ({ size: size ?? parent.size, tone: tone ?? parent.tone, panelRadius: panelRadius ?? parent.panelRadius }), [size, tone, panelRadius, parent]);
  return <BloomAppearanceContext.Provider value={value}>{children}</BloomAppearanceContext.Provider>;
}
