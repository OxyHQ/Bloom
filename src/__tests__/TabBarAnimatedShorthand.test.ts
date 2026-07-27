import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * No reanimated mapper may return a React Native style SHORTHAND that
 * react-native-web does not expand.
 *
 * Reanimated's web path hands a mapper's result to RNW's `createReactDOMStyle`
 * and then assigns each surviving key straight onto the DOM node's `style`. That
 * function expands a fixed set of shorthands (`marginInline`, `paddingInline`,
 * `borderWidth`, `borderRadius`, `insetInline`, …) but NOT React Native's own
 * `marginHorizontal` / `marginVertical` / `paddingHorizontal` / `paddingVertical`
 * — verified absent from the entire file in RNW 0.21.2. An unexpanded shorthand
 * becomes `element.style.marginHorizontal = '34px'`, which is not a CSS property,
 * so the browser drops it WITHOUT any error.
 *
 * This shipped once: `barStyle` animated `marginHorizontal` (copied verbatim from
 * upstream expo-glass-tabs, which only ever ran on native). On web the bar kept
 * its full width while `highlightStyle` still subtracted `MINIMIZED_INSET` from
 * `barWidth`, so the sliding highlight sat ~13.6px narrower than the tab beneath
 * it at five tabs — visible only once the bar minimized.
 *
 * STATIC styles are fine and are deliberately not scanned: `StyleSheet.create`
 * takes RNW's own StyleSheet path, which does handle the shorthand. The trap is
 * specific to values produced inside a mapper.
 *
 * Neither tsc nor jest can see this: the shorthand is a valid RN style key, so it
 * type-checks, and the reanimated mock never touches the DOM. Source analysis is
 * the only automatable guard.
 */

const SRC = join(__dirname, '..');
const ROOTS = ['tab-bar', 'progressive-blur'] as const;
const MAPPERS = ['useAnimatedStyle', 'useDerivedValue', 'useAnimatedProps'] as const;

/** RN shorthands with no entry in RNW's `STYLE_SHORT_FORM_EXPANSIONS`. */
const UNEXPANDED_SHORTHANDS = [
  'marginHorizontal',
  'marginVertical',
  'paddingHorizontal',
  'paddingVertical',
] as const;

function sourceFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry)) continue;
      if (/\.(test|spec|stories)\.tsx?$/.test(entry)) continue;
      out.push(full);
    }
  };
  walk(join(SRC, root));
  return out;
}

/**
 * The body of every mapper call in `source`, matched by brace depth from the
 * mapper's opening paren so nested objects and callbacks are included whole.
 */
function mapperBodies(source: string): string[] {
  const bodies: string[] = [];
  for (const mapper of MAPPERS) {
    let from = 0;
    for (;;) {
      const start = source.indexOf(`${mapper}(`, from);
      if (start === -1) break;
      let depth = 0;
      let index = source.indexOf('(', start);
      const open = index;
      for (; index < source.length; index += 1) {
        const char = source[index];
        if (char === '(') depth += 1;
        else if (char === ')') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      bodies.push(source.slice(open, index));
      from = index === -1 ? start + mapper.length : index;
    }
  }
  return bodies;
}

describe('tab-bar animated styles', () => {
  const files = ROOTS.flatMap(sourceFiles);

  // Self-check: a broken walk must not pass vacuously.
  it('walks the real sources', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
    const withMappers = files.filter((file) => mapperBodies(readFileSync(file, 'utf8')).length > 0);
    expect(withMappers.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts a mapper body that really contains its returned keys', () => {
    const base = files.find((file) => file.endsWith('TabBarBase.tsx'));
    expect(base).toBeDefined();
    const bodies = mapperBodies(readFileSync(base as string, 'utf8'));
    expect(bodies.length).toBeGreaterThanOrEqual(6);
    // `highlightStyle` is the mapper that computes the capsule geometry.
    expect(bodies.some((body) => body.includes('borderRadius'))).toBe(true);
  });

  it.each(UNEXPANDED_SHORTHANDS)('never returns %s from a mapper', (shorthand) => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const body of mapperBodies(readFileSync(file, 'utf8'))) {
        // Strip comments so the explanatory notes naming the shorthand do not
        // trip the guard that exists because of them.
        const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        if (new RegExp(`\\b${shorthand}\\s*:`).test(code)) {
          offenders.push(relative(SRC, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('animates the minimized inset as both long-form margins', () => {
    const base = readFileSync(
      files.find((file) => file.endsWith('TabBarBase.tsx')) as string,
      'utf8',
    );
    const barStyle = mapperBodies(base).find((body) => body.includes('MINIMIZED_INSET'));
    expect(barStyle).toBeDefined();
    expect(barStyle).toMatch(/marginLeft:/);
    expect(barStyle).toMatch(/marginRight:/);
  });
});
