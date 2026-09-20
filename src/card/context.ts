import { createContext } from 'react';

/** Paired foreground for semantic card fills; neutral cards retain standard text roles. */
export const CardForegroundContext = createContext<string | undefined>(undefined);
