import { createContext } from 'react';

/** Native workspace header clearance for panel content that scrolls under it. */
export const WorkspaceHeaderInsetContext = createContext<{
  scrollInset: number;
  viewportInset: number;
} | null>(null);
