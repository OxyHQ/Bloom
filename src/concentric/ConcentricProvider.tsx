import type { ReactNode } from 'react';
import { ConcentricContext, type ConcentricContextValue } from './context';
import { getVariableContextProvider } from '../theme/color-scope/style-builder';

export function ConcentricProvider({
  value,
  variables,
  children,
}: {
  value: ConcentricContextValue;
  variables: Record<string, string | number>;
  children?: ReactNode;
}) {
  const VariableProvider = getVariableContextProvider(false);
  return (
    <ConcentricContext.Provider value={value}>
      {VariableProvider ? (
        <VariableProvider value={variables}>{children}</VariableProvider>
      ) : (
        children
      )}
    </ConcentricContext.Provider>
  );
}
