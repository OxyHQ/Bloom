// A source gate for the two ways Bloom can get an optional peer's load shape
// wrong. They fail in opposite directions and only one of them is loud.
//
// (1) OPTIONAL PEER, STATIC IMPORT — takes a consumer's native bundle down
// before it ever runs. Those two statements cannot both be true: Metro resolves
// every static import in the eager graph, so omitting an "optional" peer does
// not degrade, it aborts the whole bundle with `Unable to resolve module
// <peer>`, naming a package the app never mentions.
// `@react-native-community/netinfo` was exactly this shape (with an
// empty-string version range on top), and the same defect had already shipped
// fleet-wide from `@oxyhq/protocol`'s `expo-crypto`.
//
// (2) DYNAMIC REQUIRE WITH AN UNEVALUABLE SPECIFIER — silent, and therefore
// worse. Metro can only collect a dependency whose specifier it can evaluate
// statically; anything else it rewrites into an inlined thrower ("Dynamic
// require defined at line N; not supported by Metro"), so the call resolves
// NOTHING from a consumer's `node_modules` whether or not the package is
// installed. A caller that catches the throw and degrades then degrades ALWAYS.
// Bloom's deleted `lazyRequire()` helper took the specifier as a function
// PARAMETER — the unevaluable case — and silently killed haptics, the squircle
// avatar clip, the spinner and `BloomColorScope`'s native scoping on every
// device for as long as it shipped. Only jest (CommonJS, with a real dynamic
// `require`) made it look like it worked, which is why no runtime suite could
// catch it and why this file, a STATIC scan, is the gate.
//
// The shape that satisfies both is narrower than "a require in a try", and the
// difference is not cosmetic. Verified against metro 0.83.5's own
// `collectDependencies` + `isOptionalDependency`:
//
//   require(functionParameter)              -> no dependency at all, thrower
//   const n = 'pkg'; require(n)  in try     -> optional  (Metro folds the const)
//   require('pkg')  nested in an if in try  -> NOT optional
//   require('pkg')  direct statement of try -> optional
//   require('pkg')  with no try             -> NOT optional
//
// `isOptionalDependency` walks up from the call and returns at the FIRST
// BlockStatement it meets, marking the dependency optional only if that block
// belongs to a `try`. One `if`/`else` of nesting loses it — and a non-optional
// dependency that cannot be resolved fails the BUILD, which is the very failure
// the boundary exists to prevent. So the rule is: a STRING LITERAL, as a DIRECT
// STATEMENT of a `try` block. Both halves are asserted below.
//
// Type-only imports are deliberately not flagged: they emit no require, so they
// cannot break a bundle. (Whether they leak into consumers' typechecks is the
// separate concern the split `react-native` export condition closes.)

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');
const PKG = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
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

/**
 * Every optional peer Bloom loads at RUNTIME, and the one file allowed to load
 * it. The test below asserts this table and the source tree describe the same
 * set in both directions: a boundary that moves file, and a peer that acquires a
 * second undocumented load site, both fail here.
 */
const DYNAMIC_BOUNDARIES: { peer: string; file: string }[] = [
  { peer: '@react-native-community/netinfo', file: 'connection-status/netinfo.ts' },
  { peer: 'expo-haptics', file: 'hooks/haptics-module.ts' },
  { peer: 'nativewind', file: 'theme/color-scope/style-builder.ts' },
  { peer: 'expo-router', file: 'theme/adaptive-colors.ts' },
  { peer: 'react-native-keyboard-controller', file: 'bottom-sheet/index.tsx' },
];

/**
 * The ONLY files allowed to call `require()` with a non-literal specifier.
 *
 * A local `const` holding a literal does in fact survive Metro (its collector
 * evaluates the argument and folds the constant), so this rule is stricter than
 * Metro strictly needs. That is deliberate: "literal" is a property a reader and
 * a scanner can both check at a glance, while "statically evaluable" is a
 * property of a whole scope that silently stops holding the moment the value
 * becomes a parameter, a re-assignment, or a computed string — which is exactly
 * how `lazyRequire` passed review. An entry here is a claim that the file has a
 * reason to hide the specifier from a bundler AND nothing to lose if a bundler
 * cannot resolve it.
 */
const VARIABLE_REQUIRE_ALLOWED: { file: string; why: string }[] = [
  {
    file: 'theme/init-css-interop.ts',
    why: 'react-native-css-interop is neither a dependency nor a declared peer, so the indirection keeps a plain-text specifier out of reach of bundlers that would try to resolve a package Bloom never asked for; the const is in the same scope, so Metro folds it and treats the call as an optional literal anyway, and if a bundler did drop it there is nothing to lose (the `setFlag` it probes for exists in no shipped version, native gets the flag from the host Tailwind build, and web is fixed by the CSS variable set alongside it)',
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

/**
 * Metro's own optionality rule, mirrored on the TypeScript AST.
 *
 * Transcribed from metro 0.83.5 `src/ModuleGraph/worker/collectDependencies.js`
 * → `isOptionalDependency`: walk up from the call, allowing at most three
 * statement ancestors, and return as soon as a BlockStatement is reached — the
 * dependency is optional iff that block is a `try` block. Reimplemented rather
 * than imported because metro is not a Bloom dependency (it arrives through
 * react-native), and a gate must not rest on a package nothing declares.
 *
 * `TSAsExpression` and friends are transparent here for the same reason they are
 * under Metro: they are gone by the time Metro sees the file.
 */
function isMetroOptional(node: ts.Node): boolean {
  let statementsCrossed = 0;
  let current: ts.Node | undefined = node;

  while (current && statementsCrossed < 3) {
    if (ts.isBlock(current)) {
      return current.parent !== undefined && ts.isTryStatement(current.parent) && current.parent.tryBlock === current;
    }
    if (ts.isStatement(current)) statementsCrossed += 1;
    current = current.parent;
  }

  return false;
}

/** Every `require(...)` call in a file. `specifier` is null when non-literal. */
function requireCalls(source: ts.SourceFile): {
  specifier: string | null;
  metroOptional: boolean;
  line: number;
}[] {
  const found: { specifier: string | null; metroOptional: boolean; line: number }[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length === 1
    ) {
      const [argument] = node.arguments;
      found.push({
        specifier: argument && ts.isStringLiteral(argument) ? argument.text : null,
        metroOptional: isMetroOptional(node),
        line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
      });
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return found;
}

/** Source with comments stripped — a scanner that flags its own prose is one nobody keeps. */
function codeWithoutComments(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

describe('optional peers are loaded through Metro’s optional-dependency form', () => {
  const files = sourceFiles(SRC);

  /** Every (file, optional peer) pair the tree actually loads via `require`. */
  function foundBoundaries(): {
    peer: string;
    file: string;
    line: number;
    metroOptional: boolean;
  }[] {
    const found: { peer: string; file: string; line: number; metroOptional: boolean }[] = [];

    for (const file of files) {
      for (const { specifier, line, metroOptional } of requireCalls(parse(file))) {
        if (specifier === null) continue;
        const peer = OPTIONAL_PEERS.find((candidate) => specifierTargets(specifier, candidate));
        if (!peer) continue;
        found.push({ peer, file: file.slice(SRC.length + 1), line, metroOptional });
      }
    }

    return found;
  }

  it('places every boundary require where Metro will mark it optional', () => {
    // The narrow rule from the header, not the loose one: a literal specifier
    // inside a try is NOT enough — nested one `if` deeper it is collected as a
    // hard dependency, and an app without the peer stops building.
    const notOptional = foundBoundaries()
      .filter((entry) => !entry.metroOptional)
      .map(
        (entry) =>
          `${entry.file}:${entry.line}  requires '${entry.peer}' where Metro will NOT mark it ` +
          'optional — the call must be a DIRECT statement of a `try` block (hoist any ' +
          '`typeof require` guard out of the try); an absent peer otherwise fails the build',
      );

    expect(notOptional).toEqual([]);
  });

  it('declares every package it loads through a require boundary', () => {
    // The inverse direction, and the one that matters: every other assertion in
    // this file starts from `peerDependenciesMeta` and asks whether the code
    // matches it, so by construction none of them can see a package the manifest
    // never mentions. `react-native-keyboard-controller` sat in `bottom-sheet`
    // for exactly that reason — loaded, degraded correctly, and invisible to a
    // consumer, who had no range to install against and no way to learn the
    // integration existed.
    const declared = new Set([
      ...Object.keys(PKG.peerDependencies),
      ...Object.keys(PKG.dependencies ?? {}),
    ]);

    const undeclared = new Set<string>();
    for (const file of files) {
      for (const { specifier, line } of requireCalls(parse(file))) {
        if (specifier === null || specifier.startsWith('.')) continue;
        const pkg = specifier.startsWith('@')
          ? specifier.split('/').slice(0, 2).join('/')
          : (specifier.split('/')[0] as string);
        if (declared.has(pkg)) continue;
        if (VARIABLE_REQUIRE_ALLOWED.some((entry) => file.endsWith(entry.file))) continue;
        undeclared.add(
          `${file.slice(SRC.length + 1)}:${line}  requires '${pkg}', which appears in neither ` +
            'dependencies nor peerDependencies — a consumer cannot know the integration exists ' +
            'or which versions satisfy it',
        );
      }
    }

    expect([...undeclared].sort()).toEqual([]);
  });

  it('loads each optional peer from exactly the documented boundary file', () => {
    // Both directions in one assertion: a boundary that moved (or was deleted)
    // leaves a stale table entry; a second load site for the same peer, or a new
    // peer loaded from nowhere documented, shows up as an extra pair.
    // Deduplicated: the claim is which FILE owns which peer, not how many calls
    // it makes (adaptive-colors reads expo-router once per platform branch).
    const found = [
      ...new Set(foundBoundaries().map(({ peer, file }) => `${peer} <- ${file}`)),
    ].sort();
    const documented = DYNAMIC_BOUNDARIES.map(({ peer, file }) => `${peer} <- ${file}`).sort();

    expect(found).toEqual(documented);
  });
});

describe('no require() resolves through a variable specifier', () => {
  const files = sourceFiles(SRC);

  it('never calls require() with a non-literal specifier outside the allowlist', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const relative = file.slice(SRC.length + 1);
      if (VARIABLE_REQUIRE_ALLOWED.some((entry) => entry.file === relative)) continue;
      for (const { specifier, line } of requireCalls(parse(file))) {
        if (specifier !== null) continue;
        offenders.push(
          `${relative}:${line}  require() with a non-literal specifier. Metro collects nothing ` +
            'and emits a thrower for any specifier it cannot evaluate, so such a call resolves ' +
            'nothing on a device whether or not the package is installed. Make it a literal ' +
            'inside a `try` (see connection-status/netinfo.ts) or a plain static import for a ' +
            'required peer',
        );
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps no stale variable-require allowlist entries', () => {
    const stale = VARIABLE_REQUIRE_ALLOWED.filter(
      (entry) => !requireCalls(parse(join(SRC, entry.file))).some(({ specifier }) => specifier === null),
    ).map((entry) => `${entry.file} no longer calls require() with a variable — drop the entry`);

    expect(stale).toEqual([]);
  });

  // The deleted `lazyRequire` helper is the reason this class of defect shipped
  // at all: one import made a dead load look like a supported pattern, and four
  // call sites took it. The file and any reference to it are asserted
  // SEPARATELY so neither can hide behind the other's failure.
  it('has deleted the lazyRequire helper file', () => {
    expect(existsSync(join(SRC, 'utils', 'lazy-require.ts'))).toBe(false);
  });

  it('has no lazyRequire reference left anywhere in the tree', () => {
    const referencing = files
      .filter((file) => /\blazyRequire\b/.test(codeWithoutComments(file)))
      .map((file) => file.slice(SRC.length + 1));

    expect(referencing).toEqual([]);
  });
});
