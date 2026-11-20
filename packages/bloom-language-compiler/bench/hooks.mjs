// Module resolution for the benchmark: the bare names the compiled and
// interpreted code import, pointed at the spike's own files.
const here = new URL('.', import.meta.url);
const ALIASES = {
  'react-native': new URL('hosts.mjs', here).href,
  '@oxy.so/bloom-language': new URL('interpreter.mjs', here).href,
  '@oxy.so/bloom-language/compiled': new URL('../runtime/compiled.mjs', here).href,
};

export async function resolve(specifier, context, nextResolve) {
  const alias = ALIASES[specifier];
  return alias ? { url: alias, shortCircuit: true } : nextResolve(specifier, context);
}
