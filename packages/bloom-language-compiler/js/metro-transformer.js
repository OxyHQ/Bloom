const { compileModule } = require('./compile');
const { digest } = require('./native');
const { remapMetroMap } = require('./remap');

/**
 * A Metro transform worker that compiles Bloom chains, then hands the module
 * to the worker it wraps (Expo's by default) unchanged in every other way.
 *
 * Running before the wrapped worker keeps the app's Babel config and Babel
 * transformer the Expo defaults, so Expo's native transformer (Noxcturnal)
 * and the React Compiler still apply, and the React Compiler sees the
 * already-compiled module.
 */

function upstream(config) {
  return require(config.bloomLanguage.upstreamTransformerPath);
}

async function transform(config, projectRoot, filename, data, options) {
  // The output is the same on every platform: the runtime resolves tokens.
  const compiled = /\.[cm]?[jt]sx?$/.test(filename)
    ? compileModule(data.toString('utf8'), filename)
    : null;
  if (!compiled) return upstream(config).transform(config, projectRoot, filename, data, options);

  const result = await upstream(config).transform(
    config,
    projectRoot,
    filename,
    Buffer.from(compiled.code, 'utf8'),
    options,
  );
  for (const output of result.output) {
    if (output.data.map) output.data.map = remapMetroMap(output.data.map, compiled.map);
    // Its positions describe the compiled module. Metro rebuilds names from
    // the map when this is absent; a production adapter would remap it too.
    output.data.functionMap = null;
  }
  return result;
}

function getCacheKey(config) {
  return [upstream(config).getCacheKey(config), 'bloom-language', digest].join('$');
}

module.exports = { transform, getCacheKey };
