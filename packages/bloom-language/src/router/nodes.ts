/**
 * The navigation nodes: what a route file's `layout()` draws, as data.
 *
 * expo-router's files stay the URL map (deep links, `+native-intent`, typed
 * routes, universal links and the web fallback are untouched); these say what
 * a layout file renders. Each platform draws them with its own navigator (see
 * `stack.*.tsx`, `tabs.*.tsx`, `bar.*.tsx`).
 */
import type { Href } from 'expo-router';

import {
  Navigation,
  Node,
  type AppLayoutView,
  type Child,
  type DestinationView,
  type PanelView,
  type NavStackView,
  type RouteView,
  type TabNavigatorView,
} from '../node';

const NO_CHILDREN: readonly Child[] = [];

/**
 * The app's root layout: Bloom's `AppShell` with the navigator in it, the
 * navigation the shell draws from the `TabPagerProvider` above it (the
 * sidebar's rows, the bottom bar), and the primary action.
 *
 * ```ts
 * export default layout(() =>
 *   AppLayout(Stack('(tabs)', Sheet('compose'), 'p/[id]/boost'))
 *     .primaryAction(RiQuillPenLine, t('sidebar.compose'), 'write')
 *     .bottomBar(signedIn)
 *     .shell((navigator) => ({ panelLayout: { panels: [{ id: 'main', role: 'main', content: navigator }] } })),
 * );
 * ```
 */
export function AppLayout(navigator: NavStackView | TabNavigatorView): AppLayoutView {
  return new Node('appLayout', { navigator }, NO_CHILDREN);
}

/**
 * A stack of routes. Each name is a route of the layout's directory, pushed
 * over the ones before it; `Sheet(name)` presents one as a sheet. With no
 * names, the directory's routes as expo-router finds them.
 *
 * - iOS: expo-router's native `Stack`, so a screen's `Header` is the system
 *   navigation bar and a `Sheet` is the system's page sheet.
 * - Android and OxyOS: `ExperimentalStack`, whose back consumes Android's
 *   predictive gesture (every native stack of the app must be one); a `Sheet`
 *   is pushed.
 * - The web: the route in place (`Slot`), so the document scrolls and sticky
 *   chrome works; a `Sheet` is the route in place too.
 */
export function Stack(...routes: (string | RouteView)[]): NavStackView {
  return new Node('navStack', { routes }, NO_CHILDREN);
}

/** A stack's route presented as a sheet over the one under it (iOS); pushed elsewhere. */
export function Sheet(name: string): RouteView {
  return new Node('route', { name, presentation: 'sheet' }, NO_CHILDREN);
}

/**
 * The tabs group's navigator over the `TabPagerProvider`'s pages: the system
 * tab bar on iOS (expo-router's `NativeTabs`), Bloom's swipe pager under the
 * shell's bottom bar on Android and OxyOS, the routed page on the web.
 */
export function TabView(): TabNavigatorView {
  return new Node('tabView', null, NO_CHILDREN);
}

/**
 * A place to go: a press modifier takes it like a handler, and the router
 * `layout()` or `screen()` drawing the view pushes it onto its navigator (a
 * deck panel's own, on the web).
 *
 * ```ts
 * PostRow({ id }).onPress(navigate('/p/[id]', { id }))
 * ```
 */
export function navigate(
  href: Href,
  params?: Readonly<Record<string, string | number>>,
): Navigation {
  return new Navigation(href as string, params);
}

/**
 * A panel of the app's shell. Without content it holds the layout's
 * navigator; with it, that view beside the navigator (a detail, an inspector).
 *
 * ```ts
 * AppLayout(Stack()).panels(
 *   Panel('main'),
 *   Panel('details', Details()).panelRole('inspector').presented(open).onPresentedChange(setOpen).label('Details'),
 * )
 * ```
 */
export function Panel(id: string, content?: Child): PanelView {
  return new Node('panel', { id, content }, NO_CHILDREN);
}

/**
 * One of the app's destinations, by its route's name and its address: what
 * the pager, the bottom bar and the sidebar read (Bloom's `AppDestination`).
 */
export function Destination(name: string, href: Href): DestinationView {
  return new Node('destination', { name, href: href as string }, NO_CHILDREN);
}
