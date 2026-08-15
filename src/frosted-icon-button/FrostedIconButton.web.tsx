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
  base: `
    padding: 0;
    border-style: solid;
    border-width: 1px;
    font-family: inherit;
  `,
  transition:
    'background-color 140ms ease, border-color 140ms ease, box-shadow 160ms ease, transform 120ms ease',
  hover: {
    // The ACTIVE (solid) state is its own colour and already at full strength —
    // letting hover repaint it would make a selected control look unselected.
    filter: ':not([data-active="true"])',
    declarations: `
      background-color: var(--bloom-frosted-hover-bg);
      border-color: var(--bloom-frosted-hover-ring);
    `,
  },
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
      ['--bloom-frosted-ring' as string]: palette.focusRing,
      ['--bloom-frosted-press-scale' as string]: animation.pressScale,
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
