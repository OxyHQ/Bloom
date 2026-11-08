import type { ReactNode, Ref } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { ViewRef } from '../styles/native-refs';
import type { ScreenProps } from '../screen/types';
export interface CanvasProps extends Omit<ScreenProps, 'scroll' | 'documentScroll'> {}
export interface CanvasBackgroundProps {
  children: ReactNode;
  testID?: string;
}
export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Physical local edges in layout pixels; overlapping claims combine by MAX. */
export interface CanvasInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface CanvasRegion {
  bounds: CanvasRect;
  viewport: CanvasRect;
  occupied: CanvasInsets;
  /** Safe-area intrusion into this host, already translated to local coordinates. */
  safeArea: CanvasInsets;
  active: boolean;
}
export type CanvasPanelSnap = 'peek' | 'half' | 'full';
export interface CanvasPanelProps {
  children: ReactNode;
  header?: ReactNode;
  snap: CanvasPanelSnap;
  onSnapChange: (snap: CanvasPanelSnap) => void;
  /** Explicit consumer policy; omitted means bottom placement at every width. */
  side?: { from: number; width: number; edge?: 'start' | 'end' };
  halfRatio?: number;
  /** Additional measured scene chrome to keep above the panel at full. */
  topClearance?: number;
  scrollable?: boolean;
  active?: boolean;
  visible?: boolean;
  animatedHeight?: SharedValue<number>;
  animatedProgress?: SharedValue<number>;
  /** Focus destination when adjacent scene controls yield their space to the panel. */
  handleRef?: Ref<ViewRef>;
  accessibilityLabel: string;
  testID?: string;
}
