/**
 * `layout()` and `screen()`: a route file's default export, from a body that
 * returns language nodes. The body runs as the route's component, so it may
 * call hooks. Both provide the environment's navigator (Bloom's panel-aware
 * router, so a deck panel's routes push in that panel on the web), which
 * `navigate()` presses go through.
 */
import { useMemo, type ComponentType, type ReactNode } from 'react';
import type { Href } from 'expo-router';
import { useRouter } from '@oxy.so/bloom/panel-routing/expo-router';

import { EnvContext, navigatorEnv, type Env } from '../env';
import type { Child } from '../node';
import { drawNavigation } from './navigators';
import { ScreenHost } from './screen-host';

function useNavigatorEnv(): Env {
  const router = useRouter();
  return useMemo(
    () =>
      navigatorEnv((href, params) =>
        router.push((params ? { pathname: href, params } : href) as Href),
      ),
    [router],
  );
}

/**
 * A layout route (`_layout.tsx`): what its directory's routes render in, a
 * navigator (`AppLayout`, `Stack`, `TabView`) or any view.
 *
 * ```ts
 * // app/(app)/(tabs)/_layout.tsx
 * export default layout(() => TabView());
 * ```
 */
export function layout(body: () => Child): ComponentType {
  // A factory of components is what layout() is: called once per route file, at module scope.
  // biome-ignore lint/correctness/noComponentHookFactories: layout() defines one route component per call by design
  function Layout(): ReactNode {
    const env = useNavigatorEnv();
    return <EnvContext.Provider value={env}>{drawNavigation(body())}</EnvContext.Provider>;
  }
  Layout.displayName = body.name || 'Layout';
  return Layout;
}

/**
 * A screen: its body's root view is the screen's content, and the root's
 * screen modifiers are its chrome (`title`, `titleDisplay`, `subtitle`,
 * `header`, `toolbar`, `toolbarLeading`, `onBack`, `backLabel`,
 * `headingLevel`, `footer`, `sheet`, `onReselect`); the root's `testID` names
 * the screen. A route file default-exports one; a screen a route renders with
 * props (a post's id) takes them as a component does. Bloom's `Screen` draws it; the header is Bloom's
 * PageHeader, and on iOS inside a native stack the system navigation bar.
 *
 * ```ts
 * export default screen(function Saved() {
 *   const [filters, setFilters] = useState(false);
 *   return Embed(<SavedList />)
 *     .title(t('saved.title'))
 *     .toolbar(Button(Icon(RiFilter3Line)).label(t('saved.filter')).onPress(() => setFilters(true)))
 *     .sheet(filters, () => SavedFilters(), { onDismiss: () => setFilters(false) });
 * });
 * ```
 */
export function screen<P extends object = Record<string, never>>(
  body: (props: P) => Child,
): ComponentType<P> {
  // biome-ignore lint/correctness/noComponentHookFactories: screen() defines one route component per call by design
  function RouteScreen(props: P): ReactNode {
    const env = useNavigatorEnv();
    return (
      <EnvContext.Provider value={env}>
        <ScreenHost root={body(props)} />
      </EnvContext.Provider>
    );
  }
  RouteScreen.displayName = body.name || 'Screen';
  return RouteScreen;
}
