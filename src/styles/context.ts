import { createContext, useContext } from 'react';

/** Inline SSR CSS is explicit because the host owns its Content Security Policy. */
export type ServerStylePolicy = 'inline' | { nonce: string };
export const ServerStyleContext = createContext<ServerStylePolicy | undefined>(undefined);
export const useServerStylePolicy = () => useContext(ServerStyleContext);
