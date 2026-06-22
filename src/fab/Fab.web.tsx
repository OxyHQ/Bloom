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
import type { Theme } from '../theme/types';
import type { FabPlacement, FabProps, FabSize, FabVariant } from './types';

export type { FabProps, FabVariant, FabSize, FabPlacement } from './types';

const SIZE_CONFIG: Record<FabSize, { diameter: number; iconBox: number; fontSize: number }> = {
  small: { diameter: 40, iconBox: 20, fontSize: 14 },
  medium: { diameter: 56, iconBox: 24, fontSize: 15 },
  large: { diameter: 64, iconBox: 28, fontSize: 16 },
};

const PILL_RADIUS = 999;
const PRESS_SCALE = 0.94;
const DEFAULT_OFFSET = 16;
const DEFAULT_Z_INDEX = 50;

// ---------------------------------------------------------------------------
//  Per-state CSS injection
//
//  Inline styles cannot express `:hover` / `:focus-visible` / `:active`. We
//  inject one static stylesheet (keyed by id, once) defining the interaction
//  behavior for the base `bloom-fab` class; per-instance resolved colors stay
//  inline. The focus-ring color is read from a CSS custom property the
//  component sets inline (`--bloom-fab-ring`).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-fab-web-css';

const BLOOM_FAB_CSS = `
.bloom-fab {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 8px;
  margin: 0;
  border: none;
  font-family: inherit;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: opacity 120ms ease, transform 120ms ease, box-shadow 160ms ease, background-color 120ms ease;
}
.bloom-fab:disabled,
.bloom-fab[aria-disabled="true"] {
  cursor: default;
  opacity: 0.5;
}
.bloom-fab:not(:disabled):not([aria-disabled="true"]):hover {
  box-shadow: var(--bloom-fab-shadow-hover);
}
.bloom-fab:not(:disabled):not([aria-disabled="true"]):active {
  transform: scale(var(--bloom-fab-press-scale, 1));
}
.bloom-fab:focus-visible {
  outline: 2px solid var(--bloom-fab-ring, currentColor);
  outline-offset: 3px;
}
`;

function useFabCss(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = BLOOM_FAB_CSS;
    document.head.appendChild(style);
  }, []);
}

/**
 * Positioning for a placement on web.
 *
 * CRITICAL: the positioned placements use `position: sticky`, NOT `fixed`. A
 * sticky element is positioned relative to its nearest scrolling ancestor and
 * stays within its containing block — so the FAB tracks the bottom-right of the
 * CENTRAL CONTENT COLUMN as it scrolls and never escapes to the viewport edge /
 * over a side rail in a constrained multi-column app layout.
 *
 * To pin a sticky element to the BOTTOM of a column it must sit at the end of
 * the scroll content with `align-self: flex-end` (consumer column should be a
 * flex column) — documented in the component's usage story. We set `bottom`
 * and a self-alignment so the common case works with zero consumer CSS beyond a
 * `flex-col` column.
 */
function placementStyle(placement: FabPlacement, offset: number): CSSProperties {
  if (placement === 'static') return {};
  const style: CSSProperties = { position: 'sticky' };
  if (placement === 'bottom-right' || placement === 'bottom-left') {
    style.bottom = offset;
  } else {
    style.top = offset;
  }
  // Sticky elements can't be pushed horizontally by left/right the way absolute
  // ones are; we self-align within the (flex column) container instead, and add
  // a horizontal margin for the offset so the FAB sits `offset` px from the
  // column's inline edge.
  if (placement === 'bottom-right' || placement === 'top-right') {
    style.alignSelf = 'flex-end';
    style.marginRight = offset;
  } else {
    style.alignSelf = 'flex-start';
    style.marginLeft = offset;
  }
  return style;
}

function resolveVariant(
  variant: FabVariant,
  c: Theme['colors'],
): { background: string; foreground: string; ring: string } {
  switch (variant) {
    case 'secondary':
    case 'surface':
      return { background: c.card, foreground: c.text, ring: c.primary };
    case 'primary':
    default:
      return { background: c.primary, foreground: c.primaryForeground, ring: c.primary };
  }
}

const FabWebComponent: React.FC<FabProps> = ({
  onPress,
  onClick,
  icon,
  children,
  label,
  variant = 'primary',
  size = 'medium',
  placement = 'bottom-right',
  offset = DEFAULT_OFFSET,
  disabled = false,
  accessibilityLabel,
  'aria-label': ariaLabelProp,
  accessibilityHint,
  style,
  labelStyle,
  className,
  testID,
  zIndex = DEFAULT_Z_INDEX,
  id,
  title,
  type = 'button',
}) => {
  useFabCss();
  const theme = useTheme();
  const reactId = useId();
  const resolvedId = id ?? `bloom-fab-${reactId}`;

  const sizeConfig = SIZE_CONFIG[size];
  const isExtended = label != null && label.length > 0;
  const content = icon ?? children;
  const variantColors = useMemo(() => resolveVariant(variant, theme.colors), [variant, theme.colors]);

  // Resolved-token shadows. The token is already a full color (per the Bloom
  // web CSS-var contract), so it is used directly — never wrapped in hsl().
  const restShadow = `0 4px 12px ${theme.colors.shadow}`;
  const hoverShadow = `0 8px 20px ${theme.colors.shadow}`;

  const containerStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      backgroundColor: variantColors.background,
      color: variantColors.foreground,
      borderRadius: PILL_RADIUS,
      height: sizeConfig.diameter,
      zIndex,
      boxShadow: restShadow,
      fontSize: sizeConfig.fontSize,
      fontWeight: 600,
      ['--bloom-fab-ring' as string]: variantColors.ring,
      ['--bloom-fab-shadow-hover' as string]: hoverShadow,
      ['--bloom-fab-press-scale' as string]: PRESS_SCALE,
      ...placementStyle(placement, offset),
    };
    if (isExtended) {
      base.paddingLeft = size === 'small' ? 14 : 20;
      base.paddingRight = size === 'small' ? 14 : 20;
    } else {
      base.width = sizeConfig.diameter;
    }
    return base;
  }, [
    variantColors,
    sizeConfig.diameter,
    sizeConfig.fontSize,
    zIndex,
    restShadow,
    hoverShadow,
    placement,
    offset,
    isExtended,
    size,
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

  const ariaLabel = ariaLabelProp ?? accessibilityLabel ?? label;
  const composedClassName = ['bloom-fab'].concat(className ? [className] : []).join(' ');

  return (
    <button
      id={resolvedId}
      type={type}
      className={composedClassName}
      style={{ ...containerStyle, ...(style as CSSProperties) }}
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      title={title ?? accessibilityHint}
      data-testid={testID}
    >
      {content != null && (
        <span
          aria-hidden={isExtended ? 'true' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeConfig.iconBox,
            height: sizeConfig.iconBox,
          }}
        >
          {content}
        </span>
      )}
      {isExtended && <span style={labelStyle as CSSProperties}>{label}</span>}
    </button>
  );
};

export const Fab = memo(FabWebComponent);
Fab.displayName = 'Fab';
