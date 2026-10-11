import React, { useContext, useMemo } from 'react';
import { ViewportContext, type ViewportScope } from './context';
import type { ViewportProviderProps } from './types';

/** Scope native clipping geometry without inserting a layout wrapper. */
export function ViewportProvider({ children, root = false }: ViewportProviderProps) {
  const inherited = useContext(ViewportContext);
  const parent = root ? null : inherited;
  const scope = useMemo<ViewportScope>(
    () => ({ parent, getNode: null, listeners: new Set() }),
    [parent],
  );
  return <ViewportContext.Provider value={scope}>{children}</ViewportContext.Provider>;
}
