// A stand-in upstream Jest transformer: returns what it was handed.
module.exports = {
  createTransformer: (options) => ({
    process: (code) => ({ code, options }),
    getCacheKey: () => 'echo',
  }),
};
