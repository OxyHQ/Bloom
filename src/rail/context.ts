import { createContext } from 'react';

/** The compositor knows whether its navigation slot scrolls with a document. */
export const RailHostContext = createContext<'document' | 'bounded' | null>(null);
