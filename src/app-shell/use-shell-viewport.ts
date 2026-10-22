import { useSyncExternalStore } from 'react';
import { useServerStylePolicy } from '../styles/context';
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

/** Opted-in SSR uses the same CSS tree as first hydration; feature fallback is client-only. */
export function useShellCssLayout() {
  const ready = useShellLayoutReady();
  const serverStyles = useServerStylePolicy();
  return (
    Platform.OS === 'web' &&
    (!ready
      ? !!serverStyles
      : typeof CSS !== 'undefined' && !!CSS.supports?.('container-type', 'inline-size'))
  );
}
