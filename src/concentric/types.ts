import type { ReactNode } from 'react';
import type { ViewProps, ViewStyle, StyleProp } from 'react-native';
import type { CornerRadii } from '../shapes/corner-types';

export type ConcentricRadius = number | CornerRadii | 'concentric';
export interface ConcentricViewProps extends Omit<ViewProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Omitted passes geometry through; a fixed radius starts a new chain. */
  radius?: ConcentricRadius;
  /** Isolate this subtree from any rounded ancestor. */
  reset?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}
export interface ConcentricEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface ConcentricCorners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}
export interface ConcentricGeometry {
  corners: ConcentricCorners;
  gap: ConcentricEdges;
}
