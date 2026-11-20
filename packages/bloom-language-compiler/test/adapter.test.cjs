// node --test packages/bloom-language-compiler/test
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');
const { vlqMapFromTuples } = require('metro-source-map');

const { compileModule } = require('../js/compile');
const { remapMetroMap } = require('../js/remap');

const fixture = (name) => fs.readFileSync(path.join(__dirname, '../fixtures', name), 'utf8');

test('modules without the language skip the compiler', () => {
  assert.equal(compileModule("import { View } from 'react-native';", 'a.ts', 'native'), null);
});

test('a wrong token throws the rendered diagnostic with its position', () => {
  assert.throws(
    () => compileModule(fixture('wrong-token.tsx'), 'wrong-token.tsx', 'native'),
    (error) => {
      assert.equal(error.lineNumber, 4);
      assert.equal(error.column, 48);
      assert.match(error.message, /Unknown spacing token 'mdd' for \.padding\(\)/);
      assert.match(error.message, /did you mean 'md'\?/);
      return true;
    },
  );
});

test('the compiler map sends a runtime value back to its source position', () => {
  const compiled = compileModule(fixture('post-row.tsx'), 'post-row.tsx', 'native');
  const lines = compiled.code.split('\n');
  const line = lines.findIndex((text) => text.includes('children: post.author.name')) + 1;
  const column = lines[line - 1].indexOf('post.author.name');
  const original = originalPositionFor(new TraceMap(compiled.map), { line, column });
  assert.deepEqual([original.line, original.column], [8, 11]);
});

test('Metro maps are remapped in the form they came in', () => {
  const compiled = compileModule(fixture('hello.tsx'), 'hello.tsx', 'native');
  // A Metro segment pointing at the hoisted style's `padding` line, which the
  // code generator leaves without a mapping of its own.
  const lines = compiled.code.split('\n');
  const paddingLine = lines.findIndex((text) => text.includes('padding: 12')) + 1;
  const tuples = [[1, 0, paddingLine, 1]];
  assert.deepEqual(remapMetroMap(tuples, compiled.map), [[1, 0, 4, 9]]);
  const vlq = remapMetroMap(vlqMapFromTuples(tuples), compiled.map);
  assert.equal(typeof vlq.mappings, 'string');
});
