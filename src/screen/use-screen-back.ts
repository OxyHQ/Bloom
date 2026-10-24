import { useContext } from 'react';
import { ScreenHostContext, type ScreenHostValue } from './context';

/** A panel history's Back while it can go back, else the app's route Back. */
export function resolveScreenBack(host: ScreenHostValue): (() => void) | undefined {
  const { navigation } = host;
  if (navigation) return navigation.canGoBack ? navigation.back : undefined;
  return host.back;
}

/**
 * The Back this screen's `PageHeader` offers, for content that navigates back
 * itself (after a delete, on a cancel). `undefined` where there is none: a
 * panel's history root, a root page, an overlay.
 */
export function useScreenBack(): (() => void) | undefined {
  return resolveScreenBack(useContext(ScreenHostContext));
}
