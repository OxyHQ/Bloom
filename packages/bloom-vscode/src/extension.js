// The Bloom extension's language client: runs `bloomc lsp` (the workspace's
// own compiler when it has one, see ./bloomc-path) and speaks the LSP messages
// it serves: incremental sync, diagnostics, hover, go-to-definition,
// references, completion and formatting. Written against VS Code's API
// directly, with no client library: the server's surface is small and the
// extension has no build step.
const { spawn } = require('node:child_process');
const vscode = require('vscode');

const { resolveBloomc } = require('./bloomc-path');
const { Connection } = require('./connection');

const LANGUAGE = 'bloom';

const toRange = (range) =>
  new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
const fromPosition = (position) => ({ line: position.line, character: position.character });
const toLocation = (location) =>
  new vscode.Location(vscode.Uri.parse(location.uri), toRange(location.range));

let connection;

async function activate(context) {
  const bloomc = resolveBloomc({
    setting: vscode.workspace.getConfiguration('bloom').get('bloomcPath'),
    folders: (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath),
    // A workspace's own binaries run only once it is trusted.
    trusted: vscode.workspace.isTrusted,
  });
  const child = spawn(bloomc.command, bloomc.args, { stdio: ['pipe', 'pipe', 'inherit'] });
  const diagnostics = vscode.languages.createDiagnosticCollection(LANGUAGE);
  context.subscriptions.push(diagnostics);
  child.on('error', (error) => {
    vscode.window.showWarningMessage(
      `Bloom: could not start ${bloomc.command} lsp (${error.message}). Install @oxy.so/bloom-language-compiler in the workspace, or set bloom.bloomcPath.`,
    );
  });

  connection = new Connection(child, (method, params) => {
    if (method !== 'textDocument/publishDiagnostics') return;
    diagnostics.set(
      vscode.Uri.parse(params.uri),
      params.diagnostics.map((d) => {
        const diagnostic = new vscode.Diagnostic(
          toRange(d.range),
          d.message,
          d.severity === 1 ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning,
        );
        diagnostic.code = d.code;
        diagnostic.source = d.source;
        return diagnostic;
      }),
    );
  });
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.toString() ?? null;
  await connection.request('initialize', {
    processId: process.pid,
    rootUri: root,
    capabilities: {},
  });
  connection.notify('initialized', {});

  const isBloom = (document) => document.languageId === LANGUAGE;
  const at = (document, position) => ({
    textDocument: { uri: document.uri.toString() },
    position: fromPosition(position),
  });
  const open = (document) => {
    if (!isBloom(document)) return;
    connection.notify('textDocument/didOpen', {
      textDocument: {
        uri: document.uri.toString(),
        languageId: LANGUAGE,
        version: document.version,
        text: document.getText(),
      },
    });
  };
  vscode.workspace.textDocuments.forEach(open);
  // The TS declarations and other modules a .bloom file imports.
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,tsx,bloom,json}');
  const changed = (uri, type) =>
    connection.notify('workspace/didChangeWatchedFiles', {
      changes: [{ uri: uri.toString(), type }],
    });
  context.subscriptions.push(
    watcher,
    watcher.onDidChange((uri) => changed(uri, 2)),
    watcher.onDidCreate((uri) => changed(uri, 1)),
    watcher.onDidDelete((uri) => changed(uri, 3)),
    vscode.workspace.onDidOpenTextDocument(open),
    vscode.workspace.onDidChangeTextDocument(({ document, contentChanges }) => {
      if (!isBloom(document) || contentChanges.length === 0) return;
      connection.notify('textDocument/didChange', {
        textDocument: { uri: document.uri.toString(), version: document.version },
        // Incremental: each change's range in the text before it, in order.
        contentChanges: contentChanges.map((change) => ({
          range: {
            start: fromPosition(change.range.start),
            end: fromPosition(change.range.end),
          },
          text: change.text,
        })),
      });
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (!isBloom(document)) return;
      connection.notify('textDocument/didSave', { textDocument: { uri: document.uri.toString() } });
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (!isBloom(document)) return;
      connection.notify('textDocument/didClose', {
        textDocument: { uri: document.uri.toString() },
      });
    }),
    vscode.languages.registerHoverProvider(LANGUAGE, {
      async provideHover(document, position) {
        const hover = await connection.request('textDocument/hover', at(document, position));
        if (!hover) return null;
        return new vscode.Hover(
          new vscode.MarkdownString(hover.contents.value),
          hover.range && toRange(hover.range),
        );
      },
    }),
    vscode.languages.registerDefinitionProvider(LANGUAGE, {
      async provideDefinition(document, position) {
        const location = await connection.request(
          'textDocument/definition',
          at(document, position),
        );
        return location ? toLocation(location) : null;
      },
    }),
    vscode.languages.registerReferenceProvider(LANGUAGE, {
      async provideReferences(document, position, context) {
        const locations = await connection.request('textDocument/references', {
          ...at(document, position),
          context: { includeDeclaration: context.includeDeclaration },
        });
        return (locations ?? []).map(toLocation);
      },
    }),
    vscode.languages.registerCompletionItemProvider(
      LANGUAGE,
      {
        async provideCompletionItems(document, position) {
          const items = await connection.request('textDocument/completion', at(document, position));
          return (items ?? []).map((item) => {
            // LSP's kinds are one more than VS Code's.
            const completion = new vscode.CompletionItem(item.label, item.kind - 1);
            completion.detail = item.detail;
            if (item.textEdit) {
              completion.range = toRange(item.textEdit.range);
              completion.insertText = item.textEdit.newText;
            }
            return completion;
          });
        },
      },
      '.',
      '"',
    ),
    vscode.languages.registerDocumentFormattingEditProvider(LANGUAGE, {
      async provideDocumentFormattingEdits(document) {
        const edits = await connection.request('textDocument/formatting', {
          textDocument: { uri: document.uri.toString() },
          options: { tabSize: 2, insertSpaces: true },
        });
        return (edits ?? []).map((edit) =>
          vscode.TextEdit.replace(toRange(edit.range), edit.newText),
        );
      },
    }),
  );
}

async function deactivate() {
  if (!connection) return;
  await connection.request('shutdown').catch(() => {});
  connection.notify('exit');
}

module.exports = { activate, deactivate };
