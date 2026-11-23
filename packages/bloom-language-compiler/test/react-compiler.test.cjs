// node --test test/react-compiler.test.cjs: the React Compiler (the version Expo
// runs, babel-preset-expo's babel-plugin-react-compiler 1.0.0) compiles what this
// compiler emits for a component and a view body whose chain takes a ref and a
// press handler that reads it, where it gives up on the source as written.
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const babel = require('@babel/core');

const { compileModule } = require('../js/compile');

/** What the React Compiler did with each function: `ok` or the reason it gave up. */
function reactCompiled(source, filename) {
  const outcomes = [];
  babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('@babel/preset-typescript'), { isTSX: true, allExtensions: true }]],
    plugins: [
      [
        require.resolve('babel-plugin-react-compiler'),
        {
          target: '19',
          logger: {
            logEvent(_file, event) {
              if (event.kind === 'CompileSuccess') outcomes.push('ok');
              else if (event.kind === 'CompileError') outcomes.push(event.detail.reason);
            },
          },
        },
      ],
    ],
  });
  return outcomes;
}

const IMPORTS = `import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Text, VStack, toElement, view } from '@oxy.so/bloom-language';
`;

/** A progress bar that measures itself when pressed (Mention's video controls). */
const COMPONENT = `${IMPORTS}
export function Progress({ onSeek, label }) {
  const bar = useRef(null);
  const seek = useCallback(() => bar.current?.measure(onSeek), [onSeek]);
  return <View>{toElement(VStack(Text(label)).ref(bar).onPress(seek))}</View>;
}
`;

const BODY = `${IMPORTS}
export const Progress = view(function Progress({ onSeek, label }) {
  const bar = useRef(null);
  const seek = useCallback(() => bar.current?.measure(onSeek), [onSeek]);
  return VStack(Text(label)).ref(bar).onPress(seek);
});
export const Inline = view(({ onSeek, label }) => VStack(Text(label)).onPress(onSeek));
`;

const REFS = 'Cannot access refs during render';

test('a chain given a ref and a ref-reading handler costs a component its memoization as written', () => {
  assert.deepEqual([...new Set(reactCompiled(COMPONENT, 'progress.tsx'))], [REFS]);
});

test('toElement(chain), lowered to a root that builds it, compiles', () => {
  const { code } = compileModule(COMPONENT, 'progress.tsx');
  assert.match(code, /build=\{\(\) => /);
  assert.deepEqual(reactCompiled(code, 'progress.tsx'), ['ok']);
});

test('a view body returning that chain gives up as written (its directive opts it in)', () => {
  const written = BODY.replace('({ onSeek, label }) {', '({ onSeek, label }) {\n  "use memo";');
  assert.ok(reactCompiled(written, 'body.tsx').includes(REFS));
});

test('a view body, its returned chain lowered to a function that builds it, compiles', () => {
  const { code } = compileModule(BODY, 'body.tsx');
  assert.match(code, /return \(\) => VStack/);
  assert.deepEqual(reactCompiled(code, 'body.tsx'), ['ok', 'ok']);
});
