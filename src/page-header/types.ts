import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/** Where the title sits: after the back button, or centred on the bar. */
export type PageHeaderTitleAlign = 'start' | 'center';

/**
 * How the header presents itself.
 *
 * `floating` is the default: no bar at all. The back button sits in its own
 * translucent capsule, related actions share one island, the title floats
 * between them, and the whole thing ends in a soft vertical gradient instead of
 * a horizontal edge. Content passes UNDER it.
 *
 * `bar` is Bloom's original flat header — an opaque full-width strip with a
 * hairline separator and a scroll-linked shadow. It is still the right shape
 * for a dense tool screen, a split-pane sidebar header or anywhere the chrome
 * must not be mistaken for content; it is no longer the default.
 */
export type PageHeaderPresentation = 'floating' | 'bar';

/**
 * Who reserves the space the header occupies.
 *
 * `inline` (default): the header is a sibling ABOVE the content, in a column.
 * It occupies layout, so nothing passes under it and nothing needs padding.
 *
 * `overlay`: the header is absolutely positioned over the content, which starts
 * at the top of the container and scrolls under the islands. The header then
 * CLAIMS its measured height on `layout/top-edge`, and the content reads it
 * with `useTopEdgeInset()` so its first item is not born underneath. This is
 * the placement the floating presentation was designed for; the two are
 * separate props because a floating header above a fixed panel is also a real
 * arrangement.
 */
export type PageHeaderPlacement = 'inline' | 'overlay';

/**
 * The bottom separator: `auto` fades it in once the page has scrolled past
 * `scrollThreshold`, `always` draws it at rest, `none` never draws it.
 *
 * `presentation="bar"` only. A floating header has no edge to separate.
 */
export type PageHeaderBorder = 'auto' | 'always' | 'none';

/**
 * The floating header's edge effect: a vertical gradient from the page colour
 * to full transparency, behind the title and the islands.
 *
 * `auto` (default) fades it in over `[0, scrollThreshold]` of the scroll
 * offset, so it appears exactly when content starts passing under it. `always`
 * paints it at rest — for a header that is born over a photograph. `none`
 * removes it, which leaves the islands to carry legibility on their own.
 */
export type PageHeaderScrim = 'auto' | 'always' | 'none';

/**
 * When the title is visible.
 *
 * `always` (default) is the ordinary screen header. `onScroll` holds the title
 * back and fades it in with the scrim — the shape a header over a hero photo
 * wants, where the photo already names the screen.
 *
 * It is a prop of its own rather than a side effect of the background, because
 * the two are different questions and conflating them is how every header that
 * turned transparent also lost its title.
 */
export type PageHeaderTitleReveal = 'always' | 'onScroll';

export interface PageHeaderProps {
  /** A string renders as the heading; a node renders as-is (and owns its own semantics). */
  title?: ReactNode;
  /** A string renders as a secondary line under the title; a node renders as-is. */
  subtitle?: ReactNode;
  /** Default `start`. */
  titleAlign?: PageHeaderTitleAlign;
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Default `always`. */
  titleReveal?: PageHeaderTitleReveal;

  /** Default `floating`. */
  presentation?: PageHeaderPresentation;
  /** Default `inline`. */
  placement?: PageHeaderPlacement;

  /**
   * Renders the back button and is called when it is pressed. The header is
   * router-agnostic: pass `router.back`, or your app's safe-back helper.
   */
  onBack?: () => void;
  /** The back button's accessible name. Default "Back". */
  backLabel?: string;

  /** Rendered after the back button, before the title (an avatar, a logo). */
  leading?: ReactNode;
  /**
   * Rendered at the end of the bar. In the floating presentation this slot is
   * wrapped in a `ControlSurface` with `material: 'glass'`, so a `ButtonGroup`
   * inside it becomes one island with no prop written on it. Declare the
   * grouping yourself — the header never infers it by reading children.
   */
  actions?: ReactNode;

  /** `presentation="bar"` only. Default `auto`. */
  border?: PageHeaderBorder;
  /**
   * `presentation="bar"` only: the bar's background and shadow fade in with
   * scroll instead of showing at rest.
   *
   * It no longer hides the title — that is `titleReveal="onScroll"`, and the
   * two are set independently. A `bar` header that wants the old combined
   * behaviour asks for both.
   */
  transparent?: boolean;
  /** `presentation="floating"` only. Default `auto`. */
  scrim?: PageHeaderScrim;
  /**
   * The colour the edge effect fades FROM. Defaults to `theme.colors.background`
   * — the page colour, which is what the content scrolling under the header is
   * disappearing into.
   *
   * Pass it when the screen paints a background the theme does not know about:
   * a tinted section, a brand panel, a dark surface inside a light app. The
   * header cannot read the colour behind it, and a scrim in the theme's
   * background over a page in some other colour is a wash of the wrong hue
   * rather than a fade.
   *
   * It must be OPAQUE. The alpha is the ramp's, and a colour that brings its
   * own would multiply with it — `rgba(0,0,0,0.5)` at the ramp's 0.86 paints
   * 0.43 and reads as a weak, dirty veil rather than the colour you asked for.
   */
  scrimColor?: string;

  /**
   * The scroll offset driving the scrim, the separator and the shadow.
   *
   * Resolution order: this prop, then the enclosing `Screen` offset, then the nearest `ScrollOffsetProvider`
   * (`@oxy.so/bloom/layout`) — which is how a header inside a Bloom scroll
   * composition gets it with no wiring — then, on web only, `window.scrollY`.
   * On native with none of the three, the header stays at rest.
   */
  scrollY?: SharedValue<number>;
  /** The offset (px) over which the scrim, separator and shadow fade in. Default 20. */
  scrollThreshold?: number;

  /** Web only: pin the bar to the top of its scroll container. Default true. */
  sticky?: boolean;
  /** Pad the top by the safe-area inset. Default true on native, false on web. */
  safeArea?: boolean;

  style?: StyleProp<ViewStyle>;
  testID?: string;
}
