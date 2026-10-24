import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLatestClaim, type Claim } from '../hooks/use-latest-claim';

interface ScreenActionClaim {
  /** Whether the screen in front shows a primary action of its own. */
  claimed: boolean;
  claim: Claim<true> | null;
}

const ScreenActionContext = createContext<ScreenActionClaim>({ claimed: false, claim: null });

/**
 * Whose screen this is. The shell renders its own floating action through its
 * own `Screen` on wide layouts; that screen must not claim against itself, or the
 * action would hide, release and return without end. Every Screen marks what it
 * renders as a route's.
 */
export const ScreenActionOwnerContext = createContext<'shell' | 'route'>('route');

/**
 * One primary action on screen at a time. A screen with its own
 * (`Screen primaryAction`, a "new folder" on a saved-posts page) claims the spot
 * while it is the active one, and the shell's own (the compose FAB) steps aside
 * until it leaves — two floating buttons stacked in one corner is never the
 * design. The shell's sidebar compose row is not a floating action and stays.
 */
export function ScreenActionScope({ children }: { children: ReactNode }) {
  const [claimed, claim] = useLatestClaim<true>();
  const value = useMemo(() => ({ claimed: claimed === true, claim }), [claimed, claim]);
  return <ScreenActionContext.Provider value={value}>{children}</ScreenActionContext.Provider>;
}

/** Whether the shell's floating action should step aside for the screen's. */
export function useScreenActionClaimed(): boolean {
  return useContext(ScreenActionContext).claimed;
}

/** A route's screen claims the action spot while it is active and shows its own. */
export function useScreenActionClaim(active: boolean): void {
  const { claim } = useContext(ScreenActionContext);
  const route = useContext(ScreenActionOwnerContext) === 'route';
  useEffect(() => (active && route && claim ? claim(true) : undefined), [active, route, claim]);
}
