import assert from 'node:assert';
import { test } from 'node:test';
import Parser from 'tree-sitter';

test('can load grammar', async () => {
  const parser = new Parser();
  await assert.doesNotReject(async () => {
    const { default: language } = await import('./index.js');
    parser.setLanguage(language);
  });
});

test('parses a view', async () => {
  const parser = new Parser();
  const { default: language } = await import('./index.js');
  parser.setLanguage(language);
  const tree = parser.parse(
    'public struct Greeting: View {\n  let name: String\n  var body: some View {\n    Text("Hello, \\(name)")\n      .padding(.md)\n  }\n}\n',
  );
  assert.equal(tree.rootNode.hasError, false);
  assert.equal(tree.rootNode.child(0).type, 'struct_declaration');
});
