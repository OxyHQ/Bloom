import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * ONE family layout, and ONE file-naming convention.
 *
 * Every `src/<family>/` is `index.ts` (a pure barrel) + `<Pascal>.tsx` +
 * `types.ts`. Before this gate, 31 of 78 families declared their
 * implementation inside `index.tsx` instead — and the split did not correlate
 * with size, so it read as arbitrary rather than as a rule: `text-field` had
 * 620 lines and six components in its index, while `badge` (one component) had
 * the full treatment.
 *
 * Why it is worth a gate rather than a habit: an `index` that is both the
 * barrel and the implementation is what makes a family's public surface
 * invisible. Anything the file happens to export becomes API, so an internal
 * helper leaks by being written, not by being decided.
 *
 * THE ONE EXCEPTION IS THE FACTORY LAYOUT, and it is a real one. A web-forked
 * family whose fork differs only in which component it is BUILT FROM cannot
 * express that as a re-export: `alert-dialog`, `combobox` and `command`
 * construct themselves from `Dialog`/`Popover`, and each barrel binds the
 * platform's own. Written as a normal import, the shared implementation would
 * have to import the surface that imports it. So those barrels carry exactly
 * one `const X = createY(Z)` binding and nothing else.
 *
 * The exemption list is EXACT — an equality, not a floor. A list that only ever
 * grows is the gate switching itself off one defensible line at a time.
 */

const SRC = join(__dirname, '..');
const SKIP = new Set(['__tests__']);

/**
 * Barrels allowed to declare, because they BIND a factory. Exact set: a new
 * entry here has to be argued for, and a stale one fails.
 */
const FACTORY_BARRELS = [
  'alert-dialog/index.ts',
  'alert-dialog/index.web.ts',
  'combobox/index.ts',
  'combobox/index.web.ts',
  'command/index.ts',
  'command/index.web.ts',
  'surfaces/index.ts',
  'surfaces/index.web.ts',
  'tab-bar/index.ts',
  'tab-bar/index.web.ts',
].sort();

function families(): string[] {
  return readdirSync(SRC).filter(
    (name) => !SKIP.has(name) && !name.startsWith('.') && statSync(join(SRC, name)).isDirectory(),
  );
}

/** Every `index.*` under `src/`, one level deep and nested, relative to `src/`. */
function indexFiles(dir: string, prefix: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      indexFiles(full, `${prefix}${name}/`, out);
    } else if (/^index\.(native\.|web\.|node\.)?tsx?$/.test(name)) {
      out.push(`${prefix}${name}`);
    }
  }
  return out;
}

/** Names a barrel DECLARES (as opposed to forwards from another module). */
function declaredNames(rel: string): string[] {
  const file = join(SRC, rel);
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TSX,
  );
  const out: string[] = [];
  for (const stmt of sf.statements) {
    if (ts.isImportDeclaration(stmt)) continue;
    if (ts.isExportDeclaration(stmt)) continue; // `export … from` and local `export {}`
    if (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
      out.push(stmt.name?.text ?? '<anonymous>');
    } else if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) out.push(d.name.getText(sf));
    } else if (
      ts.isInterfaceDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    ) {
      out.push(stmt.name.text);
    } else if (ts.isExpressionStatement(stmt)) {
      out.push(`<statement> ${stmt.getText(sf).slice(0, 40)}`);
    }
  }
  return out;
}

const allIndexes = indexFiles(SRC, '').sort();
const declaring = allIndexes.filter((rel) => declaredNames(rel).length > 0);

describe('one family layout', () => {
  it('reads a real tree', () => {
    // Vacuity floors: "no barrel declares anything" is also what a walk that
    // found no barrels reports.
    expect(families().length).toBeGreaterThanOrEqual(60);
    expect(allIndexes.length).toBeGreaterThanOrEqual(90);
  });

  it('lets only the factory barrels declare, and exactly those', () => {
    expect(declaring.sort()).toEqual(FACTORY_BARRELS);
  });

  it('gives every factory barrel exactly one binding, so it stays a binding', () => {
    const offenders = FACTORY_BARRELS.map((rel) => [rel, declaredNames(rel)] as const)
      .filter(([, names]) => names.length !== 1)
      .map(([rel, names]) => `${rel}: declares ${names.length} (${names.join(', ')})`);
    // `tab-bar` binds two components from two factories; everything else binds
    // one. Recorded as the shape it has rather than waved through.
    expect(offenders).toEqual([
      'tab-bar/index.ts: declares 2 (TabBar, TabBarButton)',
      'tab-bar/index.web.ts: declares 2 (TabBar, TabBarButton)',
    ]);
  });

  it('writes every barrel as .ts — a barrel has no JSX to justify .tsx', () => {
    expect(allIndexes.filter((rel) => rel.endsWith('.tsx'))).toEqual([]);
  });
});

describe('one file-naming convention', () => {
  function allSourceFiles(dir: string, prefix: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) allSourceFiles(full, `${prefix}${name}/`, out);
      else if (/\.tsx?$/.test(name)) out.push(`${prefix}${name}`);
    }
    return out;
  }
  const files = allSourceFiles(SRC, '');

  it('reads a real tree', () => {
    expect(files.length).toBeGreaterThanOrEqual(400);
  });

  it('names every hook file use-kebab-case', () => {
    // `src/hooks/` was the one island of `useCamelCase.ts`, and no file in the
    // repo mixed the two — two internally consistent conventions that never met.
    const offenders = files.filter((rel) => /(^|\/)use[A-Z][A-Za-z]*\.tsx?$/.test(rel));
    expect(offenders).toEqual([]);
  });

  it('names the context module `context`', () => {
    const offenders = files.filter(
      (rel) => /context\.tsx?$/i.test(rel) && !/(^|\/)context\.tsx?$/.test(rel),
    );
    expect(offenders).toEqual([]);
  });

  it('names constants `constants.ts`, never `const.ts`', () => {
    // `tooltip/const.ts` sat one letter from `toast/constants.ts`.
    expect(files.filter((rel) => /(^|\/)consts?\.tsx?$/.test(rel))).toEqual([]);
  });

  it('names the cross-fork module `shared`, never `common`', () => {
    expect(files.filter((rel) => /(^|\/)common\.tsx?$/.test(rel))).toEqual([]);
  });

  it('still contains the files these rules are about (positive control)', () => {
    // Each rule above asserts an ABSENCE, which is also what a scan that read
    // nothing reports. So assert the conforming spellings are present.
    const present = (re: RegExp) => files.some((rel) => re.test(rel));
    expect(present(/(^|\/)use-[a-z-]+\.tsx?$/)).toBe(true);
    expect(present(/(^|\/)context\.tsx?$/)).toBe(true);
    expect(present(/(^|\/)constants\.ts$/)).toBe(true);
    expect(present(/(^|\/)shared\.tsx?$/)).toBe(true);
  });
});
