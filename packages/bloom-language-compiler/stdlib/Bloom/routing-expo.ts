// `NavigationStack` on the Expo path (the web, `--with-expo`): expo-router's file routes, drawn
// by the language's router (`@oxy.so/bloom-language/router`). `bloom build` writes the route
// files from the app's `Routable` enum (`.bloom/build/app/`); they call `routeScreen` here, and
// the root layout installs `expoDriver`. A Bloom build never bundles this file: its navigator
// is the Bloom router (`router.ts`).

import type { Child } from '@oxy.so/bloom-language';

import {
  insideSafeArea,
  type NavigationDriver,
  type NavigationTable,
  type Route,
  routePath,
  useDestination,
} from './routing';

declare const require: (id: string) => unknown;

type ExpoRouter = {
  router: {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
    canGoBack(): boolean;
  };
  useLocalSearchParams(): Readonly<Record<string, string | readonly string[] | undefined>>;
};

function expoRouter(): ExpoRouter {
  return require('expo-router') as ExpoRouter;
}

/** expo-router's moves, by the path each route's file has. */
export function expoDriver(
  routes: Pick<NavigationTable, 'root' | 'routes' | 'paths'>,
): NavigationDriver {
  return {
    push: (route) => expoRouter().router.push(routePath(route, routes)),
    replace: (route) => expoRouter().router.replace(routePath(route, routes)),
    back: () => {
      const { router } = expoRouter();
      if (router.canGoBack()) router.back();
    },
  };
}

/**
 * A route file's screen body: the route its URL names (`route` builds the case from the
 * URL's parameters, typed by the generated file), drawn by the stack's `destination`.
 */
export function routeScreen(
  route: (params: Readonly<Record<string, string>>) => Route,
): () => Child {
  // biome-ignore lint/correctness/noComponentHookFactories: one route component per route file, as screen() itself
  return function RouteScreen(): Child {
    const raw = expoRouter().useLocalSearchParams();
    const destination = useDestination();
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string') params[key] = first;
    }
    return insideSafeArea(destination(route(params)));
  };
}
