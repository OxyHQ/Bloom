// Bun loads `.bloom` modules through Bloom's compiler (the same TypeScript Metro and Jest get),
// so the golden tests run the colour engine exactly as the TypeScript backend emits it.
import { readFileSync } from 'node:fs';
import { plugin } from 'bun';

const { compileBloomModule } = require('../../bloom-language-compiler/js/compile.js') as {
  compileBloomModule(source: string, filename: string, options: { root: string }): { code: string };
};

plugin({
  name: 'bloom',
  setup(build) {
    build.onLoad({ filter: /\.bloom$/ }, ({ path }) => ({
      contents: compileBloomModule(readFileSync(path, 'utf8'), path, { root: process.cwd() }).code,
      loader: 'ts',
    }));
  },
});
