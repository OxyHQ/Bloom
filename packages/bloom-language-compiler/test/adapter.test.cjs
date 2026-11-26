// node --test test/adapter.test.cjs: the JS adapters around the native compiler.
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');
const { vlqMapFromTuples } = require('metro-source-map');

const { compileModule } = require('../js/compile');
const { remapMetroMap } = require('../js/remap');
const { createTransformer } = require('../js/jest');
const { withBloomLanguage } = require('../js/metro');

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
      // Metro and Jest print the message: the section that explains the modifier is in it.
      assert.match(
        error.message,
        /\n {2}= docs: https:\/\/github\.com\/OxyHQ\/Bloom\/blob\/main\/docs\/bloom-language-modifiers\.mdx#padding$/m,
      );
      assert.deepEqual(error.docs, [
        'https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-modifiers.mdx#padding',
        'https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-tokens.mdx#padding',
      ]);
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

test('a warning is said and the module still compiles', () => {
  const source = `import { ScrollView, Text, VStack } from '@oxy.so/bloom-language';

export function Feed() {
  return ScrollView(VStack(Text('Pinned')).glass());
}
`;
  const said = [];
  const warn = console.warn;
  console.warn = (message) => said.push(message);
  try {
    const output = compileModule(source, 'feed.tsx');
    assert.ok(output === null || typeof output.code === 'string');
  } finally {
    console.warn = warn;
  }
  assert.equal(said.length, 1);
  assert.match(said[0], /^warning\[bloom\]: glass in scrolling content/);
  assert.match(said[0], /= docs: https:\/\/\S+\/bloom-language-tour\.mdx#liquid-glass-rules$/m);
});

test('withBloomLanguage lets Metro resolve .bloom modules, once', () => {
  const config = withBloomLanguage({ resolver: { sourceExts: ['ts', 'tsx', 'js'] } });
  assert.deepEqual(config.resolver.sourceExts, ['ts', 'tsx', 'js', 'bloom']);
  assert.deepEqual(withBloomLanguage(config).resolver.sourceExts, ['ts', 'tsx', 'js', 'bloom']);
  assert.match(config.transformerPath, /metro-transformer\.js$/);
});

const COUNTER = `pub view Counter() {
  @state count = 0

  body {
    Button(Text("\${count}")).onPress { count += 1 }
  }
}
`;

test('a .bloom module reaches the upstream transformer as TypeScript, with its map inline', () => {
  const upstream = require.resolve('./support/echo-transformer.cjs');
  const transformer = createTransformer({ upstream: [upstream, {}] });
  const result = transformer.process(COUNTER, '/app/Counter.bloom', {});
  assert.equal(result.filename, '/app/Counter.bloom.ts');
  assert.match(result.code, /useState/);
  const inline = /\/\/# sourceMappingURL=data:application\/json;charset=utf-8;base64,(\S+)\n$/.exec(
    result.code,
  );
  assert.ok(inline, 'an inline source map');
  const map = JSON.parse(Buffer.from(inline[1], 'base64').toString('utf8'));
  assert.deepEqual(map.sources, ['/app/Counter.bloom']);
});

test('a .bloom error is a thrown, rendered diagnostic at its position', () => {
  const transformer = createTransformer({
    upstream: [require.resolve('./support/echo-transformer.cjs'), {}],
  });
  assert.throws(
    () =>
      transformer.process(
        COUNTER.replace('Button(', 'Button(Text("a")).padding("medium")\n    Button('),
        '/app/Bad.bloom',
        {},
      ),
    (error) => {
      assert.match(error.message, /^error\[B\d{4}\]/m);
      assert.equal(error.filename, '/app/Bad.bloom');
      assert.equal(typeof error.lineNumber, 'number');
      return true;
    },
  );
});
