import { createContext, useContext } from 'react';

import type { MarkdownProps, MarkdownSize } from './types';

export interface MarkdownContextValue {
  size: MarkdownSize;
  onLinkPress?: (url: string) => void;
  renderCodeBlock?: MarkdownProps['renderCodeBlock'];
}

const MarkdownContext = createContext<MarkdownContextValue>({ size: 'md' });

export const MarkdownProvider = MarkdownContext.Provider;

export function useMarkdownContext(): MarkdownContextValue {
  return useContext(MarkdownContext);
}
