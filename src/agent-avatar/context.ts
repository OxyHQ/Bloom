import { createContext } from 'react';
import type { CharacterStills } from './character-still';

export type AvatarSnapshot = Readonly<{ uri: string }>;
export type CaptureAvatarSnapshot = () => Promise<AvatarSnapshot | null>;
/** Registers an on-demand capture; no pixel reads occur during animation. */
export const AvatarSnapshotObserver = createContext<
  ((capture: CaptureAvatarSnapshot | null) => void) | null
>(null);
/**
 * Where an app that does not host the 214 MB runtime loads it from: the SDK's own copy (CORS
 * open). One constant, so no library invents its own; `BloomProvider characterRuntimeUrl` and
 * `AgentAvatarProvider runtimeUrl` replace it for an app that self-hosts.
 */
export const BLOOM_CHARACTER_RUNTIME_URL = 'https://alia.onl/bloom-character/runtime.mjs';

export type CharacterCapabilities = {
  key: string;
  available: Record<string, boolean>;
  selected: Record<string, string>;
};
/** The renderer's module URL, and the still cache that goes with it (see `character-still.ts`). */
export const CharacterRuntimeContext = createContext<{
  runtimeUrl?: string;
  reportCapabilities?: (value: CharacterCapabilities) => void;
  stills?: CharacterStills;
}>({
  runtimeUrl: BLOOM_CHARACTER_RUNTIME_URL,
});

/** Only editors subscribe to catalog updates; renderer input stays stable. */
export const CharacterCapabilitiesContext = createContext<{
  capabilities?: CharacterCapabilities;
  capabilitiesByKey?: ReadonlyMap<string, CharacterCapabilities>;
}>({});
