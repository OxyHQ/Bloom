import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Entries that exist to NOT link something, pinned by their static import graph.
 *
 * Metro does not tree-shake: an app naming one export of a barrel bundles and
 * evaluates every module the barrel reaches. Each case below is an import a
 * consumer's startup path makes, and the heavy graph it must stay clear of.
 * Measured in Mention's web export, where these three sat on the home route.
 */

const sourceRoot = resolve(__dirname, '..');

/** Runtime (non-type) relative imports reachable from `entry`, as `src`-relative paths. */
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
      const target = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find((path) => existsSync(path) && statSync(path).isFile());
      if (target) walk(target);
    }
  }
  walk(join(sourceRoot, entry));
  return new Set([...files].map((path) => relative(sourceRoot, path)));
}

function bytes(files: Iterable<string>): number {
  let total = 0;
  for (const file of files) total += statSync(join(sourceRoot, file)).size;
  return total;
}

function report(name: string, lean: Set<string>, full: Set<string>) {
  const avoided = [...full].filter((file) => !lean.has(file));
  console.info(`${name}: ${lean.size} modules / ${bytes(lean)} B; avoids ${avoided.length} modules / ${bytes(avoided)} B.`);
  return avoided;
}

describe('lean entries stay lean', () => {
  it('settings-modal/rows links the rows, not the dialog or its pages', () => {
    const rows = graph('settings-modal/rows.ts');
    expect(rows.has('settings-modal/SettingsRows.tsx')).toBe(true);
    for (const heavy of ['SettingsModal.tsx', 'SettingsStorage.tsx', 'SettingsTools.tsx', 'SettingsArt.tsx', 'SettingsFields.tsx', 'SettingsPlanCard.tsx', 'index.ts']) {
      expect(rows.has(`settings-modal/${heavy}`)).toBe(false);
    }
    expect([...rows].filter((file) => file.startsWith('date-picker/'))).toEqual([]);
    const avoided = report('settings-modal/rows', rows, graph('settings-modal/index.ts'));
    expect(bytes(avoided)).toBeGreaterThan(100_000);
  });

  it('chat-people/contact-row links one row, not the lists, form or story viewer', () => {
    const row = graph('chat-people/contact-row.ts');
    expect(row.has('chat-people/ContactRow.tsx')).toBe(true);
    for (const heavy of ['ContactList.tsx', 'MemberList.tsx', 'MemberRow.tsx', 'NewGroupForm.tsx', 'StoryViewer.tsx', 'StoryProgressBars.tsx', 'ChannelPostCard.tsx', 'SelectedChipsRow.tsx', 'index.ts']) {
      expect(row.has(`chat-people/${heavy}`)).toBe(false);
    }
    report('chat-people/contact-row', row, graph('chat-people/index.ts'));
  });

  it.each(['app-shell/index.ts', 'app-shell/index.web.ts', 'chat-screen/ChatSplitLayout.tsx'])(
    '%s reaches the resize grip without the AI chat shell or its catalog',
    (entry) => {
      const reached = graph(entry);
      expect(reached.has('ai-chat/AiChatShell.tsx')).toBe(false);
      expect(reached.has('ai-chat/messages.ts')).toBe(false);
    },
  );

  it('the split pane still draws the same grip', () => {
    expect(graph('app-shell/AppShellSplit.tsx').has('ai-chat/AiChatResizeHandle.tsx')).toBe(true);
    expect(graph('ai-chat/AiChatShell.tsx').has('ai-chat/AiChatResizeHandle.tsx')).toBe(true);
  });
});
