import * as ReactNative from 'react-native';

/**
 * THE OPTIONAL-PEER BOUNDARY for `nativewind`.
 *
 * `BloomColorScope` publishes a preset's CSS vars into the subtree through the
 * CONSUMER's nativewind — its version decides which mechanism exists
 * (`VariableContextProvider` under NativeWind 5, `vars()` before it), so the
 * module has to be loaded from the app, not from Bloom's own react-native-css.
 * Loaded through a variable specifier it was never loaded at all under Metro,
 * and a scope that does not scope is invisible: the subtree keeps rendering,
 * just in the app-wide palette.
 *
 * `optional-peer-imports.test.ts` guards the static shape (literal specifier,
 * inside a try). This runs it: the module is used when present, the scope
 * degrades rather than crashes when absent, and it says so once.
 */

const NATIVEWIND = 'nativewind';

type StyleBuilder = typeof import('../theme/color-scope/style-builder');

/**
 * Load `style-builder` against a given nativewind factory.
 *
 * `{ virtual: true }` IS correct here, unlike in the netinfo suite: nativewind
 * is not installed in this repo at all, so without it `doMock` throws while
 * resolving the name it is being asked to stand in for. The trade is that a
 * virtual mock is keyed by the bare specifier — which is exactly what the
 * loader requires, so the two agree.
 */
function loadStyleBuilder(factory?: () => unknown): StyleBuilder {
  let mod: StyleBuilder | undefined;

  jest.isolateModules(() => {
    if (factory) jest.doMock(NATIVEWIND, factory, { virtual: true });
    // A second copy of react-native carries a second `Platform`, so the OS each
    // case sets would land on an object the module under test never reads.
    jest.doMock('react-native', () => ReactNative);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../theme/color-scope/style-builder') as StyleBuilder;
  });

  if (!mod) throw new Error('module isolation did not run');
  return mod;
}

const originalOS = ReactNative.Platform.OS;

describe('BloomColorScope nativewind loading', () => {
  let warn: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    ReactNative.Platform.OS = 'ios';
  });

  afterEach(() => {
    ReactNative.Platform.OS = originalOS;
    warn.mockRestore();
    jest.resetModules();
    jest.dontMock(NATIVEWIND);
  });

  it('uses the consumer’s VariableContextProvider when nativewind provides one', () => {
    const VariableContextProvider = () => null;
    const vars = jest.fn(() => ({ marker: true }));
    const builder = loadStyleBuilder(() => ({ vars, VariableContextProvider }));

    expect(builder.getVariableContextProvider()).toBe(VariableContextProvider);
    expect(warn).not.toHaveBeenCalled();
  });

  it('passes the resolved scope vars through the consumer’s vars()', () => {
    const vars = jest.fn((_record: Record<string, string>) => ({ marker: true }));
    const builder = loadStyleBuilder(() => ({ vars }));

    expect(builder.buildNativePresetStyle('blue', 'dark')).toEqual({ marker: true });
    // Not just "called": the record it forwards must be the canonical tokens
    // plus the Tailwind `--color-*` aliases, which is the whole payload of a
    // scope. A `vars({})` would otherwise read as a working scope.
    const [record] = vars.mock.calls[0] ?? [{}];
    expect(record['--primary']).toMatch(/^rgb/);
    expect(record['--color-primary']).toBe(record['--primary']);
  });

  it('degrades to no scope, and says so once, when the peer is absent', () => {
    const builder = loadStyleBuilder(() => {
      throw new Error(`Cannot find module '${NATIVEWIND}'`);
    });

    expect(builder.getVariableContextProvider()).toBeNull();
    expect(builder.buildNativePresetStyle('blue', 'light')).toBeUndefined();

    expect(warn).toHaveBeenCalledTimes(1);
    const [message] = warn.mock.calls[0] as [string];
    expect(message).toContain('BloomColorScope');
    expect(message).toContain(NATIVEWIND);
    expect(message).toContain('expo install');
    expect(message).toContain('Cannot find module');
  });

  it('names the NativeWind 5 API when nativewind resolves without it', () => {
    const builder = loadStyleBuilder(() => ({ vars: jest.fn(() => ({})) }));

    expect(builder.getVariableContextProvider()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect((warn.mock.calls[0] as [string])[0]).toContain('VariableContextProvider');
  });

  it('never loads nativewind on web, where the vars go on documentElement', () => {
    ReactNative.Platform.OS = 'web';
    const vars = jest.fn(() => ({ marker: true }));
    const builder = loadStyleBuilder(() => ({ vars, VariableContextProvider: () => null }));

    expect(builder.getVariableContextProvider()).toBeNull();
    expect(builder.buildNativePresetStyle('blue', 'light')).toBeUndefined();
    expect(vars).not.toHaveBeenCalled();
    // A warning here would fire on every web app rendering a scoped subtree.
    expect(warn).not.toHaveBeenCalled();
  });

  it('builds the same token map on every platform', () => {
    // `buildScopeVars` is the pure half — it must not depend on nativewind at
    // all, since web consumes it directly as an inline style object.
    const builder = loadStyleBuilder(() => {
      throw new Error('absent');
    });
    const scope = builder.buildScopeVars('green', 'light');

    expect(scope['--primary']).toMatch(/^rgb/);
    expect(scope['--color-primary']).toBe(scope['--primary']);
  });
});
