import { createContext } from 'react';

export type AvatarSnapshot = Readonly<{ uri: string }>;
export type CaptureAvatarSnapshot = () => Promise<AvatarSnapshot | null>;
/** Registers an on-demand capture; no pixel reads occur during animation. */
export const AvatarSnapshotObserver = createContext<
  ((capture: CaptureAvatarSnapshot | null) => void) | null
>(null);
/** @deprecated Characters use bundled SVG assets. No hosted runtime is loaded. */
export const BLOOM_CHARACTER_RUNTIME_URL = '';

export type CharacterCapabilities = {
  key: string;
  available: Record<string, boolean>;
  selected: Record<string, string>;
};
/** SVG renderer capability reporting, independent of the compatibility URL props. */
export const CharacterRuntimeContext = createContext<{
  reportCapabilities?: (value: CharacterCapabilities) => void;
}>({});

/** Only editors subscribe to catalog updates; renderer input stays stable. */
export const CharacterCapabilitiesContext = createContext<{
  capabilities?: CharacterCapabilities;
  capabilitiesByKey?: ReadonlyMap<string, CharacterCapabilities>;
}>({});
