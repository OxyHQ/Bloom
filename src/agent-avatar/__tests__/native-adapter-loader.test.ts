import { nativeAvatarAdapter as webAdapter } from '../native-avatar-adapter';
afterEach(() => {
  jest.resetModules();
});
it('keeps the native graphics graph unreachable from the neutral web facade', () => {
  expect(webAdapter()).toBeNull();
});
it.each([0, 1, 2])('accepts only integrated adapter ABI 1 (received %s)', (abi) => {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    jest.doMock('../native', () => ({ ABI_VERSION: abi, isAvailable: true }));
    const { nativeAvatarAdapter } = require('../native-avatar-adapter.native');
    expect(nativeAvatarAdapter() !== null).toBe(abi === 1);
  });
});
it('keeps unavailable native builds on the existing fallback and caches the result', () => {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    const load = jest.fn(() => {
      throw Error('Native GL unavailable');
    });
    jest.doMock('../native', load);
    const { nativeAvatarAdapter } = require('../native-avatar-adapter.native');
    expect(nativeAvatarAdapter()).toBeNull();
    expect(nativeAvatarAdapter()).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
it('does not load graphics dependencies on unsupported native platforms', () => {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
    const load = jest.fn(() => {
      throw Error('Must not load');
    });
    jest.doMock('../native', load);
    const { nativeAvatarAdapter } = require('../native-avatar-adapter.native');
    expect(nativeAvatarAdapter()).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });
});
