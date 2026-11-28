// The Shiki language registration, generated from the one source of Bloom's TextMate grammar,
// packages/bloom-vscode/syntaxes/bloom.tmLanguage.json. `--check` fails when the committed
// files differ from what this writes (run `bun run generate` after editing the grammar).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const source = join(root, '../bloom-vscode/syntaxes/bloom.tmLanguage.json');
const NOTE =
  'Generated from packages/bloom-vscode/syntaxes/bloom.tmLanguage.json in https://github.com/OxyHQ/Bloom by packages/bloom-tmlanguage/scripts/generate.mjs; edit that file, not this one.';

const {
  $schema: _schema,
  name: _name,
  comment,
  ...grammar
} = JSON.parse(readFileSync(source, 'utf8'));
const registration = {
  name: 'bloom',
  displayName: 'Bloom',
  scopeName: grammar.scopeName,
  fileTypes: grammar.fileTypes,
  comment: `${comment} ${NOTE}`,
  patterns: grammar.patterns,
  repository: grammar.repository,
};

const json = `${JSON.stringify(registration, null, 2)}\n`;
const js = `// ${NOTE}\n/** Bloom, the language by Oxy: its Shiki language registration. */\nconst bloom = ${JSON.stringify(registration)};\n\nexport { bloom };\nexport default bloom;\n`;
const outputs = { 'bloom.tmLanguage.json': json, 'index.js': js };

const check = process.argv.includes('--check');
const stale = [];
for (const [file, text] of Object.entries(outputs)) {
  const path = join(root, file);
  let current = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {}
  if (current === text) continue;
  if (check) stale.push(file);
  else writeFileSync(path, text);
}
if (stale.length) {
  console.error(
    `packages/bloom-tmlanguage: ${stale.join(', ')} differ from the grammar; run \`bun run generate\` there.`,
  );
  process.exit(1);
}
