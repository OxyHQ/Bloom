import type { ContextType, ReactNode } from 'react';
import {
  CharacterCapabilitiesContext,
  CharacterRuntimeContext,
} from '../../../agent-avatar/context';

/** Supply the SVG capability channels independently of rendering in UI tests. */
export function CharacterRuntimeFixture({
  value,
  children,
}: {
  value: ContextType<typeof CharacterRuntimeContext> &
    ContextType<typeof CharacterCapabilitiesContext>;
  children: ReactNode;
}) {
  const { reportCapabilities, ...catalog } = value;
  return (
    <CharacterRuntimeContext.Provider value={{ reportCapabilities }}>
      <CharacterCapabilitiesContext.Provider value={catalog}>
        {children}
      </CharacterCapabilitiesContext.Provider>
    </CharacterRuntimeContext.Provider>
  );
}
