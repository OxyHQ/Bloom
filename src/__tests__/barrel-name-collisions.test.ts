/**
 * @jest-environment node
 */

/**
 * One name on a barrel means one DECLARATION.
 *
 * `Item` was offered twice by `src/index.ts`: `export * from './grouped-buttons'`
 * carried a `GroupedButtons` part called `Item`, and `export { Item } from './item'`
 * named the row component. tsc reported nothing — an explicit re-export shadows a
 * star export by design, so the file is well-formed — and the star's `Item` simply
 * stopped existing on the barrel while staying reachable from
 * `@oxyhq/bloom/grouped-buttons`. The same import specifier meant two different
 * components depending on which path a consumer took, and nothing anywhere said so.
 *
 * The two-star case is worse and equally silent: ES modules EXCLUDE a name two
 * `export *`s disagree about, so both components disappear from the barrel;
 * bob's CommonJS output resolves it first-wins instead, so the platform outputs
 * of one source file disagree about what `Bloom.X` is.
 *
 * WHY THIS RESOLVES ORIGINS RATHER THAN COUNTING NAMES. Re-offering the same
 * declaration through two routes is legal and harmless — `export * from './item'`
 * beside `export { Item } from './item'` is redundant, not ambiguous. Only two
 * distinct DECLARATIONS under one name are a defect, so every offer is followed
 * back through re-exports to the file and local name it comes from, and the
 * assertion is on the set of origins. A count-based check would fail the harmless
 * shape and its cheapest fix would be deleting a legitimate line.
 *
 * Scope is every barrel `package.json#exports` publishes, not just the root two:
 * a family barrel that offers one name from two of its own modules ships the
 * identical ambiguity one level down.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const ROOT = join(__dirname, '..', '..');
const SRC = join(__dirname, '..');

type Platform = 'native' | 'web';
interface Origin {
  /** Absolute path of the declaring file, or a bare package name if it leaves `src/`. */
  file: string;
  /** The name AT the declaration — an `as` rename does not change the identity. */
  name: string;
}

/**
 * Resolve a relative specifier the way the bundler for `platform` would. Metro
 * prefers a `.native.*` sibling; a web bundler reaching a `.web.*` file does so
 * because a barrel NAMED it, so the plain extension is tried first there too and
 * the suffixed form only matches when the specifier itself carries it.
 */
function resolveLocal(fromFile: string, spec: string, platform: Platform): string | null {
  const base = resolve(dirname(fromFile), spec);
  const suffixes =
    platform === 'native'
      ? ['.native.tsx', '.native.ts', '.tsx', '.ts']
      : ['.web.tsx', '.web.ts', '.tsx', '.ts'];
  const candidates = [
    ...suffixes.map((s) => `${base}${s}`),
    base,
    ...suffixes.map((s) => join(base, `index${s}`)),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

const exportCache = new Map<string, Map<string, Origin>>();

/** Every name a module exports, mapped to the declaration it comes from. */
function exportsOf(file: string, platform: Platform, stack: string[] = []): Map<string, Origin> {
  const key = `${platform}:${file}`;
  const cached = exportCache.get(key);
  if (cached) return cached;
  const out = new Map<string, Origin>();
  // Seed the cache before recursing: a cycle then resolves to what is known so
  // far rather than looping. Barrels re-exporting each other are ordinary.
  exportCache.set(key, out);
  if (stack.includes(file)) return out;

  const sf = parse(file);
  const imports = new Map<string, { spec: string; name: string }>();
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause) continue;
    if (!ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const clause = stmt.importClause;
    if (clause.name) imports.set(clause.name.text, { spec, name: 'default' });
    if (!clause.namedBindings) continue;
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        imports.set(el.name.text, { spec, name: (el.propertyName ?? el.name).text });
      }
    } else {
      imports.set(clause.namedBindings.name.text, { spec, name: '*' });
    }
  }

  const through = (spec: string, name: string): Origin => {
    if (!spec.startsWith('.')) return { file: spec, name };
    const target = resolveLocal(file, spec, platform);
    if (target === null) return { file: spec, name };
    if (name === '*' || name === 'default') return { file: target, name };
    return exportsOf(target, platform, [...stack, file]).get(name) ?? { file: target, name };
  };

  const originOfLocal = (local: string): Origin => {
    const imported = imports.get(local);
    return imported ? through(imported.spec, imported.name) : { file, name: local };
  };

  for (const stmt of sf.statements) {
    if (ts.isExportDeclaration(stmt)) {
      const spec =
        stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)
          ? stmt.moduleSpecifier.text
          : null;
      if (!stmt.exportClause) {
        if (spec === null || !spec.startsWith('.')) continue;
        const target = resolveLocal(file, spec, platform);
        if (target === null) continue;
        for (const [name, origin] of exportsOf(target, platform, [...stack, file])) {
          // A star export does not forward `default`.
          if (name === 'default') continue;
          if (!out.has(name)) out.set(name, origin);
        }
        continue;
      }
      if (ts.isNamespaceExport(stmt.exportClause)) {
        // `export * as X from './y'` DECLARES the namespace object here.
        out.set(stmt.exportClause.name.text, {
          file,
          name: `* as ${stmt.exportClause.name.text}`,
        });
        continue;
      }
      for (const el of stmt.exportClause.elements) {
        const local = (el.propertyName ?? el.name).text;
        out.set(el.name.text, spec === null ? originOfLocal(local) : through(spec, local));
      }
      continue;
    }
    const modifiers = ts.canHaveModifiers(stmt) ? (ts.getModifiers(stmt) ?? []) : [];
    if (!modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
      if (stmt.name) out.set(stmt.name.text, { file, name: stmt.name.text });
    } else if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) out.set(d.name.text, { file, name: d.name.text });
      }
    } else if (
      ts.isInterfaceDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    ) {
      out.set(stmt.name.text, { file, name: stmt.name.text });
    }
  }
  return out;
}

interface Offer {
  origin: Origin;
  via: string;
  line: number;
}

/** Every name a BARREL offers, grouped by name, one entry per export statement. */
function offers(barrel: string, platform: Platform): Map<string, Offer[]> {
  const found = new Map<string, Offer[]>();
  const push = (name: string, offer: Offer): void => {
    found.set(name, [...(found.get(name) ?? []), offer]);
  };
  const sf = parse(barrel);
  for (const stmt of sf.statements) {
    if (!ts.isExportDeclaration(stmt)) continue;
    if (!stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    if (!spec.startsWith('.')) continue;
    const line = sf.getLineAndCharacterOfPosition(stmt.getStart(sf)).line + 1;
    const target = resolveLocal(barrel, spec, platform);
    if (target === null) continue;
    const targetExports = exportsOf(target, platform);
    if (!stmt.exportClause) {
      for (const [name, origin] of targetExports) {
        if (name === 'default') continue;
        push(name, { origin, via: `export * from '${spec}'`, line });
      }
      continue;
    }
    if (ts.isNamespaceExport(stmt.exportClause)) {
      const name = stmt.exportClause.name.text;
      push(name, { origin: { file: target, name: '*' }, via: `export * as ${name}`, line });
      continue;
    }
    for (const el of stmt.exportClause.elements) {
      const local = (el.propertyName ?? el.name).text;
      const written = el.propertyName ? `${local} as ${el.name.text}` : local;
      push(el.name.text, {
        origin: targetExports.get(local) ?? { file: target, name: local },
        via: `export { ${written} } from '${spec}'`,
        line,
      });
    }
  }
  return found;
}

const show = (origin: Origin): string =>
  `${origin.file.startsWith('/') ? relative(SRC, origin.file) : origin.file}#${origin.name}`;

/** Names offered by two different declarations, formatted for the failure message. */
function collisions(barrel: string, platform: Platform): string[] {
  const out: string[] = [];
  for (const [name, list] of [...offers(barrel, platform)].sort()) {
    const distinct = new Set(list.map((o) => show(o.origin)));
    if (distinct.size < 2) continue;
    out.push(
      `${name}: ${list.map((o) => `line ${o.line} ${o.via} -> ${show(o.origin)}`).join('  |  ')}`,
    );
  }
  return out;
}

/** Every barrel `package.json#exports` publishes, as a source path under `src/`. */
function publishedBarrels(): Array<{ rel: string; platform: Platform }> {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    exports: Record<string, Record<string, unknown> | string>;
  };
  const out = new Map<string, Platform>();
  for (const entry of Object.values(pkg.exports)) {
    if (typeof entry === 'string') continue;
    const rn = entry['react-native'];
    const native = typeof rn === 'object' && rn !== null ? (rn as { default?: unknown }).default : rn;
    if (typeof native === 'string' && native.startsWith('./src/')) {
      out.set(native.replace('./src/', ''), 'native');
    }
    const browser = entry.browser;
    const built = typeof browser === 'object' && browser !== null ? (browser as { import?: unknown }).import : undefined;
    if (typeof built !== 'string') continue;
    const stem = built.replace(/^\.\/lib\/module\//, '').replace(/\.js$/, '');
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(join(SRC, `${stem}${ext}`))) {
        out.set(`${stem}${ext}`, 'web');
        break;
      }
    }
  }
  return [...out].map(([rel, platform]) => ({ rel, platform })).sort((a, b) => a.rel.localeCompare(b.rel));
}

const BARRELS = publishedBarrels();
const ROOT_BARRELS = BARRELS.filter(({ rel }) => rel === 'index.ts' || rel === 'index.web.ts');

describe('the resolver reads a real surface', () => {
  it('finds both root barrels among the published entry points', () => {
    // Vacuity floors. "No barrel collides" is also what a walk that resolved
    // nothing reports, so the measurement's own inputs carry floors.
    expect(ROOT_BARRELS.map((b) => b.rel).sort()).toEqual(['index.ts', 'index.web.ts']);
    expect(BARRELS.length).toBeGreaterThanOrEqual(80);
  });

  it('resolves a realistic number of names, back to the files that declare them', () => {
    for (const { rel, platform } of ROOT_BARRELS) {
      const offered = offers(join(SRC, rel), platform);
      expect(offered.size).toBeGreaterThanOrEqual(400);
      // Spot-check the resolution itself: an offer must land on a DECLARING
      // file, not on the barrel that forwarded it. If `through()` stopped
      // following re-exports, every origin would collapse onto a family index
      // and no two would ever differ — a check that cannot fail.
      const button = offered.get('Button');
      expect(button).toBeDefined();
      expect(show((button as Offer[])[0]?.origin as Origin)).toBe(
        platform === 'web' ? 'button/Button.web.tsx#Button' : 'button/Button.tsx#Button',
      );
      const declaringFiles = new Set(
        [...offered.values()].flatMap((list) => list.map((o) => o.origin.file)),
      );
      expect(declaringFiles.size).toBeGreaterThanOrEqual(100);
    }
  });

  it('reports a collision when one is present (positive control)', () => {
    // The control runs the MEASUREMENT, not a paraphrase of it: the same
    // `collisions()` over a barrel written on disk, resolving through the same
    // real family modules. It reproduces the `Item` shape — one name offered by
    // a star export and by an explicit re-export, from two different files.
    const fixture = join(SRC, '__tests__', 'support', 'collision-fixture-barrel.ts');
    const reported = collisions(fixture, 'native');
    expect(reported).toEqual([
      "Item: line 13 export * from '../../item' -> item/Item.tsx#Item  |  " +
        "line 14 export { Card as Item } from '../../card' -> card/Card.tsx#Card",
    ]);
    // …and stays quiet about the name the fixture offers TWICE from one
    // declaration, which is redundant and not ambiguous.
    expect(reported.some((line) => line.startsWith('Card:'))).toBe(false);
  });
});

describe('no barrel offers one name from two declarations', () => {
  for (const { rel, platform } of BARRELS) {
    it(`src/${rel}`, () => {
      expect(collisions(join(SRC, rel), platform)).toEqual([]);
    });
  }
});
