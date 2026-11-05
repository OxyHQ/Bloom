afterEach(() => jest.resetModules());

function loadBridge(
  available: boolean,
  abiVersion = 1,
  missingGL = false,
  glVersion = '58.0.3',
  coreVersion = '58.0.22',
  missingNative: 'BloomAvatarGPU' | 'ExpoGL' | null = null,
) {
  const native = { available, abiVersion, addListener: jest.fn() };
  const view = jest.fn(() => () => null);
  const optional = jest.fn((name: string) =>
    name === missingNative ? null : name === 'BloomAvatarGPU' ? native : {},
  );
  const modules = jest.fn(() => ({
    requireOptionalNativeModule: optional,
    requireNativeViewManager: view,
  }));
  const gl = jest.fn(() => ({}));
  jest.doMock('expo-gl/package.json', () => {
    if (missingGL) throw Error('GL peer absent');
    return { version: glVersion };
  });
  jest.doMock('expo-modules-core/package.json', () => ({ version: coreVersion }));
  jest.doMock('expo-gl', gl);
  jest.doMock('expo-modules-core', modules);
  return { native, view, modules, gl, optional, load: () => require('../bridge') };
}

it('settles unavailable without throwing or loading graphics when the optional GL peer is absent', () => {
  const probe = loadBridge(true, 1, true);
  expect(probe.load().isAvailable).toBe(false);
  expect(probe.modules).not.toHaveBeenCalled();
  expect(probe.gl).not.toHaveBeenCalled();
});

it.each([
  ['14.0.2', '58.0.22'],
  ['58.0.4', '58.0.22'],
  ['58.0.3', '1.11.15'],
])(
  'keeps unsupported JS bindings %s / %s off a previously built matching native module',
  (glVersion, coreVersion) => {
    const probe = loadBridge(true, 1, false, glVersion, coreVersion);
    expect(probe.load().isAvailable).toBe(false);
    expect(probe.gl).not.toHaveBeenCalled();
    expect(probe.modules).not.toHaveBeenCalled();
  },
);

it('settles the no-GL registration without loading GL, creating a view or attaching listeners', () => {
  const probe = loadBridge(false);
  expect(probe.load().isAvailable).toBe(false);
  expect(probe.gl).not.toHaveBeenCalled();
  expect(probe.view).not.toHaveBeenCalled();
  expect(probe.native.addListener).not.toHaveBeenCalled();
});

it.each(['BloomAvatarGPU', 'ExpoGL'] as const)(
  'does not initialize GL JS when the linked %s module is missing',
  (missingNative) => {
    const probe = loadBridge(true, 1, false, '58.0.3', '58.0.22', missingNative);
    expect(probe.load().isAvailable).toBe(false);
    expect(probe.gl).not.toHaveBeenCalled();
    expect(probe.view).not.toHaveBeenCalled();
    expect(probe.native.addListener).not.toHaveBeenCalled();
  },
);

it('requires the matching native ABI before initializing GL or registering presentation callbacks', () => {
  const probe = loadBridge(true, 2);
  expect(probe.load().isAvailable).toBe(false);
  expect(probe.gl).not.toHaveBeenCalled();
  expect(probe.view).not.toHaveBeenCalled();
  expect(probe.native.addListener).not.toHaveBeenCalled();
});

it('loads the integrated native view only for an available matching module', () => {
  const probe = loadBridge(true);
  expect(probe.load().isAvailable).toBe(true);
  expect(probe.gl).toHaveBeenCalledTimes(1);
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
  'reading index availability settles without throwing when component loading is deferred (%s)',
  (available) => {
    const probe = loadBridge(available);
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    jest.doMock('../NativeAvatar', () => ({ NativeAvatar: () => null }));
    jest.doMock('../runtime', () => ({ isRuntimeCompatible: jest.fn() }));
    expect(require('../index').isAvailable).toBe(available);
    expect(probe.modules).toHaveBeenCalledTimes(1);
    if (!available) {
      expect(probe.view).not.toHaveBeenCalled();
      expect(probe.native.addListener).not.toHaveBeenCalled();
    }
  },
);
