import type { ReactNode } from 'react';
import { ConcentricContext, type ConcentricContextValue } from './context';

export function ConcentricProvider({
  value,
  children,
}: {
  value: ConcentricContextValue;
  children?: ReactNode;
}) {
  return <ConcentricContext.Provider value={value}>{children}</ConcentricContext.Provider>;
}
