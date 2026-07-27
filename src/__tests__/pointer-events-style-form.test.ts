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
    expect(files.some((f) => f.endsWith(join('overlay', 'index.tsx')))).toBe(true);
  });

  it('never uses the RN-only values as styles — pass them as the prop', () => {
    const offenders = files
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => ({ file: file.slice(SRC.length + 1), line: i + 1, text: line.trim() }))
          .filter(({ text }) => BANNED.test(text) && !text.startsWith('*') && !text.startsWith('//')),
      )
      .map(({ file, line, text }) => `${file}:${line}  ${text}`);

    expect(offenders).toEqual([]);
  });
});
