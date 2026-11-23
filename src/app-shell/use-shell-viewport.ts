import { useSyncExternalStore } from 'react';
import { useServerStylePolicy } from '../styles/context';
import { Platform } from 'react-native';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => Platform.OS !== 'web';

/** SSR and its first hydration render must select the same layout tree. A
 * client-only mount still reads its real viewport immediately. */
export function useShellLayoutReady() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
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
