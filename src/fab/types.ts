import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

/**
 * Visual style of the FAB.
 *
 *   - `primary`  — filled with the brand `primary` token + `primaryForeground`
 *                  icon/label. The default; the high-emphasis floating action.
 *   - `secondary`— filled with the `card`/surface token + `text` foreground.
 *                  A lower-emphasis FAB that still reads as elevated.
 *   - `surface`  — alias of `secondary`, named for Material-style "surface" FABs.
 */
export type FabVariant = 'primary' | 'secondary' | 'surface';

/**
 * FAB sizes, matching Material-ish conventions but in Bloom's scale:
 *   - `small`   — 40px (compact / dense layouts)
 *   - `medium`  — 56px (the canonical FAB; the default)
 *   - `large`   — 64px (high-prominence primary action)
 *
 * In the `extended` variant the height tracks the size but the FAB grows
 * horizontally to fit its icon + label as a pill.
 */
export type FabSize = 'small' | 'medium' | 'large';

/**
 * Where the FAB anchors itself.
 *
 *   - `bottom-right` (default) / `bottom-left` / `top-right` / `top-left` —
 *     the FAB pins itself to that corner of its CONTAINING block. On web this
 *     uses `position: sticky` so it tracks the bottom of the scrolling column
 *     (NOT the viewport edge), which is exactly what a constrained multi-column
 *     app layout needs. On native it uses `position: absolute` within the
 *     nearest positioned ancestor.
 *   - `static` — no positioning at all. The FAB is laid out inline and the
 *     consumer is fully responsible for placement (e.g. wrapping it in their
 *     own absolutely/sticky-positioned container). Use this when you need
 *     custom containment.
 *
 * CRITICAL: the positioned placements DO NOT use web `position: fixed` and are
 * never anchored to the viewport. They stay inside the containing column so the
 * FAB never escapes a constrained 3-column app layout and sits over a side rail.
 */
export type FabPlacement =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'static';

export interface FabProps {
  /** Press handler. */
  onPress?: () => void;

  /**
   * The icon to render inside the FAB. Typically a Bloom icon element
   * (`<Icons.Plus .../>`). For an icon-only FAB this is the whole content; for
   * the extended variant it sits to the left of the `label`.
   *
   * `children` is accepted as an alias/override of `icon` for ergonomics — if
   * both are given, `icon` wins and `children` is ignored.
   */
  icon?: React.ReactNode;
  children?: React.ReactNode;

  /**
   * When provided, renders the EXTENDED FAB: a pill with the icon followed by
   * this text label. Omit for the canonical circular icon FAB.
   */
  label?: string;

  variant?: FabVariant;
  size?: FabSize;

  /**
   * Corner of the containing block to anchor to. Defaults to `'bottom-right'`.
   * See {@link FabPlacement}. The DEFAULT never escapes the containing column
   * (web uses `position: sticky`, native uses `position: absolute`).
   */
  placement?: FabPlacement;

  /**
   * Distance (in px) from the anchored edges. Applies to whichever edges the
   * `placement` pins to. Defaults to `16`.
   */
  offset?: number;

  disabled?: boolean;

  /** Required for icon-only FABs so screen readers announce the action. */
  accessibilityLabel?: string;
  accessibilityHint?: string;

  /** Container style override (merged last). */
  style?: StyleProp<ViewStyle>;
  /** Extended-FAB label text style override. */
  labelStyle?: StyleProp<TextStyle>;
  /** NativeWind / DOM className passthrough. */
  className?: string;
  testID?: string;

  /**
   * Hard `zIndex` override. Defaults to a high value so the FAB floats above
   * scrolling content.
   */
  zIndex?: number;

  // -------------------------------------------------------------------------
  //  Web-only props
  //
  //  No-ops in the native (`Pressable`) implementation — present on the shared
  //  type so a single `<Fab>` call site type-checks on both platforms. The web
  //  fork (`Fab.web.tsx`) renders a real DOM element and consumes them.
  // -------------------------------------------------------------------------

  /** Web click handler. Fires together with `onPress`. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** `aria-label` (web only). Falls back to `accessibilityLabel`. */
  'aria-label'?: string;
  /** `title` tooltip attribute (web only). */
  title?: string;
  /** Inline DOM `id` (web only). */
  id?: string;
  /** HTML button `type` (web only). Defaults to `'button'`. */
  type?: 'button' | 'submit' | 'reset';
}
