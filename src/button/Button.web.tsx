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
import {
  GLASS_BLUR_FILTER,
  GLASS_RIM_HIGHLIGHT,
  glassBackgroundImage,
  resolveGlassColors,
} from '../theme/glass-colors';
import type { Theme } from '../theme/types';
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
}

const SIZE_CONFIG: Record<NativeSize, SizeConfig> = {
  small: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14, minHeight: 32 },
  medium: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 15, minHeight: 40 },
  large: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16, minHeight: 48 },
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
  // The `link` variant is the one button that is text: it underlines on hover
  // instead of dimming, so it has to undo the shared opacity dip.
  extraRules: `.bloom-btn--link${NOT_DISABLED}:hover {
  opacity: 1;
  text-decoration: underline;
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
 * The glass material as raw-DOM CSS.
 *
 * `backdrop-filter` needs both spellings for Safari, and it needs the element to
 * have a translucent background for anything to show through — which the
 * `background-image` stack provides rather than `background-color`, leaving that
 * slot free.
 */
function glassContainer(theme: Theme, isDestructive: boolean): CSSProperties {
  const glass = resolveGlassColors(theme.colors, isDestructive ? 'error' : 'primary');
  return {
    backgroundColor: 'transparent',
    backgroundImage: glassBackgroundImage(glass.fill, theme.isDark),
    borderWidth: glass.hairlineWidth,
    borderStyle: 'solid',
    borderColor: glass.hairline,
    borderRadius: borderRadius.full,
    backdropFilter: GLASS_BLUR_FILTER,
    WebkitBackdropFilter: GLASS_BLUR_FILTER,
    boxShadow: `${GLASS_RIM_HIGHLIGHT}, ${SHADOW_BOX.glass}`,
  };
}

function resolveVariantStyle(
  variant: ButtonVariant,
  size: NativeSize,
  theme: Theme,
): VariantStyle {
  const c = theme.colors;
  const sizeConfig = SIZE_CONFIG[size];

  switch (variant) {
    // The two FILLED variants are GLASS. Every layer comes from
    // `theme/glass-colors.ts`, the same module the native fork's `GlassSurface`
    // reads, so the two cannot drift: the accent tint and its guaranteed-legible
    // label from the `*Subtle` pair, the hairline at the tone's full strength,
    // the sheen and the material as a `background-image` stack, the lit rim and
    // the drop shadow as one `box-shadow`.
    case 'primary':
    case 'destructive':
      return {
        container: glassContainer(theme, variant === 'destructive'),
        textColor: resolveGlassColors(c, variant === 'destructive' ? 'error' : 'primary')
          .foreground,
        ringColor: variant === 'destructive' ? c.negative : c.primary,
      };
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
          padding: 8,
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
