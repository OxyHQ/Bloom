// A stand-in upstream Jest transformer: returns what it was handed.
module.exports = {
  createTransformer: (options) => ({
    process: (code, filename) => ({ code, filename, options }),
    getCacheKey: () => 'echo',
  }),
};
