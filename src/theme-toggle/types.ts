import type { StyleProp, ViewStyle } from 'react-native';

/**
 * - `sidebar`            a "Dark mode" row with a small pill switch (the default)
 * - `segmented`          sun / moon segments on the secondary surface
 * - `sidebar-segmented`  the same segments on the sidebar's tertiary track
 * - `glass-segmented`    literal black / white segments with no track, for a
 *                        host that supplies its own glass surface
 */
export type ThemeToggleAppearance = 'sidebar' | 'segmented' | 'sidebar-segmented' | 'glass-segmented';

export interface ThemeToggleProps {
  /**
   * Compact 36px icon button for a collapsed sidebar rail. Only applies to the
   * `sidebar` appearance.
   */
  collapsed?: boolean;
  /** Visual treatment. Defaults to `sidebar`. */
  appearance?: ThemeToggleAppearance;
  /** Circular reveal duration on web, in ms. Defaults to 820. */
  transitionDuration?: number;
  /**
   * Root style. On the segmented appearances this is the TRACK, so a host can
   * repaint it (the sidebar's flat mobile variant does).
   */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
