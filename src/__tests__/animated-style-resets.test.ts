// A source gate for animated styles that leave a stale value on native.
//
// Reanimated hands a worklet's style to native through `jsi::dynamicFromValue`,
// which drops every key whose value is `undefined`; a key the worklet leaves out
// is never sent either. Either way the view keeps the last value the worklet
// gave that key: AppShell's detail panel, hidden (`maxHeight: 0`) and shown
// again (`maxHeight: undefined`), stayed a zero-height line on Android, iOS and
// OxyOS until something else committed. `styles/animated-style.ts` has the
// rule: every key on every run, an explicit value or `UNSET`.
//
// Jest's Reanimated mock applies a worklet's style as React does, so no
// rendered test can see this; the source can.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.(stories|d)\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every `useAnimatedStyle(...)` call's argument list, with the line it starts on. */
function animatedStyles(source: string): { line: number; body: string }[] {
  const found: { line: number; body: string }[] = [];
  const pattern = /useAnimatedStyle\(/g;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (depth > 0 && end < source.length) {
      const char = source[end++];
      if (char === '(') depth++;
      else if (char === ')') depth--;
    }
    found.push({
      line: source.slice(0, match.index).split('\n').length,
      body: source.slice(match.index + match[0].length, end - 1),
    });
  }
  return found;
}

// A branch that returns no keys at all, where what decides it never changes
// while the view is mounted with this style (the platform, a prop the view is
// keyed on, a style passed only while enabled). Each with the reason; an
// EQUALITY, so a fixed or moved one fails until it is removed here.
const EMPTY_BRANCH_ALLOWED: Record<string, string> = {
  'app-shell/AppShellEngine.tsx': 'overlayDrawerStyle: its view is mounted only under swipeOverlay',
  'app-shell/AppShellPanelLayout.tsx': 'sizing: cssScope is fixed for the layout instance',
  'app-shell/EdgeDock.tsx':
    'useDockSlotStyle returns its style only while enabled; peek progress is a fixed prop',
  'chat-composer/create-chat-composer.tsx': 'IS_WEB',
  'composer-panel/ComposerPillBase.tsx': 'IS_WEB',
  'media-header/StickyMediaTopBar.tsx': 'IS_WEB',
  'sidebar/Sidebar.tsx': 'IS_WEB',
};
const EMPTY_BRANCH = /(?:[?:]\s*\(?\s*\{\s*\}|return\s*\{\s*\})/;

describe('animated styles write every key on every run', () => {
  const files = sourceFiles(SRC);
  const styles = files.flatMap((file) =>
    animatedStyles(readFileSync(file, 'utf8')).map((style) => ({
      file: relative(SRC, file),
      ...style,
    })),
  );

  it('scans every animated style in the source tree', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(styles.length).toBeGreaterThan(100);
  });

  it('never gives a key `undefined` (dropped on native: UNSET instead); comparing with it is fine', () => {
    const offenders = styles
      .filter(({ body }) => /\bundefined\b/.test(body.replace(/[!=]==?\s*undefined\b/g, '')))
      .map(({ file, line }) => `${file}:${line}`);
    expect(offenders).toEqual([]);
  });

  it('never leaves every key out, but where what decides it is fixed', () => {
    const empty = [
      ...new Set(styles.filter(({ body }) => EMPTY_BRANCH.test(body)).map(({ file }) => file)),
    ].sort();
    expect(empty).toEqual(Object.keys(EMPTY_BRANCH_ALLOWED).sort());
  });
});
