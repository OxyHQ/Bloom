// The standard library's navigation primitives (`Navigation.bloom`): the app's route table and
// the navigator that draws it. `bloom build` writes the table from the app's `Routable` enum
// and installs one of two navigators with it:
//
// - a Bloom build (`bloom build android`): the Bloom router (`router.ts`), Bloom's own stack,
//   tabs, sheets and deep links over react-native-screens, with no Expo underneath;
// - the Expo path (the web, `--with-expo`): expo-router's file routes (`routing-expo.ts`),
//   which `bloom` writes under `.bloom/build/app/`.
//
// This file names neither: Metro bundles every `require` it sees, so the navigator a build
// does not use never reaches its bundle.

// An ES import, not `require`: a `require` resolves a package's CommonJS build, and
// Bloom's must load as the rest of the app loads it.
import { type Child, Embed } from '@oxy.so/bloom-language';

declare const require: (id: string) => unknown;

/** A route value as the compiler emits an enum case: its name, or `{ tag, …payload }`. */
export type Route = string | { readonly tag: string; readonly [label: string]: unknown };

type React = {
  createElement(type: unknown, props: unknown, ...children: unknown[]): unknown;
  createContext<T>(value: T): { Provider: unknown };
  useContext<T>(context: { Provider: unknown }): T;
};

/** How a navigator moves: what `push`, `replace` and `dismiss` call. */
export type NavigationDriver = {
  push(route: Route): void;
  replace(route: Route): void;
  back(): void;
};

/** The app's route table, from its `Routable` enum (written by `bloom build`). */
export type NavigationTable = {
  /** The root case (the stack's first screen, `/`). */
  readonly root: string;
  /** Every case, with its associated values' labels in order (its path's parameters). */
  readonly routes: Readonly<Record<string, readonly string[]>>;
  /** The navigator's component for the table (its stack, tabs and sheets). */
  readonly navigator: unknown;
  /** How the navigator moves. */
  readonly driver: NavigationDriver;
};

let table: NavigationTable | undefined;

/** Installs the app's route table: the generated root calls it once, at startup. */
export function registerNavigation(next: NavigationTable): void {
  table = next;
}

export function react(): React {
  return require('react') as React;
}

function installed(): NavigationTable {
  if (!table) throw new Error('Bloom: no NavigationStack is mounted');
  return table;
}

/** A case's path: `/` for the root, `/post/42` for `post(id: "42")`. */
export function routePath(route: Route, routes: Pick<NavigationTable, 'root' | 'routes'>): string {
  const tag = typeof route === 'string' ? route : route.tag;
  if (tag === routes.root) return '/';
  const labels = routes.routes[tag] ?? [];
  const values = typeof route === 'string' ? [] : labels.map((label) => route[label]);
  return `/${[tag, ...values.map((v) => encodeURIComponent(String(v)))].join('/')}`;
}

/**
 * The route a path names (`/post/42`, `post/42`, a deep link's `demo://post/42` or a web
 * URL's `https://host/post/42?x=1`), the inverse of `routePath`; `undefined` when it names
 * none. Each parameter is the string the path holds; the route's own reader types it.
 */
export function routeOfPath(
  path: string,
  routes: Pick<NavigationTable, 'root' | 'routes'>,
): { tag: string; params: Record<string, string> } | undefined {
  let rest = path;
  const scheme = /^[a-z][a-z0-9+.-]*:\/\//i.exec(rest);
  if (scheme) {
    rest = rest.slice(scheme[0].length);
    // A web URL's host is not a route; a custom scheme's "host" is the route's first segment.
    if (/^https?:\/\//i.test(scheme[0])) rest = rest.slice(Math.max(0, rest.indexOf('/')));
  }
  rest = rest.replace(/[?#].*$/, '');
  const segments = rest.split('/').filter((s) => s.length > 0);
  if (segments.length === 0) return { tag: routes.root, params: {} };
  const [tag, ...values] = segments as [string, ...string[]];
  const labels = routes.routes[tag];
  if (!labels || labels.length !== values.length) return undefined;
  const params: Record<string, string> = {};
  labels.forEach((label, i) => {
    params[label] = decodeURIComponent(values[i] ?? '');
  });
  return { tag, params };
}

export function navigationHref<R>(route: R): string {
  return routePath(route as Route, installed());
}

export function navigationPush<R>(route: R): void {
  installed().driver.push(route as Route);
}

export function navigationReplace<R>(route: R): void {
  installed().driver.replace(route as Route);
}

export function navigationBack(): void {
  installed().driver.back();
}

let destinations: { Provider: unknown } | undefined;

function destinationContext(): { Provider: unknown } {
  destinations ??= react().createContext<((route: Route) => Child) | undefined>(undefined);
  return destinations;
}

/** The stack's `destination`, from inside the navigator: what draws each route. */
export function useDestination(): (route: Route) => Child {
  const destination = react().useContext<((route: Route) => Child) | undefined>(
    destinationContext(),
  );
  if (!destination) throw new Error('Bloom: a route is drawn outside its NavigationStack');
  return destination;
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

/** `NavigationStack`'s view: the navigator, its screens drawn by `destination`. */
export function navigationRoot<R>(destination: (route: R) => Child): Child {
  return Embed(
    react().createElement(NavigationRoot, { destination }) as Parameters<typeof Embed>[0],
  );
}

/**
 * A screen's view inside the window's top safe area (the status bar, the notch), as a
 * SwiftUI stack's content is: the screen draws edge to edge, its content below the bar.
 */
export function insideSafeArea(view: Child): Child {
  const padded = view as { safeAreaPadding?: (edge: string) => Child } | null | undefined;
  return typeof padded?.safeAreaPadding === 'function' ? padded.safeAreaPadding('top') : view;
}
