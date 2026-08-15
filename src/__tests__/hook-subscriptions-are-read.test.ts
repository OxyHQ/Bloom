/**
 * @jest-environment node
 */

/**
 * Every value a hook hands back is read.
 *
 * A hook call is a SUBSCRIPTION. `useTheme()` joins a context, `useInteractionState()`
 * owns a `useState`, a store hook registers a listener — each of them re-renders the
 * component when its source changes. A binding nobody reads is that cost paid for
 * nothing, and it is almost never JUST waste: it is the visible half of a feature
 * that was never wired. `PopoverTrigger` binds `onIn`/`onOut` from
 * `useInteractionState()`, attaches neither to anything, and still hands
 * `state.pressed` to its render prop — so every consumer's pressed styling is
 * permanently `false`, and the code reads as though press feedback exists.
 * `useTheme()` bound and unread is worse than waste in a second way: it THROWS
 * outside `BloomThemeProvider`, so it makes a component require a provider it does
 * not use.
 *
 * WHY A GATE RATHER THAN A COMPILER FLAG. `noUnusedLocals` is the same idea and it
 * is off: switched on repo-wide it reports 148 errors, ~90 of them an unused `React`
 * import under `jsx: react-jsx`, so it is a rule that would be turned back off
 * within a day. This is that rule narrowed to the one place where an unused binding
 * is not untidiness but a broken feature — measured, the narrowing costs nothing:
 * 651 files, 1008 hook calls and 1313 bound names produce exactly three findings.
 *
 * WHAT IT DELIBERATELY DOES NOT SEE:
 *   - A BARE `useX();` statement. `useEffect`, `useLayoutEffect` and
 *     `useImperativeHandle` are exactly that shape and exactly right; 110 of them
 *     exist here. A rule that flagged them would be deleted, not obeyed.
 *   - A name whose spelling also appears anywhere else in the file — as a property
 *     (`x.pressed`), a JSX attribute name, an import, or a second binding in
 *     another component. Every one of those counts as a read, so the scan errs
 *     towards silence. It is a source scan, not a type checker; a defect it misses
 *     is a defect the next one of these still catches.
 *
 * There is no exemption list, because there is nothing to exempt: an array hole
 * (`const [, setOpen] = useState()`) binds no name at all, and a value genuinely
 * worth subscribing to and discarding has not turned up. If one does, this fails
 * and somebody decides — which is the point.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');

const parseFile = (file: string): ts.SourceFile =>
  ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

/**
 * `__tests__` is excluded from the MEASUREMENT — a test may bind a value only to
 * prove something about the call — and that exclusion is what makes the positive
 * control below possible: the fixture lives inside it.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue;
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** The callee's own name: `useTheme()` and `React.useMemo()` are both hook calls. */
function calleeName(call: ts.CallExpression): string | null {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return null;
}

const isHookName = (name: string | null): boolean => name !== null && /^use[A-Z]/.test(name);

/** Every identifier a binding pattern introduces, nested patterns included. */
function boundNames(name: ts.BindingName, out: ts.Identifier[] = []): ts.Identifier[] {
  if (ts.isIdentifier(name)) {
    out.push(name);
    return out;
  }
  for (const element of name.elements) {
    if (ts.isBindingElement(element)) boundNames(element.name, out);
  }
  return out;
}

interface Counts {
  /** Every occurrence of an identifier text, wherever it appears. */
  all: Map<string, number>;
  /** Occurrences that are the NAME of a binding, i.e. not a read. */
  bindings: Map<string, number>;
}

function countIdentifiers(sf: ts.SourceFile): Counts {
  const all = new Map<string, number>();
  const bindings = new Map<string, number>();
  const bump = (map: Map<string, number>, text: string): void => {
    map.set(text, (map.get(text) ?? 0) + 1);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) bump(all, node.text);
    if (
      (ts.isVariableDeclaration(node) || ts.isBindingElement(node) || ts.isParameter(node)) &&
      ts.isIdentifier(node.name)
    ) {
      bump(bindings, node.name.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { all, bindings };
}

interface Finding {
  where: string;
  detail: string;
}

interface Scan {
  findings: Finding[];
  hookCalls: number;
  boundNames: number;
}

/**
 * A binding is unread when every occurrence of its spelling in the file IS a
 * binding. Comparing against the count rather than against one declaration is
 * what keeps a name bound twice in two components from reading as unread when
 * only one of them uses it — the conservative direction, on purpose.
 */
function scan(file: string): Scan {
  const sf = parseFile(file);
  const { all, bindings } = countIdentifiers(sf);
  const findings: Finding[] = [];
  let hookCalls = 0;
  let bound = 0;
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer !== undefined &&
      ts.isCallExpression(node.initializer) &&
      isHookName(calleeName(node.initializer))
    ) {
      hookCalls += 1;
      const hook = calleeName(node.initializer) ?? '';
      for (const identifier of boundNames(node.name)) {
        bound += 1;
        const text = identifier.text;
        if ((all.get(text) ?? 0) > (bindings.get(text) ?? 0)) continue;
        const line = sf.getLineAndCharacterOfPosition(identifier.getStart(sf)).line + 1;
        findings.push({
          where: `${relative(SRC, file)}:${line}`,
          detail: `${text} <- ${hook}()`,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { findings, hookCalls, boundNames: bound };
}

const SOURCES = sourceFiles(SRC);
const SCANS = SOURCES.map(scan);
const HOOK_CALLS = SCANS.reduce((n, s) => n + s.hookCalls, 0);
const BOUND_NAMES = SCANS.reduce((n, s) => n + s.boundNames, 0);

describe('the scan can see what it is looking for', () => {
  it('reads a real tree, full of real hook calls', () => {
    // Vacuity floors in the currency of the measurement: "every hook binding is
    // read" and "the walk found no hook bindings" print the same empty array.
    expect(SOURCES.length).toBeGreaterThanOrEqual(400);
    expect(HOOK_CALLS).toBeGreaterThanOrEqual(500);
    expect(BOUND_NAMES).toBeGreaterThanOrEqual(800);
  });

  it('reports a binding that is never read, and only that one (positive control)', () => {
    // The same `scan()`, over a module written on disk for it, in the directory
    // the measurement excludes. Both halves matter: the unread name is reported,
    // and the name beside it that IS read is not — a detector that flagged both
    // could be greened by deleting working code.
    const fixture = scan(join(SRC, '__tests__', 'support', 'unread-hook-fixture.ts'));
    expect(fixture.findings.map((f) => f.detail)).toEqual([
      'unreadFlag <- useFixtureInteractionState()',
    ]);
    expect(fixture.hookCalls).toBe(1);
    expect(fixture.boundNames).toBe(2);
  });
});

describe('no hook is subscribed to and thrown away', () => {
  it('every name bound from a hook call is read', () => {
    const offenders = SCANS.flatMap((s) => s.findings).map((f) => `${f.where}  ${f.detail}`);
    expect(offenders).toEqual([]);
  });
});
