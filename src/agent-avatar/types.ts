import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomThemeStorage } from '../theme/persistence';
import type { AvatarCharacter } from './character';

export type AgentAvatarProps = {
  /** What the avatar is. `{ preset: 'blue_beret' }` is a complete one; see `AvatarCharacter`. */
  character: AvatarCharacter;
  size?: number;
  paused?: boolean;
  label?: string;
  locale?: string;
  /** Enables pointer and touch reactions in the character renderer. */
  interactive?: boolean;
  /** Uses a cached still portrait for optional character previews, avoiding a live renderer per thumbnail. */
  portrait?: boolean;
  /** Replays the supported 3D reaction (signature or migrated silhouette wave) when the key changes. */
  reactionKey?: number;
  entranceKey?: number;
  workingKey?: number;
  workingCycles?: number;
  /** The first picture of the character has been painted. Fires once per mounted renderer. */
  onReady?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};
export type AvatarProps = AgentAvatarProps;

export type AgentAvatarProviderProps = {
  /**
   * The runtime module's absolute URL. Defaults to `BLOOM_CHARACTER_RUNTIME_URL` (the SDK's own
   * hosted copy); an app that self-hosts `assets/character-runtime/` passes its own.
   */
  runtimeUrl?: string;
  /**
   * Where drawn stills persist across launches: any `getItem`/`setItem` adapter (the one
   * `BloomThemeProvider` takes). Without it stills live in memory for the session.
   */
  stillStorage?: BloomThemeStorage;
  children: ReactNode;
};
