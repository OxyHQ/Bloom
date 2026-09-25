/**
 * @jest-environment node
 */

/**
 * No worklet captures a value the native worklet runtime cannot copy.
 *
 * Every identifier a worklet reads from outside itself — a mapper's props,
 * state, a gesture callback's closure — is serialized to the UI runtime when
 * the worklet is created. Plain objects are copied RECURSIVELY; a `Date`, a
 * class instance, anything whose prototype is not `Object.prototype` (bar Map,
 * Set, RegExp, Error and array buffers) throws `[Worklets] Cannot copy value of
 * type …` and takes the app down.
 *
 * `Sidebar` shipped exactly that: `contentMorph` read `tree ? 0 : …` inside
 * `useAnimatedStyle`, so the WHOLE tree went to the UI thread — folders, rows,
 * each row's `actions` element and, through its props, the app's conversations —
 * and died on the first `createdAt`. Every Android launch of an app with chat
 * history crashed about three seconds in (Alia on a Pixel 8a, Bloom 4.23.0).
 * `BottomBarBase` read `items.length` the same way, capturing every item's
 * `icon` element. Neither is visible anywhere else: jest's reanimated mock runs
 * mappers inline, web never serializes, and the crash depends on what the APP
 * puts in a prop Bloom types as `ReactNode`.
 *
 * So the rule is on the TYPE of what is captured, read with the type checker:
 * a captured value whose type reaches a React node, a `Date`, a `Promise`, a
 * class instance, or a bare type parameter (whatever the app instantiates it
 * with) fails. Primitives, shared values, functions (they cross as remote
 * functions or worklets), and plain objects and arrays of those pass. Derive the
 * primitive the worklet needs OUTSIDE it (`const hasTree = Boolean(tree)`).
 */

import { join, relative } from 'node:path';
import ts from 'typescript';

const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

/** Hooks whose argument(s) at these positions the worklets plugin workletizes. */
const WORKLET_HOOKS = new Map<string, number[]>([
  ['useAnimatedStyle', [0]],
  ['useAnimatedProps', [0]],
  ['useDerivedValue', [0]],
  ['useFrameCallback', [0]],
  ['useAnimatedReaction', [0, 1]],
  ['useAnimatedScrollHandler', [0]],
  ['runOnUI', [0]],
  ['scheduleOnUI', [0]],
]);
/** Gesture builder callbacks, workletized unless the chain opts into `runOnJS(true)`. */
const GESTURE_CALLBACKS = new Set([
  'onBegin', 'onStart', 'onUpdate', 'onChange', 'onEnd', 'onFinalize',
  'onTouchesDown', 'onTouchesMove', 'onTouchesUp', 'onTouchesCancelled',
]);
/** Copied by the runtime, or references it resolves itself. */
const COPYABLE = new Set(['SharedValue', 'DerivedValue', 'Mutable', 'AnimatedRef', 'Map', 'Set', 'RegExp', 'Error', 'ArrayBuffer']);
/** Reach one of these and the copy throws (or drags app data along until something does). */
const UNCOPYABLE = new Set(['Date', 'Promise', 'ReactElement', 'ReactPortal', 'Element', 'Component', 'PureComponent']);

type FunctionNode = ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration | ts.MethodDeclaration;

const isFunctionNode = (node: ts.Node): node is FunctionNode =>
  ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node);

function hasWorkletDirective(fn: FunctionNode): boolean {
  const first = fn.body && ts.isBlock(fn.body) ? fn.body.statements[0] : undefined;
  return !!first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === 'worklet';
}

/** `Gesture.Pan().minDistance(4).onUpdate` → `Gesture`, and whether `.runOnJS(…)` is in the chain. */
function gestureChain(expression: ts.Expression): { root: ts.Expression; onJS: boolean } {
  let onJS = false;
  let node = expression;
  while (ts.isCallExpression(node) || ts.isPropertyAccessExpression(node)) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'runOnJS') onJS = true;
    node = node.expression;
  }
  return { root: node, onJS };
}

function worklets(sf: ts.SourceFile): FunctionNode[] {
  const found: FunctionNode[] = [];
  const visit = (node: ts.Node): void => {
    if (isFunctionNode(node) && hasWorkletDirective(node)) found.push(node);
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
      for (const index of WORKLET_HOOKS.get(name) ?? []) {
        const arg = node.arguments[index];
        if (arg && isFunctionNode(arg)) found.push(arg);
        // `useAnimatedScrollHandler({ onScroll() {…} })`
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const property of arg.properties) {
            if (ts.isMethodDeclaration(property)) found.push(property);
            else if (ts.isPropertyAssignment(property) && isFunctionNode(property.initializer)) found.push(property.initializer);
          }
        }
      }
      if (ts.isPropertyAccessExpression(callee) && GESTURE_CALLBACKS.has(name)) {
        const arg = node.arguments[0];
        const { root, onJS } = gestureChain(callee);
        if (arg && isFunctionNode(arg) && ts.isIdentifier(root) && root.text === 'Gesture' && !onJS) found.push(arg);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function uncopyable(checker: ts.TypeChecker, type: ts.Type, depth = 0, seen = new Set<ts.Type>()): string | null {
  if (seen.has(type) || depth > 6) return null;
  seen.add(type);
  if (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.BigIntLike
    | ts.TypeFlags.EnumLike | ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void | ts.TypeFlags.Never | ts.TypeFlags.ESSymbolLike)) {
    return null;
  }
  if (type.flags & ts.TypeFlags.Any) return 'any';
  if (type.flags & ts.TypeFlags.Unknown) return 'unknown';
  if (type.flags & ts.TypeFlags.TypeParameter) return `type parameter ${checker.typeToString(type)}`;
  if (type.isUnionOrIntersection()) {
    for (const member of type.types) {
      const found = uncopyable(checker, member, depth, seen);
      if (found) return found;
    }
    return null;
  }
  const symbol = type.aliasSymbol ?? type.getSymbol();
  const name = symbol?.getName() ?? '';
  if (COPYABLE.has(name)) return null;
  if (UNCOPYABLE.has(name)) return name;
  if (type.getCallSignatures().length > 0) return null;
  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    for (const element of checker.getTypeArguments(type as ts.TypeReference)) {
      const found = uncopyable(checker, element, depth + 1, seen);
      if (found) return `[]: ${found}`;
    }
    return null;
  }
  if (symbol && symbol.flags & ts.SymbolFlags.Class) return `class ${name}`;
  for (const property of type.getProperties()) {
    const declaration = property.valueDeclaration ?? property.declarations?.[0];
    if (!declaration) continue;
    const found = uncopyable(checker, checker.getTypeOfSymbolAtLocation(property, declaration), depth + 1, seen);
    if (found) return `.${property.getName()}: ${found}`;
  }
  return null;
}

interface Scan {
  worklets: number;
  captures: number;
  findings: string[];
}

const CONFIG = ts.getParsedCommandLineOfConfigFile(join(ROOT, 'tsconfig.json'), {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
    throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  },
});
if (!CONFIG) throw new Error('tsconfig.json did not parse');

function scan(rootNames: string[], include: (file: string) => boolean): Scan {
  const program = ts.createProgram({ rootNames, options: { ...CONFIG!.options, noEmit: true } });
  const checker = program.getTypeChecker();
  const result: Scan = { worklets: 0, captures: 0, findings: [] };

  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile || !include(sf.fileName)) continue;
    for (const fn of worklets(sf)) {
      result.worklets += 1;
      const captured = new Set<string>();
      const visit = (node: ts.Node): void => {
        ts.forEachChild(node, visit);
        if (!ts.isIdentifier(node)) return;
        const parent = node.parent;
        if ((ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node)
          || ts.isTypeReferenceNode(parent) || ts.isQualifiedName(parent)) return;
        const symbol = ts.isShorthandPropertyAssignment(parent)
          ? checker.getShorthandAssignmentValueSymbol(parent)
          : checker.getSymbolAtLocation(node);
        const declaration = symbol?.declarations?.[0];
        if (!symbol || !declaration || captured.has(node.text)) return;
        if (!(symbol.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Alias | ts.SymbolFlags.Function))) return;
        // Globals and library bindings are the runtime's own business.
        if (declaration.getSourceFile().isDeclarationFile) return;
        // Declared inside the worklet: not a capture.
        if (declaration.getSourceFile() === sf && declaration.pos >= fn.pos && declaration.end <= fn.end) return;
        captured.add(node.text);
        result.captures += 1;
        const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        const found = uncopyable(checker, checker.getTypeOfSymbolAtLocation(target, node));
        if (found) {
          const line = sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line + 1;
          result.findings.push(`${relative(SRC, sf.fileName)}:${line} captures ${node.text} (${found})`);
        }
      };
      ts.forEachChild(fn, visit);
    }
  }
  return result;
}

const isMeasured = (file: string): boolean =>
  file.startsWith(SRC) && !file.includes('/__tests__/') && !file.includes('.stories.');

describe('worklet captures', () => {
  const tree = scan(CONFIG.fileNames.filter(isMeasured), isMeasured);

  it('walks the real worklets (vacuity floor)', () => {
    // Measured at 296 worklets and 928 captures when this gate was written.
    expect(tree.worklets).toBeGreaterThanOrEqual(250);
    expect(tree.captures).toBeGreaterThanOrEqual(700);
  });

  it('never hands the UI runtime a value it cannot copy', () => {
    expect(tree.findings).toEqual([]);
  });

  it('reports a Date or React node captured whole, and not the primitive derived from it (positive control)', () => {
    const fixture = join(SRC, '__tests__', 'support', 'worklet-capture-fixture.tsx');
    const result = scan([fixture], (file) => file === fixture);
    expect(result.worklets).toBe(3);
    expect(result.findings).toEqual([
      expect.stringMatching(/^__tests__\/support\/worklet-capture-fixture\.tsx:\d+ captures history \(\[\]: \.createdAt: Date\)$/),
      expect.stringMatching(/^__tests__\/support\/worklet-capture-fixture\.tsx:\d+ captures slot \(ReactElement\)$/),
    ]);
  });
});
