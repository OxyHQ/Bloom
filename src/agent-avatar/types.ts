import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
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
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};
export type AvatarProps = AgentAvatarProps;

export type AgentAvatarProviderProps = {
  /** Defaults to /bloom-character/runtime.mjs on web; native requires an absolute hosted URL. */
  runtimeUrl?: string;
  children: ReactNode;
};
