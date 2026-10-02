import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AvatarConfig } from './model';

export type AgentAvatarProps = {
  config: AvatarConfig;
  size?: number;
  paused?: boolean;
  label?: string;
  locale?: string;
  /** Enables pointer and touch reactions when a 3D runtime provider is available. */
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

export type { AvatarCharacterConfig, AvatarCharacterCategory } from './config-character';

export type AgentAvatarProviderProps = {
  runtimeUrl: string;
  children: ReactNode;
};
