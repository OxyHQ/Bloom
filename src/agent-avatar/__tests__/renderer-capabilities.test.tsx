import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import { useAvatarRendererCapabilities } from '../use-avatar-renderer-capabilities';

const originalPlatform = Platform.OS;
afterEach(() => {
  Platform.OS = originalPlatform;
});
it.each(['web', 'ios', 'android'] as const)(
  'shares SVG frame work on %s without a native adapter',
  (platform) => {
    Platform.OS = platform;
    const { result } = renderHook(useAvatarRendererCapabilities, {
      wrapper: ({ children }) => (
        <AgentAvatarProvider runtimeUrl="https://invalid.example/obsolete.mjs">
          {children}
        </AgentAvatarProvider>
      ),
    });
    expect(result.current.sharedLiveRendering).toBe(true);
  },
);
it('preserves the capability opt-out and responds immediately to changes', () => {
  const { result, rerender } = renderHook(
    ({ enabled }: { enabled: boolean }) => useAvatarRendererCapabilities({ enabled }),
    { initialProps: { enabled: false } },
  );
  expect(result.current.sharedLiveRendering).toBe(false);
  rerender({ enabled: true });
  expect(result.current.sharedLiveRendering).toBe(true);
  rerender({ enabled: false });
  expect(result.current.sharedLiveRendering).toBe(false);
});
