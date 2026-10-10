import { createContext } from 'react';
import type { DrawingContext } from './drawing';

/** Internal frame observer. A preview can retain its committed artwork for a handoff. */
export const AvatarDrawingObserver = createContext<((drawing: DrawingContext) => void) | null>(
  null,
);

export type CharacterCapabilities = {
  key: string;
  available: Record<string, boolean>;
  selected: Record<string, string>;
};
/** The application hosts the optional renderer assets at this module URL. */
export const CharacterRuntimeContext = createContext<{
  runtimeUrl?: string;
  reportCapabilities?: (value: CharacterCapabilities) => void;
}>({});

/** Only editors subscribe to catalog updates; renderer input stays stable. */
export const CharacterCapabilitiesContext = createContext<{
  capabilities?: CharacterCapabilities;
  capabilitiesByKey?: ReadonlyMap<string, CharacterCapabilities>;
}>({});
