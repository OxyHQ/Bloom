/**
 * @jest-environment node
 */

/**
 * `className` reaches a react-native primitive through `styled()`, never as a
 * bare prop smuggled in by a cast.
 *
 * The cast — `{...(className ? ({ className } as Record<string, string>) : {})}`
 * — was in 12 files. It compiles because the assertion erases the prop's
 * identity, and it appears to work because NativeWind v5's babel interop
 * rewrites the `style` of JSX elements in the CONSUMER's own source. It stops
 * working the moment the primitive is wrapped, or the consumer is on anything
 * else, and it fails by doing nothing: no error, no warning, a class that simply
 * never becomes a style.
 *
 * Two defects it was actively hiding, both found by converting it:
 *   - `OverlayRoot` never destructured `className`, so `Dialog`'s
 *     `containerClassName` was dropped for every side and bottom surface.
 *   - `DialogBottomSheet` spread the cast TWICE on one node, so `panelClassName`
 *     overwrote `containerClassName`.
 * A typed prop makes both of those a compile error rather than a silence.
 *
 * This scans the source rather than rendering: no runtime suite can see the
 * difference, because under the repo-wide react-native mock a bare `className`
 * prop reads straight back off the stub.
 *
 * STORIES ARE STILL SKIPPED, and that is now a known gap rather than a
 * deliberate exclusion. It was harmless while Storybook had no Tailwind
 * pipeline — no class resolved there either way — but the harness now compiles
 * the same stylesheet a consumer compiles, so a cast in a story renders a
 * working component as a broken one. Two casts survived there:
 * `SubtleHover.stories.tsx` (fixed: it uses `StyledPressable`) and
 * `PressableScale.stories.tsx`, which cannot be fixed in the story because
 * `PressableScale` wires no `className` at all — it wraps a bare
 * `Animated.createAnimatedComponent(Pressable)`, so the class has no `styled()`
 * to reach. Drop the skip below once that component follows `button/Button.tsx`
 * and builds its animated component from a styled primitive.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(__dirname, '..');

/**
 * Files allowed to SPREAD a `Record<...>` cast onto an element, and why. An
 * EQUALITY, so a new one fails until somebody decides about it.
 *
 * Every one passes a DOM attribute or handler react-native has no prop for, to a
 * node only web renders — not a `className`, which is what `styled()` answers.
 */
const CAST_EXEMPTIONS = [
  // `dataSet`, react-native-web's channel for a `data-*` attribute, used as the
  // CSS selector hook by the chip's own adopted sheet and applied only under
  // `Platform.OS === 'web'`. A class would be the obvious hook and is the one
  // thing that cannot work: `className` on a react-native primitive is consumed
  // by react-native-css into `style`, so no class ever reaches the DOM for a
  // `:focus-visible` rule to match.
  'chip/Chip.tsx',
  // The same, for the checkbox's focus ring.
  'checkbox/Checkbox.tsx',
  // The same, for the dots' reduced-motion media query.
  'connection-dots/ConnectionDots.web.tsx',
  // `onClick`, to stop a press inside the panel dismissing the dialog.
  'dialog/Dialog.web.tsx',
  // DOM mouse handlers, applied only under `Platform.OS === 'web'`.
  'text-field/TextField.tsx',
];

/** A line that is only a comment — the rule's own prose quotes what it forbids. */
const isComment = (line: string): boolean =>
  line.trimStart().startsWith('*') ||
  line.trimStart().startsWith('//') ||
  line.trimStart().startsWith('/*');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      out.push(...sourceFiles(full));
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (entry.endsWith('.stories.tsx')) continue;
    out.push(full);
  }
  return out;
}

const FILES = sourceFiles(SRC);
const SOURCES = new Map(FILES.map((f) => [relative(SRC, f), readFileSync(f, 'utf8')]));

describe('className goes through styled(), not a cast', () => {
  it('scanned the package', () => {
    // Vacuity floor: an empty scan and a clean one print the same result.
    expect(FILES.length).toBeGreaterThan(200);
    // Positive control: the scan can see the text it looks for. `styled(` must
    // appear somewhere, or the whole file is measuring nothing.
    const withStyled = [...SOURCES].filter(([, text]) => text.includes('styled('));
    expect(withStyled.length).toBeGreaterThan(0);
  });

  it('no file spreads a className cast', () => {
    // Line-based on purpose: every instance of this pattern is written on one
    // line, and a looser multi-line matcher would need its own vacuity floor.
    const offenders: string[] = [];
    for (const [file, text] of SOURCES) {
      text.split('\n').forEach((line, i) => {
        if (isComment(line)) return;
        if (/\{\s*\.\.\..*className.*as Record</.test(line)) {
          offenders.push(`${file}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the files that still SPREAD a Record cast are the web-only attribute cases', () => {
    // Scoped to a JSX SPREAD, which is the shape that smuggles an untyped prop
    // onto an element. `value as Record<string, unknown>` in ordinary narrowing
    // code (`scroll/expo-router`) is a different thing entirely, and folding the
    // two together would turn this list into a place where anything can hide.
    const casting = [...SOURCES]
      .filter(([, text]) => {
        const lines = text.split('\n');
        return lines.some((line, i) => {
          if (isComment(line)) return false;
          if (!/as Record<string, (string|unknown)>/.test(line)) return false;
          // The cast may close several lines below its `{...(`, so walk back to
          // the nearest opener that is not itself a comment.
          for (let j = i; j >= 0 && j > i - 12; j -= 1) {
            const candidate = lines[j] ?? '';
            if (isComment(candidate)) continue;
            if (/\{\s*\.\.\.\(/.test(candidate) || /\{\s*\.\.\.\(\{/.test(candidate)) return true;
            if (/^\s*(const|let|return|function|export)\b/.test(candidate)) return false;
          }
          return false;
        });
      })
      .map(([file]) => file)
      .sort();
    expect(casting).toEqual([...CAST_EXEMPTIONS].sort());
  });
});
