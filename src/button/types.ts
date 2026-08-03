import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

/**
 * Bloom's canonical button variants (shared across native + web) plus the
 * web/shadcn set that DOM apps (auth, console, website) rely on:
 *
 *   - `primary | secondary | inverse | icon | ghost | text` — the original
 *     Bloom set, rendered identically on both platforms.
 *   - `outline | link | destructive` — web additions. They are styled from the
 *     SAME Bloom design tokens so they stay visually consistent with the rest of
 *     the set. On native they fall back to a sensible equivalent
 *     (`outline → secondary`, `link → text`, `destructive → primary` tinted with
 *     the negative token) so passing them never crashes a native consumer.
 *
 * `text` (and its web alias `link`) is DELIBERATELY not a transparent `ghost`:
 * it is the compact inline affordance, so it overrides the size config's padding
 * down to 4/8 on BOTH platforms. `ghost` keeps the full padding — it is a
 * regular button that happens to have no background. The one geometry that does
 * differ by platform is `minHeight`: web clears it for `text`/`link` so the
 * control hugs its label and sits inline, native keeps the size config's value
 * because a finger needs the target and a cursor does not.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'inverse'
  | 'icon'
  | 'ghost'
  | 'text'
  | 'outline'
  | 'link'
  | 'destructive';

/**
 * Bloom sizes plus shadcn-style aliases. `sm | md | lg` map onto
 * `small | medium | large`; `icon` maps onto a square icon button at the medium
 * height. The aliases exist so web consumers migrating from shadcn keep their
 * call sites unchanged.
 */
export type ButtonSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon';

export interface ButtonProps {
  onPress?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;

  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';

  /**
   * When true, displays a centered loading spinner overlay and prevents
   * presses. Children remain in the layout (but visually hidden) so the
   * button preserves its width. Use this for async actions like submit.
   */
  loading?: boolean;
  /**
   * Optional color override for the loading spinner. Defaults to the
   * resolved button text color.
   */
  loadingColor?: string;

  accessibilityLabel?: string;
  accessibilityHint?: string;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  activeOpacity?: number;
  testID?: string;
  className?: string;

  // -------------------------------------------------------------------------
  //  Web-only props
  //
  //  These are no-ops in the native (`Pressable`) implementation — they exist
  //  on the shared type so a single `<Button>` call site type-checks on both
  //  platforms. The web fork (`Button.web.tsx`) renders a real HTML `<button>`
  //  and consumes them.
  // -------------------------------------------------------------------------

  /**
   * HTML button `type` (web only). Defaults to `'button'`. Use `'submit'` to
   * participate in `<form>` submission / HTML5 validation / Enter-to-submit,
   * and `'reset'` to reset a form.
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Web click handler. Aliased to the same logical action as `onPress` — either
   * (or both) may be provided; both fire on click. `onPress` is kept for
   * cross-platform parity.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Render as the child element instead of a `<button>` (web only). Use for
   * link-buttons: `<Button asChild><a href="…">Go</a></Button>` applies the
   * button styling to the `<a>` (or a router `<Link>`). The child receives the
   * merged `className`, `style`, and the button's event handlers.
   */
  asChild?: boolean;
  /**
   * Inline DOM `id` (web only).
   */
  id?: string;
  /**
   * Native HTML `name` for form participation (web only).
   */
  name?: string;
  /**
   * Native HTML `value` for form participation (web only).
   */
  value?: string;
  /**
   * `aria-label` (web only). Falls back to `accessibilityLabel`.
   */
  'aria-label'?: string;
  /**
   * `title` tooltip attribute (web only).
   */
  title?: string;
  /**
   * `autoFocus` the button on mount (web only).
   */
  autoFocus?: boolean;
  /**
   * `tabIndex` override (web only).
   */
  tabIndex?: number;
  /**
   * Stretch the button to fill its container's main axis (web only). Equivalent
   * to passing `className="w-full"`; provided as a prop for ergonomics.
   */
  fullWidth?: boolean;
}
