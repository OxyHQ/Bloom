import { useContext, useMemo, type ReactNode } from 'react';
import { ScreenHostContext } from '../../screen/context';

/**
 * The pages are the app's top-level destinations, so their screens offer no
 * route Back: one back from a root page is a page of the same rank, which the
 * bar already reaches. A screen pushed over them keeps its own.
 */
export function TabPagesHost({ children }: { children: ReactNode }) {
  const host = useContext(ScreenHostContext);
  const pages = useMemo(() => ({ ...host, back: undefined }), [host]);
  return <ScreenHostContext.Provider value={pages}>{children}</ScreenHostContext.Provider>;
}
