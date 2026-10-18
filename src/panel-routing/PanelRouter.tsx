import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAppShellPanel } from '../app-shell/context';
import { usePanelNavigation } from '../app-shell/PanelNavigation';
import {
  matchPanelRoute,
  resolvePanelHref,
  type PanelHref,
  type PanelRouteDefinition,
  type PanelRouteParams,
} from './routes';

export interface PanelRouter {
  active: boolean;
  pathname: string;
  href: string;
  params: PanelRouteParams;
  key: string;
  push(href: PanelHref): void;
  replace(href: PanelHref): void;
  navigate(href: PanelHref): void;
  back(): void;
  forward(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  setParams(params: Record<string, unknown>): void;
  dismiss(count?: number): void;
  dismissAll(): void;
  dismissTo(href: PanelHref): void;
  canDismiss(): boolean;
  prefetch(href: PanelHref): void;
}
const RouterContext = createContext<PanelRouter | null>(null);
const OutletContext = createContext<ReactNode>(null);
export function useOptionalPanelRouter() {
  return useContext(RouterContext);
}
export function PanelRouteSlot() {
  return <>{useContext(OutletContext)}</>;
}

/** One routing scope per panel, backed by AppShell's independent history. */
export function PanelRouterProvider({
  routes,
  children,
  entryParams,
  notFound = null,
}: {
  routes: readonly PanelRouteDefinition[];
  children?: ReactNode;
  /** App-owned metadata copied to new history entries. */
  entryParams?: Record<string, unknown>;
  notFound?: ReactNode;
}) {
  const navigation = usePanelNavigation();
  const active = useAppShellPanel().active !== false;
  const href = navigation.entry.name;
  const match = useMemo(() => matchPanelRoute(routes, href), [routes, href]);
  const router = useMemo<PanelRouter>(() => {
    const resolve = (target: PanelHref) => resolvePanelHref(target, href);
    const entry = (target: PanelHref) => ({ name: resolve(target), params: entryParams });
    const back = (count = 1) => navigation.go(-count);
    return {
      active,
      href,
      pathname: (href.split(/[?#]/)[0] ?? '/').split('/').map(decodeURIComponent).join('/'),
      params: match?.params ?? {},
      key: navigation.entry.key,
      push: (target) => navigation.push(entry(target)),
      replace: (target) => navigation.replace(entry(target)),
      navigate: (target) => {
        if (resolve(target) !== href) navigation.push(entry(target));
      },
      back: navigation.back,
      forward: navigation.forward,
      canGoBack: () => navigation.canGoBack,
      canGoForward: () => navigation.canGoForward,
      dismiss: back,
      dismissAll: () => back(navigation.index),
      canDismiss: () => navigation.canGoBack,
      dismissTo: (target) => {
        const name = resolve(target);
        let index = navigation.index - 1;
        while (index >= 0 && navigation.entries[index]?.name !== name) index--;
        if (index >= 0) back(navigation.index - index);
        else navigation.replace(entry(target));
      },
      setParams: (params) => {
        const url = new URL(href, 'https://panel.invalid');
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.delete(key);
          if (value != null)
            for (const item of Array.isArray(value) ? value : [value])
              url.searchParams.append(key, String(item));
        }
        navigation.replace({
          ...navigation.entry,
          name: `${url.pathname}${url.search}${url.hash}`,
        });
      },
      prefetch: () => {},
    };
  }, [navigation, href, match, active, entryParams]);
  let outlet: ReactNode = notFound;
  if (match) {
    const Component = match.route.component;
    outlet = <Component key={navigation.entry.key} />;
    for (const Layout of [...(match.route.layouts ?? [])].reverse()) {
      outlet = (
        <OutletContext.Provider value={outlet}>
          <Layout />
        </OutletContext.Provider>
      );
    }
  }
  return (
    <RouterContext.Provider value={router}>
      <OutletContext.Provider value={outlet}>{children ?? outlet}</OutletContext.Provider>
    </RouterContext.Provider>
  );
}
