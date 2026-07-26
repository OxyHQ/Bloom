import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Structural guard for the tab bar's platform split.
 *
 * `@oxyhq/bloom/tab-bar` has to resolve cleanly in four places at once: Metro on
 * iOS/Android (platform extensions), a web bundler (the `browser` export
 * condition), a non-Metro bundler reading the published `lib/`, and a consumer's
 * `tsc` (which follows the `"react-native"` source condition). Three packages
 * break that the moment they appear outside a `.native` file:
 * `expo-glass-effect` and `expo-symbols` are native-only, and `expo-router` /
 * `react-native-screens` belong solely to the opt-in
 * `@oxyhq/bloom/tab-bar/expo-router` subpath so the core bar stays usable in an
 * app with no router at all.
 *
 * None of that is observable from a jest render — a missing `.web` retarget or a
 * leaked native import fails at a consumer's BUILD, in a repo that isn't this
 * one. Hence source/contract assertions.
 *
 * Every assertion below matches on real import/export/require STATEMENTS, never
 * on bare substrings: the doc comments in these files name all four packages on
 * purpose (explaining why they are absent), so `includes('expo-symbols')` would
 * report a failure that is actually the documentation doing its job.
 */

const SRC = join(__dirname, '..');
const REPO_ROOT = join(SRC, '..');

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

/** Packages that must never be reached from a neutral or web module. */
const PLATFORM_ONLY = [
  'expo-glass-effect',
  'expo-symbols',
  'expo-router',
  'react-native-screens',
] as const;

/**
 * Files resolved by a web bundler, a non-Metro bundler, or a consumer's `tsc`.
 * `expo-router/index.ts` and its siblings are deliberately absent — that subpath
 * is where the router packages are allowed to live.
 */
const NEUTRAL_AND_WEB_FILES = [
  'tab-bar/index.ts',
  'tab-bar/index.web.tsx',
  'tab-bar/types.ts',
  'tab-bar/shared.ts',
  'tab-bar/TabBarBase.tsx',
  'tab-bar/minimize-context.tsx',
  'tab-bar/surface.tsx',
  'tab-bar/surface.web.tsx',
  'tab-bar/glyph.tsx',
  'progressive-blur/index.web.tsx',
  'progressive-blur/shared.ts',
  'progressive-blur/types.ts',
] as const;

/**
 * Blank out comments so a doc comment discussing a package is not mistaken for
 * an import of it. Line comments are matched only when they START the line, so
 * a `//` inside a string literal (a URL) survives untouched.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
}

/** Every module specifier the file actually imports, re-exports or requires. */
function moduleSpecifiers(source: string): string[] {
  const code = stripComments(source);
  const patterns = [
    /\bfrom\s*['"]([^'"]+)['"]/g, // import … from 'x' / export … from 'x'
    /\bimport\s*['"]([^'"]+)['"]/g, // bare side-effect import 'x'
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  const found = new Set<string>();
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      if (match[1]) found.add(match[1]);
    }
  }
  return [...found];
}

/** True when `specifier` resolves to `pkg` (bare or a subpath of it). */
function isFrom(specifier: string, pkg: string): boolean {
  return specifier === pkg || specifier.startsWith(`${pkg}/`);
}

describe('tab-bar platform split', () => {
  it('the extractor sees real imports and ignores commented-out ones', () => {
    // Self-check: if `moduleSpecifiers` breaks, every assertion below would
    // pass vacuously by finding nothing.
    const probe = [
      "/* a doc comment naming expo-symbols and expo-router */",
      "// import { Nope } from 'react-native-screens';",
      "import { A } from 'react-native';",
      "export type { B } from './types';",
      "const c = require('expo-glass-effect');",
    ].join('\n');
    expect(moduleSpecifiers(probe).sort()).toEqual([
      './types',
      'expo-glass-effect',
      'react-native',
    ]);
  });

  it.each(NEUTRAL_AND_WEB_FILES)('%s imports no native-only or router package', (file) => {
    const specifiers = moduleSpecifiers(read(file));
    const leaked = specifiers.filter((s) => PLATFORM_ONLY.some((pkg) => isFrom(s, pkg)));
    expect(leaked).toEqual([]);
  });

  it('the web progressive blur drops expo-blur for one masked backdrop-filter', () => {
    // Ten stacked BlurViews would be ten composited backdrop passes per frame.
    expect(moduleSpecifiers(read('progressive-blur/index.web.tsx'))).not.toContain('expo-blur');
    expect(moduleSpecifiers(read('progressive-blur/index.tsx'))).toContain('expo-blur');
  });

  it('the native surface and glyph are the ONLY holders of the native packages', () => {
    // The guard above only proves absence; this proves the split is real rather
    // than the feature having quietly lost its native path.
    expect(moduleSpecifiers(read('tab-bar/surface.native.tsx'))).toContain('expo-glass-effect');
    expect(moduleSpecifiers(read('tab-bar/glyph.native.tsx'))).toContain('expo-symbols');
  });

  it('the router packages live only under tab-bar/expo-router', () => {
    const router = moduleSpecifiers(read('tab-bar/expo-router/RouterTabBar.tsx'));
    expect(router.some((s) => isFrom(s, 'expo-router'))).toBe(true);
    const screen = moduleSpecifiers(read('tab-bar/expo-router/fading-tab-screen.tsx'));
    expect(screen).toContain('react-native-screens');
  });

  it('the default entry imports the platform pieces BY BARE NAME (Metro picks .native)', () => {
    const specifiers = moduleSpecifiers(read('tab-bar/index.ts'));
    expect(specifiers).toContain('./surface');
    expect(specifiers).toContain('./glyph');
    expect(specifiers).toContain('../progressive-blur');
    // A `.web` path here would pin every platform to the web fork.
    expect(specifiers).not.toContain('./surface.web');
  });

  it('the web entry imports the web pieces by their FULL .web name', () => {
    // Inside the published `lib/` every file is plain `.js`, and no web bundler
    // resolves a bare `./surface` to the `.web` sibling — only Metro does.
    const specifiers = moduleSpecifiers(read('tab-bar/index.web.tsx'));
    expect(specifiers).toContain('./surface.web');
    expect(specifiers).toContain('../progressive-blur/index.web');
    expect(specifiers).not.toContain('./surface');
    // `./glyph` has no web fork: the neutral file already renders `item.icon`,
    // which is the correct web behaviour.
    expect(specifiers).toContain('./glyph');
  });
});

describe('tab-bar published surface', () => {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    exports: Record<string, { browser?: { import?: string; require?: string } }>;
  };

  it('exports ./tab-bar with a browser condition → index.web.js', () => {
    const entry = pkg.exports['./tab-bar'];
    expect(entry).toBeDefined();
    expect(entry?.browser?.import).toBe('./lib/module/tab-bar/index.web.js');
    expect(entry?.browser?.require).toBe('./lib/commonjs/tab-bar/index.web.js');
  });

  it('exports ./progressive-blur with a browser condition → index.web.js', () => {
    expect(pkg.exports['./progressive-blur']?.browser?.import).toBe(
      './lib/module/progressive-blur/index.web.js',
    );
  });

  it('exports ./tab-bar/expo-router with NO browser condition', () => {
    // The router adapter is universal — it only re-binds `TabBar`/`TabBarButton`,
    // whose own entry already resolves per platform. There is no `.web` sibling,
    // so a browser condition would point at a file bob never emits.
    const entry = pkg.exports['./tab-bar/expo-router'];
    expect(entry).toBeDefined();
    expect(entry?.browser).toBeUndefined();
  });

  it('the generator lists exactly the right subpaths as web-forked', () => {
    const gen = readFileSync(join(REPO_ROOT, 'scripts/generate-platform-exports.mjs'), 'utf8');
    const block = /const WEB_FORKED_SUBPATHS = new Set\(\[([\s\S]*?)\]\);/.exec(gen)?.[1];
    expect(block).toBeDefined();
    const listed = [...(block ?? '').matchAll(/^\s*'([^']+)',/gm)].map((m) => m[1]);
    expect(listed).toContain('./tab-bar');
    expect(listed).toContain('./progressive-blur');
    // `assertWebSourceExists()` throws for this one — it has no `.web` sibling.
    expect(listed).not.toContain('./tab-bar/expo-router');
  });
});
