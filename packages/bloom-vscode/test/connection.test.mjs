// node --test test/: the client's connection against a real `bloomc lsp`:
// BLOOMC, else the compiler's checkout build (bun run build:addon in
// packages/bloom-language-compiler); skipped without either.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { Connection } = require('../src/connection.js');
const LOCAL = join(import.meta.dirname, '..', '..', 'bloom-language-compiler', 'bloomc');
const BLOOMC = process.env.BLOOMC ?? (existsSync(LOCAL) ? LOCAL : undefined);

test('bloomc lsp publishes diagnostics, hovers and formats', {
  skip: !BLOOMC && 'BLOOMC is not set',
}, async () => {
  const child = spawn(BLOOMC, ['lsp'], { stdio: ['pipe', 'pipe', 'inherit'] });
  const published = [];
  let onPublish;
  const connection = new Connection(child, (method, params) => {
    if (method !== 'textDocument/publishDiagnostics') return;
    published.push(params);
    onPublish?.();
  });
  const next = () => new Promise((resolve) => (onPublish = resolve));

  const init = await connection.request('initialize', { processId: process.pid, capabilities: {} });
  assert.equal(init.capabilities.hoverProvider, true);
  connection.notify('initialized', {});

  const uri = 'file:///tmp/panel.bloom';
  let arrived = next();
  connection.notify('textDocument/didOpen', {
    textDocument: { uri, languageId: 'bloom', version: 1, text: 'pub view Panel( {\n}\n' },
  });
  await arrived;
  assert.ok(published.at(-1).diagnostics.length > 0, 'a syntax error is published');
  assert.match(published.at(-1).diagnostics[0].code, /^B\d{4}$/);

  const fixed = 'pub   view Panel() {\n  body {\n    Text("a")\n  }\n}\n';
  arrived = next();
  connection.notify('textDocument/didChange', {
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: fixed }],
  });
  await arrived;
  // Errors only: the 0.x forms it is written in warn (B0950, severity 2).
  assert.deepEqual(
    published.at(-1).diagnostics.filter((d) => d.severity === 1),
    [],
  );

  const edits = await connection.request('textDocument/formatting', {
    textDocument: { uri },
    options: {},
  });
  assert.equal(edits[0].newText, 'pub view Panel() {\n  body {\n    Text("a")\n  }\n}\n');

  await connection.request('shutdown');
  const exited = new Promise((resolve) => child.on('exit', resolve));
  connection.notify('exit');
  assert.equal(await exited, 0);
});

test('bloomc lsp takes incremental changes and answers definition, references and completion', {
  skip: !BLOOMC && 'BLOOMC is not set',
}, async () => {
  const child = spawn(BLOOMC, ['lsp'], { stdio: ['pipe', 'pipe', 'inherit'] });
  let onPublish;
  const connection = new Connection(child, (method) => {
    if (method === 'textDocument/publishDiagnostics') onPublish?.();
  });
  const published = () => new Promise((resolve) => (onPublish = resolve));
  const init = await connection.request('initialize', { processId: process.pid, capabilities: {} });
  assert.equal(init.capabilities.textDocumentSync.change, 2);
  assert.equal(init.capabilities.definitionProvider, true);

  const uri = 'file:///tmp/bloom-vscode-navigate.bloom';
  const text =
    'struct Draft {\n  text: String = ""\n}\n\npub view Panel() {\n  @state draft = Draft()\n\n  body {\n    Text(draft.text)\n  }\n}\n';
  let arrived = published();
  connection.notify('textDocument/didOpen', {
    textDocument: { uri, languageId: 'bloom', version: 1, text },
  });
  await arrived;
  const doc = { textDocument: { uri } };

  // `Draft()` on line 5 goes to `struct Draft` on line 0; its references are both.
  const definition = await connection.request('textDocument/definition', {
    ...doc,
    position: { line: 5, character: 18 },
  });
  assert.deepEqual(definition.range.start, { line: 0, character: 7 });
  const references = await connection.request('textDocument/references', {
    ...doc,
    position: { line: 0, character: 8 },
    context: { includeDeclaration: true },
  });
  assert.deepEqual(
    references.map((r) => r.range.start.line),
    [0, 5],
  );

  // `draft.text` becomes `draft.` (an incremental delete), then completes the fields.
  arrived = published();
  connection.notify('textDocument/didChange', {
    textDocument: { uri, version: 2 },
    contentChanges: [
      { range: { start: { line: 8, character: 15 }, end: { line: 8, character: 19 } }, text: '' },
    ],
  });
  await arrived;
  const items = await connection.request('textDocument/completion', {
    ...doc,
    position: { line: 8, character: 15 },
  });
  assert.ok(
    items.some((item) => item.label === 'text' && item.kind === 5),
    JSON.stringify(items),
  );

  await connection.request('shutdown');
  const exited = new Promise((resolve) => child.on('exit', resolve));
  connection.notify('exit');
  assert.equal(await exited, 0);
});
