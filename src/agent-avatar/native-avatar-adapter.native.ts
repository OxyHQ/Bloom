import type { NativeAvatarAdapter } from './native-avatar-adapter';

let cached: NativeAvatarAdapter | null | undefined;
export function nativeAvatarAdapter() {
  if (cached !== undefined) return cached;
  cached = null;
  if (typeof require !== 'function') return cached;
  try {
    const adapter = require('@oxy.so/bloom-avatar-native') as NativeAvatarAdapter;
    if (adapter.ABI_VERSION === 1 && adapter.isAvailable) cached = adapter;
  } catch {
    // The companion is optional. Existing consumers keep the WebView renderer.
  }
  return cached;
}
