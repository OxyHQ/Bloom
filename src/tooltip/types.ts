import type { ReactNode } from 'react';

export interface TooltipProps {
  children: ReactNode;
  /** A preference: a bubble near a screen edge is nudged back into view. */
  position?: 'top' | 'bottom';
  /** The request to show. What sets it (hover, focus, long-press) is the call site's choice. */
  visible: boolean;
  /**
   * Milliseconds `visible` must stay true before the bubble shows, so a pointer that only passes
   * over the trigger opens nothing. Closing is immediate. Default `0`.
   */
  delay?: number;
  onVisibleChange: (visible: boolean) => void;
}
