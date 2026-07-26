import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

/**
 * Every `Icons.*` reference in this repo must name an identifier `src/icons`
 * actually exports.
 *
 * Icon exports carry their full style and corner suffix
 * (`Home_Stroke2_Corner0_Rounded`), there are 250-odd of them, and a shortened
 * name is not a compile error anywhere it usually appears: in a DOC COMMENT or an
 * `.mdx` example, `tsc` never sees it. A reader copies it, gets `undefined`, and
 * React reports "Element type is invalid … but got: undefined" against the
 * consumer's own file — which is exactly how a phantom release blocker was filed
 * against the tab bar's native surface.
 *
 * Two shapes are checked, because the real incident needed both:
 *
 *   1. `Icons.Home` — a member that does not exist.
 *   2. `import { Icons } from '@oxyhq/bloom/icons'` — the NAMESPACE imported as a
 *      named export. `Icons` is assembled by the ROOT barrel
 *      (`export * as Icons from './icons'` in `src/index.ts`); the `./icons`
 *      subpath exports the components flat, so that import is `undefined` too.
 *      `import * as Icons from '@oxyhq/bloom/icons'` and
 *      `import { Icons } from '@oxyhq/bloom'` are both correct and must stay
 *      unflagged.
 *
 * Comments are deliberately NOT stripped here — the inverse of
 * `TabBarWebFork.test.ts`, which blanks them so a doc comment naming a package is
 * not mistaken for an import of it. Here the doc comments ARE the surface under
 * test: four of the five instances this test was written for lived in JSDoc.
 *
 * Identifiers are matched against the UNION of everything exported anywhere under
 * `src/icons`, because references legitimately target the barrel
 * (`../icons`), a single icon file (`../icons/Check`) and `../icons/common` alike.
 */

const SRC = join(__dirname, '..');
const REPO_ROOT = join(SRC, '..');
const ICONS_DIR = join(SRC, 'icons');

const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.mdx', '.md'];

/** True for a specifier that resolves to an icons module, package or relative. */
const ICONS_MODULE = /(?:^|\/)icons(?:\/|$)/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    // Agent worktrees under `.claude/` are full copies of this repo — scanning
    // them would double every file and report another checkout's problems.
    if (entry === 'node_modules' || entry === 'lib' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCANNED_EXTENSIONS.includes(extname(full))) out.push(full);
  }
  return out;
}

/** Every identifier a module exports, across every export shape in use here. */
function exportedNames(source: string): string[] {
  const found = new Set<string>();

  // `export const X` / `export function X` / `export class X` /
  // `export type X =` / `export interface X`
  for (const m of source.matchAll(
    /export\s+(?:declare\s+)?(?:const|let|var|function|class|type|interface)\s+([A-Za-z0-9_$]+)/g,
  )) {
    if (m[1]) found.add(m[1]);
  }

  // `export { A, B as C }` and `export type { A, B } from './x'` — the form that
  // carries `IconStyle` / `Props` out of `icons/common.tsx` through the barrel.
  // Missing it is what made an earlier pass of this check report two phantom
  // failures, and a check with known noise is a check somebody disables.
  for (const m of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const name of namedBindings(m[1] ?? '', 'export')) found.add(name);
  }

  return [...found];
}

/**
 * The bindings a brace list introduces.
 *
 * `as` means opposite things in the two directions: `export { A as B }` publishes
 * `B`, while `import { A as B }` reads `A`. Getting that backwards would make the
 * check blind to exactly the imports it exists to catch.
 */
function namedBindings(list: string, direction: 'import' | 'export'): string[] {
  const names: string[] = [];
  for (const raw of list.split(',')) {
    const part = raw.trim().replace(/^type\s+/, '');
    if (!part) continue;
    const sides = part.split(/\s+as\s+/).map((s) => s.trim());
    const name = direction === 'export' ? sides[sides.length - 1] : sides[0];
    if (name && /^[A-Za-z0-9_$]+$/.test(name) && name !== 'default') names.push(name);
  }
  return names;
}

/** The union of every identifier exported anywhere under `src/icons`. */
function iconExportUnion(): Set<string> {
  const union = new Set<string>();
  for (const file of walk(ICONS_DIR)) {
    for (const name of exportedNames(readFileSync(file, 'utf8'))) union.add(name);
  }
  return union;
}

interface Unresolved {
  line: number;
  ref: string;
}

/** Every icon reference in `source` that `exported` cannot satisfy. */
function unresolvedIconRefs(source: string, exported: Set<string>): Unresolved[] {
  const problems: Unresolved[] = [];

  source.split('\n').forEach((text, index) => {
    const line = index + 1;

    for (const m of text.matchAll(/\bIcons\.([A-Za-z0-9_$]+)/g)) {
      if (m[1] && !exported.has(m[1])) problems.push({ line, ref: `Icons.${m[1]}` });
    }

    // Braces only: `import * as Icons from …` is the correct namespace form, and a
    // bare `import '…/icons'` binds nothing.
    const imported = /\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/.exec(text);
    const specifier = imported?.[2];
    if (imported && specifier && ICONS_MODULE.test(specifier)) {
      for (const name of namedBindings(imported[1] ?? '', 'import')) {
        if (!exported.has(name)) problems.push({ line, ref: `{ ${name} } from '${specifier}'` });
      }
    }
  });

  return problems;
}

const ICON_EXPORTS = iconExportUnion();

const SCANNED = [
  ...walk(SRC),
  ...walk(join(REPO_ROOT, 'docs')),
  join(REPO_ROOT, 'README.md'),
  join(REPO_ROOT, 'AGENTS.md'),
];

/**
 * This file is the one exclusion, and it has to be: it SPELLS the mistakes it
 * forbids — in its probes, in the doc comment above, and in the `Icons.${…}`
 * template that formats a finding. Nothing outside a test copies an example out of
 * a test. The list is pinned to exactly one path in the first assertion below, so
 * it can neither grow quietly nor become a silent no-op through a typo.
 */
const EXCLUDED = [join(__dirname, 'icon-references.test.ts')];
const CHECKED = SCANNED.filter((file) => !EXCLUDED.includes(file));

describe('icon reference integrity', () => {
  it('reads a plausible repo — neither list may be empty or truncated', () => {
    // Without these floors a broken traversal or a broken extractor makes every
    // assertion below pass by finding nothing at all.
    expect(ICON_EXPORTS.size).toBeGreaterThan(200);
    expect(CHECKED.length).toBeGreaterThan(300);
    expect(CHECKED).toContain(join(SRC, 'tab-bar', 'types.ts'));
    expect(CHECKED).toContain(join(REPO_ROOT, 'docs', 'tab-bar.mdx'));

    // Exactly one file is exempt, and it really is in the scan — a misspelled path
    // here would make the exemption a no-op and the suite fail on itself instead.
    expect(EXCLUDED).toHaveLength(1);
    expect(SCANNED).toContain(EXCLUDED[0]);
    expect(CHECKED).not.toContain(EXCLUDED[0]);
  });

  it('collects every export shape src/icons uses, types included', () => {
    // The suffixed component itself, the helpers, and the two TYPE exports that an
    // earlier version of this check mistook for phantom references.
    for (const name of [
      'Home_Stroke2_Corner0_Rounded',
      'PlusLarge_Stroke2_Corner0_Rounded',
      'sizes',
      'useCommonSVGProps',
      'createSinglePathSVG',
      'IconStyle',
      'Props',
    ]) {
      expect([...ICON_EXPORTS]).toContain(name);
    }
    // And nothing shortened is in there, which is the premise of the whole test.
    expect(ICON_EXPORTS.has('Home')).toBe(false);
    expect(ICON_EXPORTS.has('Icons')).toBe(false);
  });

  it('resolves the export/import directions of `as` correctly', () => {
    // `export { A as B }` publishes B; `import { A as B }` reads A.
    expect(exportedNames("export { TimesLarge_Stroke2_Corner0_Rounded as X } from './Times';")).toEqual(
      ['X'],
    );
    expect(namedBindings('Check_Stroke2_Corner0_Rounded as CheckIcon', 'import')).toEqual([
      'Check_Stroke2_Corner0_Rounded',
    ]);
  });

  it('flags the two mistakes that have actually been made', () => {
    const probe = [
      "import { Icons } from '@oxyhq/bloom/icons';",
      'const a = <Icons.Home />;',
      "import { Bell, Home } from '@oxyhq/bloom/icons';",
      " * A doc comment saying `<Icons.Lock size=\"sm\" />`, which is where four of these lived.",
    ].join('\n');

    expect(unresolvedIconRefs(probe, ICON_EXPORTS)).toEqual([
      { line: 1, ref: "{ Icons } from '@oxyhq/bloom/icons'" },
      { line: 2, ref: 'Icons.Home' },
      { line: 3, ref: "{ Bell } from '@oxyhq/bloom/icons'" },
      { line: 3, ref: "{ Home } from '@oxyhq/bloom/icons'" },
      { line: 4, ref: 'Icons.Lock' },
    ]);
  });

  it('leaves every correct form alone', () => {
    const probe = [
      "import * as Icons from '@oxyhq/bloom/icons';",
      "import { Icons } from '@oxyhq/bloom';",
      'const a = <Icons.Home_Stroke2_Corner0_Rounded />;',
      "import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';",
      "import { type IconStyle, type Props as SVGIconProps } from '../icons/common';",
      '| `Icons` | `export * as Icons` | keep namespace | `Icons.*` |',
      "import { useState } from 'react';",
    ].join('\n');

    expect(unresolvedIconRefs(probe, ICON_EXPORTS)).toEqual([]);
  });

  it('every icon reference in src, docs, README and AGENTS resolves', () => {
    const problems = CHECKED.flatMap((file) =>
      unresolvedIconRefs(readFileSync(file, 'utf8'), ICON_EXPORTS).map(
        ({ line, ref }) => `${relative(REPO_ROOT, file)}:${line}  ${ref}`,
      ),
    );

    expect(problems).toEqual([]);
  });
});
