import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Metro warns "Require cycle: …" for every static import cycle and says they "can result in
 * uninitialized values". Two crept into the theme (the colour engine's barrel and the image seed
 * importing each other; the token registry and preset vars). This keeps the theme's own static
 * import graph acyclic, so the warning is not in every consumer's console.
 */
const THEME = resolve(__dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === '__tests__' || name === 'node_modules') return [];
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.(test|stories)\./.test(name) ? [path] : [];
  });
}

function resolveImport(from: string, specifier: string): string | null {
  const base = resolve(dirname(from), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ])
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

/** Static value imports and re-exports between the theme's own files (type-only ones erase). */
function edges(file: string): string[] {
  const code = readFileSync(file, 'utf8');
  const found: string[] = [];
  const pattern = /(?:^|\n)\s*(?:import|export)\s+(?!type\b)[^;'"]*?from\s+['"](\.[^'"]*)['"]/g;
  for (const match of code.matchAll(pattern)) {
    const target = resolveImport(file, match[1]!);
    if (target?.startsWith(THEME)) found.push(target);
  }
  return found;
}

describe('the theme’s static import graph', () => {
  it('has no cycle', () => {
    const graph = new Map(sources(THEME).map((file) => [file, edges(file)]));
    const state = new Map<string, 'visiting' | 'done'>();
    const cycles: string[] = [];
    const visit = (file: string, path: string[]) => {
      if (state.get(file) === 'done') return;
      if (state.get(file) === 'visiting') {
        cycles.push(
          [...path.slice(path.indexOf(file)), file]
            .map((f) => f.slice(THEME.length + 1))
            .join(' -> '),
        );
        return;
      }
      state.set(file, 'visiting');
      for (const next of graph.get(file) ?? []) visit(next, [...path, file]);
      state.set(file, 'done');
    };
    for (const file of graph.keys()) visit(file, []);
    expect(cycles).toEqual([]);
  });
});
