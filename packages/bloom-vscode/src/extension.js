// The Bloom extension's language client: runs `bloomc lsp` and speaks the
// few LSP messages it serves (full-text sync, diagnostics, hover,
// formatting). Written against VS Code's API directly, with no client
// library: the server's surface is small and the extension has no build step.
const { spawn } = require('node:child_process');
const vscode = require('vscode');

const { Connection } = require('./connection');

const LANGUAGE = 'bloom';

const toRange = (range) =>
  new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);

let connection;

async function activate(context) {
  const bloomc = vscode.workspace.getConfiguration('bloom').get('bloomcPath') || 'bloomc';
  const child = spawn(bloomc, ['lsp'], { stdio: ['pipe', 'pipe', 'inherit'] });
  const diagnostics = vscode.languages.createDiagnosticCollection(LANGUAGE);
  context.subscriptions.push(diagnostics);
  child.on('error', (error) => {
    vscode.window.showWarningMessage(`Bloom: could not start ${bloomc} lsp (${error.message}).`);
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
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(open),
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      if (!isBloom(document)) return;
      connection.notify('textDocument/didChange', {
        textDocument: { uri: document.uri.toString(), version: document.version },
        contentChanges: [{ text: document.getText() }],
      });
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (!isBloom(document)) return;
      connection.notify('textDocument/didClose', {
        textDocument: { uri: document.uri.toString() },
      });
    }),
    vscode.languages.registerHoverProvider(LANGUAGE, {
      async provideHover(document, position) {
        const hover = await connection.request('textDocument/hover', {
          textDocument: { uri: document.uri.toString() },
          position: { line: position.line, character: position.character },
        });
        if (!hover) return null;
        return new vscode.Hover(
          new vscode.MarkdownString(hover.contents.value),
          hover.range && toRange(hover.range),
        );
      },
    }),
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
