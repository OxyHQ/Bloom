const crypto = require('node:crypto');

const { compileModule } = require('./compile');
const { digest } = require('./native');

/**
 * A Jest transformer that compiles Bloom chains, then hands the module to the
 * transformer it wraps (`babel-jest` by default) unchanged in every other way:
 *
 * ```js
 * transform: { '\\.[jt]sx?$': ['@oxy.so/bloom-language-compiler/jest', { upstream: [babelJest, babelOptions] }] }
 * ```
 *
 * Stack traces point into the compiled module, whose hoisted declarations
 * shift lines below them; Metro's adapter composes source maps, this one does not.
 */
function createTransformer(options = {}) {
  const [upstreamPath, upstreamOptions] = options.upstream ?? ['babel-jest', {}];
  const loaded = require(upstreamPath);
  const upstreamModule = loaded.default ?? loaded;
  const upstream = upstreamModule.createTransformer
    ? upstreamModule.createTransformer(upstreamOptions)
    : upstreamModule;
  const compiled = (source, filename) => compileModule(source, filename)?.code ?? source;
  return {
    canInstrument: upstream.canInstrument,
    getCacheKey(source, filename, transformOptions) {
      const key = upstream.getCacheKey
        ? upstream.getCacheKey(source, filename, transformOptions)
        : '';
      return crypto.createHash('sha1').update(`${key}$bloom-language$${digest}`).digest('hex');
    },
    process(source, filename, transformOptions) {
      return upstream.process(compiled(source, filename), filename, transformOptions);
    },
    async processAsync(source, filename, transformOptions) {
      const code = compiled(source, filename);
      return upstream.processAsync
        ? upstream.processAsync(code, filename, transformOptions)
        : upstream.process(code, filename, transformOptions);
    },
  };
}

module.exports = { createTransformer };
