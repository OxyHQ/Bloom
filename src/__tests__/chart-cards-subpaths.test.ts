import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import * as barrel from '../chart-cards';
import { BarListCard } from '../chart-cards/bar-list';
import { LineChartCard } from '../chart-cards/line';
import { ChartCardSurface } from '../chart-cards/surface';
import { ChartHeader, ChartHeadline } from '../chart-cards/header';
import { ChartStatTiles } from '../chart-cards/stat-tiles';

const root = resolve(__dirname, '..', '..');
const source = join(root, 'src');
const entries = ['bar-list', 'line', 'surface', 'header', 'stat-tiles'] as const;

/** Follow runtime imports to check that a focused entry does not load the family barrel. */
function runtimeGraph(entry: string): Set<string> {
  const visited = new Set<string>();
  function walk(file: string) {
    if (visited.has(file)) return;
    visited.add(file);
    const tree = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of tree.statements) {
      if (
        (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) ||
        (ts.isExportDeclaration(statement) && statement.isTypeOnly)
      )
        continue;
      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith('.')) continue;
      const base = resolve(dirname(file), specifier);
      const target = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        join(base, 'index.ts'),
        join(base, 'index.tsx'),
      ].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
      if (target) walk(target);
    }
  }
  walk(join(source, 'chart-cards', `${entry}.ts`));
  return visited;
}

test('focused entries return the same component identities as the unchanged barrel', () => {
  expect({
    BarListCard,
    LineChartCard,
    ChartCardSurface,
    ChartHeader,
    ChartHeadline,
    ChartStatTiles,
  }).toEqual({
    BarListCard: barrel.BarListCard,
    LineChartCard: barrel.LineChartCard,
    ChartCardSurface: barrel.ChartCardSurface,
    ChartHeader: barrel.ChartHeader,
    ChartHeadline: barrel.ChartHeadline,
    ChartStatTiles: barrel.ChartStatTiles,
  });
});

test.each(entries)(
  '%s has native, import, require and legacy type targets without the family barrel',
  (name) => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const key = `./chart-cards/${name}`;
    expect(pkg.exports[key]).toEqual({
      'react-native': {
        types: `./lib/typescript/module/chart-cards/${name}.d.ts`,
        default: `./src/chart-cards/${name}.ts`,
      },
      import: {
        types: `./lib/typescript/module/chart-cards/${name}.d.ts`,
        default: `./lib/module/chart-cards/${name}.js`,
      },
      require: {
        types: `./lib/typescript/commonjs/chart-cards/${name}.d.ts`,
        default: `./lib/commonjs/chart-cards/${name}.js`,
      },
    });
    expect(pkg.typesVersions['*'][`chart-cards/${name}`]).toEqual([
      `./lib/typescript/module/chart-cards/${name}.d.ts`,
    ]);
    const graph = runtimeGraph(name);
    expect(graph.has(join(source, 'chart-cards/index.ts'))).toBe(false);
    expect(graph.has(join(source, 'chart-cards/SankeyChartCard.tsx'))).toBe(false);
  },
);
