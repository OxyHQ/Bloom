import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const tasks = JSON.parse(read('scripts/task-catalog/tasks.json'));
const ids = new Set();
for (const task of tasks) {
  if (ids.has(task.id)) throw Error(`Duplicate task: ${task.id}`);
  ids.add(task.id);
  for (const file of [...task.docs, task.example, task.story.source]) {
    if (!existsSync(resolve(root, file))) throw Error(`Missing catalog target: ${file}`);
  }
  const story = read(task.story.source);
  const group = task.story.id.split('--')[0];
  if (
    !(
      story.includes(`id: '${group}'`) ||
      (task.story.title && story.includes(`title: '${task.story.title}'`))
    ) ||
    !story.includes(`export const ${task.story.export}:`)
  ) {
    throw Error(`Stale story: ${task.story.id}`);
  }
  const source = ts.createSourceFile(
    task.example,
    read(task.example),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  task.imports = source.statements.filter(ts.isImportDeclaration).flatMap((statement) => {
    const from = statement.moduleSpecifier.text;
    if (!from.startsWith('@oxy.so/bloom')) return [];
    const subpath = from === pkg.name ? '.' : `.${from.slice(pkg.name.length)}`;
    const conditions = pkg.exports[subpath];
    if (!conditions) throw Error(`Private or missing import: ${from}`);
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings))
      throw Error(`Use explicit named imports: ${task.example}`);
    return [
      {
        from,
        symbols: bindings.elements.map((node) => (node.propertyName ?? node.name).text),
        conditions,
      },
    ];
  });
  if (!task.imports.length) throw Error(`No public imports: ${task.id}`);
}
const catalog = {
  schemaVersion: 1,
  package: {
    name: pkg.name,
    version: pkg.version,
    peers: pkg.peerDependencies,
    optionalPeers: pkg.peerDependenciesMeta,
  },
  scope:
    'Generated from this package. Version denotes the containing artifact, not proof of registry publication or device acceptance.',
  sections: ['Foundations', 'Composition', 'Components', 'Patterns', 'Templates', 'Labs'],
  tasks,
};
const lines = [
  '---',
  'title: Choose an API by task',
  'description: Versioned task entrypoints, public imports, examples and ownership constraints.',
  'order: 1',
  '---',
  '',
  '{/* GENERATED: node scripts/generate-task-catalog.mjs. Curated semantics: scripts/task-catalog/tasks.json. */}',
  '',
  '# Choose an API by task',
  '',
  `This guide belongs to **${pkg.name} ${pkg.version}**. Read it from the installed package alongside [the structured index](./task-catalog.json). A source build version is not a registry-publication receipt. Use the containing package’s manifest for exact peer ranges.`,
  '',
  'Start under the application’s BloomProvider and follow [getting started](./getting-started.mdx) for CSS, fonts and platform setup. These examples accept domain content/actions and require a bounded host. They do not add a provider per route. For document scrolling, follow [the host contract](./compose-layouts.mdx); Expo’s bounded reset must not silently prevent document overflow.',
  '',
  'The six Storybook sections and existing IDs are unchanged. Story IDs below were read from the running index and are checked against their source exports. Catalog status recommends a composition; it does not establish device acceptance.',
  '',
  '| Task | Selection | Example |',
  '| --- | --- | --- |',
  ...tasks.map(
    (task) =>
      `| [${task.title}](#${task.id}) | ${task.status} | [${task.id}.tsx](./examples/${task.id}.tsx) |`,
  ),
  '',
];
for (const task of tasks) {
  lines.push(
    `<a id="${task.id}" />`,
    '',
    `## ${task.title}`,
    '',
    `Search: ${task.synonyms.join(', ')}. Status: **${task.status}**.`,
    '',
    task.choose,
    '',
    '```tsx',
    ...task.imports.map((item) => `import { ${item.symbols.join(', ')} } from '${item.from}';`),
    '```',
    '',
    `Runnable component: [${task.id}.tsx](./examples/${task.id}.tsx). Story: \`${task.story.id}\` (\`${task.story.export}\`).`,
    '',
    `Canonical guides: ${task.docs.map((file) => `[${file.slice(5, -4)}](./${file.slice(5)})`).join(', ')}.`,
    '',
    ...Object.entries(task.ownership).map(([owner, value]) => `- **${owner}:** ${value}`),
    '',
    `Avoid: ${task.avoid}`,
    '',
    `Consumer context: ${task.consumers}`,
    '',
    `Runtime evidence for this example: web **${task.evidence.web}**, Android **${task.evidence.android}**, iOS **${task.evidence.ios}**. ${task.evidence.scope}`,
    '',
  );
}
function output(file, text) {
  if (process.argv.includes('--check')) {
    if (read(file) !== text) throw Error(`Stale ${file}; regenerate the task catalog`);
  } else writeFileSync(resolve(root, file), text);
}
output('docs/task-catalog.json', `${JSON.stringify(catalog, null, 2)}\n`);
output('docs/task-catalog.mdx', `${lines.join('\n')}\n`);
console.log(`Task catalog: ${tasks.length} tasks for ${pkg.name}@${pkg.version}`);
