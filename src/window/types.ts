import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

import type { PlatformWindowMetrics, PlatformWindowState } from '../platform-surface/types';

/** The window's state and the actions on it (`useWindow()`). */
export interface WindowHandle extends PlatformWindowState {
  /** Who draws the controls: Bloom (`WindowControls`) or the platform. */
  readonly controls: 'bloom' | 'platform';
  readonly metrics: PlatformWindowMetrics;
  /** The application's close request. */
  close(): void;
  minimize(): void;
  /** Maximize, or restore the frame the window had. */
  zoom(): void;
  /** Start an interactive move from the press being handled. */
  startMove(): void;
}

/**
 * The room the window's controls take, from the window's top and from its
 * LEADING edge (the left in LTR, the right in RTL): keep it with
 * `paddingTop` / `paddingInlineStart`. Zero without the `window` capability
 * and while the window is full screen.
 */
export interface WindowControlsRoom {
  readonly top: number;
  readonly leading: number;
}

export interface WindowControlsProps {
  /**
   * Float the controls on a plate of the surface material, for full-bleed
   * content (a photo, a video, a map) that keeps no room for them. Default
   * false.
   */
  plate?: boolean;
  /** Names the close control (`"Close"` in English). */
  closeLabel?: string;
  /** Names the minimize control (`"Minimize"` in English). */
  minimizeLabel?: string;
  /** Names the zoom control (`"Zoom"` in English). */
  zoomLabel?: string;
  testID?: string;
}

/** A `View`'s props, less the responder handlers the region owns. */
export interface WindowDragRegionProps
  extends Omit<
    ViewProps,
    | 'style'
    | 'children'
    | 'onStartShouldSetResponder'
    | 'onResponderGrant'
    | 'onResponderTerminationRequest'
  > {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
