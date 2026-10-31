import { Platform } from 'react-native';
import type { NativeAvatarAdapter } from './native-avatar-adapter';

let cached: NativeAvatarAdapter | null | undefined;
export function nativeAvatarAdapter() {
  if (cached !== undefined) return cached;
  cached = null;
  if (Platform.OS !== 'android' || typeof require !== 'function') return cached;
  try {
    const adapter = require('./native') as NativeAvatarAdapter;
    if (adapter.ABI_VERSION === 1 && adapter.isAvailable) cached = adapter;
  } catch {
    // The native graphics dependencies and rebuilt module are optional. Existing consumers keep the WebView renderer.
  }
  return cached;
}
