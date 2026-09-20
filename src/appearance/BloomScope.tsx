import React, { useContext, useMemo } from 'react';
import { BloomAppearanceContext } from './context';
import type { BloomScopeProps } from './types';

/** A visual environment only: never inherits actions, selection or disabled state. */
export function BloomScope({ children, size, tone }: BloomScopeProps) {
  const parent = useContext(BloomAppearanceContext);
  const value = useMemo(() => ({ size: size ?? parent.size, tone: tone ?? parent.tone }), [size, tone, parent]);
  return <BloomAppearanceContext.Provider value={value}>{children}</BloomAppearanceContext.Provider>;
}
