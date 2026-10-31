import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { CharacterRuntimeContext } from '../context';
import { useAvatarRendererCapabilities } from '../use-avatar-renderer-capabilities';

const mockCompatibility = jest.fn<Promise<boolean>, [string]>();
const mockLookup = jest.fn();
let mockAvailable = true;
jest.mock('../native-avatar-adapter', () => {
  const adapter = { isRuntimeCompatible: (url: string) => mockCompatibility(url) };
  return {
    nativeAvatarAdapter: () => {
      mockLookup();
      return mockAvailable ? adapter : null;
    },
  };
});
const originalPlatform = Platform.OS;
afterEach(() => {
  Platform.OS = originalPlatform;
});
beforeEach(() => {
  Platform.OS = 'android';
  mockAvailable = true;
  mockCompatibility.mockReset();
  mockLookup.mockClear();
});

it('keeps native capability false until the current provider manifest is compatible', async () => {
  const pending = new Map<string, (compatible: boolean) => void>();
  mockCompatibility.mockImplementation(
    (url) => new Promise((resolve) => pending.set(url, resolve)),
  );
  let runtimeUrl = 'https://test.invalid/first/runtime.mjs';
  const { result, rerender, unmount } = renderHook(useAvatarRendererCapabilities, {
    wrapper: ({ children }) => (
      <CharacterRuntimeContext.Provider value={{ runtimeUrl }}>
        {children}
      </CharacterRuntimeContext.Provider>
    ),
  });
  expect(result.current.sharedLiveRendering).toBe(false);
  await act(async () => pending.get(runtimeUrl)?.(true));
  expect(result.current.sharedLiveRendering).toBe(true);
  runtimeUrl = 'https://test.invalid/second/runtime.mjs';
  rerender({});
  expect(result.current.sharedLiveRendering).toBe(false);
  const obsolete = runtimeUrl;
  runtimeUrl = 'https://test.invalid/third/runtime.mjs';
  rerender({});
  await act(async () => pending.get(obsolete)?.(true));
  expect(result.current.sharedLiveRendering).toBe(false);
  await act(async () => pending.get(runtimeUrl)?.(false));
  expect(result.current.sharedLiveRendering).toBe(false);
  unmount();
});

it.each(['ios', 'android'] as const)(
  'does not promise shared rendering without a native adapter on %s',
  (platform) => {
    Platform.OS = platform;
    mockAvailable = false;
    const { result } = renderHook(useAvatarRendererCapabilities);
    expect(result.current.sharedLiveRendering).toBe(false);
    expect(mockCompatibility).not.toHaveBeenCalled();
  },
);

it('reports pooled web support without requiring a native adapter', () => {
  Platform.OS = 'web';
  mockAvailable = false;
  const { result } = renderHook(useAvatarRendererCapabilities);
  expect(result.current.sharedLiveRendering).toBe(true);
  expect(mockCompatibility).not.toHaveBeenCalled();
  expect(mockLookup).not.toHaveBeenCalled();
});

it('does not load or query the native adapter when no character needs a capability', async () => {
  mockCompatibility.mockResolvedValue(true);
  const { result, rerender } = renderHook(
    ({ enabled }: { enabled: boolean }) => useAvatarRendererCapabilities({ enabled }),
    { initialProps: { enabled: false } },
  );
  expect(result.current.sharedLiveRendering).toBe(false);
  expect(mockLookup).not.toHaveBeenCalled();
  expect(mockCompatibility).not.toHaveBeenCalled();
  rerender({ enabled: true });
  expect(result.current.sharedLiveRendering).toBe(false);
  await act(async () => {});
  expect(result.current.sharedLiveRendering).toBe(true);
  rerender({ enabled: false });
  expect(result.current.sharedLiveRendering).toBe(false);
});

it('treats a rejected compatibility request as unavailable', async () => {
  mockCompatibility.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(useAvatarRendererCapabilities);
  await act(async () => {});
  expect(result.current.sharedLiveRendering).toBe(false);
});
