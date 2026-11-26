// The echo worker, counting the modules it is handed (in-band: Metro with one worker).
const echo = require('./echo-worker.cjs');

globalThis.bloomUpstreamTransforms = 0;

module.exports = {
  transform: (...args) => {
    globalThis.bloomUpstreamTransforms++;
    return echo.transform(...args);
  },
  getCacheKey: echo.getCacheKey,
};
