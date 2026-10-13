import { createContext, useContext } from 'react';

import type { MarkdownSize } from './types';

export interface MarkdownContextValue {
  size: MarkdownSize;
  onLinkPress?: (url: string) => void;
}

const MarkdownContext = createContext<MarkdownContextValue>({ size: 'md' });

export const MarkdownProvider = MarkdownContext.Provider;

export function useMarkdownContext(): MarkdownContextValue {
  return useContext(MarkdownContext);
}
