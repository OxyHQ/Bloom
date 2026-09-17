import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** Four gradient colours, spread across the pill left → right. */
export type ComposerLoaderColors = readonly [string, string, string, string];

export interface ComposerLoaderProps {
  children: ReactNode;
  /** Show the light. Fades in/out (450ms) — flip it while awaiting a response. Default `true`. */
  active?: boolean;
  /** Four gradient colours, spread across the pill left → right. Default an iridescent set. */
  colors?: ComposerLoaderColors;
  /** Seconds per full lap. Default `4.5`. */
  speed?: number;
  /** Overall light opacity. Default `0.7`. */
  intensity?: number;
  /** How far the bloom bleeds inward from the rim, px. `0` drops the bloom layer. Default `16`. */
  bloom?: number;
  /** Bloom layer opacity. Default `0.3`. */
  bloomStrength?: number;
  /** How much of the perimeter the band occupies, degrees (of 360). Default `120`. */
  arc?: number;
  /** Reverse the travel direction. */
  reverse?: boolean;
  /** Corner radius, px. Defaults to a full pill. */
  radius?: number;
  /** Width of the crisp line, px; the tight glow scales with it. Default `2.5`. */
  line?: number;
  /** Draw the wide bloom alone, no line or tight glow: a soft wash for a beam to lead. */
  bloomOnly?: boolean;
  /** Paint the pill surface (and its `shadow-xs`) behind the light. Default `true`. */
  surface?: boolean;
  /**
   * Fade the band's two ends instead of cutting them, 0–1: the fraction of the
   * band's length that ramps. Each layer is stacked as 14 shorter, centred
   * copies at a fraction of its opacity; the blur melts the steps together.
   */
  taper?: number;
  /** How the light composites over what's beneath, e.g. `screen` to read as light on a surface. */
  blend?: ViewStyle['mixBlendMode'];
  /**
   * Moves the band forward along the lap, as a fraction of the perimeter (0–1).
   * Lets two loaders on one pill line up: a short beam with `offset` equal to
   * the difference of the two arcs (as fractions) leads a wider glow tip to tip.
   */
  offset?: number;
  /** Outer wrapper style (width, margins…). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
