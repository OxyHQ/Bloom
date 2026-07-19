import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
} from 'react';

import { useTheme } from '../theme/use-theme';
import { flattenWebStyle } from '../styles/flatten-web-style';
import {
  applyIconColor,
  resolveFrostedPalette,
  resolveFrostedSize,
} from './shared';
import type { FrostedIconButtonProps } from './types';

export type { FrostedIconButtonProps, FrostedIconButtonSize } from './types';

const RADIUS = 999;
const PRESS_SCALE = 0.94;

// ---------------------------------------------------------------------------
//  Per-state CSS injection
//
//  Inline styles cannot express `:hover` / `:focus-visible` / `:active`. We
//  inject one static stylesheet (keyed by id, once) defining the interaction
//  behavior for the base `bloom-frosted-icon-btn` class; per-instance resolved
//  colors are passed in as inline CSS custom properties. Self-injecting the CSS
//  (rather than exporting a string for consumers to paste) is the Bloom web-fork
//  convention — an unresolvable rule would fail silently otherwise.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-frosted-icon-button-web-css';

const BLOOM_FROSTED_ICON_BUTTON_CSS = `
.bloom-frosted-icon-btn {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border-style: solid;
  border-width: 1px;
  font-family: inherit;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: background-color 140ms ease, border-color 140ms ease,
    box-shadow 160ms ease, transform 120ms ease;
}
.bloom-frosted-icon-btn:disabled,
.bloom-frosted-icon-btn[aria-disabled="true"] {
  cursor: default;
  opacity: 0.5;
}
.bloom-frosted-icon-btn:not(:disabled):not([aria-disabled="true"]):not([data-active="true"]):hover {
  background-color: var(--bloom-frosted-hover-bg);
  border-color: var(--bloom-frosted-hover-ring);
}
.bloom-frosted-icon-btn:not(:disabled):not([aria-disabled="true"]):active {
  transform: scale(var(--bloom-frosted-press-scale, 1));
}
.bloom-frosted-icon-btn:focus-visible {
  outline: 2px solid var(--bloom-frosted-ring-focus, currentColor);
  outline-offset: 2px;
}
`;

function useFrostedIconButtonCss(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = BLOOM_FROSTED_ICON_BUTTON_CSS;
    document.head.appendChild(style);
  }, []);
}

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
  useFrostedIconButtonCss();
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
      borderRadius: RADIUS,
      backgroundColor: active ? palette.activeSurface : palette.surface,
      borderColor: palette.ring,
      color: iconColor,
      // Real CSS backdrop blur so the chip frosts over content behind it. The
      // solid `active` state drops the blur. Both prefixed forms for Safari.
      backdropFilter: active ? 'none' : blur,
      WebkitBackdropFilter: active ? 'none' : blur,
      // Soft shadow kept in BOTH modes so the chip has an edge on a solid bg.
      boxShadow: `0 2px 8px ${palette.shadow}`,
      ['--bloom-frosted-hover-bg' as string]: palette.surfaceHover,
      ['--bloom-frosted-hover-ring' as string]: palette.ringHover,
      ['--bloom-frosted-ring-focus' as string]: palette.focusRing,
      ['--bloom-frosted-press-scale' as string]: PRESS_SCALE,
    };
  }, [
    geo.diameter,
    active,
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
