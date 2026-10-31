import { useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { BLOOM_CHARACTER_RUNTIME_URL, CharacterRuntimeContext } from './context';
import { nativeAvatarAdapter } from './native-avatar-adapter';

/** Shared routing observation. The adapter owns manifest request deduplication and expiry. */
export function useNativeAvatarCompatibility(runtimeUrl: string) {
  const adapter = nativeAvatarAdapter();
  const [choice, setChoice] = useState<{ url: string; compatible: boolean }>();
  useEffect(() => {
    if (!adapter) return;
    let stopped = false;
    void adapter.isRuntimeCompatible(runtimeUrl).then(
      (compatible) => {
        if (!stopped) setChoice({ url: runtimeUrl, compatible });
      },
      () => {
        if (!stopped) setChoice({ url: runtimeUrl, compatible: false });
      },
    );
    return () => {
      stopped = true;
    };
  }, [adapter, runtimeUrl]);
  return {
    adapter,
    compatible: adapter && choice?.url === runtimeUrl ? choice.compatible : undefined,
  };
}

/** Whether this provider can share live rendering across independently laid-out avatars.
 * Pending native compatibility is false; the reduced-motion preference remains Avatar's owner. */
export function useAvatarRendererCapabilities(): { sharedLiveRendering: boolean } {
  const { runtimeUrl = BLOOM_CHARACTER_RUNTIME_URL } = useContext(CharacterRuntimeContext);
  const { compatible } = useNativeAvatarCompatibility(runtimeUrl);
  return {
    sharedLiveRendering:
      Platform.OS === 'web' || (Platform.OS === 'android' && compatible === true),
  };
}
