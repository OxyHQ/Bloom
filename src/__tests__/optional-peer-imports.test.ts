// A source gate for the contradiction that takes a consumer's native bundle
// down before it ever runs: a package declared an OPTIONAL peer, imported
// STATICALLY.
//
// Those two statements cannot both be true. Metro resolves every static import
// in the eager graph, so omitting an "optional" peer does not degrade — it
// aborts the whole bundle with `Unable to resolve module <peer>`, naming a
// package the app never mentions. `@react-native-community/netinfo` was exactly
// this shape (with an empty-string version range on top), and the same defect
// had already shipped fleet-wide from `@oxyhq/protocol`'s `expo-crypto`.
//
// The fix an optional peer must use instead is a `require()` of a STRING
// LITERAL inside a `try` block: Metro collects that as an optional dependency
// (`isOptional: true`), resolving the real module when installed and writing
// `null` into the dependency map when it is not, so the failure lands at
// evaluation instead of at build. Bloom's own `lazyRequire()` helper does NOT
// qualify — it passes the specifier as a variable, which Metro rewrites into a
// thrower ("Dynamic require defined at line N; not supported by Metro").
//
// Type-only imports are deliberately not flagged: they emit no require, so they
// cannot break a bundle. (Whether they leak into consumers' typechecks is the
// separate concern the split `react-native` export condition closes.)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');
const PKG = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8')) as {
  peerDependencies: Record<string, string>;
  peerDependenciesMeta: Record<string, { optional?: boolean }>;
};

const OPTIONAL_PEERS = Object.entries(PKG.peerDependenciesMeta)
  .filter(([, meta]) => meta.optional === true)
  .map(([name]) => name);

/**
 * Static imports of an optional peer that are known-safe, each because the
 * package is guaranteed present in the only environment that reaches the file.
 * An entry here is an assertion that the peer CANNOT actually be absent — not a
 * TODO. The stale-exemption test below fails if one stops being imported, so
 * this list can never quietly outlive its subject.
 */
const ALLOWED: { peer: string; file: string; why: string }[] = [
  {
    peer: 'expo-font',
    file: 'fonts/FontLoader.native.tsx',
    why: 'expo-font is a hard dependency of `expo` itself, so any app that can reach a .native file has it',
  },
  {
    peer: 'react-dom',
    file: 'portal/index.web.tsx',
    why: 'react-native-web depends on react-dom, so a web bundle rendering Bloom always has it',
  },
  {
    peer: 'expo-router',
    file: 'scroll/index.web.tsx',
    why: 'scroll restoration is expo-router-only by design — this is the import that keeps BloomProvider out of Vite/SPA consumers (see AGENTS.md "App Root Provider")',
  },
];

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

/** `pkg` itself or any of its subpaths (`react-dom/client`). */
function specifierTargets(specifier: string, pkg: string): boolean {
  return specifier === pkg || specifier.startsWith(`${pkg}/`);
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

/** Every value-position `import`/`export ... from` specifier in a file. */
function valueImportSpecifiers(source: ts.SourceFile): { specifier: string; line: number }[] {
  const found: { specifier: string; line: number }[] = [];

  for (const statement of source.statements) {
    const isImport = ts.isImportDeclaration(statement);
    const isExportFrom = ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined;
    if (!isImport && !isExportFrom) continue;

    // `import type … from` / `export type … from` emit nothing at runtime.
    if (isImport && statement.importClause?.isTypeOnly) continue;
    if (isExportFrom && statement.isTypeOnly) continue;

    const moduleSpecifier = isImport ? statement.moduleSpecifier : statement.moduleSpecifier;
    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue;

    found.push({
      specifier: moduleSpecifier.text,
      line: source.getLineAndCharacterOfPosition(statement.getStart(source)).line + 1,
    });
  }

  return found;
}

describe('optional peers are never static imports', () => {
  const files = sourceFiles(SRC);

  // Vacuity floors: a broken traversal, or a manifest read that silently
  // produced an empty peer set, would otherwise report a clean sweep.
  it('scans the whole source tree against a non-empty optional-peer set', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files.some((f) => f.endsWith(join('connection-status', 'netinfo.ts')))).toBe(true);
    expect(OPTIONAL_PEERS.length).toBeGreaterThanOrEqual(5);
    expect(OPTIONAL_PEERS).toContain('@react-native-community/netinfo');
  });

  it('declares a real version range for every peer', () => {
    const offenders: string[] = [];

    for (const [name, range] of Object.entries(PKG.peerDependencies)) {
      // The wart this guards is `""` — a range that constrains nothing and that
      // no package manager can act on. `*` is a deliberate "any version"; every
      // other range has to carry a number.
      if (range.trim() !== '*' && !/\d/.test(range)) {
        offenders.push(`${name}: ${JSON.stringify(range)}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('lists every optional peer in peerDependencies', () => {
    const missing = OPTIONAL_PEERS.filter((peer) => !(peer in PKG.peerDependencies));
    expect(missing).toEqual([]);
  });

  it('never statically imports one outside the documented allowlist', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const relative = file.slice(SRC.length + 1);
      for (const { specifier, line } of valueImportSpecifiers(parse(file))) {
        const peer = OPTIONAL_PEERS.find((candidate) => specifierTargets(specifier, candidate));
        if (!peer) continue;
        if (ALLOWED.some((entry) => entry.peer === peer && entry.file === relative)) continue;
        offenders.push(
          `${relative}:${line}  imports optional peer '${specifier}' — load it with ` +
            "`try { require('<literal>') } catch` (see connection-status/netinfo.ts) " +
            'or make it a non-optional peer',
        );
      }
    }

    expect(offenders).toEqual([]);
  });

  // An exemption that no longer describes anything is worse than no exemption:
  // it silently pre-approves the next import someone adds to that file.
  it('keeps no stale allowlist entries', () => {
    const stale: string[] = [];

    for (const entry of ALLOWED) {
      const specifiers = valueImportSpecifiers(parse(join(SRC, entry.file)));
      if (!specifiers.some(({ specifier }) => specifierTargets(specifier, entry.peer))) {
        stale.push(`${entry.file} no longer imports '${entry.peer}' — drop the allowlist entry`);
      }
    }

    expect(stale).toEqual([]);
  });
});

describe('netinfo is loaded through Metro’s optional-dependency form', () => {
  const file = join(SRC, 'connection-status', 'netinfo.ts');
  const source = parse(file);

  /** Every `require('<literal>')` call in the file, with its enclosing-try status. */
  function literalRequires(): { specifier: string; insideTry: boolean }[] {
    const found: { specifier: string; insideTry: boolean }[] = [];

    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'require' &&
        node.arguments.length === 1
      ) {
        const [argument] = node.arguments;
        if (argument && ts.isStringLiteral(argument)) {
          let insideTry = false;
          for (let parent: ts.Node | undefined = node.parent; parent; parent = parent.parent) {
            if (ts.isTryStatement(parent)) {
              insideTry = true;
              break;
            }
          }
          found.push({ specifier: argument.text, insideTry });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(source);
    return found;
  }

  it('requires the literal specifier from inside a try block', () => {
    // Metro only marks a dependency optional when BOTH hold: the specifier is a
    // string literal (a variable is rewritten into a thrower) and the call sits
    // inside a `try` (otherwise an absent module fails the build).
    expect(literalRequires()).toContainEqual({
      specifier: '@react-native-community/netinfo',
      insideTry: true,
    });
  });

  it('does not route netinfo through lazyRequire, whose specifier is a variable', () => {
    // Comments first: this file DESCRIBES why `lazyRequire` is unusable here,
    // and a scanner that flags its own documentation is one nobody keeps.
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    expect(code).not.toMatch(/lazyRequire\s*[<(]/);
  });
});
