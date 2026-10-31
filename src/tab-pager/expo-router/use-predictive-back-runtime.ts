import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { isPredictiveBackAvailable } from './PredictiveBackHost';
import { supportsPredictiveNavigation } from './predictive-navigation';

type NativeBackHandler = typeof BackHandler & {
  setNativeNavigationEnabled?: (enabled: boolean) => void;
};
let owners = 0;

/** The navigation provider outlives individual tabs and cold-start pushed routes. */
export function usePredictiveBackRuntime(navigation: object): void {
  const available =
    Platform.OS === 'android' &&
    isPredictiveBackAvailable() &&
    supportsPredictiveNavigation(navigation);
  useEffect(() => {
    const handler = BackHandler as NativeBackHandler;
    if (!available || typeof handler.setNativeNavigationEnabled !== 'function') return;
    if (owners++ === 0) handler.setNativeNavigationEnabled(true);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--owners === 0) handler.setNativeNavigationEnabled?.(false);
    };
  }, [available]);
}
