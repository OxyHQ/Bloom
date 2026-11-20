// node --test test/adapter.test.cjs: the JS adapters around the native compiler.
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');
const { vlqMapFromTuples } = require('metro-source-map');

const { compileModule } = require('../js/compile');
const { remapMetroMap } = require('../js/remap');
const { createTransformer } = require('../js/jest');

const ROW = `import { HStack, Text } from '@oxy.so/bloom-language';

export function Row(post) {
  return HStack(Text(post.author.name), Text('Pinned').font('caption-1')).padding('md');
}
`;

test('modules without the language skip the compiler', () => {
  assert.equal(compileModule("import { View } from 'react-native';", 'a.ts'), null);
});

test('a wrong token throws the rendered diagnostic with its position', () => {
  assert.throws(
    () => compileModule(ROW.replace("padding('md')", "padding('mdd')"), 'row.tsx'),
    (error) => {
      assert.equal(error.lineNumber, 4);
      assert.equal(error.column, 82);
      assert.match(error.message, /Unknown padding token 'mdd' for \.padding\(\)/);
      assert.match(error.message, /did you mean 'md'\?/);
      return true;
    },
  );
});

test('the compiler map sends a runtime value and a hoisted chain back to their source', () => {
  const compiled = compileModule(ROW, 'row.tsx');
  assert.equal(compiled.hoisted, 1);
  const lines = compiled.code.split('\n');
  const trace = new TraceMap(compiled.map);
  const at = (text) => {
    const line = lines.findIndex((l) => l.includes(text)) + 1;
    const position = originalPositionFor(trace, { line, column: lines[line - 1].indexOf(text) });
    return [position.line, position.column];
  };
  assert.deepEqual(at('post.author.name'), [4, 21]);
  assert.deepEqual(at('Text("Pinned")'), [4, 40]);
});

test('Metro maps are remapped in the form they came in', () => {
  const compiled = compileModule(ROW, 'row.tsx');
  const lines = compiled.code.split('\n');
  const hoistLine = lines.findIndex((text) => text.includes('_bloomStatic0 =')) + 1;
  const tuples = [[1, 0, hoistLine, 0]];
  const [[, , line]] = remapMetroMap(tuples, compiled.map);
  assert.equal(line, 4);
  const vlq = remapMetroMap(vlqMapFromTuples(tuples), compiled.map);
  assert.equal(typeof vlq.mappings, 'string');
});

test('the Jest transformer hands the compiled module to the transformer it wraps', () => {
  const upstream = require.resolve('./support/echo-transformer.cjs');
  const transformer = createTransformer({ upstream: [upstream, { tag: 'x' }] });
  const result = transformer.process(ROW, 'row.tsx', {});
  assert.match(result.code, /const _bloomStatic0 = Text\("Pinned"\)/);
  assert.equal(result.options.tag, 'x');
  const other = transformer.getCacheKey(ROW, 'row.tsx', {});
  assert.equal(typeof other, 'string');
});
