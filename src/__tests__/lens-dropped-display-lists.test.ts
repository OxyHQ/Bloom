// A source gate for the lens engine's long-lived RenderNodes (packages/bloom-lens, Android).
//
// hwui drops the display list of a RenderNode that has left every tree. It happens when a window stops (the app goes
// to the background, the screen locks), when the last display list that drew the node is recorded again without it,
// and when the separate renderer of a still that drew it is destroyed. A View notices this through
// RenderNode.hasDisplayList() and records again. The lens keeps nodes of its own (the window page, each lens, each
// glass) and draws them again without recording them when nothing changed, so each of those reuses must ask the same
// question. Without the check, the page went empty after a scroll, once the stills that held it were released, and
// every glass on it drew black. After the app came back from the background, each glass drew nothing.
//
// The engine changes only through patches/bloom.patch (sync-from-upstream.sh), so every guard is asserted in the
// engine's source with comments stripped, and also as an added line of the patch.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const lens = join(__dirname, '../../packages/bloom-lens');
const engine = join(lens, 'android/src/main/java/so/oxy/bloom/glassmenu');
const patch = readFileSync(join(lens, 'patches/bloom.patch'), 'utf8');

// Kotlin without its comments: a comment that names a guard must not satisfy the gate.
function code(file: string): string {
  return readFileSync(join(engine, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

// The body of `fun <name>(`, braces matched; throws when the function is missing, so a rename fails the gate.
function body(source: string, name: string): string {
  const start = source.search(new RegExp(`fun ${name}\\(`));
  if (start < 0) throw new Error(`fun ${name} not found`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  throw new Error(`fun ${name} has no closing brace`);
}

const flat = (text: string) => text.replace(/\s+/g, ' ');

// Lines the patch adds, whitespace collapsed.
const added = patch
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .map((line) => flat(line.slice(1)).trim());

const guards: Array<{ file: string; fun: string; guard: RegExp; why: string }> = [
  {
    file: 'backdrop/GlassBackdrop.kt',
    fun: 'onPreDraw',
    guard: /val whole = [^\n]*!node\.hasDisplayList\(\)/,
    why: 'the window page is recorded again when its display list was dropped',
  },
  {
    file: 'backdrop/GlassLens.kt',
    fun: 'sample',
    guard: /if \([^\n]*!node\.hasDisplayList\(\)/,
    why: 'a lens whose node was dropped records it again before the glass draws it',
  },
  {
    file: 'backdrop/GlassLens.kt',
    fun: 'showPage',
    guard: /if \(!showsStill && recorded && node\.hasDisplayList\(\)/,
    why: 'showing the page again never keeps a dropped recording',
  },
  {
    file: 'render/GlassRenderer.kt',
    fun: 'sameAsRecorded',
    guard: /val same = glassNode\.hasDisplayList\(\) &&/,
    why: 'a glass whose recording was dropped is recorded again',
  },
  {
    file: 'GlassMenuAndroidView.kt',
    fun: 'drawRestInPlace',
    guard: /if \(!restRecorded \|\| !node\.hasDisplayList\(\)\)/,
    why: 'the pressed lens drawn in place is recorded again when dropped',
  },
  {
    file: 'overlay/GlassMenuSession.kt',
    fun: 'recordRows',
    guard: /if \(rowsDirty \|\| !node\.hasDisplayList\(\)\)/,
    why: "an open menu's rows are recorded again when dropped",
  },
  {
    file: 'overlay/GlassSubmenuLayer.kt',
    fun: 'recordRows',
    guard: /if \(rowsDirty \|\| !node\.hasDisplayList\(\)\)/,
    why: "an open submenu's rows are recorded again when dropped",
  },
];

describe('lens: a RenderNode drawn again without being recorded again checks that hwui kept its display list', () => {
  it.each(guards)('$file $fun: $why', ({ file, fun, guard }) => {
    const match = body(code(file), fun).match(guard);
    expect(match).not.toBeNull();
    // The same guard is an addition of the patch, so sync-from-upstream.sh reproduces it.
    const line = flat(match?.[0] ?? '').trim();
    expect(added.some((addedLine) => addedLine.includes(line))).toBe(true);
  });

  it('a lens lets go of a still after the next frame, not while that still may be the last to hold the page', () => {
    const source = code('backdrop/GlassLens.kt');
    // showPage releases nothing itself: a release there drops the page when every other lens rests on its own still.
    expect(body(source, 'showPage')).not.toMatch(/\.release\(\)/);
    expect(body(source, 'showPage')).toMatch(/letStillGo\(\)/);
    expect(flat(body(source, 'letStillGo'))).toMatch(
      /Choreographer\.getInstance\(\)\.postFrameCallback \{ old\.release\(\) \}/,
    );
  });

  it('strips comments: a guard named only in a comment does not count', () => {
    expect(code('backdrop/GlassBackdrop.kt')).not.toMatch(/hwui drops the display list/);
    expect(readFileSync(join(engine, 'backdrop/GlassBackdrop.kt'), 'utf8')).toMatch(
      /hwui drops the display list/,
    );
  });
});
