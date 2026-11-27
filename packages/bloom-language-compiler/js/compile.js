const native = require('./native');

const LANGUAGE_MODULE = '@oxy.so/bloom-language';
const BLOOM_EXTENSION = '.bloom';

/**
 * The error a module that does not compile throws: its message is every
 * rendered diagnostic (with its help and a `= docs:` link), with the position
 * Metro and Jest show in their frames, and the links as `error.docs`.
 */
function compileError(diagnostics, filename) {
  const [first] = diagnostics;
  const error = new SyntaxError(diagnostics.map((d) => d.rendered).join('\n\n'));
  error.filename = filename;
  error.lineNumber = first.line;
  error.column = first.column - 1;
  error.docs = diagnostics.flatMap((d) => d.docs ?? []);
  return error;
}

/** Says each warning, then throws when there is any error. */
function settle(output, filename) {
  for (const warning of output.warnings ?? []) console.warn(warning.rendered);
  if (output.diagnostics.length > 0) throw compileError(output.diagnostics, filename);
}

/**
 * Compile one module, or return `null` when it has nothing to compile.
 * A wrong token or modifier throws (see `compileError`); a warning is
 * printed with `console.warn`.
 *
 * @param {string} source
 * @param {string} filename
 * @returns {{ code: string, map: string, hoisted: number } | null}
 */
function compileModule(source, filename) {
  // Most modules never import the language; skip the native call for them.
  if (!source.includes(LANGUAGE_MODULE)) return null;
  const output = native.compile(source, filename);
  // A warning (a Liquid Glass rule the screen may break on purpose) is said, and the module compiles.
  settle(output, filename);
  return output.changed ? { code: output.code, map: output.map, hoisted: output.hoisted } : null;
}

const isBloomFile = (filename) => filename.endsWith(BLOOM_EXTENSION);

/**
 * Compile a `.bloom` module to TypeScript (the embedded-language pass has
 * already run on it), with a source map back to the `.bloom` file whose only
 * source is `filename`. Errors throw as `compileModule`'s do.
 *
 * @param {string} source
 * @param {string} filename
 * @param {{ root?: string, dev?: boolean, paths?: Record<string, string[]>, app?: string, allowTsImports?: boolean }} [options]
 * @returns {{ code: string, map: string | null, dependencies: string[] }}
 */
function compileBloomModule(source, filename, options = {}) {
  const output = bloomCompiler(filename, 'compileBloom')(source, filename, options);
  settle(output, filename);
  return {
    code: output.code,
    map: output.map ? pointAt(output.map, filename) : null,
    dependencies: output.dependencies,
  };
}

/**
 * The files compiling a `.bloom` module reads, its imported `.bloom` modules
 * and TS declarations (without emitting): what a cache key hashes besides the
 * module itself, so editing one compiles the module again.
 *
 * @param {string} source
 * @param {string} filename
 * @param {{ root?: string, paths?: Record<string, string[]> }} [options]
 * @returns {string[]}
 */
function bloomDependencies(source, filename, options = {}) {
  return bloomCompiler(filename, 'bloomDependencies')(source, filename, options);
}

/** The addon's `.bloom` entry point `name`, or why this build has none. */
function bloomCompiler(filename, name) {
  if (!native[name]) {
    throw new Error(
      `${filename}: this build of the Bloom language compiler has no .bloom compiler (${native.binary}, no ${name}); rebuild it (bun run build:addon).`,
    );
  }
  return native[name];
}

/** The map with `filename` as its one source, so frames name the file on disk. */
function pointAt(map, filename) {
  const parsed = JSON.parse(map);
  parsed.sources = [filename];
  return JSON.stringify(parsed);
}

/**
 * The name a host transformer gets for a compiled `.bloom` module: its own
 * path with `.ts`, so Babel (preset-typescript, Expo's preset) and Metro's
 * worker parse it as the TypeScript it is. Source maps still name the `.bloom`.
 */
const hostFilename = (filename) => `${filename}.ts`;

module.exports = {
  bloomDependencies,
  compileModule,
  compileBloomModule,
  hostFilename,
  isBloomFile,
  BLOOM_EXTENSION,
  LANGUAGE_MODULE,
};
