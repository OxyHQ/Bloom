// A source gate for what the lens engine (packages/bloom-lens, Android) costs RenderThread and the GPU per frame.
//
// Measured on a Pixel 8a in Mention (AGENTS.rules.md, lens menu): a still let go through a renderer that draws to a
// surface waited on RenderThread for the GPU to go idle (7 to 23 ms as a menu closed); a menu's glass sampled the live
// page for the whole of its opening; and a frame of an opening menu invalidated the overlay,
// a damage of the whole window, so the page was drawn again and the glass's blur and material ran over the whole of
// the menu's capture on every frame. These gates keep each fix in the engine's source, with comments stripped, and as
// an added line of the patch (the engine changes only through patches/bloom.patch and sync-from-upstream.sh).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const lens = join(__dirname, '../../packages/bloom-lens');
const engine = join(lens, 'android/src/main/java/so/oxy/bloom/glassmenu');
const patch = readFileSync(join(lens, 'patches/bloom.patch'), 'utf8');

// Kotlin without its comments: a comment that names a fix must not satisfy the gate.
function code(file: string): string {
  return readFileSync(join(engine, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

// The braces-matched block that starts at the first match of [start]; throws when it is missing.
function block(source: string, start: RegExp): string {
  const at = source.search(start);
  if (at < 0) throw new Error(`${start} not found`);
  const open = source.indexOf('{', at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  throw new Error(`${start} has no closing brace`);
}

const fun = (source: string, name: string) => block(source, new RegExp(`fun ${name}\\(`));
const flat = (text: string) => text.replace(/\s+/g, ' ').trim();

const added = patch
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .map((line) => flat(line.slice(1)));

// [text] is in the source and is a line the patch adds.
function expectPatched(source: string, text: RegExp) {
  const match = source.match(text);
  expect(match).not.toBeNull();
  const line = flat(match?.[0] ?? '');
  expect(added.some((addedLine) => addedLine.includes(line))).toBe(true);
}

describe('lens: a still lets go of its buffer without waiting for the GPU', () => {
  const still = code('render/GlassStill.kt');

  it('renders into one hardware buffer with no surface on Android 14 and later', () => {
    expectPatched(
      still,
      /if \(Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.UPSIDE_DOWN_CAKE\) BufferTarget\(\)/,
    );
    const target = block(still, /private inner class BufferTarget/);
    expect(target).toMatch(/HardwareBufferRenderer\(buffer\)/);
    expect(target).not.toMatch(/setSurface|ImageReader/);
    // The bitmap is handed over only once the GPU has drawn it.
    expect(flat(target)).toMatch(/result\.fence\.awaitForever\(\)/);
  });
});

describe('lens: a quiet region takes its still as soon as it has settled', () => {
  const glassLens = code('backdrop/GlassLens.kt');

  it('a new region is as quiet as the page behind it, and a moving one takes no still', () => {
    expectPatched(fun(glassLens, 'sample'), /showPage\(page\.lastChangeIn\(region, now\)\)/);
    expectPatched(fun(glassLens, 'frame'), /now - placedAt >= SettleMs/);
  });
});

describe("lens: a frame of an open menu damages the menu's area, not the window", () => {
  const overlay = code('overlay/GlassMenuOverlay.kt');

  it('a frame of the menu alone records its bounded node and asks the window for a frame', () => {
    expectPatched(fun(overlay, 'doFrame'), /redrawSession\(active\)/);
    const redraw = fun(overlay, 'redrawSession');
    expectPatched(redraw, /window\.onDescendantInvalidated\(root, this\)/);
    expect(redraw).toMatch(/recordSession\(active, page\)/);
    expectPatched(fun(overlay, 'recordSession'), /active\.drawnBounds\(sessionBounds, limits\)/);
  });
});
