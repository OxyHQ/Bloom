// Runtime cost of one tree, interpreted chain vs compiled.
//
//   node packages/bloom-language-compiler/bench/run.mjs
//
// 1. Element production: what a component does each render to produce its
//    tree (interpreted: build the chain, resolve tokens, create elements).
// 2. React update: a parent re-renders with a new prop and the tree under it
//    is reconciled (react-test-renderer, host components).
// 3. Theme switch: how many components render when the palette changes.
// 4. Build cost: the compiler per module, next to Babel with Expo's preset.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire, register } from 'node:module';
import { performance } from 'node:perf_hooks';

register('./hooks.mjs', import.meta.url);
const require = createRequire(import.meta.url);
const { compile } = require('../bloom-language-compiler.node');

const fixtures = new URL('../fixtures/', import.meta.url);
const generated = new URL('.generated/', import.meta.url);
mkdirSync(generated, { recursive: true });
for (const name of ['hello', 'hello-label']) {
  const file = name === 'hello' ? 'hello.tsx' : 'hello-label.ts';
  const output = compile(readFileSync(new URL(file, fixtures), 'utf8'), file, 'native');
  writeFileSync(new URL(`${name}.mts`, generated), output.code);
}

const React = require('react');
const TestRenderer = require('react-test-renderer');
const { HStack, Text, render } = await import('./interpreter.mjs');
const { setPalette } = await import('../runtime/compiled.mjs');
const { Hello: CompiledHello } = await import(new URL('hello.mts', generated));
const { HelloLabel: CompiledHelloLabel } = await import(new URL('hello-label.mts', generated));

const InterpretedHello = () => render(HStack(Text('x').font('body')).padding('md'));
const InterpretedHelloLabel = ({ label }) => render(HStack(Text(label).font('body')).padding('md'));

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Median nanoseconds per call over `rounds` timed batches of `batch` calls. */
function time(fn, { batch = 200_000, rounds = 15 } = {}) {
  for (let i = 0; i < batch; i++) fn(i); // warm up the JIT
  const samples = [];
  for (let round = 0; round < rounds; round++) {
    const start = performance.now();
    for (let i = 0; i < batch; i++) fn(i);
    samples.push(((performance.now() - start) * 1e6) / batch);
  }
  return median(samples);
}

const rows = [];
const report = (group, name, ns, unit = 'ns') => rows.push({ group, name, value: ns, unit });

// 1. Element production.
let sink;
report(
  'element production',
  'interpreted, static text',
  time(() => (sink = InterpretedHello())),
);
report(
  'element production',
  'compiled, static text (hoisted tree)',
  time(() => (sink = CompiledHello())),
);
const labels = ['a', 'b', 'c', 'd'];
report(
  'element production',
  'interpreted, runtime label',
  time((i) => (sink = InterpretedHelloLabel({ label: labels[i & 3] }))),
);
report(
  'element production',
  'compiled, runtime label',
  time((i) => (sink = CompiledHelloLabel({ label: labels[i & 3] }))),
);

// 2. React update of a parent whose child is the tree. Every render is flushed
// synchronously (production React has no act()).
function mount(element) {
  const root = TestRenderer.create(null);
  root.unstable_flushSync(() => root.update(element));
  return root;
}
function updateCost(Tree, withLabel) {
  function Parent({ tick }) {
    return React.createElement(Tree, withLabel ? { label: labels[tick & 3] } : null);
  }
  // Parent passes no memo boundary: Tree renders on every update.
  const root = mount(React.createElement(Parent, { tick: 0 }));
  const updates = 2_000;
  const samples = [];
  for (let round = 0; round < 9; round++) {
    const start = performance.now();
    for (let tick = 1; tick <= updates; tick++) {
      root.unstable_flushSync(() => root.update(React.createElement(Parent, { tick })));
    }
    samples.push(((performance.now() - start) * 1e6) / updates);
  }
  root.unmount();
  return median(samples);
}
report('React update', 'interpreted, static text', updateCost(InterpretedHello, false));
report('React update', 'compiled, static text (hoisted tree)', updateCost(CompiledHello, false));
report('React update', 'interpreted, runtime label', updateCost(InterpretedHelloLabel, true));
report('React update', 'compiled, runtime label', updateCost(CompiledHelloLabel, true));

// 3. Theme switch: 100 rows under one app root.
let appRenders = 0;
let rowRenders = 0;
const CountedRow = () => {
  rowRenders++;
  return CompiledHello();
};
function App() {
  appRenders++;
  return React.createElement(
    'View',
    null,
    Array.from({ length: 100 }, (_, i) => React.createElement(CountedRow, { key: i })),
  );
}
const themeRoot = mount(React.createElement(App));
[appRenders, rowRenders] = [0, 0];
const before = JSON.stringify(themeRoot.toJSON()).includes('rgb(20 20 20)');
themeRoot.unstable_flushSync(() =>
  setPalette({ foreground: 'rgb(240 240 240)', primary: 'rgb(120 180 255)' }),
);
const after = JSON.stringify(themeRoot.toJSON()).includes('rgb(240 240 240)');
const textHosts = themeRoot.root.findAll((node) => node.type === 'Text').length;
rows.push({
  group: 'theme switch, 100 rows',
  name: 'app root renders',
  value: appRenders,
  unit: '',
});
rows.push({
  group: 'theme switch, 100 rows',
  name: 'row component renders',
  value: rowRenders,
  unit: '',
});
rows.push({
  group: 'theme switch, 100 rows',
  name: 'themed text hosts updated',
  value: after ? textHosts : 0,
  unit: '',
});
themeRoot.unmount();
if (!before || !after) throw new Error('the palette did not reach the text hosts');

// 4. Build cost per module.
const babel = require('@babel/core');
const source = readFileSync(new URL('post-row.tsx', fixtures), 'utf8');
const compileUs =
  time(() => compile(source, 'post-row.tsx', 'native'), { batch: 2_000, rounds: 9 }) / 1000;
const babelUs =
  time(
    () =>
      babel.transformSync(source, {
        filename: 'post-row.tsx',
        presets: ['babel-preset-expo'],
        babelrc: false,
        configFile: false,
        caller: { name: 'metro', platform: 'android', bundler: 'metro' },
      }),
    { batch: 200, rounds: 9 },
  ) / 1000;
rows.push({
  group: 'build, post-row.tsx',
  name: 'Bloom compiler (Rust, napi)',
  value: compileUs,
  unit: 'µs',
});
rows.push({
  group: 'build, post-row.tsx',
  name: 'Babel, babel-preset-expo',
  value: babelUs,
  unit: 'µs',
});

void sink;
console.log(
  `node ${process.version}, ${process.arch}, NODE_ENV=${process.env.NODE_ENV ?? 'development'}`,
);
for (const { group, name, value, unit } of rows) {
  const shown = unit ? `${value.toFixed(value < 10 ? 2 : 0)} ${unit}` : String(value);
  console.log(`${group.padEnd(24)} ${name.padEnd(40)} ${shown}`);
}
