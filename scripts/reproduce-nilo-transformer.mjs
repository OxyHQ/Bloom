// Executes the installed Expo transformer without changing consumer dependencies.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';
const root = resolve(process.env.NILO_ROOT);
const output = resolve(
  process.env.BASELINE_OUTPUT ?? 'docs/audits/issue-663/baseline/nilo/transformer',
);
const require = createRequire(join(root, 'package.json'));
const source =
  'class Base {} var Observer = class extends Base { #result; constructor(){super();this.#result=[];} #read(){return this.#result;} read(){return this.#read();} }; globalThis.observed = new Observer().read();';
const original = {};
vm.runInNewContext(source, original);
assert.equal(original.observed.length, 0);
const transformerPath = join(
  root,
  'node_modules/@expo/metro-config/build/transform-worker/noxcturnal/noxcturnal-transformer.js',
);
const { transformFileFullyWithNoxcturnalSync } = require(transformerPath);
const options = {
  type: 'module',
  platform: 'web',
  dev: true,
  hot: false,
  minify: false,
  inlineRequires: false,
  unstable_transformProfile: 'hermes-stable',
  customTransformOptions: { engine: 'hermes' },
};
const attempt = transformFileFullyWithNoxcturnalSync({
  filename: 'node_modules/fixture/index.js',
  source,
  projectRoot: root,
  enableBabelRuntime: false,
  isDefaultExpoTransformer: true,
  hasNonDefaultBabelConfig: false,
  options,
  config: {
    allowOptionalDependencies: true,
    asyncRequireModulePath: 'asyncRequire',
    globalPrefix: '',
    unstable_compactOutput: false,
    unstable_disableModuleWrapping: true,
  },
});
assert.equal(attempt.status, 'complete');
let error = null;
try {
  vm.runInNewContext(attempt.result.code, {});
} catch (caught) {
  error = caught.message;
}
const packages = Object.fromEntries(
  ['@oxy.so/app-preset', '@expo/metro-config', 'noxcturnal', '@tanstack/query-core'].map((name) => [
    name,
    {
      version: require(`${name}/package.json`).version,
      path: realpathSync(require.resolve(`${name}/package.json`)),
    },
  ]),
);
mkdirSync(output, { recursive: true });
writeFileSync(join(output, 'input.js'), `${source}\n`);
writeFileSync(join(output, 'output.js'), attempt.result.code);
writeFileSync(
  join(output, 'report.json'),
  `${JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      packages,
      options,
      original: 'pass',
      transformed: error ?? 'pass',
      reactCompiler: false,
      helpers:
        'inline for self-contained execution; same private-key collision as app runtime helpers',
    },
    null,
    2,
  )}\n`,
);
console.log(JSON.stringify({ original: 'pass', transformed: error ?? 'pass', packages }, null, 2));
