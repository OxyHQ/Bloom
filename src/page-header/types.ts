import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/** Where the title sits: after the back button, or centred on the bar. */
export type PageHeaderTitleAlign = 'start' | 'center';

/**
 * The bottom separator: `auto` fades it in once the page has scrolled past
 * `scrollThreshold`, `always` draws it at rest, `none` never draws it.
 */
export type PageHeaderBorder = 'auto' | 'always' | 'none';

export interface PageHeaderProps {
  /** A string renders as the heading; a node renders as-is (and owns its own semantics). */
  title?: ReactNode;
  /** A string renders as a secondary line under the title; a node renders as-is. */
  subtitle?: ReactNode;
  /** Default `start`. */
  titleAlign?: PageHeaderTitleAlign;
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Renders the back button and is called when it is pressed. The header is
   * router-agnostic: pass `router.back`, or your app's safe-back helper.
   */
  onBack?: () => void;
  /** The back button's accessible name. Default "Back". */
  backLabel?: string;

  /** Rendered after the back button, before the title (an avatar, a logo). */
  leading?: ReactNode;
  /** Rendered at the end of the bar, 10 apart — typically Bloom `Button`s. */
  actions?: ReactNode;

  /** Default `auto`. */
  border?: PageHeaderBorder;
  /**
   * The bar's background, shadow and title fade in with scroll instead of
   * showing at rest — for a header over media. The back button and actions
   * stay visible (their own fill reads over any image).
   */
  transparent?: boolean;
  /**
   * The scroll offset driving `border="auto"`, `transparent` and the shadow.
   * Pass it from a Reanimated scroll handler on native or for any scroll
   * container. Omitted on web, the header follows `window.scrollY`; omitted on
   * native, the header stays at rest.
   */
  scrollY?: SharedValue<number>;
  /** The offset (px) over which border, background and shadow fade in. Default 20. */
  scrollThreshold?: number;

  /** Web only: pin the bar to the top of its scroll container. Default true. */
  sticky?: boolean;
  /** Pad the top by the safe-area inset. Default true on native, false on web. */
  safeArea?: boolean;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}
