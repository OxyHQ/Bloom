import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Size of the {@link FrostedIconButton}.
 *
 *   - `sm` — 32px circle (`h-8`), 18px icon box. Dense toolbars / stacked chips.
 *   - `md` — 36px circle (`h-9`), 20px icon box. The default; a comfortable
 *     header/overlay action.
 *
 * A raw pixel `number` is also accepted for an exact diameter; the icon box is
 * derived as `round(size * 0.56)` (min 16px) and the blur radius scales with it.
 */
export type FrostedIconButtonSize = 'sm' | 'md';

export interface FrostedIconButtonProps {
  /** Press handler. */
  onPress?: () => void;

  /**
   * The icon to render, centered inside the circle. Typically a Bloom icon
   * element (`<Icons.ArrowLeft… />`). If the icon does not set its own `fill`,
   * the button injects the theme-aware icon color (foreground when frosted,
   * `primaryForeground` when `active`) as a fallback so a bare icon is colored
   * correctly out of the box; an explicit `fill` on the icon always wins.
   *
   * `children` is accepted as an alias — if both are given, `icon` wins.
   */
  icon?: React.ReactNode;
  children?: React.ReactNode;

  /**
   * Solid "on" state for toggles. When true the button drops its translucency
   * and backdrop blur and fills with the brand `primary` token (icon tinted
   * `primaryForeground`), so an enabled toggle reads unmistakably as active.
   * Exposed to assistive tech as `aria-pressed` (web) / the selected a11y state.
   */
  active?: boolean;

  disabled?: boolean;

  /**
   * A preset (`'sm' | 'md'`) or a raw pixel diameter (`number`). Defaults to
   * `'md'` (36px). See {@link FrostedIconButtonSize}.
   */
  size?: FrostedIconButtonSize | number;

  /** Required for icon-only buttons so screen readers announce the action. */
  accessibilityLabel?: string;
  accessibilityHint?: string;

  /** Container style override (merged last). */
  style?: StyleProp<ViewStyle>;
  /** NativeWind / DOM className passthrough. */
  className?: string;
  testID?: string;

  /**
   * Native press hit target padding. Defaults to a generous slop so the compact
   * circle is comfortable to tap. No-op on web.
   */
  hitSlop?: { top: number; bottom: number; left: number; right: number };

  // -------------------------------------------------------------------------
  //  Web-only props
  //
  //  No-ops in the native (`Pressable`) implementation — present on the shared
  //  type so a single `<FrostedIconButton>` call site type-checks on both
  //  platforms. The web fork renders a real DOM `<button>` and consumes them.
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
