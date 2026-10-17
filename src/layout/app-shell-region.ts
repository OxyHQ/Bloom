/**
 * The box an `AppShell` with `panels` leaves for its routes, as its panels and
 * pages need to know it.
 *
 * The shell owns the frame — the gutter on all four sides, whether panels are
 * framed or full-bleed, the viewport geometry, the bottom-bar reserve — and the
 * panels (`AppShellPanel`, `AppShellPanels`) and `Screen` only READ it. One
 * context, flowing down; nothing below ever tells the shell anything, which is
 * why a route can render one panel or several without the shell re-rendering
 * around it.
 *
 * In `layout/` rather than `app-shell/` because `Screen` reads it, and the
 * shell already imports `Screen`.
 */
import { createContext, useContext } from 'react';

export interface AppShellRegionValue {
  /**
   * `document`: the region grows the web document (a sole panel grows with its
   * content). `container`: it grows inside the shell's own ScrollView.
   * `bounded`: one screen (`fixed`, and `page` on native) — panels fill it and
   * their content owns its scrolling.
   */
  flow: 'document' | 'container' | 'bounded';
  /** Panels are rounded with the gutter around them, or full-bleed with none. */
  framed: boolean;
  /** The gap between two framed panels — the same number as the outer gutter. */
  gutter: number;
  /**
   * What a viewport-tall box in this region subtracts: the distance from the
   * viewport's top to the region's top (gutter, top bar) and from its bottom.
   */
  viewportInset: { top: number; bottom: number };
  /** Bottom chrome a growing (document / container) panel reserves under its content. */
  bottomReserve: number;
  /** The reveal drawer is open: panels veil themselves and drop their edge. */
  revealed: boolean;
  /** The page background the panels' web mask paints. */
  maskColor: string;
}

export const AppShellRegionContext = createContext<AppShellRegionValue | null>(null);
AppShellRegionContext.displayName = 'BloomAppShellRegionContext';

/** The enclosing panel shell's region, or `null` outside one. */
export function useAppShellRegion(): AppShellRegionValue | null {
  return useContext(AppShellRegionContext);
}
