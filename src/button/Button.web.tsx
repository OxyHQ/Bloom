import { useSurfaceRefraction } from '../surface/web-refraction';
import { useSurfaceLayer } from '../surface/use-surface-layer';
import { useButtonLayout } from './use-button-layout.web';
import { useLongPress } from './use-long-press.web';
import { resolveSurfaceOptics } from '../surface/shared';
import type { GestureResponderEvent, View } from 'react-native';
import { surfaceMaterialCss } from '../surface/web-material';
import type { LinkButtonProps } from './types';
import React, {
  memo,
  forwardRef,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from 'react';

import { resolveIconSlot } from '../icons/render-icon';
import { useBloomAppearance } from '../appearance/context';
import { useTheme } from '../theme/use-theme';
import { SpinnerIcon } from '../loading/SpinnerIcon.web';
import { flattenWebStyle } from '../styles/flatten-web-style';
import {
  NOT_DISABLED,
  interactiveWebCss,
  useInteractiveWebCss,
} from '../styles/interactive-web-css';
import { BUTTON_RADIUS, BUTTON_SHADOW, BUTTON_TRANSITION_MS, ICON_BUTTON_ICON_SIZE, LINK_BUTTON_GAP, LINK_BUTTON_UNDERLINE_OFFSET, isIconComponent, resolveButtonGeometry, resolveLinkButtonPalette, resolveButtonPalette, resolveButtonUnderline } from './shared';
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
//  Glass paints the backdrop in ::before and its state tint in ::after.
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
export const BLOOM_BUTTON_CSS = `@layer base {\n${interactiveWebCss({
  selector: '.bloom-btn',
  varPrefix: 'bloom-btn',
  base: `
    height: var(--bloom-btn-height);
    width: var(--bloom-btn-width, auto);
    padding-inline: var(--bloom-btn-padding);
    border-radius: var(--bloom-btn-radius);
    font-size: var(--bloom-btn-font-size);
    line-height: var(--bloom-btn-line-height);
    font-weight: var(--bloom-btn-font-weight);
    letter-spacing: var(--bloom-btn-letter-spacing, normal);
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
${surfaceMaterialCss('.bloom-btn--surface', 'var(--bloom-btn-bg)', `background-color ${T} ease`)}
.bloom-btn--surface { background: transparent !important; }
.bloom-btn--surface::before { inset: 0; }
.bloom-btn--surface${NOT_DISABLED}:hover::after { background-color: var(--bloom-btn-bg-hover); }
.bloom-btn--surface${NOT_DISABLED}:active::after { background-color: var(--bloom-btn-bg-active); }
.bloom-btn--surface:disabled:not([aria-busy="true"])::after,
.bloom-btn--surface[aria-disabled="true"]:not([aria-busy="true"])::after { background-color: var(--bloom-btn-bg-disabled); }
.bloom-btn--surface:disabled, .bloom-btn--surface[aria-disabled="true"] { box-shadow: var(--bloom-btn-shadow); }
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
.bloom-btn--surface::after {
  transition: none;
}
}`,
})}\n}`;

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

const ButtonWebComponent = forwardRef<View, ButtonProps>(function ButtonWebComponent({
  onPress,
  onLayout,
  'aria-hidden': ariaHidden,
  accessibilityElementsHidden,
  importantForAccessibility,
  onLongPress,
  onPressIn,
  onPressOut,
  colors,
  material = 'surface',
  children,
  disabled = false,
  pressed: togglePressed,
  stopPropagation = false,
  appearance: appearanceProp,
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
  renderLeadingIcon,
  renderTrailingIcon,
  iconOnly = false,
  linkTone,
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
}, ref) {
  useInteractiveWebCss(STYLE_ID, BLOOM_BUTTON_CSS);
  const childRef = asChild && React.isValidElement(children) ? (children.props as {ref?: React.Ref<HTMLElement>}).ref : undefined;
  const setRoot = useButtonLayout(ref, onLayout, childRef);
  const hidden = ariaHidden ?? (accessibilityElementsHidden || importantForAccessibility === 'no-hide-descendants' ? true : undefined);
  const theme = useTheme();
  const layer = useSurfaceLayer();
  const reactId = useId();
  const resolvedId = id ?? `bloom-btn-${reactId}`;

  const appearance = appearanceProp ?? 'solid';
  useSurfaceRefraction(material === 'surface' && appearance !== 'plain');
  const { size, tone } = useBloomAppearance({ size: sizeProp, tone: toneProp }, { size: 'md', tone: 'accent' });
  const geometry = resolveButtonGeometry(size, textVariant);
  const isSquare = iconOnly || (icon != null && children == null);
  const isIconVariant = isSquare;
  const isLink = appearance === 'plain' && (href != null || linkTone != null);
  const isInteractionBlocked = disabled || loading;
  const longPress = useLongPress(onLongPress, isInteractionBlocked, onPressIn, onPressOut);
  const iconSize = typeof iconSizeProp === 'number' && Number.isFinite(iconSizeProp) && iconSizeProp > 0 ? iconSizeProp : isIconVariant ? ICON_BUTTON_ICON_SIZE[size] : geometry.iconSize;

  const palette = useMemo(
    () => isLink && linkTone != null && toneProp == null ? resolveLinkButtonPalette(theme, linkTone) : resolveButtonPalette(appearance, theme, tone, colors, layer.fill, material),
    [appearance, theme, tone, toneProp, isLink, linkTone, colors, layer.fill, material],
  );
  const underlineMode = resolveButtonUnderline(isLink, underline);

  const containerStyle = useMemo((): CSSProperties => {
    const shadow = palette.shadow ? BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'] : 'none';
    const base: CSSProperties = {
      ['--bloom-btn-height' as string]: `${geometry.height}px`,
      ['--bloom-btn-padding' as string]: `${geometry.paddingHorizontal}px`,
      ['--bloom-btn-radius' as string]: `${BUTTON_RADIUS}px`,
      ['--bloom-btn-font-size' as string]: `${geometry.fontSize}px`,
      ['--bloom-btn-line-height' as string]: `${geometry.lineHeight}px`,
      ['--bloom-btn-font-weight' as string]: geometry.fontWeight,
      ['--bloom-btn-letter-spacing' as string]: geometry.letterSpacing ? `${geometry.letterSpacing}px` : 'normal',
      // CSS custom props consumed by the static stylesheet — see its header.
      ['--bloom-surface-rim' as string]: resolveSurfaceOptics(theme.isDark).rim,
      ['--bloom-surface-sheen' as string]: resolveSurfaceOptics(theme.isDark).sheenCss,
      ['--bloom-btn-gap' as string]: `${geometry.gap}px`,
      ['--bloom-btn-ring' as string]: palette.ring,
      // No press scale — the pressed state is the active paint alone.
      ['--bloom-btn-press-scale' as string]: 1,
      ['--bloom-btn-shadow' as string]: shadow,
      ['--bloom-btn-border-width' as string]: `${palette.borderWidth}px`,
      ['--bloom-btn-fg' as string]: (togglePressed && !loading ? palette.active : palette.rest).foreground,
      ['--bloom-btn-fg-hover' as string]: palette.hover.foreground,
      ['--bloom-btn-fg-active' as string]: palette.active.foreground,
      ['--bloom-btn-fg-disabled' as string]: palette.disabled.foreground,
      ['--bloom-btn-disabled-opacity' as string]: palette.disabledOpacity ?? 1,
      ['--bloom-btn-bg' as string]: (togglePressed && !loading ? palette.active : palette.rest).background,
      ['--bloom-btn-bg-hover' as string]: palette.hover.background,
      ['--bloom-btn-bg-active' as string]: palette.active.background,
      ['--bloom-btn-bg-disabled' as string]: palette.disabled.background,
      ['--bloom-btn-border' as string]: palette.rest.border,
      ['--bloom-btn-border-hover' as string]: palette.hover.border,
      ['--bloom-btn-border-active' as string]: palette.active.border,
      ['--bloom-btn-border-disabled' as string]: palette.disabled.border,
    };
    // Keep the existing inline defaults for callers without utilities. When
    // classes are present, the same defaults come from the base layer.
    if (!className) Object.assign(base, {
      height: geometry.height, paddingLeft: geometry.paddingHorizontal,
      paddingRight: geometry.paddingHorizontal, borderRadius: BUTTON_RADIUS,
      fontSize: geometry.fontSize, lineHeight: `${geometry.lineHeight}px`,
      fontWeight: Number(geometry.fontWeight), letterSpacing: geometry.letterSpacing || undefined,
    });
    if (isSquare) {
      if (!className) Object.assign(base, { width: geometry.height, paddingLeft: 0, paddingRight: 0 });
      (base as Record<string, unknown>)['--bloom-btn-width'] = `${geometry.height}px`;
      (base as Record<string, unknown>)['--bloom-btn-padding'] = '0px';
    }
    if (isLink && !isSquare) {
      // LinkButton: no container at all — the label's own line box,
      // a 4px gap, and a 4px corner that only the focus ring shows.
      if (!className) Object.assign(base, { height: undefined, paddingLeft: 0, paddingRight: 0, borderRadius: 4 });
      (base as Record<string, unknown>)['--bloom-btn-height'] = 'auto';
      (base as Record<string, unknown>)['--bloom-btn-padding'] = '0px';
      (base as Record<string, unknown>)['--bloom-btn-radius'] = '4px';
      (base as Record<string, unknown>)['--bloom-btn-gap'] = `${LINK_BUTTON_GAP}px`;
    }
    return base;
  }, [geometry, palette, theme.isDark, isSquare, isIconVariant, isLink, togglePressed, loading, className]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (longPress.suppressClick(event)) return;
      if (stopPropagation) event.stopPropagation();
      if (isInteractionBlocked) {
        event.preventDefault();
        return;
      }
      onPress?.(event as unknown as GestureResponderEvent);
    },
    [isInteractionBlocked, onPress, stopPropagation, longPress.suppressClick],
  );

  const ariaLabel = accessibilityLabel;
  const composedClassName = ['bloom-btn']
    .concat(isLink ? ['bloom-btn--link'] : [])
    .concat(underlineMode === 'none' ? [] : [`bloom-btn--underline-${underlineMode}`])
    .concat(palette.rest.surface ? ['bloom-btn--surface'] : [])
    .concat(className ? [className] : [])
    .join(' ');

  const spinnerColor =
    loadingColor ?? 'currentColor';

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

  // A caller-drawn glyph is handed `currentColor` rather than the resolved
  // foreground, for the same reason the icon components above are: on web the
  // state colours come from the stylesheet, so a glyph that inherits them needs
  // no re-render when hover or press changes them. Native has no cascade and
  // passes the resolved value.
  const renderSlot = (render: typeof renderLeadingIcon, fallback: () => React.ReactNode) => (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', flexShrink: 0, width: iconSize, height: iconSize }}
    >
      {resolveIconSlot(render, iconSize, 'currentColor', fallback)}
    </span>
  );

  const labelPadding = isLink ? 0 : geometry.labelPaddingHorizontal;
  const hasLabel = !isSquare && children != null && children !== false;
  const content = (
    <>
      {renderLeadingIcon
        ? renderSlot(renderLeadingIcon, () => null)
        : LeadingIcon
          ? renderIcon(LeadingIcon)
          : null}
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
      {isSquare && !renderLeadingIcon && !LeadingIcon && !iconNode && children != null
        ? children
        : null}
      {trailing}
      {!isSquare && renderTrailingIcon
        ? renderSlot(renderTrailingIcon, () => null)
        : !isSquare && TrailingIcon
          ? renderIcon(TrailingIcon)
          : null}
    </>
  );

  // A stable, layout-transparent parent preserves child state across loading.
  // visibility hides its descendants without removing their measured geometry.
  const body = (
    <>
      <span
        aria-hidden={loading || undefined}
        style={{ display: 'contents', visibility: loading ? 'hidden' : undefined }}
      >
        {content}
      </span>
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}
        >
          <SpinnerIcon size={iconSize} color={spinnerColor} />
        </span>
      ) : null}
    </>
  );

  // asChild: render the provided child element (e.g. <a> / router <Link>) with
  // the button styling and handlers merged in. Used for link-buttons.
  if (asChild && React.isValidElement(children)) {
    const child = children as ReactElement<{
      ref?: React.Ref<HTMLElement>;
      'aria-hidden'?: boolean;
      className?: string;
      style?: CSSProperties;
      onClick?: (event: MouseEvent<HTMLElement>) => void;
      onPointerDown?: React.PointerEventHandler<HTMLElement>;
      onPointerLeave?: React.PointerEventHandler<HTMLElement>;
      onBlur?: React.FocusEventHandler<HTMLElement>;
      onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
      onKeyUp?: React.KeyboardEventHandler<HTMLElement>;
      onContextMenu?: React.MouseEventHandler<HTMLElement>;
      'aria-disabled'?: boolean;
      'aria-busy'?: boolean;
      'aria-pressed'?: boolean;
      'aria-label'?: string;
      title?: string;
      id?: string;
      tabIndex?: number;
    }>;
    const childProps = child.props;
    return React.cloneElement(child, {
      ref: setRoot,
      'aria-hidden': hidden,
      className: [composedClassName, childProps.className].filter(Boolean).join(' '),
      style: { ...containerStyle, ...resolvedStyle, ...childProps.style },
      onPointerDown: event => { childProps.onPointerDown?.(event); longPress.onPointerDown(event); },
      onPointerLeave: event => { childProps.onPointerLeave?.(event); longPress.onPointerLeave(); },
      onBlur: event => { childProps.onBlur?.(event); longPress.onBlur(); },
      onKeyDown: event => { childProps.onKeyDown?.(event); longPress.onKeyDown(event); },
      onKeyUp: event => { childProps.onKeyUp?.(event); longPress.onKeyUp(event); },
      onContextMenu: event => { childProps.onContextMenu?.(event); longPress.onContextMenu(event); },
      onClick: (event: MouseEvent<HTMLElement>) => {
        if (longPress.suppressClick(event)) return;
      if (stopPropagation) event.stopPropagation();
        if (isInteractionBlocked) {
          event.preventDefault();
          return;
        }
        childProps.onClick?.(event);
        onPress?.(event as unknown as GestureResponderEvent);
      },
      'aria-disabled': isInteractionBlocked || undefined,
      'aria-busy': loading || undefined,
      'aria-pressed': togglePressed,
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
        ref={setRoot}
        aria-hidden={hidden}
        id={resolvedId}
        href={isInteractionBlocked ? undefined : href}
        target={target}
        rel={rel}
        className={composedClassName}
        style={{ ...containerStyle, ...resolvedStyle }}
        onPointerDown={longPress.onPointerDown}
        onPointerLeave={longPress.onPointerLeave}
        onBlur={longPress.onBlur}
        onKeyDown={longPress.onKeyDown}
        onKeyUp={longPress.onKeyUp}
        onContextMenu={longPress.onContextMenu}
        onClick={handleClick}
        aria-disabled={isInteractionBlocked || undefined}
        aria-busy={loading || undefined}
        aria-pressed={togglePressed}
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
      ref={setRoot}
      aria-hidden={hidden}
      id={resolvedId}
      type={type}
      name={name}
      value={value}
      className={composedClassName}
      style={{ ...containerStyle, ...resolvedStyle }}
      onPointerDown={longPress.onPointerDown}
      onPointerLeave={longPress.onPointerLeave}
      onBlur={longPress.onBlur}
      onKeyDown={longPress.onKeyDown}
      onKeyUp={longPress.onKeyUp}
      onContextMenu={longPress.onContextMenu}
      onClick={handleClick}
      role={accessibilityRole}
      disabled={disabled && !loading}
      aria-disabled={isInteractionBlocked || undefined}
      aria-busy={loading || undefined}
      aria-pressed={togglePressed}
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
});

export const Button = memo(ButtonWebComponent);
Button.displayName = 'Button';

export const PrimaryButton = memo((props: ButtonProps) => (
  <Button appearance="solid" tone="accent" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = memo((props: ButtonProps) => (
  <Button appearance="outline" tone="neutral" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const IconButton = memo((props: ButtonProps) => (
  <Button appearance="outline" tone="neutral" {...props} iconOnly />
));
IconButton.displayName = 'IconButton';

export const GhostButton = memo((props: ButtonProps) => (
  <Button appearance="subtle" tone="accent" {...props} />
));
GhostButton.displayName = 'GhostButton';

export const InverseButton = memo((props: ButtonProps) => {
  const theme = useTheme();
  return <Button appearance="solid" tone="neutral" colors={props.appearance == null && props.tone == null ? { background: theme.colors.text, foreground: theme.colors.background } : undefined} {...props} />;
});
InverseButton.displayName = 'InverseButton';

export const TextButton = memo((props: ButtonProps) => (
  <Button appearance="plain" tone="accent" {...props} />
));
TextButton.displayName = 'TextButton';

export const OutlineButton = memo((props: ButtonProps) => (
  <Button appearance="outline" tone="neutral" {...props} />
));
OutlineButton.displayName = 'OutlineButton';

/**
 * `LinkButton`: an inline text action — no fill, no border, the label
 * (plus icons) underlined on hover. `linkTone` is its colour; pass `href` for an
 * anchor.
 */
export const LinkButton = memo(({ linkTone = 'primary', ...props }: LinkButtonProps) => (
  <Button appearance="plain" {...props} linkTone={linkTone} />
));
LinkButton.displayName = 'LinkButton';

export const DestructiveButton = memo((props: ButtonProps) => (
  <Button appearance="solid" tone="danger" {...props} />
));
DestructiveButton.displayName = 'DestructiveButton';
