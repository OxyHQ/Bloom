import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomThemeStorage } from '../theme/persistence';
import type { AvatarCharacter } from './character';
import type { VectorAssetLoader } from './vector-types';

/**
 * How the character feels, held for as long as it is set. `neutral` is its usual idle. `sad` is
 * for an empty or not-found state, a refusal, something that could not be done: the character
 * shakes its head "no" once as the mood starts, then stays dejected (looking down, drooping, lids
 * heavy) on top of its idle until the mood changes.
 */
export type AgentAvatarMood = 'neutral' | 'sad';

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
  /**
   * Default `neutral`. Becoming `sad` (or mounting sad) shakes the head "no" once, then holds a
   * dejected idle; back to `neutral` the droop eases out. Reactions, work and pointer gaze still
   * play on top. Reduced motion and `paused` show the settled pose with no shake; a `portrait`
   * still is always neutral.
   */
  mood?: AgentAvatarMood;
  /** The first picture of the character has been painted. Fires once per mounted renderer. */
  onReady?: () => void;
  /** Reports selected geometry preparation; paint-only changes do not reload. */
  onLoadingChange?: (loading: boolean) => void;
  /** The vector assets to draw from, overriding the provider's. See `createVectorAssetLoader`. */
  catalog?: VectorAssetLoader;
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
  /**
   * The vector assets this app ships (`createVectorAssetLoader`). Unset: Bloom's full catalog,
   * linked lazily; drop it from the bundle as docs/agent-avatar.mdx describes.
   */
  catalog?: VectorAssetLoader;
  children: ReactNode;
};
