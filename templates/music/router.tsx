import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * The template's in-memory router: a history stack of routes, so every card,
 * link and back button in the template really navigates. An app swaps this for
 * its own router; the pages only call `navigate`, `replace` and `back`.
 */

export type MusicRoute =
  | { name: 'home' }
  | { name: 'search'; query?: string }
  | { name: 'library' }
  | { name: 'album'; id: string }
  | { name: 'playlist'; id: string }
  | { name: 'mix'; id: string }
  | { name: 'artist'; id: string }
  | { name: 'podcast'; id: string }
  | { name: 'episode'; id: string }
  | { name: 'profile' };

export interface MusicRouter {
  route: MusicRoute;
  canGoBack: boolean;
  canGoForward: boolean;
  navigate: (route: MusicRoute) => void;
  /** Swaps the top of the stack (typing a search query). */
  replace: (route: MusicRoute) => void;
  back: () => void;
  forward: () => void;
  /** The full player: an overlay on a phone, the immersive view on desktop. */
  fullPlayerOpen: boolean;
  setFullPlayerOpen: (open: boolean) => void;
}

const RouterContext = createContext<MusicRouter | null>(null);

export function useMusicRouter(): MusicRouter {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useMusicRouter() must be used inside <MusicRouterProvider>');
  return value;
}

export function MusicRouterProvider({
  initialRoute,
  initialFullPlayerOpen = false,
  children,
}: {
  initialRoute: MusicRoute;
  initialFullPlayerOpen?: boolean;
  children: React.ReactNode;
}) {
  const [stack, setStack] = useState<{ entries: MusicRoute[]; index: number }>({
    entries: initialRoute.name === 'home' ? [initialRoute] : [{ name: 'home' }, initialRoute],
    index: initialRoute.name === 'home' ? 0 : 1,
  });
  const [fullPlayerOpen, setFullPlayerOpen] = useState(initialFullPlayerOpen);

  const navigate = useCallback((route: MusicRoute) => {
    setStack(({ entries, index }) => {
      const top = entries[index];
      if (top && JSON.stringify(top) === JSON.stringify(route)) return { entries, index };
      return { entries: [...entries.slice(0, index + 1), route], index: index + 1 };
    });
    setFullPlayerOpen(false);
  }, []);

  const replace = useCallback((route: MusicRoute) => {
    setStack(({ entries, index }) => ({ entries: [...entries.slice(0, index), route], index }));
  }, []);

  const back = useCallback(() => setStack((s) => ({ ...s, index: Math.max(0, s.index - 1) })), []);
  const forward = useCallback(
    () => setStack((s) => ({ ...s, index: Math.min(s.entries.length - 1, s.index + 1) })),
    [],
  );

  const value = useMemo<MusicRouter>(
    () => ({
      route: stack.entries[stack.index]!,
      canGoBack: stack.index > 0,
      canGoForward: stack.index < stack.entries.length - 1,
      navigate,
      replace,
      back,
      forward,
      fullPlayerOpen,
      setFullPlayerOpen,
    }),
    [stack, navigate, replace, back, forward, fullPlayerOpen],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}
