import type {
  BloomAppearance,
  BloomTone,
  BloomSize,
  BloomControlDensity,
} from '../appearance/types';
import type { BloomIconRenderer } from '../icons/render-icon';
import type { AriaAttributes, ReactNode } from 'react';
import type {
  GestureResponderEvent,
  FocusEvent as NativeFocusEvent,
  MouseEvent as NativeMouseEvent,
  LayoutChangeEvent,
  ViewProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import type { WebAriaProps } from '../styles/styled-primitives';
import type { BloomIconComponent } from '../icons/icon-component';
import type { TypeScaleVariant } from '../typography/scale';

/** Shared control size; square geometry is expressed with iconOnly. */
export type ButtonSize = BloomSize;

/** The original platform focus event, without a synthetic cross-platform adapter. */
export type ButtonFocusEvent = NativeFocusEvent | React.FocusEvent<HTMLElement>;
/** Native Pressable hover event or the original non-touch web pointer event. */
export type ButtonHoverEvent = NativeMouseEvent | React.PointerEvent<HTMLElement>;

export interface ButtonProps {
  /** False renders the same visual as decoration, without focus or interaction. A label names it as an image. */
  interactive?: boolean;
  /** Announces background work without blocking presses. `loading` also announces busy and blocks interaction. */
  'aria-busy'?: boolean;
  /** Focus lifecycle on the interactive host; does not activate the button. */
  onFocus?: (event: ButtonFocusEvent) => void;
  onBlur?: (event: ButtonFocusEvent) => void;
  /** Pointer preview lifecycle. Touch gestures do not synthesize web hover. */
  onHoverIn?: (event: ButtonHoverEvent) => void;
  onHoverOut?: (event: ButtonHoverEvent) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  'aria-hidden'?: boolean;
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: ViewProps['importantForAccessibility'];
  /** Explicit paired brand fill and label; preserves semantic geometry. */
  colors?: { background: string; foreground: string };
  /** Swap the theme background and foreground for a high-contrast action. */
  inverted?: boolean;
  /** Optional state colours for controls over artwork or branded surfaces. */
  color?: string;
  hoverColor?: string;
  activeColor?: string;
  activeHoverColor?: string;
  fill?: string;
  hoverFill?: string;
  ring?: string;
  disabledOpacity?: number;
  /** A numeric size is an explicit control diameter; grow keeps it as a minimum width. */
  grow?: boolean;
  paddingHorizontal?: number;
  /** Changes pulse the content without moving or remounting the press target. */
  attention?: number;
  decoration?: ReactNode;
  /** Override the loading glyph; null keeps caller-rendered busy content visible. */
  loadingIndicator?: ReactNode;
  /** Preview lifecycle; activation remains onPress. */
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Toggle state, announced on web and native. Omit for ordinary actions. */
  pressed?: boolean;
  /** Controlled toggle callback. Works for both standalone and grouped buttons. */
  onPressedChange?: (pressed: boolean) => void;
  /** Keep an embedded action from also activating its parent. Default false. */
  stopPropagation?: boolean;
  appearance?: BloomAppearance;
  /**
   * Own surface (default), flat fill, shared material painted by an enclosing control group, or
   * `'glass'`: the native glass (Android 13+, in a binary that has Bloom's glass module), which
   * draws the fill, tinted by the button's tone, and springs under the finger. Where glass is
   * not available the button keeps its own surface. A glass button sizes to its content or to
   * its `width`/`height`.
   *
   * Glass belongs to the fixed layer: a header, a toolbar, a floating button. Never inside a
   * scrolling area, whose overscroll stretch a glass control does not follow, and never one per
   * row of a list: each glass button is a native view drawn every frame (measured on a Pixel 8a,
   * 60 at once cost 21% janky frames while scrolling, against 2% on a surface).
   */
  material?: 'surface' | 'flat' | 'shared' | 'glass';
  tone?: BloomTone;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  children?: React.ReactNode | ((foreground: string) => React.ReactNode);
  disabled?: boolean;

  size?: ButtonSize | number;
  /** Explicit override of the nearest BloomScope's contextual action geometry. */
  density?: BloomControlDensity;
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
   * The inline link colour. `primary` is the accent label, `secondary` the
   * secondary-text label, `text` the READING colour (`text` at rest, secondary
   * under a pointer or a press) — the tone an underlined action takes when it
   * sits inside a sentence and must not read as the accent. Used by LinkButton and plain inline actions.
   */
  linkTone?: ButtonLinkTone;

  /**
   * When the label carries its underline. `rest` underlines always — the
   * underline IS the affordance, which is what an inline text action inside
   * running copy needs; `hover` underlines only under a pointer (the `link`
   * action's default, and web-only: native has no hover); `none` never does.
   *
   * Defaults to `hover` for `link` and `none` for other actions, so an
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
   *
   * `columnheader` is a list's or a table's column header that sorts by its
   * column when pressed (a file list's Name, Size): announced as a column
   * header, not as a button, as VoiceOver and the ARIA grid pattern say one.
   */
  accessibilityRole?: 'button' | 'link' | 'columnheader';

  /**
   * Makes the button a link. On web it renders a real `<a href>` (dropped
   * while disabled); on native a press opens the URL unless `onPress` is set.
   */
  href?: string;
  /**
   * Anchor `target`, with `href`. On native, `'_blank'` opens the URL outside the
   * app (`openExternal`: the in-app browser) instead of with the system handler.
   */
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
   * Draw the leading glyph yourself, handed the button's icon size and the
   * foreground for the CURRENT state — for an app's own icon set, whose props
   * Bloom's icon slot cannot name. Wins over `leadingIcon`, and is used for the
   * glyph when `iconOnly`. See `icons/render-icon.tsx`.
   */
  renderLeadingIcon?: BloomIconRenderer;
  /** Same as {@link ButtonProps.renderLeadingIcon}, after the label. Ignored when `iconOnly`. */
  renderTrailingIcon?: BloomIconRenderer;
  /**
   * Render a square icon-only button (24 / 32 / 36 / 44) from `leadingIcon` or
   * `icon`. Name it with `accessibilityLabel` — there is no text to read.
   */
  iconOnly?: boolean;
  /**
   * With `iconOnly`: a pill 1.5 times as wide as it is tall, not a square. Where a row of icon
   * buttons stands apart (a separated `ButtonGroup`), a circle is not a pill.
   */
  wide?: boolean;

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
  /**
   * Native: what the button shows beyond its name, read after it ("Dropsea, running"),
   * as a `Pressable`'s. The web fork's `<button>` has no value; it ignores it.
   */
  accessibilityValue?: ViewProps['accessibilityValue'];
  /**
   * Native: what an assistive technology (or the keyboard, through the
   * platform) can ask of the button beyond pressing it — a context menu
   * trigger's `longpress` on a `ContextMenuTrigger asChild` button, an
   * application's custom actions — and their handler, as a `Pressable`'s. The
   * web fork ignores them.
   */
  accessibilityActions?: ViewProps['accessibilityActions'];
  onAccessibilityAction?: ViewProps['onAccessibilityAction'];
  /**
   * Whether the keyboard's Tab stops here: -1 leaves the button out of the Tab
   * order, a pointer and assistive technologies still pressing it (a list's
   * column header, sorted from the keyboard by a View menu's Sort By, as a
   * Mac's table header is not in the key view loop). Both platforms: the DOM's
   * `tabIndex` on web, React Native's (its `focusable`) on native, which a
   * native host's keyboard focus reads.
   */
  tabIndex?: number;
  hitSlop?: number | { top: number; bottom: number; left: number; right: number };
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
  /** Original DOM keyboard event (web only). preventDefault cancels native key behavior. */
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLElement>;
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
   * Current destination or item in a set. Forwarded to the web host, including
   * links and asChild. Native announces selected when current is truthy;
   * an explicit pressed toggle state remains authoritative on native.
   */
  'aria-current'?: AriaAttributes['aria-current'];
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

/** The props `Button` hands an icon component: Bloom icons accept all three. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type ButtonIconComponent = BloomIconComponent;

/** Layout and shared surface for ordinary Button children. */
export interface ButtonGroupProps {
  orientation?: 'horizontal' | 'vertical';
  size?: ButtonSize;
  /** Hairlines between controls. Default true. */
  dividers?: boolean;
  /** Flat segments with a gap, sharing the outer pill. Default false. */
  separated?: boolean;
  children: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
