/**
 * @jest-environment jsdom
 */

// Exercises `scroll/expo-router` — the only module in the scroll primitive that
// knows a router exists. What it has to get right is the CONTENT id: two
// screens that show the same thing must produce the same id however they were
// reached, and one entry recycled to show something else must not.
//
// `expo-router` is mocked (`virtual: true`) so jest never resolves the real,
// native-heavy package; the mock returns the route object shape the real
// `useRoute()` returns, which is all the adapter reads.

import { createElement, type ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

interface FakeRoute {
  key: string;
  name: string;
  params?: object;
}

let currentRoute: FakeRoute = { key: 'k', name: 'index', params: {} };

jest.mock(
  'expo-router',
  () => ({
    useRoute: () => currentRoute,
    useFocusEffect: () => undefined,
  }),
  { virtual: true },
);

// Imported AFTER the mock is registered.
import { expoRouterScrollAdapter } from '../scroll/expo-router';

/** Render the adapter's content-id hook once for a given route object. */
function contentIdFor(route: FakeRoute): string | null {
  currentRoute = route;
  let captured: string | null | undefined;

  function Probe(): ReactNode {
    captured = expoRouterScrollAdapter.useScreenContentId();
    return null;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(Probe));
  });
  act(() => {
    root.unmount();
  });
  container.remove();

  if (captured === undefined) throw new Error('content id was never captured');
  return captured;
}

describe('expo-router scroll adapter', () => {
  it('ignores the route key entirely — content is the whole identity', () => {
    // Two different history entries showing the same thing are one screen as
    // far as the offset store is concerned. That is what makes a tab press
    // restore: measured on 56.2.10 and 57.0.9, tapping a tab mints a NEW
    // route key, so an entry-keyed store would miss and open at the top.
    const first = contentIdFor({ key: 'index-A', name: 'index', params: {} });
    const second = contentIdFor({ key: 'index-C', name: 'index', params: {} });
    expect(first).toBe(second);
  });

  it('distinguishes params under one route name (the recycle)', () => {
    // expo-router reuses one route object — `route.key` included — when
    // `NAVIGATE` targets the current route name and its dynamic segments match,
    // i.e. when only the query changed. Without params in the id the two
    // searches would share an offset.
    const cats = contentIdFor({ key: 'Search-xyz', name: 'search', params: { q: 'cats' } });
    const dogs = contentIdFor({ key: 'Search-xyz', name: 'search', params: { q: 'dogs' } });
    expect(cats).not.toBe(dogs);
  });

  it('distinguishes content across different routes', () => {
    const a = contentIdFor({ key: 'k', name: 'feeds/index', params: {} });
    const b = contentIdFor({ key: 'k', name: 'saved/index', params: {} });
    expect(a).not.toBe(b);
  });

  it('is insensitive to param insertion order', () => {
    // expo-router rebuilds the params object on every navigation, so key order
    // is not stable — an order-sensitive id would split one screen in two.
    const first = contentIdFor({
      key: 'k',
      name: 'search',
      params: { q: 'cats', sort: 'top' },
    });
    const second = contentIdFor({
      key: 'k',
      name: 'search',
      params: { sort: 'top', q: 'cats' },
    });
    expect(first).toBe(second);
  });

  it('ignores the params that describe how a screen was reached, not what it shows', () => {
    // `screen`/`params` are React Navigation's nested-navigator plumbing,
    // `initial` is its anchor flag, and expo-router appends its own
    // `__internal…` params to an ordinary navigation. All four vary with the
    // route taken, not the content shown.
    const plain = contentIdFor({ key: 'k', name: 'p', params: { id: '42' } });
    const decorated = contentIdFor({
      key: 'k',
      name: 'p',
      params: {
        id: '42',
        screen: 'p',
        params: { id: '42' },
        initial: false,
        __internal_expo_router_no_animation: true,
        __internal__expo_router_is_preview_navigation: true,
        __internal_expo_router_zoom_transition_source_id: 'card-42',
      },
    });

    expect(plain).toBe(decorated);
  });

  it('separates params that differ only in type or shape', () => {
    const ids = [
      contentIdFor({ key: 'k', name: 'p', params: { id: '1' } }),
      contentIdFor({ key: 'k', name: 'p', params: { id: 1 } }),
      contentIdFor({ key: 'k', name: 'p', params: { id: ['1'] } }),
      contentIdFor({ key: 'k', name: 'p', params: {} }),
      contentIdFor({ key: 'k', name: 'p', params: { id: undefined } }),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('describes a route with no params at all', () => {
    const withoutParams = contentIdFor({ key: 'k', name: 'settings/index' });
    const withEmptyParams = contentIdFor({
      key: 'k',
      name: 'settings/index',
      params: {},
    });
    expect(withoutParams).toBe(withEmptyParams);
    expect(withoutParams).toContain('settings/index');
  });

  it('survives a cyclic param object instead of hanging the render', () => {
    // React Navigation expects serializable params but does not enforce it, and
    // a serializer that a cycle can hang has no place on a render path.
    const cyclic: Record<string, unknown> = { name: 'loop' };
    cyclic.self = cyclic;

    expect(() =>
      contentIdFor({ key: 'k', name: 'p', params: { nested: cyclic } }),
    ).not.toThrow();
  });
});
