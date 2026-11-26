// The standard library's navigation primitives (`Navigation.bloom`), over today's router:
// expo-router's file routes, drawn by the language's router (`@oxy.so/bloom-language/router`:
// its native stack with Android's predictive back, Bloom's tab pager, sheets). `bloom build`
// writes the route files from the app's `Routable` enum (`.bloom/build/app/`), and they call
// `registerNavigation` and `routeScreen` here. Phase F replaces expo-router with the Bloom
// router; this file is the only one that changes.

import type { Child } from '@oxy.so/bloom-language';

declare const require: (id: string) => unknown;

/** A route value as the compiler emits an enum case: its name, or `{ tag, …payload }`. */
type Route = string | { readonly tag: string; readonly [label: string]: unknown };

type ExpoRouter = {
  router: {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
    canGoBack(): boolean;
  };
  useLocalSearchParams(): Readonly<Record<string, string | readonly string[] | undefined>>;
};
type React = {
  createElement(type: unknown, props: unknown, ...children: unknown[]): unknown;
  createContext<T>(value: T): { Provider: unknown };
  useContext<T>(context: { Provider: unknown }): T;
};

/** The app's route table, from its `Routable` enum (written by `bloom build`). */
export type NavigationTable = {
  /** The root case (the stack's first screen, `/`). */
  readonly root: string;
  /** Every case, with its associated values' labels in order (its path's parameters). */
  readonly routes: Readonly<Record<string, readonly string[]>>;
  /** The router's navigator component for the table (its stack, tabs and sheets). */
  readonly navigator: unknown;
};

let table: NavigationTable | undefined;

/** Installs the app's route table: the generated root layout calls it once, at startup. */
export function registerNavigation(next: NavigationTable): void {
  table = next;
}

function react(): React {
  return require('react') as React;
}

function expoRouter(): ExpoRouter {
  return require('expo-router') as ExpoRouter;
}

/** A case's path: `/` for the root, `/post/42` for `post(id: "42")`. */
export function routePath(route: Route, routes: NavigationTable): string {
  const tag = typeof route === 'string' ? route : route.tag;
  if (tag === routes.root) return '/';
  const labels = routes.routes[tag] ?? [];
  const values = typeof route === 'string' ? [] : labels.map((label) => route[label]);
  return `/${[tag, ...values.map((v) => encodeURIComponent(String(v)))].join('/')}`;
}

export function navigationHref<R>(route: R): string {
  if (!table) throw new Error('Bloom: no NavigationStack is mounted');
  return routePath(route as Route, table);
}

export function navigationPush<R>(route: R): void {
  expoRouter().router.push(navigationHref(route));
}

export function navigationReplace<R>(route: R): void {
  expoRouter().router.replace(navigationHref(route));
}

export function navigationBack(): void {
  const { router } = expoRouter();
  if (router.canGoBack()) router.back();
}

let destinations: { Provider: unknown } | undefined;

function destinationContext(): { Provider: unknown } {
  destinations ??= react().createContext<((route: Route) => Child) | undefined>(undefined);
  return destinations;
}

function NavigationRoot(props: { destination: (route: Route) => Child }): unknown {
  const { createElement } = react();
  if (!table) throw new Error('Bloom: the app has no route table (build it with `bloom build`)');
  return createElement(
    destinationContext().Provider,
    { value: props.destination },
    createElement(table.navigator, null),
  );
}

/** `NavigationStack`'s view: the router's navigator, its screens drawn by `destination`. */
export function navigationRoot<R>(destination: (route: R) => Child): Child {
  const { Embed } = require('@oxy.so/bloom-language') as { Embed(content: unknown): Child };
  return Embed(react().createElement(NavigationRoot, { destination }));
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
    const destination = react().useContext<((route: Route) => Child) | undefined>(
      destinationContext(),
    );
    if (!destination) throw new Error('Bloom: a route is drawn outside its NavigationStack');
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string') params[key] = first;
    }
    return destination(route(params));
  };
}
