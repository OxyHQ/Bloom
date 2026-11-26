// node --test test/import-cache.test.cjs: a .bloom module's cached transform
// follows what it imports. `screen.bloom` inlines `model.bloom`'s struct
// default, so editing that default must compile the screen again, in Jest (its
// cache key) and in Metro (its real Transformer over a file cache store, as a
// restarted Metro reads it).
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createTransformer } = require('../js/jest');
const { withBloomLanguage } = require('../js/metro');

const MODEL = 'pub struct Draft {\n  text: String = "a"\n}\n';
const WHEN = 'export function label(name: string): string {\n  return name;\n}\n';
const SCREEN = `import { Draft } from "./model.bloom"
import { label } from "./when"

pub view Screen() {
  @state draft = Draft()

  body {
    Text(label(draft.text))
  }
}
`;

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bloom-import-cache-'));
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{ "compilerOptions": { "strict": true } }\n');
  fs.writeFileSync(path.join(dir, 'model.bloom'), MODEL);
  fs.writeFileSync(path.join(dir, 'when.ts'), WHEN);
  fs.writeFileSync(path.join(dir, 'screen.bloom'), SCREEN);
  return dir;
}

test("Jest's cache key for a .bloom module changes with the .bloom and TS files it imports", (t) => {
  const dir = project();
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const transformer = createTransformer({
    upstream: [require.resolve('./support/echo-transformer.cjs'), {}],
  });
  const screen = path.join(dir, 'screen.bloom');
  const options = { config: { rootDir: dir } };
  const key = () => transformer.getCacheKey(SCREEN, screen, options);
  const first = key();
  assert.equal(key(), first, 'nothing changed');
  fs.writeFileSync(path.join(dir, 'model.bloom'), MODEL.replace('"a"', '"b"'));
  const second = key();
  assert.notEqual(second, first, 'the imported .bloom changed');
  fs.writeFileSync(path.join(dir, 'when.ts'), `${WHEN}export const later = 1;\n`);
  assert.notEqual(key(), second, 'the imported TS changed');
  // A module that is not .bloom keeps its key.
  const ts = path.join(dir, 'when.ts');
  assert.equal(
    transformer.getCacheKey(WHEN, ts, options),
    transformer.getCacheKey(WHEN, ts, options),
  );
});

/**
 * Metro's own Transformer, as a fresh Metro builds it, over a file store in
 * `cacheDir` whose writes `flush` waits for (Metro does not await them).
 */
async function metroTransformer(dir, cacheDir, { checkImports }) {
  const { getDefaultConfig, mergeConfig } = require('metro-config');
  const { FileStore } = require('metro-cache');
  const { default: Transformer } = require('metro/private/DeltaBundler/Transformer');
  const files = new FileStore({ root: cacheDir });
  const writes = [];
  const store = {
    name: 'FileStore',
    get: (key) => files.get(key),
    set: (key, value) => {
      const write = files.set(key, value);
      writes.push(write);
      return write;
    },
    clear: () => files.clear(),
  };
  const input = {
    projectRoot: dir,
    watchFolders: [dir],
    maxWorkers: 1,
    cacheStores: [store],
    transformerPath: require.resolve('./support/counting-worker.cjs'),
  };
  const config = mergeConfig(
    await getDefaultConfig(dir),
    checkImports ? withBloomLanguage(input) : input,
  );
  if (!checkImports) {
    // The worker, without the stores that check imports.
    Object.assign(config, {
      transformerPath: require.resolve('../js/metro-transformer'),
      transformer: {
        ...config.transformer,
        bloomLanguage: { upstreamTransformerPath: input.transformerPath },
      },
    });
  }
  const sha1 = async (file) => ({
    sha1: crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex'),
  });
  const transformer = new Transformer(config, { getOrComputeSha1: sha1 });
  return { transformer, flush: () => Promise.all(writes) };
}

const TRANSFORM_OPTIONS = {
  customTransformOptions: {},
  dev: true,
  experimentalImportSupport: false,
  inlinePlatform: true,
  inlineRequires: false,
  minify: false,
  nonInlinedRequires: [],
  platform: 'ios',
  type: 'module',
  unstable_transformProfile: 'default',
};

/** The screen's code from a fresh Metro, and whether it compiled it (no cache hit). */
async function screen(dir, cacheDir, checkImports) {
  const { transformer, flush } = await metroTransformer(dir, cacheDir, { checkImports });
  const before = globalThis.bloomUpstreamTransforms ?? 0;
  try {
    const result = await transformer.transformFile(
      path.join(dir, 'screen.bloom'),
      TRANSFORM_OPTIONS,
    );
    await flush();
    const compiled = globalThis.bloomUpstreamTransforms > before;
    return { text: /\{ text: "(\w)" \}/.exec(result.output[0].data.code)?.[1], compiled };
  } finally {
    transformer.end();
  }
}

test('Metro compiles a cached .bloom module again once a file it imports changed', async (t) => {
  const dir = project();
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bloom-metro-cache-'));
  const staleCache = fs.mkdtempSync(path.join(os.tmpdir(), 'bloom-metro-cache-'));
  t.after(() => {
    for (const d of [dir, cacheDir, staleCache]) fs.rmSync(d, { recursive: true, force: true });
  });
  const edit = (text) =>
    fs.writeFileSync(path.join(dir, 'model.bloom'), MODEL.replace('"a"', `"${text}"`));

  assert.deepEqual(await screen(dir, cacheDir, true), { text: 'a', compiled: true });
  assert.deepEqual(await screen(dir, cacheDir, true), { text: 'a', compiled: false }, 'cached');
  // A restarted Metro: the screen's own content is unchanged, its import is not.
  edit('b');
  assert.deepEqual(await screen(dir, cacheDir, true), { text: 'b', compiled: true });
  assert.deepEqual(
    await screen(dir, cacheDir, true),
    { text: 'b', compiled: false },
    'cached again',
  );

  // The control: Metro's stores alone serve the build from before the edit.
  assert.deepEqual(await screen(dir, staleCache, false), { text: 'b', compiled: true });
  edit('c');
  assert.deepEqual(await screen(dir, staleCache, false), { text: 'b', compiled: false }, 'stale');
  assert.deepEqual(await screen(dir, cacheDir, true), { text: 'c', compiled: true });
});

test('withBloomLanguage wraps the stores in every form a config gives them, once', async () => {
  const { DEPENDENCIES } = require('../js/metro-cache');
  const values = new Map();
  const store = {
    name: 'memory',
    get: (key) => values.get(key) ?? null,
    set: (key, value) => values.set(key, value),
    clear: () => values.clear(),
  };
  const [wrapped] = withBloomLanguage({ cacheStores: [store] }).cacheStores;
  assert.equal(wrapped.name, 'memory');
  const dir = project();
  try {
    const manifest = require('../js/dependencies').manifest([path.join(dir, 'model.bloom')]);
    await wrapped.set('k', { output: [], [DEPENDENCIES]: manifest });
    assert.ok(await wrapped.get('k'));
    fs.writeFileSync(path.join(dir, 'model.bloom'), MODEL.replace('"a"', '"b"'));
    assert.equal(await wrapped.get('k'), null);
    // A value with no manifest (any other module) is served as stored.
    await wrapped.set('j', { output: [] });
    assert.deepEqual(await wrapped.get('j'), { output: [] });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const MetroCache = { FileStore: class FileStore {} };
  const fromFunction = withBloomLanguage({ cacheStores: () => [store] }).cacheStores(MetroCache);
  assert.equal(fromFunction[0].name, 'memory');
  const byDefault = withBloomLanguage({}).cacheStores(MetroCache);
  assert.equal(byDefault[0].name, 'FileStore');
  const twice = withBloomLanguage(withBloomLanguage({ cacheStores: [store] })).cacheStores;
  assert.equal(Object.getPrototypeOf(twice[0]), store, 'wrapped once');
});
