import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import type { WebAriaProps } from '../styles/styled-primitives';

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
 * call sites unchanged. `xs` (24px) is the compact tier.
 */
export type ButtonSize =
  | 'xs'
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

  /**
   * An icon ELEMENT rendered as-is, or an icon COMPONENT (`icon={RiMore2Line}`),
   * which the button sizes and colours like `leadingIcon`.
   */
  icon?: React.ReactNode | ButtonIconComponent;
  iconPosition?: 'left' | 'right';

  /**
   * The `link` variant's colour: `primary` is the accent
   * label, `secondary` the secondary-text label. Ignored by other variants.
   */
  linkTone?: ButtonLinkTone;

  /**
   * Makes the button a link. On web it renders a real `<a href>` (dropped
   * while disabled); on native a press opens the URL unless `onPress` is set.
   */
  href?: string;
  /** Anchor `target` (web only, with `href`). */
  target?: string;
  /** Anchor `rel` (web only, with `href`). */
  rel?: string;

  /**
   * An icon COMPONENT (`leadingIcon={RiAddLine}`, not an
   * element) rendered before the label. The button sizes and colours it for the
   * current size and state, so a caller cannot pass the wrong size.
   */
  leadingIcon?: ButtonIconComponent;
  /** Same as {@link ButtonProps.leadingIcon}, after the label. Ignored when `iconOnly`. */
  trailingIcon?: ButtonIconComponent;
  /**
   * Render a square icon-only button (24 / 32 / 36 / 44) from `leadingIcon` or
   * `icon`. Name it with `accessibilityLabel` — there is no text to read.
   */
  iconOnly?: boolean;

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
   * Whether the surface this button controls is open.
   *
   * Forwarded, not invented: a `Button` used as an anchored family's `asChild`
   * trigger is handed this by `floating/TriggerSlot`, and a component that
   * destructures a known prop list DROPS what it does not name. Measured before
   * these two existed: an `asChild` trigger emitted `aria-label` (which `Button`
   * did name) and neither `aria-expanded` nor `aria-haspopup`, so every story
   * and most real call sites announced a plain button.
   */
  'aria-expanded'?: boolean;
  /**
   * What the surface this button opens IS. Forwarded for the same reason as
   * {@link ButtonProps['aria-expanded']}; the value comes from the family.
   */
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
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

/** `LinkButton`'s two colours. */
export type ButtonLinkTone = 'primary' | 'secondary';

/** Props of `LinkButton`: its `variant` is the link colour. */
export interface LinkButtonProps extends Omit<ButtonProps, 'variant' | 'linkTone'> {
  variant?: ButtonLinkTone;
}

/** Props of `CloseButton`. */
export interface CloseButtonProps {
  onPress?: () => void;
  /** `2xs` 16 · `xs` 20 (default) · `sm` 24 · `md` 32. */
  size?: '2xs' | 'xs' | 'sm' | 'md';
  disabled?: boolean;
  /** Required — the control draws no text. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The props `Button` hands an icon component: Bloom icons accept all three. */
export type ButtonIconComponent = ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
}>;
