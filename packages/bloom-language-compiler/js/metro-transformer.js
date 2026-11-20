const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { compileModule } = require('./compile');
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
  const platform = options.platform === 'web' ? 'web' : 'native';
  // The spike compiles native only; on web the runtime interprets the chains.
  const compiled =
    platform === 'native' && /\.[cm]?[jt]sx?$/.test(filename)
      ? compileModule(data.toString('utf8'), filename, platform)
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

const addonDigest = crypto
  .createHash('sha1')
  .update(fs.readFileSync(path.join(__dirname, '..', 'bloom-language-compiler.node')))
  .digest('hex');

function getCacheKey(config) {
  return [upstream(config).getCacheKey(config), 'bloom-language', addonDigest].join('$');
}

module.exports = { transform, getCacheKey };
