// The Bloom router (ADR 0002, section 7): `NavigationStack`, its tabs, sheets and deep links in
// a Bloom build, with no expo-router underneath.
//
// - **Stack.** react-native-screens' native stack (`ScreenStack`): each route a native screen,
//   pushed with the platform's transition; a `sheets:` route is the platform's form sheet.
//   Android's back (the button and the predictive gesture) pops the route in front, then
//   returns to the first tab, then leaves the app.
// - **Tabs.** Bloom's look: the pages side by side (`react-native-pager-view`, swiped between)
//   under Bloom's `BottomBar`, its highlight following the pager frame by frame.
// - **Deep links.** `<scheme>://post/42` (the manifest's schemes) and the app's web URLs open
//   the route their path names (`routeOfPath`), over the root.
//
// `bloom build android` writes the spec from the app's `Routable` enum and installs
// `bloomRouter(spec)` with `registerNavigation`. Only a Bloom build bundles this file.

import {
  type ComponentType,
  createElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { BackHandler, Linking, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSharedValue } from 'react-native-reanimated';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';
import { BottomBar } from '@oxy.so/bloom/bottom-bar';
import { Screen } from '@oxy.so/bloom/screen';
import { useThemeColor } from '@oxy.so/bloom/theme';
import { type Child, toElement } from '@oxy.so/bloom-language';

import {
  insideSafeArea,
  type NavigationDriver,
  type NavigationTable,
  type Route,
  routeOfPath,
  useDestination,
} from './routing';

/** A page of the tab bar, as `bloom build` writes it from `Tab(route:title:icon:)`. */
export type RouterTab = {
  readonly route: string;
  readonly title: string;
  readonly icon: ComponentType;
  /** The glyph while selected (the filled shape of an outline icon). */
  readonly activeIcon?: ComponentType;
};

/** The app's navigation, from its `Routable` enum and its `NavigationStack(…)`. */
export type RouterSpec = {
  readonly root: string;
  readonly routes: Readonly<Record<string, readonly string[]>>;
  readonly sheets: readonly string[];
  readonly tabs: readonly RouterTab[];
  /** Each case's reader: its value from a path's parameters, typed by the generated code. */
  readonly read: Readonly<Record<string, (params: Readonly<Record<string, string>>) => Route>>;
};

type Entry = { readonly key: string; readonly route: Route; readonly sheet: boolean };
type State = { readonly entries: readonly Entry[]; readonly tab: string };

const tagOf = (route: Route): string => (typeof route === 'string' ? route : route.tag);

/** The router's state: the stack's entries (the root first) and the tab in front. */
export class RouterStore {
  private state: State;
  private readonly listeners = new Set<() => void>();
  private next = 0;

  constructor(private readonly spec: RouterSpec) {
    this.state = { entries: [this.entry(spec.root)], tab: spec.root };
  }

  get = (): State => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(state: State): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  private entry(route: Route): Entry {
    const tag = tagOf(route);
    const key = tag === this.spec.root && this.next === 0 ? 'root' : `${tag}-${this.next}`;
    this.next += 1;
    return { key, route, sheet: this.spec.sheets.includes(tag) };
  }

  private isTab(tag: string): boolean {
    return this.spec.tabs.some((t) => t.route === tag);
  }

  /** Shows the tab `tag`, over nothing (what opened from another page closes). */
  selectTab(tag: string): void {
    const [root] = this.state.entries;
    if (!root) return;
    if (this.state.tab === tag && this.state.entries.length === 1) return;
    this.set({ entries: [root], tab: tag });
  }

  push(route: Route): void {
    const tag = tagOf(route);
    if (this.isTab(tag) || tag === this.spec.root) {
      this.selectTab(tag);
      return;
    }
    this.set({ ...this.state, entries: [...this.state.entries, this.entry(route)] });
  }

  replace(route: Route): void {
    const tag = tagOf(route);
    if (this.state.entries.length <= 1 || this.isTab(tag) || tag === this.spec.root) {
      this.push(route);
      return;
    }
    this.set({ ...this.state, entries: [...this.state.entries.slice(0, -1), this.entry(route)] });
  }

  /** Back: the route in front, then the first tab. False when there is nowhere to go back to. */
  back(): boolean {
    const { entries, tab } = this.state;
    if (entries.length > 1) {
      this.set({ ...this.state, entries: entries.slice(0, -1) });
      return true;
    }
    if (this.spec.tabs.length > 0 && tab !== this.spec.root) {
      this.selectTab(this.spec.root);
      return true;
    }
    return false;
  }

  /** The native stack removed `key` (a sheet swiped away): it and what was over it go. */
  dismissed(key: string): void {
    const at = this.state.entries.findIndex((e) => e.key === key);
    if (at > 0) this.set({ ...this.state, entries: this.state.entries.slice(0, at) });
  }

  /** A deep link or web URL: the route its path names, over the root. */
  open(url: string): boolean {
    const found = routeOfPath(url, this.spec);
    const read = found && this.spec.read[found.tag];
    if (!found || !read) return false;
    const route = read(found.params);
    const tag = tagOf(route);
    const [root] = this.state.entries;
    if (!root) return false;
    if (this.isTab(tag) || tag === this.spec.root) {
      this.set({ entries: [root], tab: tag });
    } else {
      this.set({ ...this.state, entries: [root, this.entry(route)] });
    }
    return true;
  }
}

function useRouterState(store: RouterStore): State {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** A route drawn as a Bloom screen: edge to edge, its content below the status bar. */
function RouteScreen({ route }: { route: Route }): ReactNode {
  const destination = useDestination();
  return createElement(Screen, null, toElement(insideSafeArea(destination(route) as Child)));
}

/** A sheet's route: its own height, on the page's background. */
function SheetContent({ route }: { route: Route }): ReactNode {
  const destination = useDestination();
  const background = useThemeColor('background');
  return createElement(
    View,
    { style: { backgroundColor: background } },
    toElement(destination(route) as Child),
  );
}

function Tabs({ store, spec }: { store: RouterStore; spec: RouterSpec }): ReactNode {
  const { tab } = useRouterState(store);
  // The page's background runs under the bar, as the pages' own does.
  const background = useThemeColor('background');
  const index = Math.max(
    0,
    spec.tabs.findIndex((t) => t.route === tab),
  );
  const progress = useSharedValue(index);
  const pager = useRef<PagerView>(null);
  const shown = useRef(index);
  // The bar (or back) chose a page: the pager slides to it; a swipe already did.
  useEffect(() => {
    if (shown.current !== index) {
      shown.current = index;
      pager.current?.setPage(index);
    }
  }, [index]);
  const items = useMemo(
    () =>
      spec.tabs.map((t) => ({
        name: t.route,
        label: t.title,
        icon: createElement(t.icon),
        activeIcon: t.activeIcon ? createElement(t.activeIcon) : undefined,
      })),
    [spec.tabs],
  );
  return createElement(
    View,
    { style: [styles.fill, { backgroundColor: background }] },
    createElement(
      PagerView,
      {
        ref: pager,
        style: styles.fill,
        initialPage: index,
        onPageScroll: (e: { nativeEvent: { position: number; offset: number } }) => {
          progress.value = e.nativeEvent.position + e.nativeEvent.offset;
        },
        onPageSelected: (e: { nativeEvent: { position: number } }) => {
          const selected = spec.tabs[e.nativeEvent.position];
          shown.current = e.nativeEvent.position;
          if (selected) store.selectTab(selected.route);
        },
      },
      ...spec.tabs.map((t) =>
        createElement(
          View,
          { key: t.route, style: styles.fill, collapsable: false },
          createElement(RouteScreen, { route: t.route }),
        ),
      ),
    ),
    createElement(BottomBar, {
      items,
      value: tab,
      onValueChange: (name: string) => store.selectTab(name),
      activeProgress: progress,
    }),
  );
}

const HIDDEN_HEADER = { hidden: true } as const;

function Navigator({ store, spec }: { store: RouterStore; spec: RouterSpec }): ReactNode {
  const { entries } = useRouterState(store);
  // Android's back: the route in front, then the first tab, then the system's (leave the app).
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => store.back());
    return () => subscription.remove();
  }, [store]);
  // Deep links: the one that started the app, then each one while it runs.
  useEffect(() => {
    let live = true;
    Linking.getInitialURL()
      .then((url) => {
        if (live && url) store.open(url);
      })
      .catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => store.open(url));
    return () => {
      live = false;
      subscription.remove();
    };
  }, [store]);
  return createElement(
    ScreenStack,
    { style: styles.fill },
    ...entries.map((entry, i) =>
      createElement(
        ScreenStackItem,
        {
          key: entry.key,
          screenId: entry.key,
          headerConfig: HIDDEN_HEADER,
          stackPresentation: entry.sheet ? 'formSheet' : 'push',
          sheetAllowedDetents: entry.sheet ? 'fitToContents' : undefined,
          sheetGrabberVisible: entry.sheet,
          style: StyleSheet.absoluteFill,
          onDismissed: () => store.dismissed(entry.key),
        },
        i === 0 && spec.tabs.length > 0
          ? createElement(Tabs, { store, spec })
          : entry.sheet
            ? createElement(SheetContent, { route: entry.route })
            : createElement(RouteScreen, { route: entry.route }),
      ),
    ),
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

/** The Bloom router for `spec`: the route table `registerNavigation` installs. */
export function bloomRouter(spec: RouterSpec): NavigationTable {
  const store = new RouterStore(spec);
  const driver: NavigationDriver = {
    push: (route) => store.push(route),
    replace: (route) => store.replace(route),
    back: () => {
      store.back();
    },
  };
  // biome-ignore lint/correctness/noComponentHookFactories: one navigator per app, made once at startup
  function BloomNavigator(): ReactNode {
    return createElement(Navigator, { store, spec });
  }
  return { root: spec.root, routes: spec.routes, navigator: BloomNavigator, driver };
}
