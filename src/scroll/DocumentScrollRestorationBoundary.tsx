import { useContext, useMemo } from 'react';

import { ScreenHostContext } from '../screen/context';
import type { DocumentScrollRestorationBoundaryProps } from './types';

/**
 * Declare that a host or a route below this boundary restores the document.
 * This does not restore it itself; it keeps automatic document owners in the
 * subtree from competing with that owner. Element scrollers remain independent.
 */
export function DocumentScrollRestorationBoundary({
  children,
}: DocumentScrollRestorationBoundaryProps) {
  const host = useContext(ScreenHostContext);
  const value = useMemo(() => ({ ...host, restoresDocument: true }), [host]);
  return <ScreenHostContext.Provider value={value}>{children}</ScreenHostContext.Provider>;
}
