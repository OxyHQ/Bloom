import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/** Which side of the map the stack is parked against. */
export type MapControlsAlign = 'start' | 'end';

/** Every word the stack speaks, in one prop — all of it copy, none of it layout. */
export interface MapControlsLabels {
  /** Names the stack. Default `"Map controls"`. */
  group?: string;
  /** The locate button while it is off. Default `"Show my location"`. */
  locate?: string;
  /** The locate button while the map is following. Default `"Stop following my location"`. */
  following?: string;
  /** Default `"Zoom in"`. */
  zoomIn?: string;
  /** Default `"Zoom out"`. */
  zoomOut?: string;
  /** Names the zoom pair, which is a group. Default `"Zoom"`. */
  zoom?: string;
  /** The tilt button while the map is flat. Default `"Tilt the map"`. */
  tilt?: string;
  /** The tilt button while the map is tilted. Default `"Flatten the map"`. */
  tiltOff?: string;
}

export interface MapCompassProps {
  /**
   * Degrees CLOCKWISE from north the map has been rotated. The needle turns
   * the other way, so it keeps pointing at north.
   */
  heading: number;
  /** Pressing it puts the map back at north. */
  onPress?: () => void;
  /**
   * Hide the compass while the map is already within
   * {@link MAP_CONTROLS_GEOMETRY}`.northTolerance` of north. Default `true` —
   * a control that does nothing is a control a reader has to rule out.
   */
  hideAtNorth?: boolean;
  disabled?: boolean;
  /**
   * The announced name. Default `` `Facing ${Math.round(heading)} degrees.
   * Reset to north` `` — pass a translated sentence, since a needle announces
   * nothing at all.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One map TYPE — standard, satellite, transit. Exactly one is chosen. */
export interface MapLayerOption {
  id: string;
  label: string;
  /** A glyph in the row's leading slot. */
  icon?: BloomIconComponent;
}

/** One OVERLAY — traffic, bike lanes. Any number are on at once. */
export interface MapOverlayOption {
  id: string;
  label: string;
  icon?: BloomIconComponent;
}

export interface MapLayerPickerLabels {
  /** Names the trigger, which draws no text. Default `"Map layers"`. */
  trigger?: string;
  /** The heading over the map types. Default `"Map"`. */
  layers?: string;
  /** The heading over the overlays. Default `"Overlays"`. */
  overlays?: string;
}

export interface MapLayerPickerProps {
  /** The map types. */
  layers: readonly MapLayerOption[];
  /** The chosen type's id. */
  layerId?: string;
  onLayerChange?: (id: string) => void;
  /** The overlays. Omitted, the menu is types only. */
  overlays?: readonly MapOverlayOption[];
  /** Which overlays are on. */
  activeOverlayIds?: readonly string[];
  onOverlayChange?: (id: string, active: boolean) => void;
  /** The trigger's glyph. Default a stack. */
  icon?: BloomIconComponent;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  labels?: MapLayerPickerLabels;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-trigger`, `-content`, `-layer-<id>`, `-overlay-<id>`. */
  testID?: string;
}

export interface MapControlsProps {
  /** Draws the locate button. */
  onLocate?: () => void;
  /**
   * Whether the map is following the reader. It is a TOGGLE — `aria-pressed`
   * on web and the selected state on native — so leave it `undefined` for a
   * locate button that only recentres once.
   */
  following?: boolean;
  /** Draws the compass. Degrees clockwise from north. */
  heading?: number;
  /** Pressing the compass. Without it the compass is not drawn. */
  onResetNorth?: () => void;
  /** Passed to `MapCompass`. Default `true`. */
  hideCompassAtNorth?: boolean;
  /** Draws the zoom pair. Both are needed: one zoom button is not a pair. */
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  /** Disables the matching zoom button at the end of the map's range. */
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  /** Draws the tilt toggle. */
  onTiltChange?: (tilted: boolean) => void;
  /** Whether the map is tilted. */
  tilted?: boolean;
  /**
   * Islands appended to the stack — a `MapLayerPicker`, or one of your own.
   * They are placed, not wrapped: the stack owns the column and the gap, and
   * nothing else.
   */
  children?: ReactNode;
  /** Which edge the stack hugs. Default `end`. */
  align?: MapControlsAlign;
  labels?: MapControlsLabels;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-locate`, `-compass`, `-zoom`, `-zoom-in`, `-zoom-out`, `-tilt`. */
  testID?: string;
}
