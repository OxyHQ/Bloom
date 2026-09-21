import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(__dirname, '..', '..');
const sourceRoot = join(root, 'src');
function graph(entry: string): Set<string> {
  const files = new Set<string>();
  function walk(file: string) {
    if (files.has(file)) return;
    files.add(file);
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
      if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith('.')) continue;
      const base = resolve(dirname(file), specifier);
      const target = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find(path => existsSync(path) && statSync(path).isFile());
      if (target) walk(target);
    }
  }
  walk(join(sourceRoot, entry));
  return files;
}

it('publishes a split native/types leaf that reuses the same Sparkline without chart-card implementations', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  expect(pkg.exports['./chart-cards/sparkline']['react-native']).toEqual({
    types: './lib/typescript/module/chart-cards/sparkline.d.ts', default: './src/chart-cards/sparkline.ts',
  });
  const leaf = graph('chart-cards/sparkline.ts');
  const barrel = graph('chart-cards/index.ts');
  expect(leaf.has(join(sourceRoot, 'chart-cards/primitives/Sparkline.tsx'))).toBe(true);
  expect(leaf.has(join(sourceRoot, 'chart-cards/primitives/index.ts'))).toBe(false);
  expect([...leaf].filter(path => /ChartCard\.tsx$/.test(path))).toEqual([]);
  expect(barrel.has(join(sourceRoot, 'chart-cards/SankeyChartCard.tsx'))).toBe(true);
  const added = [...barrel].filter(path => !leaf.has(path));
  const bytes = added.reduce((sum, path) => sum + statSync(path).size, 0);
  expect(bytes).toBeGreaterThan(100_000);
  console.info(`Sparkline graph: leaf ${leaf.size} modules; barrel ${barrel.size}; avoids ${bytes} source bytes (${added.length} modules).`);
  expect([...leaf].map(path => relative(sourceRoot, path))).not.toContain('chart-cards/index.ts');
});
