// A source gate for the one mistake that took every Bloom overlay down on web:
// writing `pointerEvents: 'box-none'` (or `'box-only'`) inside a STYLE object.
//
// react-native-web resolves those two RN-only values in `createDOMProps`, from
// the `pointerEvents` PROP — it maps the prop onto its own class pair
// (`self { none !important }` + `> * { auto }`). As a style-object value it is
// not valid CSS and is dropped, so the element silently keeps whatever it
// inherits. Inside the web Portal (root: `pointer-events: none`) that makes the
// entire surface click-through; outside it, a full-bleed `box-none` container
// becomes click-CATCHING and eats presses meant for the app under it. Both
// failure modes render perfectly and log nothing.
//
// `pointerEvents: 'auto' | 'none'` ARE valid CSS and stay allowed as styles —
// only the two RN-only values are banned.
//
// The runtime half of this contract is asserted in `overlay-pointer-events.test.tsx`.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
const BANNED = /pointerEvents:\s*['"](box-none|box-only)['"]/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('pointerEvents style-object form', () => {
  const files = sourceFiles(SRC);

  // Vacuity floor: a broken traversal would otherwise report a clean sweep.
  it('scans the whole source tree', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files.some((f) => f.endsWith(join('overlay', 'Overlay.tsx')))).toBe(true);
  });

  // Every dismiss scrim is the shared `Backdrop`. The dropdown surfaces used to
  // render a bare full-screen `Pressable` instead — a fourth copy of the idea,
  // and a fully transparent one, so menus dismissed but never dimmed or blurred
  // while dialogs and sheets did.
  it('routes every backdrop-styled element through <Backdrop>', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      // Every JSX element that takes the file's `styles.backdrop`, resolved back
      // to the tag that opens it.
      for (const match of source.matchAll(/style=\{(?:\[)?styles\.backdrop\b/g)) {
        const opener = source.slice(0, match.index).lastIndexOf('<');
        const tag = /^<([A-Za-z.]+)/.exec(source.slice(opener))?.[1] ?? '?';
        if (tag !== 'Backdrop' && tag !== 'AnimatedBackdrop') {
          const line = source.slice(0, match.index).split('\n').length;
          offenders.push(`${file.slice(SRC.length + 1)}:${line}  <${tag}> uses styles.backdrop`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never uses the RN-only values as styles — pass them as the prop', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      // Scan the whole SOURCE, not line by line: the toast positioner hid one
      // of these behind a multi-line ternary (`pointerEvents:\n  cond ? 'none'
      // : 'box-none'`) and a per-line regex sailed straight past it, which is
      // how a full-screen layer went on swallowing every tap under a toast.
      // Comments first: this file and several components DESCRIBE the banned
      // form in prose, and a scanner that flags its own documentation is a
      // scanner nobody keeps.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      // The value may sit behind a ternary on the next line, so allow a bounded
      // gap — but never one that crosses into a JSX prop (`pointerEvents=`) or
      // the next element (`<`), which is what turns this into a false positive.
      for (const match of code.matchAll(/pointerEvents:(?:(?!pointerEvents=|<)[\s\S]){0,160}?['"](box-none|box-only)['"]/g)) {
        const line = code.slice(0, match.index).split('\n').length;
        offenders.push(`${file.slice(SRC.length + 1)}:~${line}  ${match[0].replace(/\s+/g, ' ')}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
