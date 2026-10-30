import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Props of {@link AmbientPhoto}: a full-bleed photo that cross-fades to each new
 * `source` and drifts slowly while it rests, for an ambient display (a photo
 * frame, a lock screen, an idle TV).
 */
export interface AmbientPhotoProps {
  /**
   * The photo to show, as a URI. A new value is fetched and decoded first, then
   * cross-fades in over the one on screen; `null` keeps the current photo.
   */
  source: string | null | undefined;
  /** Length of the cross-fade, in ms. Defaults to 2500. */
  fadeMs?: number;
  /** Whether each photo zooms in slowly while it rests. Defaults to `true`. */
  drift?: boolean;
  /** Length of the drift, in ms. Defaults to 42000. */
  driftMs?: number;
  /**
   * How far the drift zooms, as a scale. Defaults to 1.04: every step above 1
   * rasterizes more pixels than the screen holds for the whole drift.
   */
  driftScale?: number;
  /** Called with each photo's URI the moment it starts fading in. */
  onShown?: (source: string) => void;
  /** The box the photo fills (`cover`). Defaults to the parent's whole area. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
