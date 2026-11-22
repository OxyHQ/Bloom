import { createContext, useContext } from 'react';

import { useIsomorphicLayoutEffect } from '../theme/use-isomorphic-layout-effect';

/**
 * A pager page's hold on its neighbours. The pager mounts the neighbours of the page it rests on
 * once that page has painted its first content: a page that renders its content later (after a
 * fetch, a cache read) holds them until then, so they do not compete with its first paint.
 */
export interface TabPageContentHold {
  hold: () => void;
  release: () => void;
}

export const TabPageContentContext = createContext<TabPageContentHold | null>(null);

/**
 * Says whether this page's first content is on screen yet. While `painted` is false the pager
 * keeps the pages beside this one unmounted (a drag still mounts them at once); a page that never
 * calls this counts as painted when it mounts. Pass `true` for whatever the page settles on first
 * (its rows, an empty state, an error), so the neighbours never wait for content that will not
 * come. Outside a tab pager it does nothing.
 */
export function useTabPageContentPainted(painted: boolean): void {
  const page = useContext(TabPageContentContext);
  // Before the pager's own effects: a hold taken in the commit that mounts the page is in place
  // before the pager schedules the neighbours' frame.
  useIsomorphicLayoutEffect(() => {
    if (!page || painted) return;
    page.hold();
    return page.release;
  }, [page, painted]);
}
