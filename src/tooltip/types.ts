import type { ReactNode } from 'react';

export interface TooltipProps {
  children: ReactNode;
  /** A preference: a bubble near a screen edge is nudged back into view. */
  position?: 'top' | 'bottom';
  /** The request to show. What sets it (hover, focus, long-press) is the call site's choice. */
  visible: boolean;
  /**
   * Milliseconds `visible` must stay true before the bubble shows, so a pointer that only passes
   * over the trigger opens nothing. Closing is immediate. Default `0`; on a desktop platform
   * (`useDesktopPlatform()`) `DESKTOP_TOOLTIP_DELAY` (1 s), and at once while another tooltip
   * shows or just closed (`TOOLTIP_WARM_WINDOW`), so neighbours read in turn. A tooltip that must
   * show at once (a dock's names) passes `0`.
   */
  delay?: number;
  onVisibleChange: (visible: boolean) => void;
}
