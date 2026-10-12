import { createContext } from 'react';
import { Platform } from 'react-native';

export type AvatarSnapshot = Readonly<{ uri: string }>;
export type CaptureAvatarSnapshot = () => Promise<AvatarSnapshot | null>;
/** Registers an on-demand capture; no pixel reads occur during animation. */
export const AvatarSnapshotObserver = createContext<
  ((capture: CaptureAvatarSnapshot | null) => void) | null
>(null);
export const DEFAULT_CHARACTER_RUNTIME_URL = '/bloom-character/runtime.mjs';

export type CharacterCapabilities = {
  key: string;
  available: Record<string, boolean>;
  selected: Record<string, string>;
};
/** The application hosts the renderer assets at this module URL. */
export const CharacterRuntimeContext = createContext<{
  runtimeUrl?: string;
  reportCapabilities?: (value: CharacterCapabilities) => void;
}>({
  runtimeUrl: Platform.OS === 'web' ? DEFAULT_CHARACTER_RUNTIME_URL : undefined,
});

/** Only editors subscribe to catalog updates; renderer input stays stable. */
export const CharacterCapabilitiesContext = createContext<{
  capabilities?: CharacterCapabilities;
  capabilitiesByKey?: ReadonlyMap<string, CharacterCapabilities>;
}>({});
