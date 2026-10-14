/**
 * @jest-environment node
 */

/**
 * No `<Svg>` in the source takes React Native's accessibility props directly:
 * they come from `svgA11yProps()` (`styles/svg-a11y.ts`).
 *
 * react-native-svg's web `<svg>` spreads every prop it does not consume onto the
 * DOM element. React Native's `accessible` therefore lands as an invalid
 * attribute — React logs "Received `false` for a non-boolean attribute
 * `accessible`" in every app that draws a shaped avatar — and
 * `accessibilityRole`/`accessibilityLabel` never reach the accessibility tree.
 * The ARIA spellings are no better on native, where react-native-svg does not
 * read them. Only the helper picks the right set per platform, so the rule is
 * that an `<Svg>` names none of them itself.
 *
 * `Shapes.test.tsx` checks what the helper emits on web; this checks that every
 * `<Svg>` uses it, including the ones no runtime test renders.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname, '..');
// React Native's own props. ARIA (`aria-hidden`, `aria-label`, `role`) is valid
// on a DOM `<svg>`, so a decorative mark that only sets `aria-hidden` is fine.
const RN_A11Y_PROP =
  /(?:^|\s)(accessible|accessibilityRole|accessibilityLabel|accessibilityHint|importantForAccessibility)(?=\s*=|\s|$)/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.(test|stories)\.tsx$/.test(name) ? [path] : [];
  });
}

interface SvgTag {
  line: number;
  /** The tag's attribute names: `{…}` values and strings blanked out. */
  attributes: string;
  /** The tag as written. */
  raw: string;
}

/** Each `<Svg …>` opening tag in `source`. */
function svgOpeningTags(source: string): SvgTag[] {
  const tags: SvgTag[] = [];
  for (const match of source.matchAll(/<Svg\b/g)) {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 0;
    let quote: string | null = null;
    let attributes = '';
    let end = start;
    for (let i = start; i < source.length; i += 1) {
      end = i;
      const char = source[i];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      } else if (char === '>' && depth === 0) {
        break;
      }
      // Only the top level holds attribute names; `{…}` holds their values.
      attributes += depth === 0 && !quote && char !== '}' ? char : ' ';
    }
    tags.push({
      line: source.slice(0, match.index).split('\n').length,
      attributes,
      raw: source.slice(start, end),
    });
  }
  return tags;
}

describe('Svg accessibility props', () => {
  const tags = sourceFiles(SRC).flatMap((file) =>
    svgOpeningTags(readFileSync(file, 'utf8')).map((tag) => ({
      ...tag,
      file: relative(SRC, file),
      where: `${relative(SRC, file)}:${tag.line}`,
    })),
  );

  it('finds the <Svg> elements it audits', () => {
    // The retired avatar renderer no longer contributes SVGs. Pin the remaining
    // helper users by name so removing one cannot hide behind a numeric floor.
    expect(tags.length).toBeGreaterThanOrEqual(20);
    expect(
      [
        ...new Set(
          tags.filter((tag) => tag.raw.includes('...svgA11yProps(')).map((tag) => tag.file),
        ),
      ].sort(),
    ).toEqual([
      'agent-creator/CustomColorPicker.tsx',
      'agent-creator/GlossArt.tsx',
      'agent-creator/ShapeArc.tsx',
      'shapes/Border.tsx',
      'shapes/Fill.tsx',
      'shapes/Image.tsx',
    ]);
  });

  it("gives no <Svg> React Native's accessibility props of its own", () => {
    const offenders = tags
      .map(({ where, attributes }) => ({ where, prop: attributes.match(RN_A11Y_PROP)?.[1] }))
      .filter((tag) => tag.prop !== undefined)
      .map(({ where, prop }) => `${where} passes \`${prop}\` — spread svgA11yProps() instead`);
    expect(offenders).toEqual([]);
  });
});
