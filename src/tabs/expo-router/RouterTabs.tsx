/**
 * expo-router bindings for the in-screen tab strip.
 *
 * This subpath (`@oxyhq/bloom/tabs/expo-router`) is the ONLY place in the tabs
 * feature allowed to import `expo-router`, which is why it is a separate entry:
 * the core `@oxyhq/bloom/tabs` stays usable in an app with a different router,
 * or none, and the optional peer is never pulled into a bundle that does not
 * ask for it. Same split as `tab-bar` / `tab-bar/expo-router` and
 * `scroll` / `scroll/expo-router`.
 *
 * Everything routing-shaped lives here on purpose: which tab the route means,
 * what a committed swipe navigates to, and which links to warm. The strip
 * itself stays presentational and knows only about measured geometry.
 */
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { router, usePathname, type Href } from 'expo-router';

import { Tabs, TabsTrigger, type TabsDragController } from '../Tabs';
import type { TabsProps } from '../types';

export interface RouterTabItem {
  /** Stable id for the tab. Used as a React key and a callback argument. */
  value: string;
  /** Tab label text. */
  label: string;
  /** The route this tab shows. Must be the tab's EXACT path. */
  href: Href;
  /** Icon rendered before the label. */
  icon?: ReactNode;
  /** Optional tally beside the label; `0` or omitted renders nothing. */
  count?: number;
  disabled?: boolean;
}

export type RouterTabsProps = Omit<
  TabsProps,
  // All three describe a selection the ROUTE already answers, so accepting them
  // here would let a caller contradict the router.
  'value' | 'onValueChange' | 'hasSelection' | 'children'
> & {
  items: RouterTabItem[];
  /**
   * Called instead of navigating when the ALREADY-active tab is pressed.
   *
   * Without it a re-tap would push a second history entry for the route the
   * user is already on, so Back would appear to do nothing. Re-tapping the
   * active tab conventionally means "refresh" or "scroll to top", and that is
   * the caller's to define.
   */
  onReselect?: (value: string) => void;
  /**
   * Enable the horizontal swipe between neighbouring tabs. Defaults to `true`.
   *
   * The gesture is INDICATOR-LED: the underline tracks the finger toward the
   * neighbour and commits on release past a threshold, while the content stays
   * where it is. That asymmetry is deliberate — the underline has somewhere
   * real to go and can complete its journey, whereas under a `<Slot/>` there is
   * no neighbouring screen mounted to bring in, so translating the content
   * would only open a blank gutter on the trailing edge.
   */
  swipeEnabled?: boolean;
};

/**
 * Resolve which item the current route belongs to.
 *
 * LONGEST matching prefix, on a segment boundary — not an exact match. All
 * three properties matter:
 *
 * - A prefix is needed because a tab may own a subtree (`/feeds/1/topics` and
 *   anything under it), and an exact match would drop the underline the moment
 *   the user goes one level deeper.
 * - LONGEST is needed because the default tab's href is a prefix of every
 *   sibling's (`/@ana` vs `/@ana/replies`), so a first-match rule would light
 *   up the default tab on every tab.
 * - The segment boundary is what stops `/feeds/12` from matching `/feeds/1`.
 *
 * Returns `undefined` when nothing matches, which is a real state — a strip
 * rendered by a LAYOUT keeps rendering while a child route outside the tab set
 * is showing — and leaves the underline hidden rather than parked on a lie.
 */
function matchActiveValue(items: RouterTabItem[], pathname: string): string | undefined {
  let best: { value: string; length: number } | undefined;
  for (const item of items) {
    // `Href` is a string or an object; only a string form can be compared to a
    // pathname, and an object form describes params we cannot resolve here.
    if (typeof item.href !== 'string') continue;
    // Compare paths only: a query string describes what the tab shows, not
    // which tab it is, and a trailing slash is the same route either way.
    const [path = ''] = item.href.split('?');
    const href = path.replace(/\/$/, '');
    const isMatch = pathname === href || pathname.startsWith(`${href}/`);
    if (!isMatch) continue;
    if (!best || href.length > best.length) {
      best = { value: item.value, length: href.length };
    }
  }
  return best?.value;
}

/**
 * A tab strip whose selection IS the route.
 *
 * Render it in the LAYOUT that owns the tabs, above the `<Slot/>` that renders
 * them — not inside the tab screens themselves. That placement is the whole
 * point, and it is load-bearing twice over: a strip inside the screens is
 * unmounted and rebuilt by every navigation, so its underline has nothing to
 * animate from and the chrome blanks while the incoming route's chunk loads;
 * and a GESTURE inside the screens would be destroyed by the very navigation it
 * commits, mid-release.
 *
 * ```tsx
 * // app/(app)/[username]/_layout.tsx
 * <RouterTabs
 *   items={[
 *     { value: 'posts', label: 'Posts', href: `/${username}` },
 *     { value: 'replies', label: 'Replies', href: `/${username}/replies` },
 *   ]}
 * />
 * <Slot />
 * ```
 */
export function RouterTabs({
  items,
  onReselect,
  swipeEnabled = true,
  ...tabsProps
}: RouterTabsProps) {
  const pathname = usePathname();
  const activeValue = useMemo(() => matchActiveValue(items, pathname), [items, pathname]);
  const dragRef = useRef<TabsDragController>(null);
  // What releasing right now would commit. A ref rather than state: it is
  // written on every frame of the drag and read once, and re-rendering the
  // strip mid-gesture would fight the animation the gesture is driving.
  const pendingRef = useRef<string | null>(null);

  const navigateTo = useCallback(
    (value: string) => {
      const target = items.find((item) => item.value === value);
      if (!target) return;
      // PUSH, not replace: a history entry per tab is what makes Back return to
      // the tab the reader came from instead of leaving the screen entirely.
      router.push(target.href);
    },
    [items],
  );

  const handlePress = useCallback(
    (item: RouterTabItem) => {
      if (item.value === activeValue) {
        onReselect?.(item.value);
        return;
      }
      navigateTo(item.value);
    },
    [activeValue, onReselect, navigateTo],
  );

  const onDrag = useCallback((translationX: number) => {
    pendingRef.current = dragRef.current?.drag(translationX) ?? null;
  }, []);

  // `onEnd` does not fire for every terminated gesture, and `onFinalize` fires
  // for all of them — including after `onEnd`. Guarding on the ref being
  // non-null is what makes the second call a no-op instead of a double commit.
  const releasedRef = useRef(true);
  const onRelease = useCallback(() => {
    if (releasedRef.current) return;
    releasedRef.current = true;
    const committed = pendingRef.current;
    pendingRef.current = null;
    // The underline commits first and instantly: it lives in the layout, it
    // survives the swap, and it is the honest signal the gesture was accepted.
    // The content area arrives when its chunk does.
    dragRef.current?.release(committed);
    if (committed !== null) navigateTo(committed);
  }, [navigateTo]);

  const onBegin = useCallback(() => {
    releasedRef.current = false;
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // Horizontal intent only. This is a hint to the gesture system and is
        // NOT what protects vertical scrolling on web — see `touchAction` below.
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onBegin(() => {
          runOnJS(onBegin)();
        })
        .onUpdate((event) => {
          runOnJS(onDrag)(event.translationX);
        })
        .onFinalize(() => {
          runOnJS(onRelease)();
        }),
    [onBegin, onDrag, onRelease],
  );

  // Warm every OTHER tab's async chunk. That fetch is the ~300ms the content
  // area would otherwise spend empty after a commit, and a swipe offers no
  // hover to warm on, so it is done up front rather than on interaction.
  //
  // `router.prefetch` — the public imperative API (declared in expo-router's
  // `global-state/router.d.ts`) — rather than wrapping each trigger in
  // `<Link prefetch asChild>`. Both reasons are about the WRAPPER, not about
  // prefetching: `asChild` is Radix's `Slot`, which COMPOSES event handlers, so
  // the trigger's own `onPress` and the link's navigation would both run — and
  // the link's push knows nothing about `onReselect`, so re-tapping the active
  // tab would push a duplicate entry and make Back appear to do nothing. It
  // also injects an `href` a `Pressable` ignores. The prefetching itself is
  // identical: `<Link prefetch>` renders `<Prefetch href/>` beside its element
  // and does nothing else.
  //
  // Known trade: a real `<Link>` would render a web anchor, which is what gives
  // middle-click and open-in-new-tab. A tab strip arguably wants that; getting
  // both needs the trigger to render an anchor itself, which is a change to the
  // core rather than to this file.
  useEffect(() => {
    for (const item of items) {
      if (item.value === activeValue || item.disabled) continue;
      router.prefetch(item.href);
    }
  }, [items, activeValue]);

  const strip = (
    // `hasSelection` is what stops the underline asserting a tab while a
    // NON-TAB sibling route is showing — the layout that renders this strip
    // renders those too (a profile's `/followers` beside its tab routes).
    <Tabs {...tabsProps} ref={dragRef} hasSelection={activeValue !== undefined}>
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          label={item.label}
          icon={item.icon}
          count={item.count}
          disabled={item.disabled}
          // Focus, never a press, is what drives the underline — so a deep
          // link, a browser Back and a back gesture animate exactly like a tap.
          isFocused={item.value === activeValue}
          onPress={() => handlePress(item)}
        />
      ))}
    </Tabs>
  );

  if (!swipeEnabled) return strip;

  return (
    // `touchAction="pan-y"` is MANDATORY and is the landmine of this file.
    // RNGH sets the detector's view to `touch-action: none` on web
    // (`GestureHandlerWebDelegate.js`), which disables browser-native VERTICAL
    // scrolling on that element. `failOffsetY` above does not protect against
    // it: that is a JS decision taken after `touch-action` has already told the
    // browser not to scroll. Removing this prop is silent on native and breaks
    // scrolling on mobile web.
    <GestureDetector gesture={panGesture} touchAction="pan-y">
      {strip}
    </GestureDetector>
  );
}

RouterTabs.displayName = 'RouterTabs';
