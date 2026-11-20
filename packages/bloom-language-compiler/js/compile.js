const { compile } = require('./native');

const LANGUAGE_MODULE = '@oxy.so/bloom-language';

/**
 * Compile one module, or return `null` when it has nothing to compile.
 * A wrong token or modifier throws an error whose message is the compiler's
 * rendered diagnostic, with the position Metro and Jest show in their frames.
 *
 * @param {string} source
 * @param {string} filename
 * @returns {{ code: string, map: string, hoisted: number } | null}
 */
function compileModule(source, filename) {
  // Most modules never import the language; skip the native call for them.
  if (!source.includes(LANGUAGE_MODULE)) return null;
  const output = compile(source, filename);
  if (output.diagnostics.length > 0) {
    const [first] = output.diagnostics;
    const error = new SyntaxError(output.diagnostics.map((d) => d.rendered).join('\n\n'));
    error.filename = filename;
    error.lineNumber = first.line;
    error.column = first.column - 1;
    throw error;
  }
  return output.changed ? { code: output.code, map: output.map, hoisted: output.hoisted } : null;
}

module.exports = { compileModule, LANGUAGE_MODULE };
