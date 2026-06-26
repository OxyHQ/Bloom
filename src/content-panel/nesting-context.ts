import { createContext, useContext } from 'react';

/**
 * Tracks whether the current subtree is already inside a `ContentPanel`.
 *
 * Every `ContentPanel` variant (web + native) wraps its rendered tree in
 * `<ContentPanelNestingContext.Provider value={true}>`, so any DESCENDANT
 * `ContentPanel` reads `true` here and can reject the invalid nesting. Context
 * only flows downward, so side-by-side sibling panels each read the default
 * `false` at their own level — siblings are valid, only true parent→child
 * nesting trips the guard.
 */
export const ContentPanelNestingContext = createContext<boolean>(false);
ContentPanelNestingContext.displayName = 'BloomContentPanelNestingContext';

/**
 * Dev-only invariant: a `ContentPanel` must NEVER be rendered inside another
 * `ContentPanel`. Nesting two content surfaces is meaningless and breaks the
 * sticky / 100dvh framed frame. Call this unconditionally at the top of every
 * `ContentPanel` variant — before any early return — so the hook order stays
 * stable (rules of hooks).
 *
 * The throw is guarded by `process.env.NODE_ENV !== 'production'`, so bundlers
 * (Metro on RN, Vite/Rolldown on web) statically strip the check from
 * production builds for zero runtime overhead.
 */
export function useContentPanelNestingGuard(): void {
  const isNested = useContext(ContentPanelNestingContext);
  if (process.env.NODE_ENV !== 'production' && isNested) {
    throw new Error(
      'ContentPanel cannot be nested inside another ContentPanel. ' +
        'Render panels as siblings (e.g. side-by-side columns), not nested.',
    );
  }
}
