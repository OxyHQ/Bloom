import type { ContextType, ReactNode } from 'react';
import {
  CharacterCapabilitiesContext,
  CharacterRuntimeContext,
} from '../../../agent-avatar/context';

/** Supply both internal channels without starting the browser engine in UI tests. */
export function CharacterRuntimeFixture({
  value,
  children,
}: {
  value: ContextType<typeof CharacterRuntimeContext> &
    ContextType<typeof CharacterCapabilitiesContext>;
  children: ReactNode;
}) {
  const { runtimeUrl, reportCapabilities, ...catalog } = value;
  return (
    <CharacterRuntimeContext.Provider value={{ runtimeUrl, reportCapabilities }}>
      <CharacterCapabilitiesContext.Provider value={catalog}>
        {children}
      </CharacterCapabilitiesContext.Provider>
    </CharacterRuntimeContext.Provider>
  );
}
