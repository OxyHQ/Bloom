/**
 * @jest-environment node
 */

/**
 * Every published family has a STORY, a DOC and a TEST.
 *
 * RED WHEN WRITTEN (2026-08-14): of 79 published families, 38 had no story, 63
 * no doc and 20 no suite. It is written to the finished standard on purpose, because a coverage
 * gate that passes today by excluding what is missing measures the exclusion
 * list, not the coverage — and the exclusion list is the thing that only ever
 * grows. This note retires the moment the three lists are empty; nothing else
 * about the gate changes then, which is how you can tell it was not tuned to
 * the tree it was written against.
 *
 * Why all three, and why they are not substitutes:
 *   - A STORY is the only artifact rendered by a real browser, which is where
 *     every layout, animation and pointer bug in this package has been found.
 *     Jest sees structure and never whether a class resolved to CSS.
 *   - A DOC is what a consumer copies. Three of the defects this consolidation
 *     removed reached apps by being copied out of an example.
 *   - A TEST is the only one that runs in CI on every change.
 *
 * ATTRIBUTION IS DERIVED, NOT NAME-MATCHED. A family counts as tested when some
 * suite RESOLVES a relative import into `src/<family>/`, so renaming a component
 * cannot silently orphan its test and a test named after a family it no longer
 * exercises cannot count. The same reasoning is why a doc must NAME the family's
 * subpath or import one of its exports: `touch docs/<family>.mdx` is the cheapest
 * way to green a filename rule, and an empty file is not documentation.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const ROOT = join(__dirname, '..', '..');
const SRC = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');

/**
 * Doc stems that document a family under a different name, because the family
 * directory is not what a reader looks for. An EQUALITY: a family is either
 * documented at its own stem or listed here, and being in neither FAILS.
 */
const DOC_ALIASES: Readonly<Record<string, string>> = {
  // `surfaces/` publishes `alert()`, `confirm()` and `prompt()`; a reader looks
  // for the function, not the store behind it.
  surfaces: 'alert',
};

/** Doc subtrees that are not component documentation. */
const NON_DOC_DIRECTORIES = new Set(['superpowers']);

function families(): string[] {
  return readdirSync(SRC)
    .filter(
      (name) =>
        name !== '__tests__' && !name.startsWith('.') && statSync(join(SRC, name)).isDirectory(),
    )
    .sort();
}

/** Families a consumer can import: named by a subpath, or by the root barrel. */
function publishedFamilies(): Set<string> {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    exports: Record<string, Record<string, unknown> | string>;
  };
  const out = new Set<string>();
  for (const entry of Object.values(pkg.exports)) {
    if (typeof entry === 'string') continue;
    const rn = entry['react-native'];
    const source = typeof rn === 'object' && rn !== null ? (rn as { default?: unknown }).default : rn;
    if (typeof source !== 'string') continue;
    const rel = source.replace(/^\.\/src\//, '');
    if (rel.includes('/')) out.add(rel.slice(0, rel.indexOf('/')));
  }
  const barrel = readFileSync(join(SRC, 'index.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const match of barrel.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)) {
    const first = match[1]?.split('/')[0];
    if (first !== undefined) out.add(first);
  }
  const known = new Set(families());
  return new Set([...out].filter((name) => known.has(name)));
}

function walk(dir: string, match: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (NON_DOC_DIRECTORIES.has(name)) continue;
      walk(full, match, out);
    } else if (match.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const STORY_FILES = walk(SRC, /\.stories\.tsx?$/);
const TEST_FILES = walk(SRC, /\.(test|spec)\.tsx?$/);
const DOC_FILES = walk(DOCS, /\.mdx?$/);

/** Which family a file under `src/` belongs to. */
const familyOf = (file: string): string => relative(SRC, file).split('/')[0] ?? '';

function resolveLocal(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    base,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
    join(base, 'index.web.ts'),
    join(base, 'index.native.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Family -> the suites that reach into it, by resolving a relative specifier. */
function testedFamilies(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const file of TEST_FILES) {
    const text = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const specifiers = new Set<string>();
    const re =
      /from\s+['"](\.[^'"]+)['"]|require\(\s*['"](\.[^'"]+)['"]\s*\)|import\(\s*['"](\.[^'"]+)['"]\s*\)|jest\.mock\(\s*['"](\.[^'"]+)['"]/g;
    for (const match of text.matchAll(re)) {
      const spec = match[1] ?? match[2] ?? match[3] ?? match[4];
      if (spec !== undefined) specifiers.add(spec);
    }
    for (const spec of specifiers) {
      const resolved = resolveLocal(file, spec);
      if (resolved === null || !resolved.startsWith(SRC)) continue;
      const family = familyOf(resolved);
      const suites = out.get(family) ?? new Set<string>();
      suites.add(relative(SRC, file));
      out.set(family, suites);
    }
  }
  return out;
}

/** Every name a family's barrel exports — what a doc example would import. */
function exportedNames(family: string): Set<string> {
  const names = new Set<string>();
  const barrel = join(SRC, family, 'index.ts');
  if (!existsSync(barrel)) return names;
  const sf = ts.createSourceFile(
    barrel,
    readFileSync(barrel, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const visit = (node: ts.Node): void => {
    if (ts.isExportSpecifier(node)) names.add(node.name.text);
    if (ts.isNamespaceExport(node)) names.add(node.name.text);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) names.add(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return names;
}

/** Every `@oxyhq/bloom` import a doc's fenced code blocks make, plus its raw text. */
interface Doc {
  stem: string;
  text: string;
  /** Names imported from `@oxyhq/bloom` or one of its subpaths, in code fences. */
  imported: Set<string>;
  /** Subpaths named anywhere in the file. */
  subpaths: Set<string>;
}

function docs(): Doc[] {
  return DOC_FILES.map((file) => {
    const text = readFileSync(file, 'utf8');
    const imported = new Set<string>();
    const subpaths = new Set<string>();
    for (const match of text.matchAll(/@oxyhq\/bloom\/([a-z0-9-]+)/g)) {
      if (match[1] !== undefined) subpaths.add(match[1]);
    }
    for (const block of text.matchAll(/^```(?:tsx|ts|jsx|js)\n([\s\S]*?)^```/gm)) {
      const sf = ts.createSourceFile(
        'block.tsx',
        block[1] ?? '',
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      for (const stmt of sf.statements) {
        if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
        if (!stmt.moduleSpecifier.text.startsWith('@oxyhq/bloom')) continue;
        const bindings = stmt.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const el of bindings.elements) imported.add(el.name.text);
        } else if (bindings && ts.isNamespaceImport(bindings)) {
          imported.add(bindings.name.text);
        }
        if (stmt.importClause?.name) imported.add(stmt.importClause.name.text);
      }
    }
    return { stem: relative(DOCS, file).replace(/\.mdx?$/, ''), text, imported, subpaths };
  });
}

const FAMILIES = families();
const PUBLISHED = publishedFamilies();
const TESTED = testedFamilies();
const DOCS_PARSED = docs();
const STORY_FAMILIES = new Set(STORY_FILES.map(familyOf));

interface Row {
  family: string;
  story: boolean;
  doc: boolean;
  test: boolean;
}

const docStem = (family: string): string => DOC_ALIASES[family] ?? family;

/** A doc exists for the family AND says something about it. */
function documented(family: string): boolean {
  const stem = docStem(family);
  const doc = DOCS_PARSED.find((d) => d.stem === stem);
  if (doc === undefined) return false;
  if (doc.subpaths.has(family)) return true;
  const exports = exportedNames(family);
  return [...doc.imported].some((name) => exports.has(name));
}

const ROWS: Row[] = [...PUBLISHED].sort().map((family) => ({
  family,
  story: STORY_FAMILIES.has(family),
  doc: documented(family),
  test: (TESTED.get(family) ?? new Set()).size > 0,
}));

const missing = (pick: (row: Row) => boolean): string[] =>
  ROWS.filter((row) => !pick(row)).map((row) => row.family);

describe('the coverage census reads real artifacts', () => {
  it('finds the families, the stories, the docs and the suites', () => {
    // Vacuity floors: "everything is covered" and "the walk found no artifacts"
    // are opposite conclusions from the same empty read, and only the floors
    // tell them apart.
    expect(FAMILIES.length).toBeGreaterThanOrEqual(60);
    expect(PUBLISHED.size).toBeGreaterThanOrEqual(60);
    expect(STORY_FILES.length).toBeGreaterThanOrEqual(30);
    expect(TEST_FILES.length).toBeGreaterThanOrEqual(100);
    expect(DOC_FILES.length).toBeGreaterThanOrEqual(15);
  });

  it('attributes a suite to the family it actually imports (positive control)', () => {
    // In the currency of the measurement: the same resolution, over the same
    // files. `button` is the reference family — it has all three artifacts, so
    // if any collector broke, this is where it shows.
    expect(TESTED.get('button')?.size ?? 0).toBeGreaterThan(0);
    expect([...(TESTED.get('button') ?? [])]).toContain('__tests__/Button.test.tsx');
    expect(STORY_FAMILIES.has('button')).toBe(true);
    expect(documented('button')).toBe(true);
  });

  it('does not credit a doc that never mentions the family', () => {
    // Negative control WITH its own vacuity floor: a family whose doc stem does
    // not exist must read as undocumented, and the check must be looking at a
    // real doc set to say so. Without the floor, "not documented" is also what a
    // parse that read no docs reports — for every family at once.
    expect(DOCS_PARSED.length).toBeGreaterThanOrEqual(15);
    expect(DOCS_PARSED.some((d) => d.imported.size > 0)).toBe(true);
    expect(documented('there-is-no-such-family')).toBe(false);
  });
});

describe('every published family is covered', () => {
  it('has a story', () => {
    expect(missing((row) => row.story)).toEqual([]);
  });

  it('has a doc that names it', () => {
    expect(missing((row) => row.doc)).toEqual([]);
  });

  it('has a suite that imports it', () => {
    expect(missing((row) => row.test)).toEqual([]);
  });
});
