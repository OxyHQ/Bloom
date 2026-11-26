const crypto = require('node:crypto');

const { compileBloomModule, compileModule, hostFilename, isBloomFile } = require('./compile');
const { digest } = require('./native');

/**
 * A Jest transformer that compiles Bloom chains and `.bloom` modules, then
 * hands the module to the transformer it wraps (`babel-jest` by default):
 *
 * ```js
 * moduleFileExtensions: ['bloom', 'tsx', 'ts', 'js', 'json'],
 * transform: {
 *   '\\.(bloom|[jt]sx?)$': ['@oxy.so/bloom-language-compiler/jest', { upstream: ['babel-jest', babelOptions] }],
 * },
 * ```
 *
 * A `.bloom` module reaches the upstream transformer as the TypeScript it
 * compiles to, named `<file>.bloom.ts` so Babel's TypeScript preset parses
 * it, with the compiler's source map inline: Babel composes it into its own
 * (`inputSourceMap`), so a stack trace from a `.bloom` handler names the
 * `.bloom` file and line. A `.tsx` module's hoisted declarations still shift
 * lines below them (its map is not composed here; Metro's adapter composes it).
 */
function createTransformer(options = {}) {
  const [upstreamPath, upstreamOptions] = options.upstream ?? ['babel-jest', {}];
  const loaded = require(upstreamPath);
  const upstreamModule = loaded.default ?? loaded;
  const upstream = upstreamModule.createTransformer
    ? upstreamModule.createTransformer(upstreamOptions)
    : upstreamModule;

  /** What the upstream transformer gets: the module's code and the name it parses it by. */
  const prepared = (source, filename) => {
    if (!isBloomFile(filename)) {
      return { code: compileModule(source, filename)?.code ?? source, filename };
    }
    const { code, map } = compileBloomModule(source, filename);
    const inline = map
      ? `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(map).toString('base64')}\n`
      : '';
    return { code: code + inline, filename: hostFilename(filename) };
  };

  return {
    canInstrument: upstream.canInstrument,
    getCacheKey(source, filename, transformOptions) {
      const key = upstream.getCacheKey
        ? upstream.getCacheKey(source, filename, transformOptions)
        : '';
      return crypto.createHash('sha1').update(`${key}$bloom-language$${digest}`).digest('hex');
    },
    process(source, filename, transformOptions) {
      const module = prepared(source, filename);
      return upstream.process(module.code, module.filename, transformOptions);
    },
    async processAsync(source, filename, transformOptions) {
      const module = prepared(source, filename);
      return upstream.processAsync
        ? upstream.processAsync(module.code, module.filename, transformOptions)
        : upstream.process(module.code, module.filename, transformOptions);
    },
  };
}

module.exports = { createTransformer };
