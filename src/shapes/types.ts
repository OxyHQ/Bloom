import type { ImageProps as NativeImageProps } from 'react-native';
import type { NamedShapeName } from './paths';

export type Name = 'circle' | 'squircle' | NamedShapeName;
/** Closed SVG outline in a square coordinate space. */
export interface Path {
  d: string;
  /** Positive side length of the coordinate space. Defaults to 1. */
  viewBox?: number;
}
export type Shape = Name | Path;
export interface FillProps {
  shape?: Shape;
  size: number;
  color: string;
}
/** One portable image request: a bundled asset ID or a URI descriptor. */
export type ImageSource =
  | number
  | {
      uri: string;
      width?: number;
      height?: number;
      scale?: number;
    };
export interface ImageProps {
  shape?: Shape;
  size: number;
  source: ImageSource;
  alt?: string;
  onError?: NativeImageProps['onError'];
}
export type GradientDirection = 'diagonal' | 'horizontal' | 'vertical';
export interface BorderProps {
  shape?: Shape;
  size: number;
  /** Thickness INSIDE the outline, in pixels. */
  width: number;
  colors: string | string[];
  gradientDirection?: GradientDirection;
}
