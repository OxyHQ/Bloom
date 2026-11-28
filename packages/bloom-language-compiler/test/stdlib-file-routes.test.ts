/**
 * @jest-environment node
 *
 * The Bloom router's table for an adopted app's file routes (`bloom routes --out`): a path
 * opens the first pattern that matches it, most specific first, and a route's path is its
 * pattern filled in. The table below is the shape `file_routes.rs`'s module test pins.
 */
import { routeOfPath, routePath } from '../stdlib/Bloom/routing';

const table = {
  root: '(app)/index.tsx',
  routes: {
    '(app)/index.tsx': [],
    '(auth)/index.tsx': [],
    '(app)/mention.tsx': [],
    '(app)/c/[username].tsx': ['username'],
    '(app)/docs/[...path].tsx': ['path'],
    '(app)/[username]/index.tsx': ['username'],
    '(app)/settings/+not-found.tsx': [],
    '(app)/+not-found.tsx': [],
  },
  paths: {
    '(app)/index.tsx': [],
    '(auth)/index.tsx': [],
    '(app)/mention.tsx': ['mention'],
    '(app)/c/[username].tsx': ['c', ':username'],
    '(app)/docs/[...path].tsx': ['docs', '*path'],
    '(app)/settings/+not-found.tsx': ['settings', '*'],
    '(app)/[username]/index.tsx': [':username'],
    '(app)/+not-found.tsx': ['*'],
  },
} as const;

describe('file routes in the Bloom router', () => {
  it('opens the most specific route, its parameters decoded', () => {
    expect(routeOfPath('/', table)).toEqual({ tag: '(app)/index.tsx', params: {} });
    expect(routeOfPath('/mention', table)).toEqual({ tag: '(app)/mention.tsx', params: {} });
    expect(routeOfPath('/c/oxy', table)).toEqual({
      tag: '(app)/c/[username].tsx',
      params: { username: 'oxy' },
    });
    expect(routeOfPath('/nate', table)).toEqual({
      tag: '(app)/[username]/index.tsx',
      params: { username: 'nate' },
    });
    expect(routeOfPath('/docs/a/b%20c', table)).toEqual({
      tag: '(app)/docs/[...path].tsx',
      params: { path: 'a/b c' },
    });
  });

  it('opens deep links and web URLs, and falls through to +not-found', () => {
    expect(routeOfPath('mention://c/oxy?ref=1', table)?.tag).toBe('(app)/c/[username].tsx');
    expect(routeOfPath('https://mention.earth/nate#top', table)?.params).toEqual({
      username: 'nate',
    });
    expect(routeOfPath('/settings/x/y', table)?.tag).toBe('(app)/settings/+not-found.tsx');
    expect(routeOfPath('/a/b/c', table)?.tag).toBe('(app)/+not-found.tsx');
    expect(routeOfPath('/docs', table)?.tag).toBe('(app)/[username]/index.tsx');
  });

  it("writes a route's path from its pattern", () => {
    expect(routePath('(app)/index.tsx', table)).toBe('/');
    expect(routePath('(app)/mention.tsx', table)).toBe('/mention');
    expect(routePath({ tag: '(app)/c/[username].tsx', username: 'a b' }, table)).toBe('/c/a%20b');
    expect(routePath({ tag: '(app)/docs/[...path].tsx', path: 'a/b c' }, table)).toBe(
      '/docs/a/b%20c',
    );
  });

  it('keeps the enum table as it was when there are no paths', () => {
    const routes = { root: 'home', routes: { home: [], post: ['id'] } };
    expect(routeOfPath('demo://post/42', routes)).toEqual({ tag: 'post', params: { id: '42' } });
    expect(routePath({ tag: 'post', id: '42' }, routes)).toBe('/post/42');
  });
});
