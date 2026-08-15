import type { StyleProp, ViewStyle } from 'react-native';

import type { GlassTone } from '../theme/glass-colors';

export type { GlassTone };

export interface GlassSurfaceProps {
  /**
   * Which hue the pane is tinted with. Defaults to `primary`.
   *
   * The same vocabulary `Chip` and `Badge` speak, so a glass dialog and a status
   * chip cannot disagree about what "warning" looks like.
   */
  tone?: GlassTone;
  /**
   * Corner radius, matching the radius of the box this fills.
   *
   * Required rather than defaulted: the surface CLIPS its own layers, so a
   * radius that disagrees with the parent's shows as a square blur peeking out
   * of a rounded control — visible, and exactly the kind of thing a default
   * hides until someone uses a different shape.
   */
  radius: number;
  /**
   * Whether to paint the sheen — the top-lit gradient that separates glass from
   * flat tinted plastic.
   *
   * Present because the sheen is the one layer with a cost worth letting a
   * caller decline: it is an SVG node per surface, and on a surface that is
   * small or already busy it contributes little. It is ON by default because
   * measuring it against a flat tint is what decided it was worth having.
   */
  sheen?: boolean;
  /** Extra style for the clipped layer stack (rarely needed). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
