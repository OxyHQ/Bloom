import React, { useState, type PropsWithChildren } from 'react';
import { createEdgeStore } from '../layout/edge-store';
import { PageFooterContext } from './context';

/** Scope a page's footer measurement to its sibling scroller. Adds no layout. */
export function PageFooterProvider({ children }: PropsWithChildren) {
  const [store] = useState(createEdgeStore);
  return <PageFooterContext.Provider value={store}>{children}</PageFooterContext.Provider>;
}
