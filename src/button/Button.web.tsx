import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from 'react';

import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { SpinnerIcon } from '../loading/SpinnerIcon.web';
import type { ButtonProps, ButtonSize, ButtonVariant } from './types';

export type { ButtonProps, ButtonVariant, ButtonSize } from './types';

// ---------------------------------------------------------------------------
//  Geometry — mirrors the native (`Button.tsx`) impl exactly so the web button
//  is pixel-consistent with native. Sizes below are the resolved primitives;
//  the shadcn-style aliases (`sm | md | lg | icon`) are normalized first.
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

const PILL_RADIUS = 20;
const GHOST_RADIUS = 8;
const ICON_RADIUS = 100;
const PRESS_SCALE = 0.97;

/** Variants that get a tactile press-scale (matches native `SCALE_VARIANTS`). */
const SCALE_VARIANTS = new Set<ButtonVariant>(['primary', 'secondary', 'inverse', 'destructive']);

// ---------------------------------------------------------------------------
//  Per-state CSS injection
//
//  Inline styles cannot express `:hover` / `:focus-visible` / `:active` /
//  `:disabled`, and the keyboard-focus ring MUST be a `:focus-visible` rule
//  (not always-on) for correct mouse-vs-keyboard behavior. We inject one static
//  stylesheet (keyed by id, once) that defines the interaction behavior for the
//  base `bloom-btn` class; per-instance resolved colors stay inline.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-button-web-css';

/**
 * The focus ring color is read from a CSS custom property the component sets
 * inline per-instance (`--bloom-btn-ring`), so the static rule can theme itself
 * from the resolved token without a per-instance stylesheet.
 */
const BLOOM_BUTTON_CSS = `
.bloom-btn {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 8px;
  position: relative;
  margin: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: opacity 120ms ease, transform 120ms ease, background-color 120ms ease, border-color 120ms ease;
}
.bloom-btn:disabled,
.bloom-btn[aria-disabled="true"] {
  cursor: default;
  opacity: 0.5;
}
.bloom-btn:not(:disabled):not([aria-disabled="true"]):hover {
  opacity: 0.9;
}
.bloom-btn:not(:disabled):not([aria-disabled="true"]):active {
  transform: scale(var(--bloom-btn-press-scale, 1));
}
.bloom-btn:focus-visible {
  outline: 2px solid var(--bloom-btn-ring, currentColor);
  outline-offset: 2px;
}
.bloom-btn--link:not(:disabled):not([aria-disabled="true"]):hover {
  opacity: 1;
  text-decoration: underline;
}
`;

function useButtonCss(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = BLOOM_BUTTON_CSS;
    document.head.appendChild(style);
  }, []);
}

// ---------------------------------------------------------------------------
//  Variant styling — all colors come from the SAME Bloom theme tokens native
//  uses, so primary/secondary/etc. look identical across platforms. The added
//  web variants (`outline | link | destructive`) are styled from those tokens
//  too (no new palette).
// ---------------------------------------------------------------------------

interface VariantStyle {
  /** Container CSS (background, border, radius). */
  container: CSSProperties;
  /** Resolved text/icon color. */
  textColor: string;
  /** The `:focus-visible` ring color. */
  ringColor: string;
}

function resolveVariantStyle(
  variant: ButtonVariant,
  size: NativeSize,
  theme: Theme,
): VariantStyle {
  const c = theme.colors;
  const sizeConfig = SIZE_CONFIG[size];

  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: c.primary, borderRadius: PILL_RADIUS },
        textColor: c.primaryForeground,
        ringColor: c.primary,
      };
    case 'destructive':
      return {
        container: { backgroundColor: c.negative, borderRadius: PILL_RADIUS },
        textColor: c.negativeForeground,
        ringColor: c.negative,
      };
    case 'inverse':
      return {
        container: { backgroundColor: '#FFFFFF', borderRadius: PILL_RADIUS },
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
          borderRadius: PILL_RADIUS,
        },
        textColor: c.text,
        ringColor: c.primary,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent', borderRadius: GHOST_RADIUS },
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
          borderRadius: ICON_RADIUS,
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
        container: { backgroundColor: 'transparent', borderRadius: 0 },
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
  useButtonCss();
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
        ? PRESS_SCALE
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
      style: { ...containerStyle, ...(style as CSSProperties), ...childProps.style },
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
      style={{ ...containerStyle, ...(style as CSSProperties) }}
      onClick={handleClick}
      disabled={disabled && !loading}
      aria-disabled={isInteractionBlocked || undefined}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
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
