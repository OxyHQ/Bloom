import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Node, Press } from '../node';

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

/** What a platform's own glass group is drawn from: the group's node, its blend and its presses. */
export interface SystemGlassGroupInput {
  node: Node;
  blend: number | undefined;
  press: (value: Press | undefined) => (() => void) | undefined;
}

/**
 * iOS: a group of glass icon buttons drawn as SwiftUI's own glass, so a
 * `glassID` morphs as `glassEffectID` does; `null` for a group it cannot draw
 * (the group is then the platform's container around Bloom's views).
 * Elsewhere there is none.
 */
export type SystemGlassGroup = ((group: SystemGlassGroupInput) => ReactElement | null) | null;
