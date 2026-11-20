import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { GlassValue } from '../glass';
import type { ColorName } from '../tokens';

/** What a platform's glass takes: the material, the shape, and what sits on it. */
export interface GlassHostProps {
  glass: GlassValue;
  /** The corner radius in points; `undefined` is a capsule. */
  radius: number | undefined;
  /** The tint when the glass has none of its own: the fill of the control it is under. */
  fallbackTint?: ColorName;
  /** The glass answers touch (a pressable view on it). */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * The platform's own glass, or `null` where the platform has none here (the
 * web, an Android without the lens, an iOS without `expo-glass-effect` or
 * `expo-blur`): the view then draws Bloom's `Surface`, as it always has.
 */
export type PlatformGlass = ComponentType<GlassHostProps> | null;
