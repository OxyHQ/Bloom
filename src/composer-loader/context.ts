import { createContext, useContext } from 'react';

/** Paint ownership only; frame clocks never flow through React context. */
export const ComposerLoaderPaintContext = createContext<boolean | undefined>(undefined);

export function useComposerLoaderPaint() {
  return useContext(ComposerLoaderPaintContext);
}
