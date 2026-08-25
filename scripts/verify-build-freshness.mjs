// @ts-check
/**
 * THE BUILT OUTPUT IS MADE FROM THE SOURCE BESIDE IT.
 *
 * `verify-package.mjs` asserts every `exports` target EXISTS in the tarball.
 * That is a presence check, and presence cannot tell a current file from a
 * stale one — which is the failure this exists for, and it is silent in the
 * worst direction:
 *
 *   Metro resolved `@oxyhq/bloom/media-flight` through `lib/module`, not `src`.
 *   The `lib` there was old, so the app ran the PREVIOUS API — `flyTo`
 *   returning void, no `handOff` — with no error anywhere. Types came from
 *   `lib/typescript`, which was current, so `tsc` was green over an API the
 *   browser did not have. A whole continuity table was measured against a
 *   mechanism that was not running.
 *
 * ## Why this compares SETS rather than checking a list of names
 *
 * The obvious version greps for the symbols someone remembers adding —
 * `handOffFlight`, `notifySurfaceMounted`. That gate measures the list, and the
 * list is what goes stale: it is correct on the day it is written and silently
 * covers nothing a year later, which is exactly the shape this package's own
 * rules warn about. So the symbols are DERIVED: every value a source file
 * exports must appear in the file bob built from it, for every source file in
 * the package. Nothing to maintain, and a symbol added tomorrow is covered
 * without anybody remembering.
 *
 * ## Why it runs on a TARBALL
 *
 * Because the tarball is what consumers get, and it ships `src/` AND `lib/`
 * together — so the comparison is self-contained and can be pointed at a
 * PUBLISHED artifact, not just at a working tree that may have been built
 * moments ago:
 *
 *   node scripts/verify-build-freshness.mjs                    # pack this repo
 *   node scripts/verify-build-freshness.mjs --tarball x.tgz    # audit a published one
 *   node scripts/verify-build-freshness.mjs --worktree         # audit lib/ in place
 *
 * `bun pm pack` is the packer, never `npm pack`: npm ships a literal
 * `"workspace:^"` / `"catalog:"` that no consumer can resolve.
 *
 * ## THE THREE MODES ANSWER DIFFERENT QUESTIONS, AND ONE OF THEM CANNOT ANSWER
 * ## THE ONE THIS WAS WRITTEN FOR
 *
 * Packing runs `prepack`, which is `clean && build` — so the default mode always
 * audits a build made SECONDS AGO. That is worth having (it catches a build that
 * silently drops a symbol) but it is structurally incapable of catching a STALE
 * `lib`, because it just rebuilt it. Saying so here rather than letting the name
 * imply otherwise: a gate that cannot fail for the reason you are running it is
 * the thing this whole file is about.
 *
 * `--tarball` audits an artifact nobody is rebuilding, which is what a published
 * package is. `--worktree` audits `lib/` exactly as it sits on disk, which is
 * the mode that reproduces what happened in the consuming worktree.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..');

/**
 * Names that cannot be in the build because they are in no source file — the
 * negative control. Without it, "every symbol was found" is also what a broken
 * matcher reports, by finding everything or by checking nothing.
 */
const IMPOSSIBLE_SYMBOLS = [
  'handOffFlightZZZ',
  'notifySurfaceMountedNeverExisted',
  '__bloom_symbol_that_is_not_real__',
];

/** Source files that ship but that bob does not compile into `lib`. */
const NOT_COMPILED = /\.(stories|test|spec)\.tsx?$/;

function log(message) {
  console.log(`[verify-build-freshness] ${message}`);
}

function fail(problems) {
  console.log('[verify-build-freshness] FAILED');
  for (const problem of problems.slice(0, 40)) console.log(`  ${problem}`);
  if (problems.length > 40) console.log(`  …and ${problems.length - 40} more`);
  process.exitCode = 1;
}

// --------------------------------------------------------------------------
//  Tarball
// --------------------------------------------------------------------------

function packSelf(into) {
  // `BLOOM_VERIFY_PACKAGE_RUNNING` stops the `prepare` lifecycle re-entering a
  // build from inside a pack that is already building.
  execFileSync('bun', ['pm', 'pack', '--destination', into], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, BLOOM_VERIFY_PACKAGE_RUNNING: '1' },
  });
  const tgz = readdirSync(into).find((name) => name.endsWith('.tgz'));
  if (tgz === undefined) throw new Error('bun pm pack produced no .tgz');
  return join(into, tgz);
}

function extract(tarball, into) {
  execFileSync('tar', ['-xzf', tarball, '-C', into], { stdio: ['ignore', 'pipe', 'inherit'] });
  const pkg = join(into, 'package');
  if (!existsSync(pkg)) throw new Error(`no package/ inside ${tarball}`);
  return pkg;
}

// --------------------------------------------------------------------------
//  What a source file exports
// --------------------------------------------------------------------------

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * The VALUE names a module exports, and the TYPE names separately — they land
 * in different build artifacts, and asking for a type in a `.js` would fail on
 * every file.
 *
 * `export *` contributes no names here on purpose: the built file re-exports it
 * as `export *` too, so the individual names appear in NEITHER and demanding
 * them would fail on correct output.
 */
function exportedNames(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  /** @type {{ values: string[], types: string[] }} */
  const found = { values: [], types: [] };

  for (const statement of source.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : [];
    const isExported = modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
      for (const element of statement.exportClause.elements) {
        const name = element.name.text;
        if (statement.isTypeOnly || element.isTypeOnly) found.types.push(name);
        else found.values.push(name);
      }
      continue;
    }
    if (!isExported) continue;

    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      found.types.push(statement.name.text);
    } else if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      statement.name
    ) {
      found.values.push(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) found.values.push(declaration.name.text);
      }
    } else if (ts.isEnumDeclaration(statement)) {
      found.values.push(statement.name.text);
    }
  }
  return found;
}

/** A whole-word match, so `tone` does not satisfy itself inside `peakTone`. */
function mentions(haystack, name) {
  return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack);
}

// --------------------------------------------------------------------------
//  Main
// --------------------------------------------------------------------------

function main() {
  const tarballArgument = process.argv.indexOf('--tarball');
  const inPlace = process.argv.includes('--worktree');
  const scratch = mkdtempSync(join(tmpdir(), 'bloom-freshness-'));

  try {
    let pkg;
    if (inPlace) {
      log('auditing lib/ in this worktree, as it sits on disk');
      pkg = REPO_ROOT;
    } else {
      const tarball =
        tarballArgument === -1
          ? packSelf(scratch)
          // `resolve`, not `join`: an absolute path passed on the command line
          // would be appended to the cwd by `join` and silently point nowhere.
          : resolve(process.cwd(), process.argv[tarballArgument + 1] ?? '');
      log(`auditing ${relative(REPO_ROOT, tarball) || tarball}`);
      pkg = extract(tarball, scratch);
    }

    const srcRoot = join(pkg, 'src');
    const moduleRoot = join(pkg, 'lib', 'module');
    const commonjsRoot = join(pkg, 'lib', 'commonjs');
    const typesRoot = join(pkg, 'lib', 'typescript', 'module');
    for (const [label, dir] of [
      ['src', srcRoot],
      ['lib/module', moduleRoot],
      ['lib/commonjs', commonjsRoot],
      ['lib/typescript/module', typesRoot],
    ]) {
      if (!existsSync(dir)) throw new Error(`the tarball has no ${label}/`);
    }

    const sources = walk(srcRoot).filter(
      (file) => /\.tsx?$/.test(file) && !NOT_COMPILED.test(file) && !file.includes(`${'__tests__'}`),
    );

    const problems = [];
    let checkedFiles = 0;
    let checkedValues = 0;
    let checkedTypes = 0;

    for (const file of sources) {
      const stem = relative(srcRoot, file).replace(/\.tsx?$/, '');
      const { values, types } = exportedNames(file);
      if (values.length === 0 && types.length === 0) continue;

      const built = [
        ['lib/module', join(moduleRoot, `${stem}.js`)],
        ['lib/commonjs', join(commonjsRoot, `${stem}.js`)],
      ];
      let sawAnyBuilt = false;
      for (const [label, path] of built) {
        if (!existsSync(path)) {
          problems.push(`${label}/${stem}.js is MISSING while src/${stem} exists`);
          continue;
        }
        sawAnyBuilt = true;
        const text = readFileSync(path, 'utf8');
        for (const name of values) {
          checkedValues += 1;
          if (!mentions(text, name)) {
            problems.push(
              `${label}/${stem}.js does not mention '${name}', which src/${stem} exports — ` +
                'the build is older than the source it ships beside',
            );
          }
        }
      }

      const declaration = join(typesRoot, `${stem}.d.ts`);
      if (existsSync(declaration)) {
        const text = readFileSync(declaration, 'utf8');
        for (const name of types) {
          checkedTypes += 1;
          if (!mentions(text, name)) {
            problems.push(`lib/typescript/module/${stem}.d.ts does not mention type '${name}'`);
          }
        }
      }

      if (sawAnyBuilt) checkedFiles += 1;
    }

    // Negative control, in the same currency as the measurement: the matcher
    // must be capable of NOT finding something. Without it, a `mentions()` that
    // always returned true would report a clean sweep.
    const everyBuiltFile = walk(moduleRoot)
      .filter((file) => file.endsWith('.js'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    for (const impossible of IMPOSSIBLE_SYMBOLS) {
      if (mentions(everyBuiltFile, impossible)) {
        problems.push(`negative control failed: the build "contains" '${impossible}'`);
      }
    }

    // Vacuity floors: "no stale symbol" is also what a walk that read nothing
    // reports, and it is the reading this gate is most likely to give wrongly.
    if (checkedFiles < 200) problems.push(`only ${checkedFiles} source files were compared (expected 200+)`);
    if (checkedValues < 500) problems.push(`only ${checkedValues} exported values were checked (expected 500+)`);
    if (checkedTypes < 200) problems.push(`only ${checkedTypes} exported types were checked (expected 200+)`);

    if (problems.length > 0) {
      fail(problems);
      return;
    }

    log(
      `ok — ${checkedValues} exported values and ${checkedTypes} exported types across ` +
        `${checkedFiles} modules are all present in the build shipped beside them ` +
        `(${IMPOSSIBLE_SYMBOLS.length} negative controls absent)`,
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

main();
