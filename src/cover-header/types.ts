import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomImageSource } from '../image';

export interface CoverPosition {
  x: number;
  y: number;
}
export interface CoverImageGeometry {
  width: number;
  height: number;
  overflowX: number;
  overflowY: number;
}
export interface CoverImageProps {
  source: BloomImageSource;
  /** Stable asset identity across signed URL renewal. Defaults to source.cacheKey, then the source descriptor. */
  sourceKey?: string | number;
  position?: CoverPosition;
  contentFit?: 'cover' | 'contain';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  /** Reports the actual rendered overflow after loading and container layout. */
  onGeometryChange?: (geometry: CoverImageGeometry | null) => void;
}

export interface CoverHeaderLabels {
  reposition: string;
  instruction: string;
  save: string;
  cancel: string;
  saveError: string;
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
}

export interface CoverHeaderProps {
  /** Photo across the cover band. Without one the band shows `background-tertiary`. */
  coverSource?: BloomImageSource | null;
  /** Stable asset identity, preserving an edit when only its signed URL changes. */
  coverSourceKey?: string | number;
  /**
   * Where the photo's crop sits, as fractions (`object-position`). Default
   * `{ x: 0.5, y: 0.5 }` — centred, as `resizeMode="cover"`.
   */
  coverPosition?: CoverPosition;
  /** Defaults to cover. Contained images cannot be repositioned. */
  coverFit?: 'cover' | 'contain';
  /** Enables the shared editor when an image and commit callback are present. */
  repositionable?: boolean;
  /** Which crop axes can change. Default both. */
  repositionAxes?: 'vertical' | 'both';
  /** Called only by Save, never on drag release. Rejection keeps the editor open. */
  onCoverPositionCommit?: (position: CoverPosition) => void | Promise<void>;
  /** Draft notifications; persistence belongs in onCoverPositionCommit. */
  onCoverPositionChange?: (position: CoverPosition) => void;
  /** Additional controls, such as choosing or removing a cover. Hidden during editing. */
  actions?: ReactNode;
  labels?: Partial<CoverHeaderLabels>;
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

export interface CoverFillProps {
  color?: string;
  gradient?: { from: string; to: string; angle?: number };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
