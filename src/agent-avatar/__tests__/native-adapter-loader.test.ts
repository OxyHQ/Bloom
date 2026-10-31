import { nativeAvatarAdapter as webAdapter } from '../native-avatar-adapter';
it('keeps the native module graph unreachable from the neutral web facade', () => {
  expect(webAdapter()).toBeNull();
});
it.each([0, 1, 2])('accepts only adapter ABI 1 (received %s)', (abi) => {
  jest.isolateModules(() => {
    jest.doMock('@oxy.so/bloom-avatar-native', () => ({ ABI_VERSION: abi, isAvailable: true }), {
      virtual: true,
    });
    const { nativeAvatarAdapter } = require('../native-avatar-adapter.native');
    expect(nativeAvatarAdapter() !== null).toBe(abi === 1);
  });
});
