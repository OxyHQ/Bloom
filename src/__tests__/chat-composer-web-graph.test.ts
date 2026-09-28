import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';

const family = join(__dirname, '../chat-composer');
const targets = new Set(['button', 'surface', 'popover', 'dropdown-menu']);

// Follow shared factories too, using ordinary resolution rather than Metro's
// .web preference. Type-only dependencies do not enter the shipped graph.
function unsafeEdges(entry: string, overrides = new Map<string, string>()): string[] {
  const pending = [entry];
  const visited = new Set<string>();
  const bad: string[] = [];
  while (pending.length) {
    const file = pending.pop()!;
    if (visited.has(file)) continue;
    visited.add(file);
    const source = ts.createSourceFile(file, overrides.get(file) ?? readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
      if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
      const spec = statement.moduleSpecifier;
      if (!spec || !ts.isStringLiteral(spec) || !spec.text.startsWith('.')) continue;
      const base = resolve(dirname(file), spec.text);
      const target = [base + '.ts', base + '.tsx', join(base, 'index.ts')].find(existsSync);
      if (!target) continue;
      if (targets.has(spec.text.split('/')[1] ?? '') && /^\.\.\/[^/]+(?:\/index)?$/.test(spec.text)) bad.push(`${file}: ${spec.text}`);
      if (target.startsWith(family + '/')) {
        if (!/\.web\.tsx?$/.test(target) && (existsSync(base + '.web.ts') || existsSync(base + '.web.tsx'))) bad.push(`${file}: ${spec.text}`);
        pending.push(target);
      }
    }
  }
  return bad;
}

test('every browser chat entry binds its transitive controls to web implementations', () => {
  expect(unsafeEdges(join(family, 'index.web.ts'))).toEqual([]);
});

test('detects a neutral child reached through an otherwise valid web entry', () => {
  const binding = join(family, 'ChatComposer.web.tsx');
  const regressed = readFileSync(binding, 'utf8').replace("'./ComposerIconButton.web'", "'./ComposerIconButton'");
  expect(unsafeEdges(binding, new Map([[binding, regressed]]))).toEqual(expect.arrayContaining([expect.stringContaining('./ComposerIconButton')]));
});
