/**
 * The panel an anchored surface should stay inside, when its trigger lives in
 * one. Published by the app shell's panel host; read by `floating/FloatingPanel`
 * (web), which hands the measured box to `resolvePlacementBounds`.
 *
 * Carried by CONTEXT, not by a prop on each family: the five anchored families
 * (and a submenu portaled out of its parent) all render through the same
 * `FloatingPanel`, and React context crosses a portal. `null` means "no panel" —
 * the surface collides with the viewport, exactly as before.
 *
 * Internal, like `dropdown-placement`: deliberately not re-exported from
 * `overlay/index.ts`.
 */
import { createContext, useContext, type RefObject } from 'react';

export const PlacementBoundaryContext = createContext<RefObject<unknown> | null>(null);
PlacementBoundaryContext.displayName = 'BloomPlacementBoundaryContext';

/** The enclosing panel's node, or `null` outside a panel. */
export function usePlacementBoundary(): RefObject<unknown> | null {
  return useContext(PlacementBoundaryContext);
}
