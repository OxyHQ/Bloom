import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';

const SRC = resolve(__dirname, '..');
const PEER = 'react-native-keyboard-controller';

/** Include literal requires: runtime platform guards do not remove graph edges. */
function runtimeSpecifiers(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers: string[] = [];
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) ||
      (ts.isExportDeclaration(node) && !node.isTypeOnly)
    ) {
      const specifier = node.moduleSpecifier;
      if (specifier && ts.isStringLiteral(specifier)) specifiers.push(specifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) && node.expression.text === 'require') ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteral(argument)) specifiers.push(argument.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return specifiers;
}

function dependencyGraph(entry: string, platformExtensions: boolean) {
  const files = new Set<string>();
  const packages = new Set<string>();
  const pending = [join(SRC, entry)];
  while (pending.length) {
    const file = pending.pop();
    if (!file || files.has(file)) continue;
    files.add(file);
    for (const specifier of runtimeSpecifiers(file)) {
      if (!specifier.startsWith('.')) {
        packages.add(specifier);
        continue;
      }
      const base = resolve(dirname(file), specifier);
      const candidates = [
        ...(platformExtensions ? [`${base}.web.tsx`, `${base}.web.ts`] : []),
        `${base}.tsx`,
        `${base}.ts`,
        ...(platformExtensions ? [join(base, 'index.web.ts')] : []),
        join(base, 'index.ts'),
      ];
      const target = candidates.find((candidate) => existsSync(candidate));
      if (target) pending.push(target);
    }
  }
  return { files, packages };
}

it.each([true, false])(
  'keeps the optional native peer outside both web Screen graphs (platform extensions: %s)',
  (platformExtensions) => {
    for (const entry of ['screen/Screen.web.tsx', 'screen/ScreenScrollView.web.tsx']) {
      const graph = dependencyGraph(entry, platformExtensions);
      expect(graph.files.size).toBeGreaterThan(20);
      expect(graph.packages).toContain('react-native');
      expect(graph.packages).not.toContain(PEER);
      expect(graph.files).not.toContain(join(SRC, 'screen/keyboard-components.ts'));
    }
  },
);

it('retains the optional integration in the native entry points', () => {
  for (const entry of ['screen/Screen.tsx', 'screen/ScreenScrollView.tsx']) {
    expect(dependencyGraph(entry, false).packages).toContain(PEER);
  }
});

afterEach(() => {
  jest.dontMock(PEER);
});

it('loads an absent native peer only when keyboard following is requested', () => {
  const load = jest.fn(() => {
    throw new Error('peer is not installed');
  });
  jest.doMock(PEER, load);
  jest.isolateModules(() => {
    const { getScreenKeyboardComponents } =
      require('../screen/keyboard-components') as typeof import('../screen/keyboard-components');
    expect(load).not.toHaveBeenCalled();
    expect(() => getScreenKeyboardComponents()).toThrow(
      'requires react-native-keyboard-controller and its KeyboardProvider',
    );
    expect(load).toHaveBeenCalledTimes(1);
  });
});

it('reuses the installed native integration after its first request', () => {
  const components = {
    KeyboardAwareScrollView: () => null,
    KeyboardStickyView: () => null,
  };
  const load = jest.fn(() => components);
  jest.doMock(PEER, load);
  jest.isolateModules(() => {
    const { getScreenKeyboardComponents } =
      require('../screen/keyboard-components') as typeof import('../screen/keyboard-components');
    expect(load).not.toHaveBeenCalled();
    expect(getScreenKeyboardComponents()).toBe(components);
    expect(getScreenKeyboardComponents()).toBe(components);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
