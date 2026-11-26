// node --test test/: the client's connection against a real `bloomc lsp`
// (set BLOOMC to the binary; skipped without it).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { Connection } = require('../src/connection.js');
const BLOOMC = process.env.BLOOMC;

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
  assert.deepEqual(published.at(-1).diagnostics, []);

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
