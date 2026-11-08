import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomThemeStorage } from '../theme/persistence';
import type { AvatarCharacter } from './character';

export type AgentAvatarProps = {
  /** @deprecated All characters use SVG. The legacy selector is accepted but has no effect. */
  renderer?: 'svg' | 'webgl';
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
  /** Replays the supported reaction (signature or migrated silhouette wave) when the key changes. */
  reactionKey?: number;
  /** Smoothly returns the SVG renderer to idle from its currently displayed pose. */
  idleKey?: number;
  entranceKey?: number;
  workingKey?: number;
  workingCycles?: number;
  /** The first picture of the character has been painted. Fires once per mounted renderer. */
  onReady?: () => void;
  /** Reports selected geometry preparation; paint-only changes do not reload. */
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};
export type AvatarProps = AgentAvatarProps;

export type AgentAvatarProviderProps = {
  /** @deprecated No hosted runtime is loaded; accepted for source compatibility. */
  runtimeUrl?: string;
  /** @deprecated SVG portrait frames are cached in memory; raster storage is no longer used. */
  stillStorage?: BloomThemeStorage;
  children: ReactNode;
};
