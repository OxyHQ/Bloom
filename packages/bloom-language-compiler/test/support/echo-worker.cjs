// A stand-in upstream Metro worker: one output, mapped segment for segment
// onto the module it was handed (each line's start to that line's start).
module.exports = {
  transform: async (_config, _projectRoot, filename, data) => {
    const code = data.toString('utf8');
    const map = code.split('\n').map((_, index) => [index + 1, 0, index + 1, 0]);
    return { filename, output: [{ type: 'js/module', data: { code, map, functionMap: {} } }] };
  },
  getCacheKey: () => 'echo-worker',
};
