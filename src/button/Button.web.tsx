import type { LinkButtonProps } from './types';
import React, {
  memo,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from 'react';

import { useBloomAppearance } from '../appearance/context';
import { useTheme } from '../theme/use-theme';
import { SpinnerIcon } from '../loading/SpinnerIcon.web';
import { flattenWebStyle } from '../styles/flatten-web-style';
import {
  NOT_DISABLED,
  interactiveWebCss,
  useInteractiveWebCss,
} from '../styles/interactive-web-css';
import {
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  BUTTON_TRANSITION_MS,
  ICON_BUTTON_ICON_SIZE,
  LINK_BUTTON_GAP,
  LINK_BUTTON_UNDERLINE_OFFSET,
  isIconComponent,
  paintToCssImage,
  resolveButtonGeometry,
  resolveButtonRecipe,
  BUTTON_SIZE_ALIAS,
  resolveButtonPalette,
  resolveButtonUnderline,
  type ButtonResolvedSize,
} from './shared';
import type { ButtonIconComponent, ButtonProps } from './types';

export type {
  ButtonProps, LinkButtonProps,
  ButtonSize,
  ButtonIconComponent,
} from './types';

// ---------------------------------------------------------------------------
//  Per-state CSS injection — button-press colour transitions for the
//  primary/danger fills, expressed against per-instance custom properties.
//  A 0.98 press scale is deliberately not used: a press is the active paint
//  alone.
//
//  EVERY colour a state rule changes arrives as a `--bloom-btn-*` property and
//  is declared only in the sheet. An inline `background-color` would outrank the
//  `:hover` rule and silence it (`interactive-web-css.test.tsx` gates that).
//
//  The gradient variants cross-fade their hover gradient in through `::before`,
//  since `background-image` does not transition; the solid variants transition
//  `background-color` directly.
//
//  `aria-busy` is excluded from the disabled paint: a loading button keeps its
//  rest colours under the spinner instead of greying out.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-button-web-css';

const T = `${BUTTON_TRANSITION_MS}ms`;
const DISABLED = '.bloom-btn:disabled:not([aria-busy="true"]),\n.bloom-btn[aria-disabled="true"]:not([aria-busy="true"])';

/**
 * The adopted stylesheet. Exported so a suite can assert the RULES: jsdom
 * applies none of them, so a modifier class alone proves nothing about whether
 * an underline is drawn.
 */
export const BLOOM_BUTTON_CSS = interactiveWebCss({
  selector: '.bloom-btn',
  varPrefix: 'bloom-btn',
  base: `
    flex-direction: row;
    gap: var(--bloom-btn-gap, 2px);
    position: relative;
    isolation: isolate;
    overflow: hidden;
    white-space: nowrap;
    border-style: solid;
    border-width: var(--bloom-btn-border-width, 0px);
    border-color: var(--bloom-btn-border, transparent);
    background-color: var(--bloom-btn-bg, transparent);
    background-image: var(--bloom-btn-bg-image, none);
    box-shadow: var(--bloom-btn-shadow, none);
    color: var(--bloom-btn-fg, inherit);
    font-family: var(--bloom-font-sans, inherit);
    text-decoration: none;
  `,
  transition: `background-color ${T} ease, border-color ${T} ease, box-shadow ${T} ease, color ${T} ease`,
  hover: {
    declarations: `
      background-color: var(--bloom-btn-bg-hover);
      border-color: var(--bloom-btn-border-hover);
      color: var(--bloom-btn-fg-hover, var(--bloom-btn-fg));
    `,
  },
  pressDeclarations: `
    background-color: var(--bloom-btn-bg-active);
    border-color: var(--bloom-btn-border-active);
    color: var(--bloom-btn-fg-active, var(--bloom-btn-fg));
  `,
  outlineOffset: 2,
  extraRules: `${DISABLED} {
  opacity: var(--bloom-btn-disabled-opacity, 1);
  cursor: not-allowed;
  background-color: var(--bloom-btn-bg-disabled);
  background-image: var(--bloom-btn-bg-image-disabled, none);
  border-color: var(--bloom-btn-border-disabled);
  color: var(--bloom-btn-fg-disabled);
  box-shadow: none;
  transform: none;
}
.bloom-btn[aria-busy="true"] {
  opacity: 1;
  cursor: progress;
}
.bloom-btn--gradient::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background-image: var(--bloom-btn-bg-image-hover);
  opacity: 0;
  transition: opacity ${T} ease;
}
.bloom-btn--gradient${NOT_DISABLED}:hover::before {
  opacity: 1;
}
.bloom-btn--gradient${NOT_DISABLED}:active {
  background-image: var(--bloom-btn-bg-image-active);
}
.bloom-btn--gradient${NOT_DISABLED}:active::before {
  opacity: 0;
}
.bloom-btn--gradient:disabled::before,
.bloom-btn--gradient[aria-disabled="true"]::before {
  display: none;
}
.bloom-btn--underline-rest,
.bloom-btn--underline-hover {
  text-underline-offset: ${LINK_BUTTON_UNDERLINE_OFFSET}px;
}
.bloom-btn--underline-rest {
  text-decoration: underline;
}
.bloom-btn--underline-hover${NOT_DISABLED}:hover {
  text-decoration: underline;
}
@media (prefers-reduced-motion: reduce) {
.bloom-btn,
.bloom-btn--gradient::before {
  transition: none;
}
}`,
});

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

const ButtonWebComponent: React.FC<ButtonProps> = ({
  onPress,
  children,
  disabled = false,
  appearance: appearanceProp,
  variant: variantProp,
  tone: toneProp,
  size: sizeProp,
  style,
  textStyle,
  icon,
  iconSize: iconSizeProp,
  leading,
  trailing,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  iconOnly = false,
  linkTone = 'primary',
  underline,
  textVariant,
  numberOfLines,
  href,
  target,
  rel,
  loading = false,
  loadingColor,
  accessibilityLabel,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
  accessibilityHint,
  accessibilityRole,
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
}) => {
  useInteractiveWebCss(STYLE_ID, BLOOM_BUTTON_CSS);
  const theme = useTheme();
  const reactId = useId();
  const resolvedId = id ?? `bloom-btn-${reactId}`;

  const recipe = resolveButtonRecipe(variantProp);
  const appearance = appearanceProp ?? recipe.appearance;
  const { size, tone } = useBloomAppearance({ size: sizeProp ? BUTTON_SIZE_ALIAS[sizeProp] : undefined, tone: toneProp ?? (variantProp ? recipe.tone : undefined) }, { size: 'md', tone: 'accent' });
  const geometry = resolveButtonGeometry(size, textVariant);
  const isSquare = iconOnly || variantProp === 'icon' || sizeProp === 'icon' || (icon != null && children == null);
  const isIconVariant = isSquare;
  const isLink = appearance === 'plain' && (href != null || variantProp === 'link');
  const isInteractionBlocked = disabled || loading;
  const iconSize = typeof iconSizeProp === 'number' && Number.isFinite(iconSizeProp) && iconSizeProp > 0 ? iconSizeProp : isIconVariant ? ICON_BUTTON_ICON_SIZE[size] : geometry.iconSize;

  const palette = useMemo(
    () => variantProp === 'link' && appearanceProp == null && toneProp == null ? resolveButtonPalette('link', theme, linkTone) : variantProp === 'inverse' && appearanceProp == null && toneProp == null ? resolveButtonPalette('inverse', theme) : resolveButtonPalette(appearance, theme, tone),
    [appearance, theme, tone, variantProp, appearanceProp, toneProp, linkTone],
  );
  const isGradient = palette.rest.gradient !== null;
  const underlineMode = resolveButtonUnderline(isLink ? 'link' : 'primary', underline);

  const containerStyle = useMemo((): CSSProperties => {
    const shadow = palette.shadow ? BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'] : 'none';
    const base: CSSProperties = {
      height: geometry.height,
      paddingLeft: geometry.paddingHorizontal,
      paddingRight: geometry.paddingHorizontal,
      borderRadius: BUTTON_RADIUS,
      fontSize: geometry.fontSize,
      lineHeight: `${geometry.lineHeight}px`,
      fontWeight: Number(geometry.fontWeight),
      letterSpacing: geometry.letterSpacing || undefined,
      // CSS custom props consumed by the static stylesheet — see its header.
      ['--bloom-btn-gap' as string]: `${geometry.gap}px`,
      ['--bloom-btn-ring' as string]: palette.ring,
      // No press scale — the pressed state is the active paint alone.
      ['--bloom-btn-press-scale' as string]: 1,
      ['--bloom-btn-shadow' as string]: shadow,
      ['--bloom-btn-border-width' as string]: `${palette.borderWidth}px`,
      ['--bloom-btn-fg' as string]: palette.rest.foreground,
      ['--bloom-btn-fg-hover' as string]: palette.hover.foreground,
      ['--bloom-btn-fg-active' as string]: palette.active.foreground,
      ['--bloom-btn-fg-disabled' as string]: palette.disabled.foreground,
      ['--bloom-btn-disabled-opacity' as string]: palette.disabledOpacity ?? 1,
      ['--bloom-btn-bg' as string]: palette.rest.background,
      ['--bloom-btn-bg-hover' as string]: isGradient
        ? palette.rest.background
        : palette.hover.background,
      ['--bloom-btn-bg-active' as string]: isGradient
        ? palette.rest.background
        : palette.active.background,
      ['--bloom-btn-bg-disabled' as string]: palette.disabled.background,
      ['--bloom-btn-border' as string]: palette.rest.border,
      ['--bloom-btn-border-hover' as string]: palette.hover.border,
      ['--bloom-btn-border-active' as string]: palette.active.border,
      ['--bloom-btn-border-disabled' as string]: palette.disabled.border,
    };
    if (isGradient) {
      Object.assign(base, {
        '--bloom-btn-bg-image': paintToCssImage(palette.rest),
        '--bloom-btn-bg-image-hover': paintToCssImage(palette.hover),
        '--bloom-btn-bg-image-active': paintToCssImage(palette.active),
        '--bloom-btn-bg-image-disabled': paintToCssImage(palette.disabled),
      });
    }
    if (isSquare) {
      base.width = geometry.height;
      base.paddingLeft = 0;
      base.paddingRight = 0;
    }
    if (isLink && !isSquare) {
      // LinkButton: no container at all — the label's own line box,
      // a 4px gap, and a 4px corner that only the focus ring shows.
      base.height = undefined;
      base.paddingLeft = 0;
      base.paddingRight = 0;
      base.borderRadius = 4;
      (base as Record<string, unknown>)['--bloom-btn-gap'] = `${LINK_BUTTON_GAP}px`;
    }
    return base;
  }, [geometry, palette, theme.isDark, isSquare, isIconVariant, isLink, isGradient]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (isInteractionBlocked) {
        event.preventDefault();
        return;
      }
      onPress?.();
    },
    [isInteractionBlocked, onPress],
  );

  const ariaLabel = accessibilityLabel;
  const composedClassName = ['bloom-btn']
    .concat(isLink ? ['bloom-btn--link'] : [])
    .concat(underlineMode === 'none' ? [] : [`bloom-btn--underline-${underlineMode}`])
    .concat(isGradient ? ['bloom-btn--gradient'] : [])
    .concat(className ? [className] : [])
    .join(' ');

  const spinnerColor =
    loadingColor ?? (disabled ? palette.disabled.foreground : palette.rest.foreground);

  // Normalize the caller's `style` (single object, StyleProp array, or falsy)
  // into ONE flat plain object here, once, so neither raw-DOM merge site below
  // spreads a StyleProp array (which would leak numeric keys onto the button's
  // CSSStyleDeclaration). See `flattenWebStyle` for the full rationale.
  const resolvedStyle = flattenWebStyle(style);
  const resolvedTextStyle = flattenWebStyle(textStyle);

  // Icon components are sized by the button and painted `currentColor`, so they
  // follow the state colours the stylesheet sets without a re-render.
  const renderIcon = (Icon: ButtonIconComponent) => (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        width: iconSize,
        height: iconSize,
      }}
    >
      <Icon width={iconSize} height={iconSize} fill="currentColor" />
    </span>
  );
  const iconNode =
    icon == null ? null : isIconComponent(icon) ? renderIcon(icon) : (icon as React.ReactNode);

  const labelPadding = isLink ? 0 : geometry.labelPaddingHorizontal;
  const hasLabel = !isSquare && children != null && children !== false;
  const content = (
    <>
      {LeadingIcon ? renderIcon(LeadingIcon) : null}
      {leading}
      {iconNode}
      {hasLabel &&
        (typeof children === 'string' || typeof children === 'number' ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              paddingLeft: labelPadding,
              paddingRight: labelPadding,
              // `.bloom-btn` already clips; this is what makes the clip READ as
              // a truncation. Only one line is expressible here.
              ...(numberOfLines === 1
                ? { display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }
                : null),
              ...resolvedTextStyle,
            }}
          >
            {children}
          </span>
        ) : (
          children
        ))}
      {isSquare && !LeadingIcon && !iconNode && children != null ? children : null}
      {trailing}
      {!isSquare && TrailingIcon ? renderIcon(TrailingIcon) : null}
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
          gap: geometry.gap,
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
        <SpinnerIcon size={iconSize} color={spinnerColor} />
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

  // `href` renders a real anchor, for a button link or an anchor `LinkButton`.
  // A disabled link drops its `href`, so it is not a navigable link at all.
  if (href != null && !asChild) {
    return (
      <a
        id={resolvedId}
        href={isInteractionBlocked ? undefined : href}
        target={target}
        rel={rel}
        className={composedClassName}
        style={{ ...containerStyle, ...resolvedStyle }}
        onClick={handleClick}
        aria-disabled={isInteractionBlocked || undefined}
        aria-busy={loading || undefined}
        aria-label={ariaLabel}
        title={title ?? accessibilityHint}
        tabIndex={tabIndex}
        data-testid={testID}
      >
        {body}
      </a>
    );
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
      role={accessibilityRole}
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

/**
 * `LinkButton`: an inline text action — no fill, no border, the label
 * (plus icons) underlined on hover. `variant` is its colour; pass `href` for an
 * anchor.
 */
export const LinkButton = memo(({ variant = 'primary', ...props }: LinkButtonProps) => (
  <Button {...props} variant="link" linkTone={variant} />
));
LinkButton.displayName = 'LinkButton';

export const DestructiveButton = memo((props: Omit<ButtonProps, 'variant'>) => (
  <Button {...props} variant="destructive" />
));
DestructiveButton.displayName = 'DestructiveButton';
