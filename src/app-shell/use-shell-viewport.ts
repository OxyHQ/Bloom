import { useSyncExternalStore } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => Platform.OS !== 'web';
const serverViewport = { width: 0, height: 0, scale: 1, fontScale: 1 };

/** SSR and its first hydration render must select the same layout tree. A
 * client-only mount still reads its real viewport immediately. */
export function useShellLayoutReady() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

export function useShellViewport() {
  const viewport = useWindowDimensions();
  return useShellLayoutReady() ? viewport : serverViewport;
}
