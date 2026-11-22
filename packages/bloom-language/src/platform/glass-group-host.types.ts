import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** What a platform's glass group takes: the distance at which its glasses blend, and what is in it. */
export interface GlassGroupHostProps {
  /** SwiftUI's container `spacing`, in points: glasses closer than this blend. */
  blend: number | undefined;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * The platform's own glass container, or `null` where the platform has none
 * (the web, an Android without the lens, an iOS without `expo-glass-effect`):
 * the group is then a plain view and each glass in it is drawn on its own.
 */
export type PlatformGlassGroup = ComponentType<GlassGroupHostProps> | null;
