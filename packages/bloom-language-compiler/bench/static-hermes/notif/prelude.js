globalThis.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
globalThis.process = { env: { NODE_ENV: 'production' } };
if (typeof console === 'undefined')
  globalThis.console = { log: print, error: print, warn: print, info: print };
globalThis.reportError = (e) => print('reportError', (e && e.stack) || e);
