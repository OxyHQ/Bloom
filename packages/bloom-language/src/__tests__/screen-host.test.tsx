/**
 * `@oxy.so/bloom-language/screen-host`: a screen's chrome drawn as a Bloom
 * Screen for a navigator that is not expo-router's (the Bloom router). What it
 * reaches imports no expo-router, on any platform: iOS's header asks for it
 * only lazily, in a `try` (its system bar inside expo-router's stack, Bloom's
 * PageHeader without it), as the language's root does. A pushed screen's Back
 * is the navigator's unless the root says its own. Android's files, as a Bloom build
 * draws them, against the stand-ins (support/bloom-router.ts).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { createElement, useState } from 'react';

import { Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { Button, FAB, Group, Icon, Text, VStack } from '../primitives';
import { drawScreen, ScreenHost } from '../screen-host';
import { view } from '../view';

jest.mock('../router/screen-header', () => jest.requireActual('../router/screen-header.tsx'));
jest.mock('../router/sheet-host', () => jest.requireActual('../router/sheet-host.tsx'));
jest.mock('../platform/header-host', () => jest.requireActual('../platform/header-host.tsx'));

quietRenderer();

const SRC = join(__dirname, '..');
const VARIANTS = ['.ios.tsx', '.ios.ts', '.android.tsx', '.android.ts', '.web.tsx', '.web.ts'];

/** Every file a relative specifier names: each platform's variant and the plain file. */
function filesOf(from: string, specifier: string): string[] {
  const base = join(dirname(from), specifier);
  const found: string[] = [];
  for (const candidate of [
    ...VARIANTS.map((suffix) => base + suffix),
    `${base}.tsx`,
    `${base}.ts`,
    ...VARIANTS.map((suffix) => join(base, `index${suffix}`)),
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ]) {
    try {
      readFileSync(candidate);
      found.push(candidate);
    } catch {}
  }
  if (found.length === 0)
    throw new Error(`${relative(SRC, from)}: ${specifier} resolves to no file`);
  return found;
}

/**
 * The packages a source file reaches, every platform's files followed (type imports too):
 * `packages` imported, `lazy` asked for with `require()` where a file runs, by the file.
 */
function packagesReached(entry: string) {
  const files = new Set<string>();
  const packages = new Set<string>();
  const lazy = new Map<string, string>();
  const queue = [join(SRC, entry)];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (files.has(file)) continue;
    files.add(file);
    const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of text.matchAll(
      /(?:from\s*|import\s*\(\s*|(require)\s*\(\s*|^\s*import\s+)'([^']+)'/gm,
    )) {
      const specifier = match[2] as string;
      if (specifier.startsWith('.')) queue.push(...filesOf(file, specifier));
      else if (match[1]) lazy.set(specifier, relative(SRC, file));
      else packages.add(specifier);
    }
  }
  return { packages, lazy, files };
}

const isExpoRouter = (name: string) => /(^|\/)expo-router(\/|$)/.test(name);

describe('@oxy.so/bloom-language/screen-host', () => {
  it('reaches no expo-router, on any platform', () => {
    const { packages, lazy, files } = packagesReached('screen-host.ts');
    // Not vacuous: the host, its iOS bar and the sheets are in the walk.
    for (const file of [
      'router/screen-host.tsx',
      'router/screen-header.ios.tsx',
      'router/sheet-host.ios.tsx',
    ]) {
      expect(files.has(join(SRC, file))).toBe(true);
    }
    expect([...packages].filter(isExpoRouter)).toEqual([]);
    // iOS's system bar, only inside expo-router's stack: asked for in a `try`, PageHeader without it.
    expect([...lazy].filter(([name]) => isExpoRouter(name))).toEqual([
      ['expo-router', 'platform/header-host.ios.tsx'],
      ['expo-router/react-navigation', 'platform/header-host.ios.tsx'],
    ]);
    expect(readFileSync(join(SRC, 'platform/header-host.ios.tsx'), 'utf8')).toMatch(
      /try \{\s*const \{ Stack \} = require\('expo-router'\)/,
    );
    // The walk sees expo-router where it is: the router's own entry.
    expect([...packagesReached('router/index.ts').packages].some(isExpoRouter)).toBe(true);
  });

  it('draws the root’s title and toolbar as Bloom’s Screen and PageHeader', () => {
    const r = mount(
      createElement(() =>
        drawScreen(
          VStack(Text('row'))
            .title('Gallery')
            .toolbar(Button(Icon(Glyph)).label('Add')),
        ),
      ),
    );
    only(r, 'Screen');
    const header = only(r, 'PageHeader');
    expect(header.props).toMatchObject({ title: 'Gallery', presentation: 'floating' });
    expect(header.props.actions).toBeTruthy();
    // No Back of the navigator's: Bloom's own (the provider's, a panel's history) decides.
    expect(header.props.onBack).toBeUndefined();
    expect(hosts(r, 'Text').some((t) => t.props.children === 'row')).toBe(true);
  });

  it('a pushed screen’s header offers the navigator’s Back, unless the root says its own', () => {
    const back = jest.fn();
    const pushed = mount(createElement(ScreenHost, { root: Text('post').title('Post'), back }));
    expect(only(pushed, 'PageHeader').props.onBack).toBe(back);

    const own = jest.fn();
    const r = mount(
      createElement(() => drawScreen(Text('post').title('Post').onBack(own), { back })),
    );
    expect(only(r, 'PageHeader').props.onBack).toBe(own);

    const none = mount(
      createElement(() => drawScreen(Text('post').title('Post').onBack(null), { back })),
    );
    expect(only(none, 'PageHeader').props.onBack).toBeNull();
  });

  it('throughViews: a view’s body’s chrome is the screen’s, its own modifiers after it', () => {
    const back = jest.fn();
    const Post = view(function Post({ id }: { id: string }) {
      const [title] = useState(`Post ${id}`);
      return VStack(Text(id))
        .title(title)
        .toolbar(Button(Icon(Glyph)).label('Share'));
    });
    const r = mount(
      createElement(() => drawScreen(Post({ id: '7' }), { back, throughViews: true })),
    );
    const header = only(r, 'PageHeader');
    expect(header.props).toMatchObject({ title: 'Post 7', onBack: back });
    expect(header.props.actions).toBeTruthy();
    // The view's own modifiers come after its body's.
    const renamed = mount(
      createElement(() => drawScreen(Post({ id: '7' }).title('Renamed'), { throughViews: true })),
    );
    expect(only(renamed, 'PageHeader').props.title).toBe('Renamed');
    // Without it, the view is the Screen's content: its body's title draws nothing.
    const plain = mount(createElement(() => drawScreen(Post({ id: '7' }))));
    expect(only(plain, 'PageHeader').props.title).toBeUndefined();
  });

  it('a root Group’s drawn branch gives the screen its footer, floating action, sheet and test id', () => {
    // SwiftUI reads a screen's chrome from any branch: the branch `if canEdit` draws declares them.
    const r = mount(
      createElement(() =>
        drawScreen(
          Group(
            false,
            Text('page')
              .title('Feeds')
              .floatingAction(FAB(Icon(Glyph)).label('Create'))
              .footer(Text('reply'))
              .testID('feeds-screen'),
          ),
        ),
      ),
    );
    const s = only(r, 'Screen');
    expect(s.props.primaryAction).toBeTruthy();
    expect(s.props.bottomBar).toBeTruthy();
    expect(s.props.testID).toBe('feeds-screen');
    // The test id names the screen once: the branch inside it no longer carries it.
    expect(
      r.root.findAll((n) => n.props.testID === 'feeds-screen' && typeof n.type === 'string'),
    ).toHaveLength(1);
    // The root's own still win.
    const own = mount(
      createElement(() => drawScreen(Group(Text('page').testID('branch')).testID('root'))),
    );
    expect(only(own, 'Screen').props.testID).toBe('root');
  });

  it('a root that is its own surface, and null, as screen() draws them', () => {
    const own = mount(
      createElement(() => drawScreen(Text('call').ownScreen(), { back: jest.fn() })),
    );
    expect(hosts(own, 'Screen')).toHaveLength(0);
    expect(hosts(own, 'PageHeader')).toHaveLength(0);
    expect(drawScreen(null)).toBeNull();
  });
});
