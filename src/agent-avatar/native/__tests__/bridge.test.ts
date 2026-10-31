afterEach(() => jest.resetModules());

function loadBridge(
  available: boolean,
  abiVersion = 1,
  missingGL = false,
  glVersion = '58.0.3',
  coreVersion = '58.0.22',
) {
  const native = { available, abiVersion, addListener: jest.fn() };
  const view = jest.fn();
  const modules = jest.fn(() => ({
    requireNativeModule: () => native,
    requireNativeViewManager: view,
  }));
  const gl = jest.fn(() => {
    if (missingGL) throw Error('GL peer absent');
    return {};
  });
  jest.doMock('expo-gl/package.json', () => ({ version: glVersion }));
  jest.doMock('expo-modules-core/package.json', () => ({ version: coreVersion }));
  jest.doMock('expo-gl', gl);
  jest.doMock('expo-modules-core', modules);
  return { native, view, modules, gl, load: () => require('../bridge') };
}

it('does not initialize the bridge when the optional GL peer is absent', () => {
  const probe = loadBridge(true, 1, true);
  expect(probe.load).toThrow('optional Expo GL');
  expect(probe.modules).not.toHaveBeenCalled();
});

it.each([
  ['14.0.2', '58.0.22'],
  ['58.0.4', '58.0.22'],
  ['58.0.3', '1.11.15'],
])(
  'keeps unsupported JS bindings %s / %s off a previously built matching native module',
  (glVersion, coreVersion) => {
    const probe = loadBridge(true, 1, false, glVersion, coreVersion);
    expect(probe.load).toThrow('optional Expo GL');
    expect(probe.gl).not.toHaveBeenCalled();
    expect(probe.modules).not.toHaveBeenCalled();
  },
);

it('rejects the no-GL availability registration before allocating a native view', () => {
  const probe = loadBridge(false);
  expect(probe.load).toThrow('Expo GL enabled native build');
  expect(probe.view).not.toHaveBeenCalled();
  expect(probe.native.addListener).not.toHaveBeenCalled();
});

it('requires the matching native ABI before registering presentation callbacks', () => {
  const probe = loadBridge(true, 2);
  expect(probe.load).toThrow('ABI 1');
  expect(probe.view).not.toHaveBeenCalled();
  expect(probe.native.addListener).not.toHaveBeenCalled();
});

it('loads the integrated native view only for an available matching module', () => {
  const probe = loadBridge(true);
  expect(probe.load().isAvailable).toBe(true);
  expect(probe.view).toHaveBeenCalledWith('BloomAvatarGPU');
  expect(probe.native.addListener).toHaveBeenCalledTimes(1);
});

it('keeps the original complete ABI 1 module compatible before the availability flag existed', () => {
  const probe = loadBridge(true);
  Reflect.deleteProperty(probe.native, 'available');
  expect(probe.load().isAvailable).toBe(true);
  expect(probe.view).toHaveBeenCalledWith('BloomAvatarGPU');
});

it.each([false, true])(
  'reading index availability validates the bridge even when component loading is deferred (%s)',
  (available) => {
    const probe = loadBridge(available);
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    jest.doMock('../NativeAvatar', () => ({ NativeAvatar: () => null }));
    jest.doMock('../runtime', () => ({ isRuntimeCompatible: jest.fn() }));
    const readAvailability = () => require('../index').isAvailable;
    if (available) expect(readAvailability()).toBe(true);
    else expect(readAvailability).toThrow('Expo GL enabled native build');
    expect(probe.modules).toHaveBeenCalledTimes(1);
  },
);
