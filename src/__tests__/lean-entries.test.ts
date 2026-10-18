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

/**
 * Runtime (non-type) relative imports reachable from `entry`, as `src`-relative paths.
 * A bare specifier resolves to its platform fork first (`.native` or `.web`), as
 * Metro and web bundlers do, then to the unsuffixed file.
 */
function graph(entry: string, platform: 'native' | 'web' = 'native'): Set<string> {
  const extensions = [`.${platform}.ts`, `.${platform}.tsx`, '.ts', '.tsx'];
  const files = new Set<string>();
  function walk(file: string) {
    if (files.has(file)) return;
    files.add(file);
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      if (
        (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue;
      if (ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith('.')) continue;
      const base = resolve(dirname(file), specifier);
      const target = [
        base,
        ...extensions.map((extension) => `${base}${extension}`),
        ...extensions.map((extension) => join(base, `index${extension}`)),
      ].find((path) => existsSync(path) && statSync(path).isFile());
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
  console.info(
    `${name}: ${lean.size} modules / ${bytes(lean)} B; avoids ${avoided.length} modules / ${bytes(avoided)} B.`,
  );
  return avoided;
}

describe('lean entries stay lean', () => {
  it('settings-modal/rows links the rows, not the dialog or its pages', () => {
    const rows = graph('settings-modal/rows.ts');
    expect(rows.has('settings-modal/SettingsRows.tsx')).toBe(true);
    for (const heavy of [
      'SettingsModal.tsx',
      'SettingsStorage.tsx',
      'SettingsTools.tsx',
      'SettingsArt.tsx',
      'SettingsFields.tsx',
      'SettingsPlanCard.tsx',
      'index.ts',
    ]) {
      expect(rows.has(`settings-modal/${heavy}`)).toBe(false);
    }
    expect([...rows].filter((file) => file.startsWith('date-picker/'))).toEqual([]);
    const avoided = report('settings-modal/rows', rows, graph('settings-modal/index.ts'));
    expect(bytes(avoided)).toBeGreaterThan(100_000);
  });

  // The modal shell, lazy-loaded by an app, must not link the families only the
  // Storage/Tools/Plan pages use. Measured in GoWay's web export: `Select`,
  // reached through the Storage page, was shared with another lazy chunk and
  // hoisted into the first-paint common chunk (+4.7 KB gzip).
  const PAGE_ONLY_FAMILIES = [
    'select/',
    'file-upload/',
    'pagination/',
    'dropdown-menu/',
    'checkbox/',
    'chip/',
    'tooltip/',
    'empty-state/',
  ];
  const PAGE_FILES = [
    'SettingsStorage.tsx',
    'SettingsTools.tsx',
    'SettingsPlanCard.tsx',
    'SettingsArt.tsx',
    'index.ts',
  ].map((file) => `settings-modal/${file}`);

  it.each(['native', 'web'] as const)(
    'settings-modal/modal links the dialog and rows, not its pages or fields (%s)',
    (platform) => {
      const modal = graph('settings-modal/modal.ts', platform);
      expect(modal.has('settings-modal/SettingsModal.tsx')).toBe(true);
      expect(modal.has('settings-modal/SettingsRows.tsx')).toBe(true);
      for (const file of [...PAGE_FILES, 'settings-modal/SettingsFields.tsx']) {
        expect(modal.has(file)).toBe(false);
      }
      for (const family of [...PAGE_ONLY_FAMILIES, 'date-picker/', 'popover/', 'text-field/']) {
        expect([...modal].filter((file) => file.startsWith(family))).toEqual([]);
      }
      const avoided = report(
        `settings-modal/modal (${platform})`,
        modal,
        graph('settings-modal/index.ts', platform),
      );
      // The control: the full entry DOES reach what the lean one must not, so
      // the assertions above can fail.
      expect(avoided).toEqual(expect.arrayContaining(PAGE_FILES));
      for (const family of ['select/', 'file-upload/']) {
        expect(avoided.some((file) => file.startsWith(family))).toBe(true);
      }
    },
  );

  it.each(['native', 'web'] as const)(
    'settings-modal/fields links the fields, not the dialog or its pages (%s)',
    (platform) => {
      const fields = graph('settings-modal/fields.ts', platform);
      expect(fields.has('settings-modal/SettingsFields.tsx')).toBe(true);
      for (const file of [...PAGE_FILES, 'settings-modal/SettingsModal.tsx']) {
        expect(fields.has(file)).toBe(false);
      }
      for (const family of PAGE_ONLY_FAMILIES) {
        expect([...fields].filter((file) => file.startsWith(family))).toEqual([]);
      }
    },
  );

  it('the lean settings entries hand out the same components as the full one', () => {
    const full = require('../settings-modal');
    for (const lean of [
      require('../settings-modal/modal'),
      require('../settings-modal/fields'),
      require('../settings-modal/rows'),
    ]) {
      expect(Object.keys(lean).length).toBeGreaterThan(0);
      for (const [name, value] of Object.entries(lean)) {
        expect([name, full[name]]).toEqual([name, value]);
      }
    }
  });

  it('chat-people/contact-row links one row, not the lists, form or story viewer', () => {
    const row = graph('chat-people/contact-row.ts');
    expect(row.has('chat-people/ContactRow.tsx')).toBe(true);
    for (const heavy of [
      'ContactList.tsx',
      'MemberList.tsx',
      'MemberRow.tsx',
      'NewGroupForm.tsx',
      'StoryViewer.tsx',
      'StoryProgressBars.tsx',
      'ChannelPostCard.tsx',
      'SelectedChipsRow.tsx',
      'index.ts',
    ]) {
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

  it('the panels still draw the same grip', () => {
    expect(graph('app-shell/AppShellPanelLayout.tsx').has('ai-chat/AiChatResizeHandle.tsx')).toBe(true);
    expect(graph('ai-chat/AiChatShell.tsx').has('ai-chat/AiChatResizeHandle.tsx')).toBe(true);
  });
});
