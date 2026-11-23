import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { GlassTransition, GlassValue } from '../glass';
import type { RoleRef } from '../style';
import type { ColorName } from '../tokens';

/** What a platform's glass takes: the material, the shape, and what sits on it. */
export interface GlassHostProps {
  glass: GlassValue;
  /** The corner radius in points; `undefined` is a capsule. */
  radius: number | undefined;
  /** The tint when the glass has none of its own: the fill of the control it is under. */
  fallbackTint?: ColorName;
  /** The tint a variant sets while it holds (`.when(…, (v) => v.background(token))`), over the glass's own: the role at its opacity, if it names one. */
  fill?: RoleRef;
  /** The surface fill, handed in by `OnSurface` when a tint names it. */
  surface?: string;
  /** The glass answers touch (a pressable view on it). */
  interactive?: boolean;
  /** Its identity in a glass group (`.glassID()`, `.glassUnion()`, `.glassTransition()`), when it has one. */
  member?: GlassMember;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * A glass's identity in its group, each id unique to its namespace: `id` from
 * `.glassID()`, `union` from `.glassUnion()` (glasses with one union are one
 * shape), and how it arrives and leaves.
 */
export interface GlassMember {
  id?: string;
  union?: string;
  transition?: GlassTransition;
}

/**
 * The platform's own glass, or `null` where the platform has none here (the
 * web, an Android without the lens, an iOS without `expo-glass-effect` or
 * `expo-blur`): the view then draws Bloom's `Surface`, as it always has.
 */
export type PlatformGlass = ComponentType<GlassHostProps> | null;
