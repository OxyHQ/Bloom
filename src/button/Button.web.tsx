import { GlyphAttention } from './GlyphAttention';
import { resolveButtonOverrides } from './shared';
import { Group } from './Group.web';
import { useGroupedButton } from './use-grouped-button';
import { resolvePaintMode } from '../theme/paint';
import { useThemeRecipe } from '../theme/use-theme-paint';
import { useSurfaceFillRecipe, useSurfaceLevelValue } from '../styles/surface-levels';
import { resolveSurfaceLayer } from '../surface/use-surface-layer';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import { useButtonLayout } from './use-button-layout.web';
import { useLongPress } from './use-long-press.web';
import { resolveSurfaceOptics, surfaceContrastEdge, surfaceOpticsVars } from '../surface/shared';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import type { GestureResponderEvent, View } from 'react-native';
import { SURFACE_HAIRLINE_VAR, surfaceMaterialCss } from '../surface/web-material';
import React, {
  type ComponentRef,
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
import { useBloomAppearance, useBloomControlDensity } from '../appearance/context';
import { useTouchInput } from '../styles/pointer';
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
  BUTTON_TOUCH_TARGET,
  buttonTouchVisualInset,
  BUTTON_SHADOW,
  BUTTON_TRANSITION_MS,
  ICON_BUTTON_ICON_SIZE,
  LINK_BUTTON_GAP,
  LINK_BUTTON_UNDERLINE_OFFSET,
  isIconComponent,
  resolveButtonGeometry,
  resolveLinkButtonPalette,
  resolveButtonPalette,
  resolveButtonUnderline,
} from './shared';
import type { ButtonIconComponent, ButtonProps } from './types';

/** Preserve larger caller minima while preventing a touch target from shrinking.
 * CSS intrinsic/reset keywords have no numeric floor; the control still gets 44.
 */
function touchMinimum(value: CSSProperties['minWidth']): CSSProperties['minWidth'] {
  if (typeof value === 'number') return Math.max(BUTTON_TOUCH_TARGET, value);
  if (typeof value === 'string' && /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) {
    return Math.max(BUTTON_TOUCH_TARGET, Number(value));
  }
  if (
    typeof value === 'string' &&
    /^(?:-?[\d.]|calc\(|var\(|min\(|max\(|clamp\()/.test(value.trim())
  ) {
    return `max(${BUTTON_TOUCH_TARGET}px, ${value})`;
  }
  return BUTTON_TOUCH_TARGET;
}

function touchTargetStyle(style: CSSProperties, touch: boolean): CSSProperties {
  return touch
    ? {
        ...style,
        minWidth: touchMinimum(style.minWidth),
        minHeight: touchMinimum(style.minHeight),
      }
    : style;
}

export type {
  ButtonProps,
  ButtonSize,
  ButtonFocusEvent,
  ButtonHoverEvent,
  ButtonIconComponent,
} from './types';
import type { MemoRefComponent } from '../styles/native-refs';

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
//  The material paints the backdrop in ::before and its state tint in ::after.
//
//  `aria-busy` is excluded from the disabled paint: a loading button keeps its
//  rest colours under the spinner instead of greying out.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-button-web-css';

const T = `${BUTTON_TRANSITION_MS}ms`;
const DISABLED =
  '.bloom-btn:disabled:not([aria-busy="true"]),\n.bloom-btn[aria-disabled="true"]:not([aria-busy="true"])';

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
    overflow: clip;
    overflow-clip-margin: 1px;
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
/* The interactive box keeps its 44px floor. Its existing paint layers stay
   at the requested visual size; no hit region extends over another control. */
.bloom-btn[data-bloom-button-touch-paint],
.bloom-btn[data-bloom-button-touch-paint]${NOT_DISABLED}:hover,
.bloom-btn[data-bloom-button-touch-paint]${NOT_DISABLED}:active,
.bloom-btn[data-bloom-button-touch-paint]:disabled,
.bloom-btn[data-bloom-button-touch-paint][aria-disabled="true"] {
  background-color: transparent;
  background-image: none;
  border-color: transparent;
  box-shadow: none;
}
.bloom-btn[data-bloom-button-touch-paint]::before,
.bloom-btn[data-bloom-button-touch-paint]::after {
  /* Inheritance uses the computed height before the host's min-height floor.
     An authored h-11 therefore paints 44, while canonical md paints 36. */
  height: inherit;
  width: inherit;
  inset-block: 0;
  inset-inline-start: 50%;
  inset-inline-end: -50%;
  margin-block: auto;
  margin-inline: 0;
  translate: -50% 0;
}
/* Center against the padding box even when an authored border makes the
   inherited paint wider than that box. Auto widths still fill the box. */
.bloom-btn[data-bloom-button-touch-paint]:dir(rtl)::before,
.bloom-btn[data-bloom-button-touch-paint]:dir(rtl)::after { translate: 50% 0; }
.bloom-btn[data-bloom-button-touch-paint]::before {
  content: "";
  position: absolute;
  z-index: -2;
  border-radius: inherit;
  pointer-events: none;
  box-sizing: border-box;
  border: var(--bloom-btn-border-width, 0px) solid var(--bloom-btn-border, transparent);
  box-shadow: var(--bloom-btn-shadow, none);
}
.bloom-btn[data-bloom-button-touch-paint]:not(.bloom-btn--surface)::before {
  background-color: var(--bloom-btn-bg, transparent);
  transition: background-color ${T} ease, border-color ${T} ease;
}
.bloom-btn[data-bloom-button-touch-paint]${NOT_DISABLED}:hover::before {
  border-color: var(--bloom-btn-border-hover);
}
.bloom-btn[data-bloom-button-touch-paint]${NOT_DISABLED}:active::before {
  border-color: var(--bloom-btn-border-active);
}
.bloom-btn[data-bloom-button-touch-paint]:not(.bloom-btn--surface)${NOT_DISABLED}:hover::before {
  background-color: var(--bloom-btn-bg-hover);
}
.bloom-btn[data-bloom-button-touch-paint]:not(.bloom-btn--surface)${NOT_DISABLED}:active::before {
  background-color: var(--bloom-btn-bg-active);
}
.bloom-btn[data-bloom-button-touch-paint]:disabled:not([aria-busy="true"])::before,
.bloom-btn[data-bloom-button-touch-paint][aria-disabled="true"]:not([aria-busy="true"])::before {
  border-color: var(--bloom-btn-border-disabled);
  box-shadow: none;
}
.bloom-btn[data-bloom-button-touch-paint]:not(.bloom-btn--surface):disabled:not([aria-busy="true"])::before,
.bloom-btn[data-bloom-button-touch-paint]:not(.bloom-btn--surface)[aria-disabled="true"]:not([aria-busy="true"])::before {
  background-color: var(--bloom-btn-bg-disabled);
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
.bloom-btn--surface::after {
  transition: none;
}
}`,
})}\n}`;

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

const ButtonWebComponent = forwardRef<ComponentRef<typeof View>, ButtonProps>(
  function ButtonWebComponent(props, ref) {
    const {
      onPress,
      onClick,
      onFocus,
      onBlur,
      onHoverIn,
      onHoverOut,
      onKeyDown,
      onKeyUp,
      onLayout,
      'aria-hidden': ariaHidden,
      accessibilityElementsHidden,
      importantForAccessibility,
      onLongPress,
      onPressIn,
      onPressOut,
      colors: colorsProp,
      inverted = false,
      color,
      hoverColor,
      activeColor,
      activeHoverColor,
      fill,
      hoverFill,
      ring,
      disabledOpacity,
      grow = false,
      paddingHorizontal,
      attention,
      decoration,
      loadingIndicator,
      material = 'surface',
      children: childrenProp,
      disabled = false,
      pressed: togglePressed,
      stopPropagation = false,
      appearance: appearanceProp,
      tone: toneProp,
      size: sizeProp,
      density: densityProp,
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
      wide = false,
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
      'aria-label': ariaLabelProp,
      'aria-current': ariaCurrent,
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
    } = useGroupedButton(props);
    const children =
      typeof childrenProp === 'function' ? childrenProp('currentColor') : childrenProp;
    useInteractiveWebCss(STYLE_ID, BLOOM_BUTTON_CSS);
    const childRef =
      asChild && React.isValidElement(children)
        ? (children.props as { ref?: React.Ref<HTMLElement> }).ref
        : undefined;
    const setRoot = useButtonLayout(ref, onLayout, childRef);
    const hidden =
      ariaHidden ??
      (accessibilityElementsHidden || importantForAccessibility === 'no-hide-descendants'
        ? true
        : undefined);
    const theme = useTheme();
    const colors =
      colorsProp ??
      (inverted
        ? { background: theme.colors.text, foreground: theme.colors.background }
        : undefined);
    const parentRecipe = useSurfaceFillRecipe();
    const parentLevel = useSurfaceLevelValue();
    const reactId = useId();
    const resolvedId = id ?? `bloom-btn-${reactId}`;

    const appearance = appearanceProp ?? 'solid';
    const { size, tone } = useBloomAppearance(
      { size: typeof sizeProp === 'number' ? undefined : sizeProp, tone: toneProp },
      { size: 'md', tone: 'accent' },
    );
    const density = useBloomControlDensity(densityProp);
    const touch = useTouchInput();
    const geometry = resolveButtonGeometry(
      typeof sizeProp === 'number' ? sizeProp : size,
      textVariant,
      density,
      touch,
    );
    const childStyle =
      asChild && React.isValidElement<{ style?: CSSProperties }>(children)
        ? children.props.style
        : undefined;
    const authoredStyle = { ...flattenWebStyle(style), ...childStyle };
    const authoredFlatPaint =
      material === 'flat' &&
      Boolean(className || authoredStyle.backgroundColor || authoredStyle.backgroundImage);
    const paintHeight =
      typeof authoredStyle.height === 'number' ? authoredStyle.height : geometry.height;
    const touchPaint = !authoredFlatPaint && buttonTouchVisualInset(paintHeight, touch) > 0;
    const visualData = {
      'data-bloom-button-visual-height': paintHeight,
      'data-bloom-button-touch-paint': touchPaint ? '' : undefined,
    };
    const isSquare = !grow && (iconOnly || (icon != null && childrenProp == null));
    const isIconVariant = isSquare;
    const isLink = appearance === 'plain' && (href != null || linkTone != null);
    const isInteractionBlocked = disabled || loading;
    const longPress = useLongPress(onLongPress, isInteractionBlocked, onPressIn, onPressOut);
    const handleBlur: React.FocusEventHandler<HTMLElement> = (event) => {
      onBlur?.(event);
      longPress.onBlur();
    };
    const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
      onKeyDown?.(event);
      longPress.onKeyDown(event);
    };
    const handleKeyUp: React.KeyboardEventHandler<HTMLElement> = (event) => {
      onKeyUp?.(event);
      // Cleanup remains unconditional even when a caller cancels default behavior.
      longPress.onKeyUp(event);
    };
    const handlePointerEnter: React.PointerEventHandler<HTMLElement> = (event) => {
      if (!isInteractionBlocked && event.pointerType !== 'touch') onHoverIn?.(event);
    };
    const handlePointerLeave: React.PointerEventHandler<HTMLElement> = (event) => {
      if (event.pointerType !== 'touch') onHoverOut?.(event);
      longPress.onPointerLeave();
    };
    const iconSize =
      typeof iconSizeProp === 'number' && Number.isFinite(iconSizeProp) && iconSizeProp > 0
        ? iconSizeProp
        : isIconVariant
          ? density === 'compact' || typeof sizeProp === 'number'
            ? geometry.iconSize
            : ICON_BUTTON_ICON_SIZE[size]
          : geometry.iconSize;

    const paintRecipe = useThemeRecipe(
      (modeTheme, documentMode, documentPreset) => {
        const layer = resolveSurfaceLayer(
          modeTheme,
          resolvePaintMode(parentRecipe, documentMode, documentPreset),
          parentLevel,
        );
        const basePalette =
          isLink && linkTone != null && toneProp == null
            ? resolveLinkButtonPalette(modeTheme, linkTone)
            : resolveButtonPalette(appearance, modeTheme, tone, colors, layer.fill, material);
        const palette = resolveButtonOverrides(basePalette, {
          color,
          hoverColor,
          activeColor,
          activeHoverColor,
          fill,
          hoverFill,
          ring,
          disabledOpacity,
        });
        return {
          palette,
          backing: layer.fill,
          optics: resolveSurfaceOptics(modeTheme.isDark),
          shadow: palette.shadow ? BUTTON_SHADOW[modeTheme.isDark ? 'dark' : 'light'] : 'none',
        };
      },
      [
        isLink,
        parentRecipe,
        toneProp,
        parentLevel,
        colors,
        tone,
        material,
        linkTone,
        appearance,
        color,
        hoverColor,
        activeColor,
        activeHoverColor,
        fill,
        hoverFill,
        ring,
        disabledOpacity,
      ],
    );
    const palette = paintRecipe.paint.palette;
    const withPaint = (node: ReactElement) => (
      <>
        {paintRecipe.sheet}
        <ServerStyleSheet id={STYLE_ID} css={BLOOM_BUTTON_CSS} />
        {node}
      </>
    );
    const underlineMode = resolveButtonUnderline(isLink, underline);

    const containerStyle = useMemo((): CSSProperties => {
      const shadow = paintRecipe.paint.shadow;
      // The material's body is painted from `--bloom-btn-bg` (`::before`), never
      // from the host's background, so the disabled paint has to arrive through
      // it — as native's `paint` does. The disabled rule's own `background-color`
      // lands on a host the material keeps transparent. Loading keeps its rest
      // paint under the spinner (`aria-busy` is excluded from that rule too).
      const bodyPaint =
        disabled && !loading
          ? palette.disabled
          : togglePressed && !loading
            ? palette.selected
            : palette.rest;
      const solidFill = resolveSurfaceMaterial({
        fill: bodyPaint.background,
        parentFill: paintRecipe.paint.backing,
      }).solidFill;
      const base: CSSProperties = {
        ['--bloom-btn-height' as string]: `${geometry.height}px`,
        ['--bloom-btn-visual-height' as string]: `${paintHeight}px`,

        ['--bloom-btn-padding' as string]: `${paddingHorizontal ?? geometry.paddingHorizontal}px`,
        ...(grow ? { minWidth: geometry.height } : {}),
        ['--bloom-btn-radius' as string]: `${BUTTON_RADIUS}px`,
        ['--bloom-btn-font-size' as string]: `${geometry.fontSize}px`,
        ['--bloom-btn-line-height' as string]: `${geometry.lineHeight}px`,
        ['--bloom-btn-font-weight' as string]: geometry.fontWeight,
        ['--bloom-btn-letter-spacing' as string]: geometry.letterSpacing
          ? `${geometry.letterSpacing}px`
          : 'normal',
        // CSS custom props consumed by the static stylesheet — see its header.
        ...surfaceOpticsVars(
          paintRecipe.paint.optics,
          isLink ? 4 : Math.min(BUTTON_RADIUS, geometry.height / 2),
        ),
        ['--bloom-btn-gap' as string]: `${geometry.gap}px`,
        ['--bloom-btn-ring' as string]: palette.ring,
        // No press scale — the pressed state is the active paint alone.
        ['--bloom-btn-press-scale' as string]: 1,
        ['--bloom-btn-shadow' as string]: shadow,
        ['--bloom-btn-border-width' as string]: `${palette.borderWidth}px`,
        ['--bloom-btn-fg' as string]: (togglePressed && !loading ? palette.selected : palette.rest)
          .foreground,
        ['--bloom-btn-fg-hover' as string]: (togglePressed ? palette.selectedHover : palette.hover)
          .foreground,
        ['--bloom-btn-fg-active' as string]: (togglePressed
          ? palette.selectedHover
          : palette.active
        ).foreground,
        ['--bloom-btn-fg-disabled' as string]: palette.disabled.foreground,
        ['--bloom-btn-disabled-opacity' as string]: palette.disabledOpacity ?? 1,
        ['--bloom-btn-bg' as string]: bodyPaint.background,
        ['--bloom-surface-solid' as string]: solidFill,
        // A button that draws its own border keeps it as its edge.
        [SURFACE_HAIRLINE_VAR as string]:
          palette.borderWidth > 0
            ? 'transparent'
            : surfaceContrastEdge(solidFill, theme.colors.text),
        ['--bloom-btn-bg-hover' as string]: (togglePressed ? palette.selectedHover : palette.hover)
          .background,
        ['--bloom-btn-bg-active' as string]: (togglePressed
          ? palette.selectedHover
          : palette.active
        ).background,
        ['--bloom-btn-bg-disabled' as string]: palette.disabled.background,
        ['--bloom-btn-border' as string]: palette.rest.border,
        ['--bloom-btn-border-hover' as string]: palette.hover.border,
        ['--bloom-btn-border-active' as string]: palette.active.border,
        ['--bloom-btn-border-disabled' as string]: palette.disabled.border,
      };
      // Keep the existing inline defaults for callers without utilities. When
      // classes are present, the same defaults come from the base layer.
      if (!className)
        Object.assign(base, {
          height: geometry.height,
          paddingLeft: paddingHorizontal ?? geometry.paddingHorizontal,
          paddingRight: paddingHorizontal ?? geometry.paddingHorizontal,
          borderRadius: BUTTON_RADIUS,
          fontSize: geometry.fontSize,
          lineHeight: `${geometry.lineHeight}px`,
          fontWeight: Number(geometry.fontWeight),
          letterSpacing: geometry.letterSpacing || undefined,
        });
      if (isSquare) {
        const width = wide ? Math.round(geometry.height * 1.5) : geometry.height;
        if (!className) Object.assign(base, { width, paddingLeft: 0, paddingRight: 0 });
        (base as Record<string, unknown>)['--bloom-btn-width'] = `${width}px`;
        (base as Record<string, unknown>)['--bloom-btn-padding'] = '0px';
      }
      if (isLink && !isSquare) {
        // LinkButton: no container at all — the label's own line box,
        // a 4px gap, and a 4px corner that only the focus ring shows.
        if (!className)
          Object.assign(base, {
            height: undefined,
            paddingLeft: 0,
            paddingRight: 0,
            borderRadius: 4,
          });
        (base as Record<string, unknown>)['--bloom-btn-height'] = 'auto';
        (base as Record<string, unknown>)['--bloom-btn-padding'] = '0px';
        (base as Record<string, unknown>)['--bloom-btn-radius'] = '4px';
        (base as Record<string, unknown>)['--bloom-btn-gap'] = `${LINK_BUTTON_GAP}px`;
      }
      return base;
    }, [
      geometry,
      paintHeight,
      wide,
      grow,
      paddingHorizontal,
      palette,
      theme.colors.text,
      paintRecipe.paint,
      isSquare,
      wide,
      isLink,
      togglePressed,
      disabled,
      loading,
      className,
    ]);

    const handleClick = useCallback(
      (event: MouseEvent<HTMLElement>) => {
        if (longPress.suppressClick(event)) return;
        if (stopPropagation) event.stopPropagation();
        if (isInteractionBlocked) {
          event.preventDefault();
          return;
        }
        onPress?.(event as unknown as GestureResponderEvent);
        onClick?.(event as React.MouseEvent<HTMLButtonElement>);
      },
      [isInteractionBlocked, onPress, onClick, stopPropagation, longPress.suppressClick],
    );

    const ariaLabel = ariaLabelProp ?? accessibilityLabel;
    const composedClassName = ['bloom-btn']
      .concat(isLink ? ['bloom-btn--link'] : [])
      .concat(underlineMode === 'none' ? [] : [`bloom-btn--underline-${underlineMode}`])
      .concat(palette.rest.surface ? ['bloom-btn--surface'] : [])
      .concat(className ? [className] : [])
      .join(' ');

    const spinnerColor = loadingColor ?? 'currentColor';

    // Normalize the caller's `style` (single object, StyleProp array, or falsy)
    // into ONE flat plain object here, once, so neither raw-DOM merge site below
    // spreads a StyleProp array (which would leak numeric keys onto the button's
    // CSSStyleDeclaration). See `flattenWebStyle` for the full rationale.
    const resolvedStyle = authoredStyle;
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

    // A stable flex parent preserves child state and geometry across loading.
    // Opacity hides paint while keeping the original accessible content/name.
    // display:contents cannot apply opacity, and visibility/aria-hidden erase
    // the name of controls whose label comes from their descendants.
    const body = (
      <>
        <span
          style={{
            display: 'inline-flex',
            flexDirection: 'inherit',
            flexWrap: 'inherit',
            alignItems: 'inherit',
            justifyContent: 'inherit',
            alignContent: 'inherit',
            gap: 'inherit',
            alignSelf: 'stretch',
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 0,
            opacity: loading && loadingIndicator !== null ? 0 : undefined,
            pointerEvents: loading ? 'none' : undefined,
          }}
        >
          {attention === undefined ? (
            content
          ) : (
            <GlyphAttention token={attention} blocked={isInteractionBlocked}>
              {content}
            </GlyphAttention>
          )}
        </span>
        {loading ? (
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
            {loadingIndicator === undefined ? (
              <SpinnerIcon size={iconSize} color={spinnerColor} />
            ) : (
              loadingIndicator
            )}
          </span>
        ) : null}
        {decoration}
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
        onPointerEnter?: React.PointerEventHandler<HTMLElement>;
        onPointerLeave?: React.PointerEventHandler<HTMLElement>;
        onFocus?: React.FocusEventHandler<HTMLElement>;
        onBlur?: React.FocusEventHandler<HTMLElement>;
        onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
        onKeyUp?: React.KeyboardEventHandler<HTMLElement>;
        onContextMenu?: React.MouseEventHandler<HTMLElement>;
        'aria-disabled'?: boolean;
        'aria-busy'?: boolean;
        'aria-pressed'?: boolean;
        'aria-label'?: string;
        'aria-current'?: ButtonProps['aria-current'];
        title?: string;
        id?: string;
        tabIndex?: number;
      }>;
      const childProps = child.props;
      return withPaint(
        React.cloneElement(child, {
          ref: setRoot,
          ...visualData,
          'aria-hidden': hidden,
          className: [composedClassName, childProps.className].filter(Boolean).join(' '),
          style: touchTargetStyle(
            { ...containerStyle, ...resolvedStyle, ...childProps.style },
            touch,
          ),
          onPointerDown: (event) => {
            childProps.onPointerDown?.(event);
            longPress.onPointerDown(event);
          },
          onPointerEnter: (event) => {
            childProps.onPointerEnter?.(event);
            handlePointerEnter(event);
          },
          onPointerLeave: (event) => {
            childProps.onPointerLeave?.(event);
            handlePointerLeave(event);
          },
          onFocus: (event) => {
            childProps.onFocus?.(event);
            onFocus?.(event);
          },
          onBlur: (event) => {
            childProps.onBlur?.(event);
            handleBlur(event);
          },
          onKeyDown: (event) => {
            childProps.onKeyDown?.(event);
            handleKeyDown(event);
          },
          onKeyUp: (event) => {
            childProps.onKeyUp?.(event);
            handleKeyUp(event);
          },
          onContextMenu: (event) => {
            childProps.onContextMenu?.(event);
            longPress.onContextMenu(event);
          },
          onClick: (event: MouseEvent<HTMLElement>) => {
            if (longPress.suppressClick(event)) return;
            if (stopPropagation) event.stopPropagation();
            if (isInteractionBlocked) {
              event.preventDefault();
              return;
            }
            childProps.onClick?.(event);
            onPress?.(event as unknown as GestureResponderEvent);
            onClick?.(event as React.MouseEvent<HTMLButtonElement>);
          },
          'aria-disabled': isInteractionBlocked || undefined,
          'aria-busy': loading || undefined,
          'aria-pressed': togglePressed,
          'aria-label': ariaLabel ?? childProps['aria-label'],
          'aria-current': ariaCurrent ?? childProps['aria-current'],
          title: title ?? childProps.title,
          id: childProps.id ?? resolvedId,
          tabIndex: isInteractionBlocked ? -1 : childProps.tabIndex,
        }),
      );
    }

    // `href` renders a real anchor, for a button link or an anchor `LinkButton`.
    // A blocked link drops navigation, while retaining its role and name.
    if (href != null && !asChild) {
      return withPaint(
        <a
          ref={setRoot}
          {...visualData}
          aria-hidden={hidden}
          id={resolvedId}
          href={isInteractionBlocked ? undefined : href}
          role={accessibilityRole ?? 'link'}
          target={target}
          rel={rel}
          className={composedClassName}
          style={touchTargetStyle({ ...containerStyle, ...resolvedStyle }, touch)}
          onPointerDown={longPress.onPointerDown}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocus={onFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onContextMenu={longPress.onContextMenu}
          onClick={handleClick}
          aria-disabled={isInteractionBlocked || undefined}
          aria-busy={loading || undefined}
          aria-pressed={togglePressed}
          aria-label={ariaLabel}
          aria-current={ariaCurrent}
          title={title ?? accessibilityHint}
          tabIndex={tabIndex}
          data-testid={testID}
        >
          {body}
        </a>,
      );
    }

    return withPaint(
      <button
        ref={setRoot}
        {...visualData}
        aria-hidden={hidden}
        id={resolvedId}
        type={type}
        name={name}
        value={value}
        className={composedClassName}
        style={touchTargetStyle({ ...containerStyle, ...resolvedStyle }, touch)}
        onPointerDown={longPress.onPointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={onFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={longPress.onContextMenu}
        onClick={handleClick}
        role={accessibilityRole}
        disabled={disabled && !loading}
        aria-disabled={isInteractionBlocked || undefined}
        aria-busy={loading || undefined}
        aria-pressed={togglePressed}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
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
      </button>,
    );
  },
);

export const Button: MemoRefComponent<ButtonProps> & { Group: typeof Group } = Object.assign(
  memo(ButtonWebComponent),
  { Group },
);
Button.displayName = 'Button';
