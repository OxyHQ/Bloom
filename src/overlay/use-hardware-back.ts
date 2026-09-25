import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Consume Android's hardware back for as long as the caller is mounted with a
 * handler, calling the CURRENT `onBack` (read through a ref, so a new closure
 * each render does not re-register and lose its place in the LIFO order).
 *
 * `BackHandler` runs the newest listener first, so surfaces opened later close
 * first. No-op off Android and when `BackHandler` is absent (web bundles, and
 * some test environments' react-native mocks).
 */
export function useHardwareBack(onBack: (() => void) | undefined): void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const active = onBack !== undefined;

  useEffect(() => {
    if (!active || Platform.OS !== 'android') return;
    if (typeof BackHandler?.addEventListener !== 'function') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBackRef.current?.();
      return true;
    });
    return () => subscription.remove();
  }, [active]);
}
