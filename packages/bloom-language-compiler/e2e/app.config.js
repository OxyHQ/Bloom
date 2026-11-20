// `BLOOM_E2E_NOXCTURNAL=1` turns on Expo's native transformer, to check that
// the compiler runs in front of it without sending files back to Babel.
module.exports = {
  name: 'bloom-language-compiler-e2e',
  slug: 'bloom-language-compiler-e2e',
  experiments: {
    reactCompiler: true,
    noxcturnalTransformWorker: process.env.BLOOM_E2E_NOXCTURNAL === '1',
  },
};
