import type { BackPreviewState } from './back-preview';

/** Public Expo capabilities; older routers retain their existing JS Back path. */
export interface PredictiveNavigation {
  registerNativeBackNavigation(): { remove(): void };
  dispatchWithResult(
    action: { type: string; source?: string; target?: string },
    options: { expectedState: BackPreviewState },
    callback: (result: {
      status: 'handled' | 'prevented' | 'unhandled' | 'stale' | 'noop' | 'cancelled';
    }) => void,
  ): { remove(): void };
}

export function supportsPredictiveNavigation<T extends object>(
  navigation: T,
): navigation is T & PredictiveNavigation {
  return (
    'registerNativeBackNavigation' in navigation &&
    typeof navigation.registerNativeBackNavigation === 'function' &&
    'dispatchWithResult' in navigation &&
    typeof navigation.dispatchWithResult === 'function'
  );
}
