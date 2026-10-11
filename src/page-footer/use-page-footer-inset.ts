import { useContext, useSyncExternalStore } from 'react';
import { NO_INSET, NO_SUBSCRIPTION } from '../layout/edge-store';
import { PageFooterContext } from './context';

/**
 * Clearance for the last scroll item: measured footer height plus bottomInset.
 * Use as contentContainerStyle.paddingBottom. Returns 0 without a provider or
 * once the footer unmounts; does not include the decorative gradient tail.
 */
export function usePageFooterInset(): number {
  const store = useContext(PageFooterContext);
  return useSyncExternalStore(
    store?.subscribe ?? NO_SUBSCRIPTION,
    store?.getInset ?? NO_INSET,
    store?.getInset ?? NO_INSET,
  );
}
