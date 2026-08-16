import React, {
  memo,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from 'react';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius } from '../styles/tokens';
import { SHADOW_BOX } from '../design-tokens/shadows';
import type { Theme } from '../theme/types';
import {
  GLASS_BLUR_FILTER,
  GLASS_RIM_HIGHLIGHT,
  GLASS_SHEEN_GRADIENT,
  resolveGlassColors,
} from '../theme/glass-colors';
import { SpinnerIcon } from '../loading/SpinnerIcon.web';
import { flattenWebStyle } from '../styles/flatten-web-style';
import {
  NOT_DISABLED,
  interactiveWebCss,
  useInteractiveWebCss,
} from '../styles/interactive-web-css';
import type { ButtonProps, ButtonSize, ButtonVariant } from './types';

export type { ButtonProps, ButtonVariant, ButtonSize } from './types';

// ---------------------------------------------------------------------------
//  Geometry — mirrors the native (`Button.tsx`) impl so the web button is
//  pixel-consistent with native. Sizes below are the resolved primitives; the
//  shadcn-style aliases (`sm | md | lg | icon`) are normalized first.
//
//  ONE deliberate exception, in `containerStyle`: `text`/`link` clear
//  `minHeight` here so the control hugs its label and sits inline (which is what
//  makes `asChild` anchors work), while native keeps the size config's value to
//  preserve the touch target. The 4/8 padding override those variants get is NOT
//  an exception — native applies exactly the same one, so `text` is a compact
//  affordance and `ghost` a full-size button without a background on both
//  platforms. Only the variant COLOR table below is shared between them.
// ---------------------------------------------------------------------------

type NativeSize = 'small' | 'medium' | 'large';

interface SizeConfig {
  paddingVertical: number;
  paddingHorizontal: number;
  fontSize: number;
  minHeight: number;
  /** The square `icon` variant's own padding — see `Button.tsx`'s SIZE_CONFIG. */
  iconPadding: number;
}

/**
 * Mirrors `Button.tsx`'s table exactly, including why the padding is what it is:
 * `minHeight` is the single authority on the height, and these values keep the
 * content box (padding + a `1.5 × fontSize` line box + a 1px border on each
 * side) underneath it. Heights are 32 / 36 / 44 on both platforms.
 */
const SIZE_CONFIG: Record<NativeSize, SizeConfig> = {
  small: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 14, minHeight: 32, iconPadding: 8 },
  medium: { paddingVertical: 5, paddingHorizontal: 16, fontSize: 15, minHeight: 36, iconPadding: 6 },
  large: { paddingVertical: 8, paddingHorizontal: 20, fontSize: 16, minHeight: 44, iconPadding: 6 },
};

const SIZE_ALIAS: Record<ButtonSize, NativeSize> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
  sm: 'small',
  md: 'medium',
  lg: 'large',
  icon: 'medium',
};

/** Variants that get a tactile press-scale (matches native `SCALE_VARIANTS`). */
const SCALE_VARIANTS = new Set<ButtonVariant>(['primary', 'secondary', 'inverse', 'destructive']);

/**
 * The two variants painted as GLASS, and which theme fill each is tinted with.
 *
 * They are exactly the variants that carry a brand FILL today, which is what
 * makes the treatment coherent: glass REPLACES a fill, it does not add one, so
 * the button's colour does not move — only its opacity, and the chrome around
 * it. The other seven are excluded for reasons that are not aesthetic:
 *
 *  - `secondary`/`outline`/`ghost`/`text`/`link` have no fill to replace. A blur
 *    behind a transparent control shows nothing, and the hairline is only "the
 *    edge of the tinted pane" where there IS a tint for it to be the edge of.
 *  - `inverse` is the on-image CTA, and it is precisely the surface this material
 *    cannot be. Over content Bloom does not own, half the preset matrix falls
 *    below AA (worst 1.02) — and so does the reference itself, whose own label
 *    measures 4.05 over a mid-tone photo. `inverse` being opaque is the answer to
 *    that case, not an oversight.
 *  - `icon` keeps the neutral chrome that distinguishes it from a bare glyph.
 */
const GLASS_FILLS: Record<string, (theme: Theme) => { fill: string; onFill: string }> = {
  primary: (theme) => ({ fill: theme.colors.primary, onFill: theme.colors.primaryForeground }),
  destructive: (theme) => ({ fill: theme.colors.negative, onFill: theme.colors.negativeForeground }),
};

// ---------------------------------------------------------------------------
//  Per-state CSS injection
//
//  Shared recipe — see `styles/interactive-web-css.ts` for why the focus ring is
//  `:focus-visible` and why injection goes through `adoptStyleSheet`. Per-instance
//  resolved colours stay inline, reaching the static rules as custom properties
//  (`--bloom-btn-ring`, `--bloom-btn-press-scale`).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-button-web-css';

const BLOOM_BUTTON_CSS = interactiveWebCss({
  selector: '.bloom-btn',
  varPrefix: 'bloom-btn',
  base: `
    flex-direction: row;
    gap: 8px;
    position: relative;
    border: none;
    background: transparent;
    font-family: var(--bloom-font-sans, inherit);
    text-decoration: none;
  `,
  transition:
    'opacity 120ms ease, transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
  hover: { declarations: 'opacity: 0.9;' },
  outlineOffset: 2,
  // Two variants undo the shared opacity dip, each for its own reason.
  //
  // `link` is the one button that IS text: it underlines instead of dimming.
  //
  // `glass` is translucent, so dimming it is the wrong axis twice over — it
  // fades the LABEL along with the surface, and it makes a pane that is already
  // showing the page through it show more of it, which reads as the button
  // retreating rather than responding. The reference darkens its background
  // instead (`hover:bg-[rgba(0,0,0,.1)]`), and that is what this does: one more
  // flat layer on top of the sheen, in a direction the instance chooses, since
  // black-over-dark-mode would be invisible. The whole `background-image` list
  // is restated because CSS has no way to prepend to one, and the sheen has to
  // stay under the new layer.
  extraRules: `.bloom-btn--link${NOT_DISABLED}:hover {
  opacity: 1;
  text-decoration: underline;
}
.bloom-btn--glass {
  backdrop-filter: ${GLASS_BLUR_FILTER};
  -webkit-backdrop-filter: ${GLASS_BLUR_FILTER};
  background-image: ${GLASS_SHEEN_GRADIENT};
}
.bloom-btn--glass${NOT_DISABLED}:hover {
  opacity: 1;
  background-image:
    linear-gradient(var(--bloom-btn-glass-hover), var(--bloom-btn-glass-hover)),
    ${GLASS_SHEEN_GRADIENT};
}`,
});

// ---------------------------------------------------------------------------
//  Variant styling — all colors come from the SAME Bloom theme tokens native
//  uses, so primary/secondary/etc. look identical across platforms. The added
//  web variants (`outline | link | destructive`) are styled from those tokens
//  too (no new palette).
//
//  Every variant, text and icon alike, takes `borderRadius.full` — the same
//  token native reads, so the fully-rounded shape cannot drift between the two
//  forks, and a square icon button at that radius renders as a perfect circle.
// ---------------------------------------------------------------------------

interface VariantStyle {
  /** Container CSS (background, border, radius). */
  container: CSSProperties;
  /** Resolved text/icon color. */
  textColor: string;
  /** The `:focus-visible` ring color. */
  ringColor: string;
}

/**
 * The glass container, from the reference's five declarations.
 *
 * The blur and the sheen are NOT here — they are constant, so they live in the
 * `.bloom-btn--glass` rule where `:hover` can restate the `background-image`
 * without an inline style outranking it. That split is the reference's own:
 * `.glassy-effect` carries the blur and the gradient, the element's `style`
 * attribute carries the per-instance fill, border and shadow.
 */
function glassContainer(fill: string, onFill: string, theme: Theme): VariantStyle {
  const glass = resolveGlassColors(fill);
  return {
    container: {
      backgroundColor: glass.fill,
      borderWidth: glass.hairlineWidth,
      borderStyle: 'solid',
      borderColor: glass.hairline,
      borderRadius: borderRadius.full,
      // The lit rim first, then the drop — the reference's own order, and the
      // only order that works: an inset painted after a drop is still an inset,
      // but reading it in the same sequence the reference wrote it is what makes
      // the two diffable.
      boxShadow: `${GLASS_RIM_HIGHLIGHT}, ${SHADOW_BOX.glass}`,
      // Consumed by `.bloom-btn--glass:hover`. Black over a light pane, white
      // over a dark one — the reference only ever needed the first, being a
      // light-page component.
      ['--bloom-btn-glass-hover' as string]: theme.isDark
        ? 'rgba(255, 255, 255, 0.10)'
        : 'rgba(0, 0, 0, 0.10)',
    },
    // The fill's OWN on-colour. At 0.85 the pane is the fill, so it carries the
    // label the fill was calibrated for — not the page's reading colour, which
    // is what a 0.25 wash needed and what fails 1015 of 1260 rows here.
    textColor: onFill,
    ringColor: fill,
  };
}

function resolveVariantStyle(
  variant: ButtonVariant,
  size: NativeSize,
  theme: Theme,
): VariantStyle {
  const c = theme.colors;
  const sizeConfig = SIZE_CONFIG[size];

  const glass = GLASS_FILLS[variant];
  if (glass) {
    const { fill, onFill } = glass(theme);
    return glassContainer(fill, onFill, theme);
  }

  switch (variant) {
    case 'inverse':
      return {
        container: { backgroundColor: '#FFFFFF', borderRadius: borderRadius.full },
        textColor: '#000000',
        ringColor: c.primary,
      };
    case 'secondary':
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: c.border,
          borderRadius: borderRadius.full,
        },
        textColor: c.text,
        ringColor: c.primary,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent', borderRadius: borderRadius.full },
        textColor: c.primary,
        ringColor: c.primary,
      };
    case 'icon':
      return {
        container: {
          backgroundColor: c.background,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: c.border,
          borderRadius: borderRadius.full,
          padding: sizeConfig.iconPadding,
          width: sizeConfig.minHeight,
          height: sizeConfig.minHeight,
        },
        textColor: c.text,
        ringColor: c.primary,
      };
    case 'text':
    case 'link':
    default:
      return {
        container: { backgroundColor: 'transparent', borderRadius: borderRadius.full },
        textColor: c.primary,
        ringColor: c.primary,
      };
  }
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

const ButtonWebComponent: React.FC<ButtonProps> = ({
  onPress,
  onClick,
  children,
  disabled = false,
  variant = 'primary',
  size: sizeProp = 'medium',
  style,
  icon,
  iconPosition = 'left',
  loading = false,
  loadingColor,
  accessibilityLabel,
  'aria-label': ariaLabelProp,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
  accessibilityHint,
  testID,
  className,
  type = 'button',
  asChild = false,
  id,
  name,
  value,
  title,
  autoFocus,
  tabIndex,
  fullWidth = false,
}) => {
  useInteractiveWebCss(STYLE_ID, BLOOM_BUTTON_CSS);
  const theme = useTheme();
  const reactId = useId();
  const resolvedId = id ?? `bloom-btn-${reactId}`;

  // `size="icon"` shorthand also selects the icon variant unless the caller
  // explicitly picked one — mirrors native + shadcn behavior.
  const resolvedVariant: ButtonVariant =
    sizeProp === 'icon' && variant === 'primary' ? 'icon' : variant;
  const size: NativeSize = SIZE_ALIAS[sizeProp];
  const isIcon = resolvedVariant === 'icon';
  const isInteractionBlocked = disabled || loading;

  const variantStyle = useMemo(
    () => resolveVariantStyle(resolvedVariant, size, theme),
    [resolvedVariant, size, theme],
  );

  const sizeConfig = SIZE_CONFIG[size];

  const containerStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      fontSize: sizeConfig.fontSize,
      fontWeight: 'bold',
      color: variantStyle.textColor,
      width: fullWidth ? '100%' : undefined,
      // CSS custom props consumed by the static stylesheet.
      ['--bloom-btn-ring' as string]: variantStyle.ringColor,
      ['--bloom-btn-press-scale' as string]: SCALE_VARIANTS.has(resolvedVariant)
        ? animation.pressScale
        : 1,
      ...variantStyle.container,
    };
    if (!isIcon) {
      base.paddingTop = sizeConfig.paddingVertical;
      base.paddingBottom = sizeConfig.paddingVertical;
      base.paddingLeft = sizeConfig.paddingHorizontal;
      base.paddingRight = sizeConfig.paddingHorizontal;
      base.minHeight = sizeConfig.minHeight;
    }
    if (resolvedVariant === 'text' || resolvedVariant === 'link') {
      base.paddingTop = 4;
      base.paddingBottom = 4;
      base.paddingLeft = 8;
      base.paddingRight = 8;
      base.minHeight = undefined;
    }
    return base;
  }, [sizeConfig, variantStyle, fullWidth, isIcon, resolvedVariant]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isInteractionBlocked) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
      onPress?.();
    },
    [isInteractionBlocked, onClick, onPress],
  );

  const ariaLabel = ariaLabelProp ?? accessibilityLabel;
  const composedClassName = ['bloom-btn']
    .concat(resolvedVariant === 'link' ? ['bloom-btn--link'] : [])
    .concat(GLASS_FILLS[resolvedVariant] ? ['bloom-btn--glass'] : [])
    .concat(className ? [className] : [])
    .join(' ');

  const spinnerColor = loadingColor ?? variantStyle.textColor;

  // Normalize the caller's `style` (single object, StyleProp array, or falsy)
  // into ONE flat plain object here, once, so neither raw-DOM merge site below
  // spreads a StyleProp array (which would leak numeric keys onto the button's
  // CSSStyleDeclaration). See `flattenWebStyle` for the full rationale.
  const resolvedStyle = flattenWebStyle(style);

  const content = (
    <>
      {iconPosition === 'left' && icon}
      {children != null &&
        (typeof children === 'string' || typeof children === 'number' ? (
          <span>{children}</span>
        ) : (
          children
        ))}
      {iconPosition === 'right' && icon}
    </>
  );

  const body = loading ? (
    <>
      {/* Keep children mounted (hidden) so the button preserves its width. */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        {content}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <SpinnerIcon size={Math.round(sizeConfig.fontSize * 1.2)} color={spinnerColor} />
      </span>
    </>
  ) : (
    content
  );

  // asChild: render the provided child element (e.g. <a> / router <Link>) with
  // the button styling and handlers merged in. Used for link-buttons.
  if (asChild && React.isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string;
      style?: CSSProperties;
      onClick?: (event: MouseEvent<HTMLElement>) => void;
      'aria-disabled'?: boolean;
      'aria-busy'?: boolean;
      'aria-label'?: string;
      title?: string;
      id?: string;
      tabIndex?: number;
    }>;
    const childProps = child.props;
    return React.cloneElement(child, {
      className: [composedClassName, childProps.className].filter(Boolean).join(' '),
      style: { ...containerStyle, ...resolvedStyle, ...childProps.style },
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (isInteractionBlocked) {
          event.preventDefault();
          return;
        }
        childProps.onClick?.(event);
        onClick?.(event as MouseEvent<HTMLButtonElement>);
        onPress?.();
      },
      'aria-disabled': isInteractionBlocked || undefined,
      'aria-busy': loading || undefined,
      'aria-label': ariaLabel ?? childProps['aria-label'],
      title: title ?? childProps.title,
      id: childProps.id ?? resolvedId,
      tabIndex: isInteractionBlocked ? -1 : childProps.tabIndex,
    });
  }

  return (
    <button
      id={resolvedId}
      type={type}
      name={name}
      value={value}
      className={composedClassName}
      style={{ ...containerStyle, ...resolvedStyle }}
      onClick={handleClick}
      disabled={disabled && !loading}
      aria-disabled={isInteractionBlocked || undefined}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      // Forwarded from an anchored family's `asChild` trigger — see
      // `ButtonProps['aria-expanded']`.
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      title={title ?? accessibilityHint}
      autoFocus={autoFocus}
      tabIndex={tabIndex}
      data-testid={testID}
    >
      {body}
    </button>
  );
};

export const Button = memo(ButtonWebComponent);
Button.displayName = 'Button';

export const PrimaryButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="primary" />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="secondary" />
));
SecondaryButton.displayName = 'SecondaryButton';

export const IconButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="icon" />
));
IconButton.displayName = 'IconButton';

export const GhostButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="ghost" />
));
GhostButton.displayName = 'GhostButton';

export const InverseButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="inverse" />
));
InverseButton.displayName = 'InverseButton';

export const TextButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="text" />
));
TextButton.displayName = 'TextButton';

export const OutlineButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="outline" />
));
OutlineButton.displayName = 'OutlineButton';

export const LinkButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="link" />
));
LinkButton.displayName = 'LinkButton';

export const DestructiveButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="destructive" />
));
DestructiveButton.displayName = 'DestructiveButton';
