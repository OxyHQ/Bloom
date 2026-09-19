/**
 * An `<Svg>` that fills its parent absolutely must SAY how big it is.
 *
 * ── THE BUG ─────────────────────────────────────────────────────────────────
 *
 * `<Svg style={StyleSheet.absoluteFill}>` reads as complete and is wrong on
 * web. An `<svg>` is a REPLACED element: with `width: auto` its used width is
 * its INTRINSIC width, and an SVG carrying no intrinsic size falls back to
 * CSS's default 300 x 150. `position: absolute; left: 0; right: 0` therefore
 * does NOT stretch it — the box is over-constrained and `right` is dropped.
 *
 * Measured in Chrome (react-native-web 0.21, react-native-svg 15) on three
 * live surfaces, all of which had shipped:
 *
 *   PageHeader's scrim   760px-wide header → a 300 x 150 block with a hard
 *                        vertical edge down the middle of the screen
 *   GlassSurface's sheen 34px island → covered, but its vertical ramp scaled
 *                        over 150px instead of 36, so only the top quarter of
 *                        the gradient was ever visible
 *   Button's gradient    same, and a button wider than 300px stopped dead
 *
 * ── WHY NOTHING CAUGHT IT ───────────────────────────────────────────────────
 *
 * Native is UNAFFECTED: react-native-svg lays its host view out with flexbox
 * there, so `absoluteFill` does exactly what it says. The omission is therefore
 * correct on the platform most of this library is developed against, produces
 * no warning on either, and renders valid markup with a valid computed style.
 * A prop-level test sees `style={[{position:'absolute',…}]}` and agrees.
 *
 * ── WHY A SOURCE SCAN ───────────────────────────────────────────────────────
 *
 * The property is about the ABSENCE of two props, which is invisible to a
 * render test: the component renders, the SVG is there, and the only evidence
 * is a box measured by a real layout engine. A scan can see the absence
 * directly, and it covers every `<Svg>` in the tree rather than the handful a
 * suite happens to mount.
 *
 * The scan is narrow on purpose. It fires only on an `<Svg>` whose own props
 * mention `absoluteFill` — an SVG sized by `width={size}` or laid out in flow
 * is not affected and is not asked for anything.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname, '..');

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      tsxFiles(full, out);
    } else if (name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

/** Every `<Svg …>` opening tag in a file, as the raw text of its props. */
function svgTags(source: string): string[] {
  const tags: string[] = [];
  const re = /<Svg(\s[^>]*?)?\/?>/gs;
  for (const match of source.matchAll(re)) {
    tags.push(match[1] ?? '');
  }
  return tags;
}

const FILES = tsxFiles(SRC);

interface Offender {
  file: string;
  tag: string;
}

const offenders: Offender[] = [];
let absoluteFillTags = 0;

for (const file of FILES) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('<Svg')) continue;
  for (const tag of svgTags(source)) {
    if (!tag.includes('absoluteFill')) continue;
    absoluteFillTags += 1;
    const hasWidth = /\bwidth\s*=/.test(tag);
    const hasHeight = /\bheight\s*=/.test(tag);
    if (!hasWidth || !hasHeight) {
      offenders.push({ file: relative(SRC, file), tag: tag.trim().replace(/\s+/g, ' ') });
    }
  }
}

describe('an absolutely-filling Svg declares its size', () => {
  it('reads a real tree', () => {
    // Vacuity floors: "no offenders" is also what a walk that found no files,
    // or a matcher that recognises no `<Svg>`, reports.
    expect(FILES.length).toBeGreaterThanOrEqual(200);
    expect(absoluteFillTags).toBeGreaterThanOrEqual(3);
  });

  it('recognises the shape it is looking for', () => {
    // A positive control on the matcher itself, in both directions.
    const bad = svgTags('<Svg style={StyleSheet.absoluteFill}>');
    expect(bad).toHaveLength(1);
    expect(/\bwidth\s*=/.test(bad[0]!)).toBe(false);
    const good = svgTags('<Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>');
    expect(/\bwidth\s*=/.test(good[0]!)).toBe(true);
    expect(/\bheight\s*=/.test(good[0]!)).toBe(true);
    // And a multi-line tag, which is how two of the three real ones are written.
    const wrapped = svgTags('<Svg\n  width="100%"\n  height="100%"\n  style={StyleSheet.absoluteFill}\n>');
    expect(wrapped).toHaveLength(1);
    expect(/\bheight\s*=/.test(wrapped[0]!)).toBe(true);
  });

  it('finds none', () => {
    expect(offenders).toEqual([]);
  });
});
