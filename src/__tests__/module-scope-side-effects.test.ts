/**
 * @jest-environment node
 */

/**
 * Importing a Bloom module does not DO anything.
 *
 * `collapsible/` called `UIManager.setLayoutAnimationEnabledExperimental(true)`
 * at module scope and reached `src/index.ts` through an `export *`. Metro does
 * not tree-shake, so `import { Button } from '@oxyhq/bloom'` linked it — and every
 * root-barrel consumer on Android old-arch had experimental layout animations
 * switched on globally, whether or not they had ever heard of `Collapsible`. It
 * was deleted in tanda 2. Nothing stopped the next one.
 *
 * The shape is worth a gate rather than a habit because it is invisible three
 * ways. It compiles. It renders nothing, so no test that mounts a component can
 * see it. And a global flag flipped at import time surfaces as a bug in an
 * unrelated screen — the component that set it need not even be on screen.
 *
 * WHAT COUNTS AS AN EFFECT. A CALL or a loop at module scope, and an assignment
 * whose target belongs to something this module did not declare. What does NOT
 * count is a module initialising its own values: `Button.displayName = 'Button'`
 * writes a property of a component declared in that same file, which is part of
 * building the export, not a reach into the world. 159 of those exist and folding
 * them in would make the list unreadable and the rule unenforceable.
 *
 * Statements inside a top-level `if` / `try` / block are scanned, because that is
 * the shape the real one had — `if (Platform.OS === 'android') { UIManager… }`.
 *
 * WHAT IT CANNOT SEE: an effect performed inside a call whose RESULT is bound
 * (`const x = registerThing()`), because a source scan cannot tell that from a
 * pure factory. Every module-scope effect measured in this package is a bare
 * statement, which is what the exemption list below is an equality over.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const ROOT = join(__dirname, '..', '..');
const SRC = join(__dirname, '..');

/**
 * The module-scope effects this package accepts, each with the reason it is not
 * the `collapsible` mistake. An EQUALITY: a new one fails until somebody decides
 * about it, and a stale one fails when its module stops doing it.
 *
 * Neither is a global flag flipped on a consumer's behalf. Both are a module
 * wiring ITSELF to a store it owns, at the only moment early enough to matter.
 */
const ACCEPTED: ReadonlyArray<{ where: string; statement: string; why: string }> = [
  {
    where: 'theme/init-css-interop.ts',
    statement: 'initCssInteropDarkMode();',
    why:
      "Sets react-native-css-interop's darkMode flag before css-interop's " +
      'MutationObserver can fire. An effect would be too late: observers run ' +
      'during the initial render. Idempotent, and a no-op off web.',
  },
  {
    where: 'toast/use-stack-hover.ts',
    statement: 'toastStore.setExpansionHold(isStackHovered);',
    why:
      'Registers the web hover predicate on the toast store — this file is the ' +
      'one that knows what hovering means, the store only knows that something ' +
      'says "not yet". The native fork registers nothing.',
  },
];

function resolveLocal(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    base,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every platform variant of a resolved file — a bundler may select any of them. */
function platformSiblings(file: string): string[] {
  const match = file.match(/^(.*)\.tsx?$/);
  if (!match) return [file];
  const out = [file];
  for (const suffix of ['.native.ts', '.native.tsx', '.web.ts', '.web.tsx']) {
    if (existsSync(`${match[1]}${suffix}`)) out.push(`${match[1]}${suffix}`);
  }
  return out;
}

/**
 * STATIC specifiers only. `theme/adaptive-colors.ts` names `expo-router` inside a
 * `require()` in a try block; Metro links nothing for it, and neither does this.
 */
function staticRelativeSpecifiers(text: string): string[] {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const out: string[] = [];
  for (const match of stripped.matchAll(/^\s*(?:import|export)\b[\s\S]*?from\s+['"]([^'"]+)['"]/gm)) {
    if (match[1]?.startsWith('.')) out.push(match[1]);
  }
  for (const match of stripped.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) {
    if (match[1]?.startsWith('.')) out.push(match[1]);
  }
  return out;
}

/** Every published entry point, as a source file under `src/`. */
function entryPoints(): string[] {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    exports: Record<string, Record<string, unknown> | string>;
  };
  const out = new Set<string>();
  for (const entry of Object.values(pkg.exports)) {
    if (typeof entry === 'string') continue;
    const rn = entry['react-native'];
    const native =
      typeof rn === 'object' && rn !== null ? (rn as { default?: unknown }).default : rn;
    if (typeof native === 'string' && native.startsWith('./src/')) {
      out.add(join(ROOT, native.replace('./', '')));
    }
    const browser = entry.browser;
    const built =
      typeof browser === 'object' && browser !== null
        ? (browser as { import?: unknown }).import
        : undefined;
    if (typeof built !== 'string') continue;
    const stem = built.replace(/^\.\/lib\/module\//, '').replace(/\.js$/, '');
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(join(SRC, `${stem}${ext}`))) {
        out.add(join(SRC, `${stem}${ext}`));
        break;
      }
    }
  }
  return [...out];
}

/** Every `.ts`/`.tsx` a consumer links by importing a published entry point. */
function reachable(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const spec of staticRelativeSpecifiers(text)) {
      const resolved = resolveLocal(file, spec);
      // Assets (`.woff2`) resolve and are not source. Reading one as TypeScript
      // yields plausible garbage — and NUL bytes downstream.
      if (resolved !== null && /\.tsx?$/.test(resolved)) queue.push(...platformSiblings(resolved));
    }
  }
  return seen;
}

interface Effect {
  where: string;
  statement: string;
}

/** Names this module declares at top level — the roots an assignment may write. */
function declaredRoots(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  const addBinding = (name: ts.BindingName): void => {
    if (ts.isIdentifier(name)) {
      names.add(name.text);
      return;
    }
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) addBinding(element.name);
    }
  };
  for (const stmt of sf.statements) {
    if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) addBinding(d.name);
    } else if (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
      if (stmt.name) names.add(stmt.name.text);
    } else if (ts.isEnumDeclaration(stmt)) {
      names.add(stmt.name.text);
    } else if (ts.isImportDeclaration(stmt) && stmt.importClause) {
      // Deliberately NOT added: writing to an imported binding's property is a
      // reach into another module, which is the thing being forbidden.
      continue;
    }
  }
  return names;
}

/** The identifier an assignment target is rooted at: `a.b.c = x` -> `a`. */
function rootIdentifier(node: ts.Expression): string | null {
  let current: ts.Expression = node;
  for (;;) {
    if (ts.isIdentifier(current)) return current.text;
    if (ts.isPropertyAccessExpression(current) || ts.isElementAccessExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isParenthesizedExpression(current) || ts.isNonNullExpression(current)) {
      current = current.expression;
      continue;
    }
    return null;
  }
}

const ASSIGNMENT_OPERATORS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function effectsIn(file: string): Effect[] {
  const sf = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const roots = declaredRoots(sf);
  const out: Effect[] = [];
  const record = (node: ts.Node): void => {
    out.push({
      where: relative(SRC, file),
      statement: node.getText(sf).replace(/\s+/g, ' ').trim(),
    });
  };
  const scan = (statements: readonly ts.Statement[]): void => {
    for (const stmt of statements) {
      if (ts.isExpressionStatement(stmt)) {
        const expr = stmt.expression;
        if (ts.isBinaryExpression(expr) && ASSIGNMENT_OPERATORS.has(expr.operatorToken.kind)) {
          const root = rootIdentifier(expr.left);
          // Writing a property of something this module declared is how a
          // component gets its `displayName`. Writing anything else is a reach.
          if (root !== null && roots.has(root)) continue;
          record(stmt);
          continue;
        }
        record(stmt);
        continue;
      }
      if (ts.isIfStatement(stmt)) {
        for (const branch of [stmt.thenStatement, stmt.elseStatement]) {
          if (!branch) continue;
          scan(ts.isBlock(branch) ? branch.statements : [branch]);
        }
        continue;
      }
      if (ts.isTryStatement(stmt)) {
        scan(stmt.tryBlock.statements);
        if (stmt.catchClause) scan(stmt.catchClause.block.statements);
        if (stmt.finallyBlock) scan(stmt.finallyBlock.statements);
        continue;
      }
      if (ts.isBlock(stmt)) {
        scan(stmt.statements);
        continue;
      }
      if (
        ts.isForStatement(stmt) ||
        ts.isForOfStatement(stmt) ||
        ts.isForInStatement(stmt) ||
        ts.isWhileStatement(stmt) ||
        ts.isDoStatement(stmt) ||
        ts.isSwitchStatement(stmt)
      ) {
        record(stmt);
      }
    }
  };
  scan(sf.statements);
  return out;
}

const ENTRIES = entryPoints();
const REACHABLE = [...reachable(ENTRIES)].sort();
const EFFECTS = REACHABLE.flatMap(effectsIn);
const key = (e: { where: string; statement: string }): string => `${e.where}  ${e.statement}`;

describe('the census reaches the package', () => {
  it('walks from every published entry point into a real module graph', () => {
    // Vacuity floors: "nothing does work at import" is also what a walk that
    // resolved nothing reports.
    expect(ENTRIES.length).toBeGreaterThanOrEqual(80);
    expect(REACHABLE.length).toBeGreaterThanOrEqual(400);
    expect(REACHABLE.some((f) => f.endsWith('button/Button.tsx'))).toBe(true);
    expect(REACHABLE.some((f) => f.endsWith('theme/init-css-interop.ts'))).toBe(true);
  });

  it('sees module-scope statements, and classifies self-initialisation as not an effect', () => {
    // Positive control on the SCANNER, in the currency of the measurement: the
    // same parse over the same files must find the ~159 `X.displayName = …`
    // statements it is deliberately not reporting. If the walk stopped seeing
    // module-scope statements at all, this drops to zero while the assertion
    // below stays green.
    let selfInitialising = 0;
    for (const file of REACHABLE) {
      const sf = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const roots = declaredRoots(sf);
      for (const stmt of sf.statements) {
        if (!ts.isExpressionStatement(stmt)) continue;
        const expr = stmt.expression;
        if (!ts.isBinaryExpression(expr) || expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
          continue;
        }
        const root = rootIdentifier(expr.left);
        if (root !== null && roots.has(root)) selfInitialising += 1;
      }
    }
    expect(selfInitialising).toBeGreaterThanOrEqual(100);
  });
});

describe('nothing does work when a consumer imports it', () => {
  it('the module-scope effects are exactly the two that were argued for', () => {
    expect(EFFECTS.map(key).sort()).toEqual(ACCEPTED.map(key).sort());
  });

  it('every accepted effect carries a reason', () => {
    // The list is an equality on (file, statement); this stops an entry being
    // added as a bare pair. A reason is what makes removing one possible later.
    expect(ACCEPTED.filter((e) => e.why.length < 40)).toEqual([]);
  });
});
