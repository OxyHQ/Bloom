/**
 * The expo-router binding for `@oxyhq/bloom/scroll`.
 *
 * This is the only file in the scroll primitive that knows a router exists. It
 * is separate from the core so a consumer with a different router — or none —
 * can still use the core with its own adapter; before the split, a module-scope
 * `expo-router` import made the whole subpath unresolvable for them.
 *
 * The navigation hooks come from `expo-router` (which re-exports React
 * Navigation's) rather than from `@react-navigation/native` directly. Every Oxy
 * app uses expo-router as its router, so it is always a DIRECT, top-level
 * dependency that resolves cleanly under Bun's isolated linker — whereas
 * `@react-navigation/native` is only a nested/transitive dependency of
 * expo-router and would fail to resolve when bundling those apps.
 */
import { useMemo } from 'react';
import { useFocusEffect, useRoute } from 'expo-router';

import type { ScreenFocusEffect, ScrollRouterAdapter } from '../types';

/**
 * Params that describe how a screen was REACHED rather than what it shows, and
 * so must not contribute to a content id — the same screen showing the same
 * thing would otherwise get two ids depending on how the user got there.
 *
 * - `screen` / `params` are React Navigation's nested-navigator plumbing.
 *   expo-router strips both wherever it derives a URL from state
 *   (`global-state/getRouteInfoFromState.js` deletes them before building the
 *   pathname; `global-state/stateUtils.js` deletes `screen` from a payload;
 *   `hooks/useSearchParams.js` skips both).
 * - `initial` is React Navigation's reserved anchor flag, set by expo-router's
 *   `withAnchor` handling in `global-state/getNavigationAction.js` — which also
 *   warns if an app supplies it as a real param.
 */
const NON_CONTENT_PARAM_KEYS = new Set(['screen', 'params', 'initial']);

/**
 * expo-router's own internal params all carry this prefix
 * (`build/navigationParams.js` — `__internal_expo_router_no_animation`,
 * `__internal__expo_router_is_preview_navigation`, and the two zoom-transition
 * ids, verified identical in expo-router 56.2.10 and 57.0.9). They are appended
 * to the params of an ordinary navigation, so matching the prefix rather than
 * the four literals means a fifth one added upstream cannot silently split one
 * screen's content id in two.
 */
const INTERNAL_PARAM_PREFIX = '__internal';

/**
 * Depth at which nested param objects stop being described. React Navigation
 * expects params to be serializable, but nothing enforces it, and a serializer
 * that a cyclic value can hang is not one to put on a render path. Four levels
 * is far past anything a URL produces.
 */
const MAX_PARAM_DEPTH = 4;

function serializeValue(value: unknown, depth: number): string {
  if (value === undefined) return '~undefined';
  if (value === null) return '~null';
  // JSON.stringify quotes and escapes, so a string can never be confused with
  // a marker above or with the punctuation of a nested structure below.
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (depth >= MAX_PARAM_DEPTH) return '~deep';
  if (Array.isArray(value)) {
    return `[${value.map((entry) => serializeValue(entry, depth + 1)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return `{${Object.keys(source)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${serializeValue(source[key], depth + 1)}`)
      .join(',')}}`;
  }
  // A function, symbol or bigint reached a screen's params. Nothing about it
  // identifies content, and it cannot be compared across renders anyway.
  return '~opaque';
}

/**
 * Render a screen's params as a stable string. Keys are SORTED so params that
 * differ only in insertion order — routinely, since expo-router rebuilds the
 * object on every navigation — can never produce two ids for one screen.
 *
 * The exclusions apply at the top level only, because that is where React
 * Navigation and expo-router inject theirs; a nested user object keeps every
 * key it has.
 */
function serializeContentParams(params: object | undefined): string {
  if (params === undefined) return '';
  const source = params as Record<string, unknown>;
  return Object.keys(source)
    .filter(
      (key) =>
        !NON_CONTENT_PARAM_KEYS.has(key) && !key.startsWith(INTERNAL_PARAM_PREFIX),
    )
    .sort()
    .map((key) => `${JSON.stringify(key)}:${serializeValue(source[key], 1)}`)
    .join(',');
}

/**
 * Identify WHAT the calling screen is showing: its route name plus its params.
 *
 * `useRoute()` is the source, and it has to be: it reads the route object of
 * the nearest screen, so a background screen keeps reporting its own content.
 * `usePathname()` would not do — it reads the globally focused route, so a
 * background screen would adopt the foreground one's pathname and save its
 * offset under a key that is not its own.
 *
 * `route.key` is deliberately NOT part of this. An offset belongs to what the
 * user was looking at, not to the history slot it occupied — see
 * `deriveScrollKey` for the full reasoning and the trade it makes.
 *
 * Params are what separate two screens sharing a route name. That matters most
 * where expo-router RECYCLES a route object: `layouts/StackClient.js` reuses
 * the current route — key included — when `NAVIGATE` targets the current route
 * name and `getSingularId` matches, i.e. when only the query changed. Measured
 * on 56.2.10 and 57.0.9: `search?q=cats` -> `search?q=dogs` keeps one key and
 * swaps `params`, so without the params the two searches would share an offset.
 */
function useScreenContentId(): string | null {
  const route = useRoute();
  const contentId = `${route.name}?${serializeContentParams(route.params)}`;
  return useMemo(() => contentId, [contentId]);
}

function useScreenFocusEffect(effect: ScreenFocusEffect): void {
  useFocusEffect(effect);
}

/**
 * The adapter to hand `<ScrollRestorationProvider adapter={...}>` in an
 * expo-router app. A module-level constant, as the adapter contract requires.
 */
export const expoRouterScrollAdapter: ScrollRouterAdapter = {
  useScreenContentId,
  useScreenFocusEffect,
};
