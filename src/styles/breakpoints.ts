/**
 * Bloom's responsive breakpoint min-widths (px), matching the Tailwind /
 * NativeWind defaults used across the design system.
 *
 * This is the SINGLE SOURCE OF TRUTH for breakpoint values. Anything that
 * branches on viewport width — the `<Dialog>` responsive `placement` resolver,
 * the `useGutters` hook — reads from here rather than hardcoding its own
 * numbers, so a change here propagates everywhere.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** A named responsive breakpoint tier. */
export type Breakpoint = keyof typeof BREAKPOINTS;
