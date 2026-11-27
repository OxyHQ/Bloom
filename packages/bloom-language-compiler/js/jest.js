const crypto = require('node:crypto');

const {
  bloomDependencies,
  compileBloomModule,
  compileModule,
  hostFilename,
  isBloomFile,
} = require('./compile');
const { digestOf } = require('./dependencies');
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
 * `{ allowTsImports: true }` is the migration mode (`--allow-ts-imports`, ADR 0002
 * section 4): an app module may import TS by path, as `bloom migrate` checks its output.
 *
 * A `.bloom` module reaches the upstream transformer as the TypeScript it
 * compiles to, named `<file>.bloom.ts` so Babel's TypeScript preset parses
 * it, with the compiler's source map inline: Babel composes it into its own
 * (`inputSourceMap`), so a stack trace from a `.bloom` handler names the
 * `.bloom` file and line. A `.tsx` module's hoisted declarations still shift
 * lines below them (its map is not composed here; Metro's adapter composes it).
 *
 * A `.bloom` module's cache key holds the content of every file its compile
 * reads (the `.bloom` modules and TS declarations it imports), so editing a
 * declaration it imports compiles it again.
 */
function createTransformer(options = {}) {
  const [upstreamPath, upstreamOptions] = options.upstream ?? ['babel-jest', {}];
  const loaded = require(upstreamPath);
  const upstreamModule = loaded.default ?? loaded;
  const upstream = upstreamModule.createTransformer
    ? upstreamModule.createTransformer(upstreamOptions)
    : upstreamModule;

  /**
   * What the upstream transformer gets: the module's code and the name it
   * parses it by. A `.bloom` module's TS imports resolve from the project's
   * root (Jest's `rootDir`: its tsconfig's `paths`, `node_modules`).
   */
  const migration = options.allowTsImports ? { allowTsImports: true } : {};
  const bloomOptions = (transformOptions) => {
    const root = transformOptions?.config?.rootDir;
    return root ? { root, ...migration } : migration;
  };
  const prepared = (source, filename, transformOptions) => {
    if (!isBloomFile(filename)) {
      return { code: compileModule(source, filename)?.code ?? source, filename };
    }
    const { code, map } = compileBloomModule(source, filename, bloomOptions(transformOptions));
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
      const imports = isBloomFile(filename)
        ? digestOf(bloomDependencies(source, filename, bloomOptions(transformOptions)))
        : '';
      return crypto
        .createHash('sha1')
        .update(`${key}$bloom-language$${digest}$${imports}`)
        .digest('hex');
    },
    process(source, filename, transformOptions) {
      const module = prepared(source, filename, transformOptions);
      return upstream.process(module.code, module.filename, transformOptions);
    },
    async processAsync(source, filename, transformOptions) {
      const module = prepared(source, filename, transformOptions);
      return upstream.processAsync
        ? upstream.processAsync(module.code, module.filename, transformOptions)
        : upstream.process(module.code, module.filename, transformOptions);
    },
  };
}

module.exports = { createTransformer };
