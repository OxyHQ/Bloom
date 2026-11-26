const path = require('node:path');

const { compileBloomModule, compileModule, hostFilename, isBloomFile } = require('./compile');
const { manifest } = require('./dependencies');
const { DEPENDENCIES } = require('./metro-cache');
const { digest } = require('./native');
const { remapMetroMap } = require('./remap');

/**
 * A Metro transform worker that compiles Bloom chains and `.bloom` modules,
 * then hands the module to the worker it wraps (Expo's by default) unchanged
 * in every other way.
 *
 * Running before the wrapped worker keeps the app's Babel config and Babel
 * transformer the Expo defaults, so Expo's native transformer (Noxcturnal)
 * and the React Compiler still apply, and the React Compiler sees the
 * already-compiled module.
 *
 * A `.bloom` module reaches the wrapped worker as the TypeScript it compiles
 * to, named `<file>.bloom.ts` so Babel parses it as TypeScript; Metro names
 * the module by its own path, and its map is composed back to the `.bloom`.
 * Its result carries the files its compile read, for the cache (`./metro-cache`).
 */

function upstream(config) {
  return require(config.bloomLanguage.upstreamTransformerPath);
}

/**
 * The module the wrapped worker gets: its name, code and the compiler's map,
 * or `null` to pass it through. A `.bloom` module compiles by its absolute
 * path with the project as its root, where its TS imports resolve (the
 * tsconfig's `paths`, `node_modules`).
 */
function compiled(projectRoot, filename, data) {
  if (isBloomFile(filename)) {
    const { code, map, dependencies } = compileBloomModule(
      data.toString('utf8'),
      path.resolve(projectRoot, filename),
      { root: projectRoot },
    );
    return { filename: hostFilename(filename), code, map, dependencies };
  }
  // The output is the same on every platform: the runtime resolves tokens.
  const output = /\.[cm]?[jt]sx?$/.test(filename)
    ? compileModule(data.toString('utf8'), filename)
    : null;
  return output && { filename, code: output.code, map: output.map };
}

async function transform(config, projectRoot, filename, data, options) {
  const module = compiled(projectRoot, filename, data);
  if (!module) return upstream(config).transform(config, projectRoot, filename, data, options);

  const result = await upstream(config).transform(
    config,
    projectRoot,
    module.filename,
    Buffer.from(module.code, 'utf8'),
    options,
  );
  for (const output of result.output) {
    if (output.data.map && module.map) output.data.map = remapMetroMap(output.data.map, module.map);
    // Its positions describe the compiled module. Metro rebuilds names from
    // the map when this is absent; a production adapter would remap it too.
    output.data.functionMap = null;
  }
  // What the compile read, with each file's digest: Metro caches the result by
  // the module's own content, and `withBloomLanguage`'s cache stores refuse it
  // once one of these files has changed (`./metro-cache`).
  if (module.dependencies) return { ...result, [DEPENDENCIES]: manifest(module.dependencies) };
  return result;
}

function getCacheKey(config) {
  return [upstream(config).getCacheKey(config), 'bloom-language', digest].join('$');
}

module.exports = { transform, getCacheKey };
