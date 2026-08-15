import React, {
  memo,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
} from 'react';

import { useTheme } from '../theme/use-theme';
import { animation, borderRadius } from '../styles/tokens';
import { pressedSurface } from '../theme/press-colors';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { flattenWebStyle } from '../styles/flatten-web-style';
import {
  applyIconColor,
  resolveFrostedPalette,
  resolveFrostedSize,
} from './shared';
import type { FrostedIconButtonProps } from './types';

export type { FrostedIconButtonProps, FrostedIconButtonSize } from './types';

// ---------------------------------------------------------------------------
//  Per-state CSS injection
//
//  Shared recipe — see `styles/interactive-web-css.ts`. Per-instance resolved
//  colours stay inline and reach the static rules as custom properties
//  (`--bloom-frosted-ring`, `--bloom-frosted-hover-bg`,
//  `--bloom-frosted-hover-ring`, `--bloom-frosted-press-scale`).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-frosted-icon-button-web-css';

const BLOOM_FROSTED_ICON_BUTTON_CSS = interactiveWebCss({
  selector: '.bloom-frosted-icon-btn',
  varPrefix: 'bloom-frosted',
  // `background-color` and `border-color` arrive as custom properties rather than
  // in the inline style, and that is NOT a stylistic choice. An inline
  // declaration outranks EVERY rule in an adopted stylesheet, so a fork that
  // writes either one inline makes its own `:hover` rules for that property
  // unreachable. Measured in a real browser: the hover pair below had never once
  // fired, with the rules present and the variables resolving correctly.
  // Gate: `interactive-web-css.test.tsx`.
  base: `
    padding: 0;
    border-style: solid;
    border-width: 1px;
    background-color: var(--bloom-frosted-bg);
    border-color: var(--bloom-frosted-border);
    font-family: inherit;
  `,
  transition:
    'background-color 140ms ease, border-color 140ms ease, box-shadow 160ms ease, transform 120ms ease',
  hover: {
    // The ACTIVE (solid) state is its own colour and already at full strength,
    // so hover must not repaint it or a selected control looks unselected. That
    // is expressed in the VALUE — `--bloom-frosted-hover-*` resolve to the rest
    // pair when `active` — and NOT as a `:not([data-active="true"])` filter,
    // which is how it used to be written.
    //
    // The filter was not a neutral spelling of the same thing, and moving it
    // became REQUIRED the moment the press below gained a background. `:not()`
    // carries its argument's specificity, so the filter made this selector
    // (0,5,0) against the `:active` rule's (0,4,0) — and a HELD control is
    // always also a HOVERED one, so hover would have outranked press and the
    // press would have done nothing at all. Equal specificity plus source order
    // is what puts press on top.
    declarations: `
      background-color: var(--bloom-frosted-hover-bg);
      border-color: var(--bloom-frosted-hover-ring);
    `,
  },
  // Resolved per state — an active chip steps its solid fill, a frosted one
  // steps its tint — so this needs no filter to avoid unselecting anything.
  pressDeclarations: 'background-color: var(--bloom-frosted-press-bg);',
  outlineOffset: 2,
});

const FrostedIconButtonWebComponent: React.FC<FrostedIconButtonProps> = ({
  onPress,
  onClick,
  icon,
  children,
  active = false,
  disabled = false,
  size = 'md',
  accessibilityLabel,
  'aria-label': ariaLabelProp,
  accessibilityHint,
  style,
  className,
  testID,
  id,
  title,
  type = 'button',
}) => {
  useInteractiveWebCss(STYLE_ID, BLOOM_FROSTED_ICON_BUTTON_CSS);
  const theme = useTheme();
  const reactId = useId();
  const resolvedId = id ?? `bloom-frosted-icon-btn-${reactId}`;

  const geo = useMemo(() => resolveFrostedSize(size), [size]);
  const palette = useMemo(
    () => resolveFrostedPalette(theme.colors, theme.isDark),
    [theme.colors, theme.isDark],
  );

  const iconColor = active ? palette.activeIcon : palette.icon;
  const blur = `blur(${geo.blur}px)`;

  const containerStyle = useMemo((): CSSProperties => {
    return {
      width: geo.diameter,
      height: geo.diameter,
      borderRadius: borderRadius.full,
      ['--bloom-frosted-bg' as string]: active ? palette.activeSurface : palette.surface,
      ['--bloom-frosted-border' as string]: palette.ring,
      color: iconColor,
      // Real CSS backdrop blur so the chip frosts over content behind it. The
      // solid `active` state drops the blur. Both prefixed forms for Safari.
      backdropFilter: active ? 'none' : blur,
      WebkitBackdropFilter: active ? 'none' : blur,
      // Soft shadow kept in BOTH modes so the chip has an edge on a solid bg.
      boxShadow: `0 2px 8px ${palette.shadow}`,
      // An ACTIVE chip's hover pair IS its rest pair — the "hover does not repaint
      // the solid on-state" rule, moved from the selector into the value.
      ['--bloom-frosted-hover-bg' as string]: active ? palette.activeSurface : palette.surfaceHover,
      ['--bloom-frosted-hover-ring' as string]: active ? palette.ring : palette.ringHover,
      // Stepped from `surfaceHover`, because a press on web is always also a
      // hover — see the note in `FrostedIconButton.tsx`.
      ['--bloom-frosted-press-bg' as string]: active
        ? pressedSurface(theme.colors, palette.activeSurface, palette.activeIcon)
        : pressedSurface(theme.colors, palette.surfaceHover, theme.colors.text),
      ['--bloom-frosted-ring' as string]: palette.focusRing,
      ['--bloom-frosted-press-scale' as string]: animation.pressScale,
    };
  }, [
    geo.diameter,
    active,
    theme.colors,
    palette.activeIcon,
    palette.activeSurface,
    palette.surface,
    palette.ring,
    palette.surfaceHover,
    palette.ringHover,
    palette.focusRing,
    palette.shadow,
    iconColor,
    blur,
  ]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
      onPress?.();
    },
    [disabled, onClick, onPress],
  );

  const ariaLabel = ariaLabelProp ?? accessibilityLabel;
  const composedClassName = ['bloom-frosted-icon-btn']
    .concat(className ? [className] : [])
    .join(' ');

  // `style` is an RN `StyleProp` (array-capable). Flatten before spreading into
  // the raw DOM `style` object so an array form never leaks numeric keys onto
  // the element's CSSStyleDeclaration. See `flattenWebStyle` for the rationale.
  const resolvedStyle = flattenWebStyle(style);
  const content = icon ?? children;

  return (
    <button
      id={resolvedId}
      type={type}
      className={composedClassName}
      style={{ ...containerStyle, ...resolvedStyle }}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      aria-pressed={active}
      data-active={active || undefined}
      title={title ?? accessibilityHint}
      data-testid={testID}
    >
      {content != null && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: geo.iconBox,
            height: geo.iconBox,
          }}
        >
          {applyIconColor(content, iconColor)}
        </span>
      )}
    </button>
  );
};

export const FrostedIconButton = memo(FrostedIconButtonWebComponent);
FrostedIconButton.displayName = 'FrostedIconButton';
