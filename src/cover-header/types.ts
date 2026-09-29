import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

export interface CoverHeaderProps {
  /** Photo across the cover band. Without one the band shows `background-tertiary`. */
  coverSource?: string | ImageSourcePropType | null;
  /**
   * Where the photo's crop sits, as fractions (`object-position`). Default
   * `{ x: 0.5, y: 0.5 }` — centred, as `resizeMode="cover"`.
   */
  coverPosition?: { x: number; y: number };
  /** Drawn in the band instead of the photo (an editor, a gradient, a video poster). */
  cover?: ReactNode;
  /** Height of the cover band. Default `170`. */
  coverHeight?: number;
  /**
   * How far the content rises into the cover band. Default `45` — half a 90px
   * avatar. Clamped to `0..coverHeight`.
   */
  overlap?: number;
  /** The band's own style: corner radii, a different fill. */
  coverStyle?: StyleProp<ViewStyle>;
  /** The content column's style. Its `paddingTop` is the component's and is ignored. */
  contentStyle?: StyleProp<ViewStyle>;
  /** The content: the avatar row first, then whatever follows it. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Also names the parts: `-cover`, `-cover-image`, `-content`. */
  testID?: string;
}
