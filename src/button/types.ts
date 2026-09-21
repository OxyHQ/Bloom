import type { BloomAppearance, BloomTone, BloomSize } from '../appearance/types';
import type { ComponentType, ReactNode } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle, TextStyle } from 'react-native';
import type { WebAriaProps } from '../styles/styled-primitives';
import type { BloomIconComponent } from '../icons/icon-component';
import type { TypeScaleVariant } from '../typography/scale';

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
 *
 * WHICH ONE IS THE NEUTRAL TRANSPARENT AFFORDANCE — the question five families
 * answered with their own copy before this list said so:
 *
 * - **`ghost` IS NOT TRANSPARENT.** It paints an accent WASH at rest
 *   (`accent-100` / dark `accent-900`) with an accent label. It is the low-
 *   emphasis ACCENT action — the third button in a row that is still part of the
 *   accent family — and it is the wrong control for a neutral ⋯ / × / clear
 *   affordance, which lands tinted. A DESTRUCTIVE action in it is worse: a red
 *   label on a blue wash, which is what `track-list`'s selection bar shipped.
 * - **The neutral transparent ICON button is {@link GlyphButtonProps}**
 *   (`GlyphButton`, beside `Button` in `src/button`): an arbitrary round size, a
 *   neutral glyph, no fill at rest and a neutral wash on hover. Reach for it for
 *   every ⋯, ×, clear, shuffle, repeat and toggle glyph.
 * - `icon` is the neutral icon button WITH A SURFACE (`secondary`'s card +
 *   border) at the fixed 24 / 32 / 36 / 44 heights.
 * - `text` is the transparent LABELLED button: an accent label, a NEUTRAL hover
 *   wash, no fill at rest. Use it where `ghost`'s wash is too loud; colour a
 *   destructive one through `textStyle` plus an `icon` ELEMENT you paint
 *   yourself, or reach for `destructive`.
 * - `link` is running text: no container, no padding, `linkTone` for the colour
 *   and `underline` for whether the underline is the affordance at rest.
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
export type ButtonSize = BloomSize
  | 'xs'
  | 'small'
  | 'medium'
  | 'large'
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon';

export interface ButtonProps {
  appearance?: BloomAppearance;
  tone?: BloomTone;
  leading?: ReactNode;
  trailing?: ReactNode;
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
  /** Explicit glyph dimensions; otherwise follows the button size. */
  iconSize?: number;
  iconPosition?: 'left' | 'right';

  /**
   * The `link` variant's colour. `primary` is the accent label, `secondary` the
   * secondary-text label, `text` the READING colour (`text` at rest, secondary
   * under a pointer or a press) — the tone an underlined action takes when it
   * sits inside a sentence and must not read as the accent. Ignored by other
   * variants.
   */
  linkTone?: ButtonLinkTone;

  /**
   * When the label carries its underline. `rest` underlines always — the
   * underline IS the affordance, which is what an inline text action inside
   * running copy needs; `hover` underlines only under a pointer (the `link`
   * variant's default, and web-only: native has no hover); `none` never does.
   *
   * Defaults to `hover` for `link` and `none` for every other variant, so an
   * existing call site is unchanged. Four families hand-rolled an underlined
   * `Pressable` for exactly this: `stay-filters`, `booking`, `listing-details`
   * and `media-header`.
   */
  underline?: ButtonUnderline;

  /**
   * Override the type-ramp step the size picks for the label
   * (`body-semibold`, `body-2-medium`, …). The four families that hand-rolled an
   * inline text button each drew their label at their own step, and the ONE
   * thing they could not express through `textStyle` is the line height: on web
   * a `lineHeight` number in a style object is CSS's UNITLESS multiplier, so a
   * ramp step passed that way renders at twenty times its size. This is read
   * from `TYPE_SCALE` and emitted in px by the web fork, and handed to `Text`
   * as its `variant` by the native one.
   */
  textVariant?: TypeScaleVariant;

  /**
   * Truncate the label instead of letting it wrap. Native honours any count
   * (`Text numberOfLines`); the web fork honours `1`, as an ellipsis on the
   * label — `.bloom-btn` is already `white-space: nowrap; overflow: hidden`, so
   * a longer label was CLIPPED there rather than wrapped, with nothing to say
   * it had been.
   */
  numberOfLines?: number;

  /**
   * Override the announced role. `link` WITHOUT an `href` is the one reason
   * this exists: a family whose control navigates through its own router (or
   * jumps within the page) renders no anchor, and both `listing-details` and
   * `media-header` had already decided their inline links announce as links on
   * web and as buttons on native. Prefer `href` — it renders a REAL anchor,
   * which is the only spelling middle-click, copy-link and the status bar
   * understand.
   */
  accessibilityRole?: 'button' | 'link';

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

/**
 * `LinkButton`'s colours. `text` is the reading colour — `colors.text` at rest,
 * `colors.textSecondary` under a pointer or a press, `colors.textTertiary`
 * disabled — so an underlined action can sit in a sentence without pulling the
 * accent into it.
 */
export type ButtonLinkTone = 'primary' | 'secondary' | 'text';

/** When {@link ButtonProps.underline} draws the label's underline. */
export type ButtonUnderline = 'rest' | 'hover' | 'none';

/** Props of `LinkButton`: its `variant` is the link colour. */
export interface LinkButtonProps extends Omit<ButtonProps, 'variant' | 'linkTone'> {
  variant?: ButtonLinkTone;
}

/** Props of `CloseButton`. */
export interface CloseButtonProps {
  onPress?: () => void;
  /** `2xs` 16 · `xs` 20 (default) · `sm` 24 · `md` 32. */
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Required — the control draws no text. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * `GlyphButton`: the round glyph-only control — an arbitrary diameter, a glyph
 * (an icon COMPONENT Bloom sizes and paints, or any node), fills at rest and
 * under a pointer, and an optional `pressed` toggle.
 *
 * It exists because `Button iconOnly`'s heights are FIXED (24 / 32 / 36 / 44)
 * and `variant="icon"` paints a surface, so every family that wanted a 28, 40 or
 * 44 transparent glyph wrote its own: `track-list`, `queue-panel`,
 * `media-player`, `media-header` and `music-library` shipped five of them.
 *
 * The glyph is {@link GLYPH_BUTTON_GLYPH_RATIO} × the box unless `glyphSize`
 * says otherwise — measured across those five, the ratio ran 0.50 to 0.75 and
 * 0.6 is the middle of it (and exactly what the 40-box media header used).
 */
export interface GlyphButtonProps {
  /** Diameter of the round target. Default 36. */
  size?: number;
  /**
   * Glyph edge. Defaults to `round(size × 0.6)`; pass it to keep a call site's
   * own measured ratio.
   */
  glyphSize?: number;
  /**
   * An icon COMPONENT (`icon={RiMoreFill}`), sized and painted by the button so
   * it follows the rest / hover / pressed colours. For anything else — a text
   * glyph, an icon you paint yourself — pass `children` instead.
   */
  icon?: ButtonIconComponent;
  /**
   * A glyph node rendered as-is, centred. Wins over `icon`. As a FUNCTION it is
   * handed the resolved foreground for the current state, which is the only way
   * a caller-painted glyph (a text glyph, a two-tone icon) can follow hover and
   * the toggle the way `icon` does.
   */
  children?: ReactNode | ((foreground: string) => ReactNode);
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  /**
   * A TOGGLE. Emits `aria-pressed` (web) AND `accessibilityState.selected`
   * (native) — react-native-web drops `accessibilityState` and React Native has
   * no `aria-pressed`, so a toggle needs both spellings. Leave it undefined for
   * a plain button: `aria-pressed="false"` on a button that is not a toggle
   * announces a state nobody set.
   */
  pressed?: boolean;
  /** Foreground at rest. Default `colors.textSecondary`. */
  color?: string;
  /** Foreground under a pointer or a press. Default `colors.text`. */
  hoverColor?: string;
  /** Foreground while `pressed` is true. Default the theme accent. */
  activeColor?: string;
  /**
   * Foreground while `pressed` is true AND under a pointer or a press. Defaults
   * to `activeColor`. The on-state and the hover state are INDEPENDENT — a
   * player's lit shuffle still brightens under the cursor — and a single
   * `activeColor` cannot say that, which is why all four corners are spellable.
   */
  activeHoverColor?: string;
  /** Fill at rest. Default transparent. */
  fill?: string;
  /** Fill under a pointer or a press. Default the neutral wash (100 / dark 800). */
  hoverFill?: string;
  /**
   * The focus ring's colour. Default the accent — pass a light colour on a dark
   * surface Bloom does not own (artwork, a player bar), or the ring is invisible
   * exactly where a keyboard user needs it.
   */
  ring?: string;
  /** Opacity of the whole control when disabled. Default 0.5. */
  disabledOpacity?: number;
  /**
   * The box is a MINIMUM width and the control grows with its content, for a
   * text glyph ("1.5×"). Adds `paddingHorizontal` (default 6).
   */
  grow?: boolean;
  /** Horizontal padding when `grow`. Default 6. */
  paddingHorizontal?: number;
  /**
   * An extra layer painted over the box (`position: absolute`, no pointer
   * events) — the media player's 4px active dot. The family owns its geometry,
   * because the two that draw one place it differently.
   */
  decoration?: ReactNode;
  /** Required — the control draws no text. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button';
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The props `Button` hands an icon component: Bloom icons accept all three. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type ButtonIconComponent = BloomIconComponent;
