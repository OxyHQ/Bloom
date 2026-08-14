import React, {
  memo,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
} from 'react';

import { useTheme } from '../theme/use-theme';
import { borderRadius } from '../styles/tokens';
import type { Theme } from '../theme/types';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { flattenWebStyle } from '../styles/flatten-web-style';
import type { FabPlacement, FabProps, FabSize, FabVariant } from './types';

export type { FabProps, FabVariant, FabSize, FabPlacement } from './types';

interface ResolvedSize {
  diameter: number;
  iconBox: number;
  fontSize: number;
}

// Material-style FAB scale. `small` (40px) keeps a full 24px icon box so the
// glyph reads clearly; `medium` (56px) is the canonical FAB; `large` (64px) is
// the high-prominence action.
const SIZE_CONFIG: Record<FabSize, ResolvedSize> = {
  small: { diameter: 40, iconBox: 24, fontSize: 14 },
  medium: { diameter: 56, iconBox: 24, fontSize: 15 },
  large: { diameter: 64, iconBox: 28, fontSize: 16 },
};

const MIN_NUMERIC_ICON_BOX = 22;

/**
 * Resolve a `size` prop (preset name or raw pixel diameter) to concrete pixel
 * geometry. Mirrors the native `resolveSize` exactly so a numeric size renders
 * identically on both platforms. A numeric size sets the diameter directly and
 * derives the icon box as `round(size * 0.5)` (clamped to a sensible minimum).
 */
function resolveSize(size: FabSize | number): ResolvedSize {
  if (typeof size === 'number') {
    return {
      diameter: size,
      iconBox: Math.max(MIN_NUMERIC_ICON_BOX, Math.round(size * 0.5)),
      fontSize: Math.max(13, Math.round(size * 0.27)),
    };
  }
  return SIZE_CONFIG[size];
}

const PRESS_SCALE = 0.94;
const DEFAULT_OFFSET = 16;
const DEFAULT_Z_INDEX = 50;

// ---------------------------------------------------------------------------
//  Per-state CSS injection
//
//  Shared recipe — see `styles/interactive-web-css.ts`. Per-instance resolved
//  colours stay inline and reach the static rules as custom properties
//  (`--bloom-fab-ring`, `--bloom-fab-shadow-hover`, `--bloom-fab-press-scale`).
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-fab-web-css';

const BLOOM_FAB_CSS = interactiveWebCss({
  className: 'bloom-fab',
  varPrefix: 'bloom-fab',
  base: `
    flex-direction: row;
    gap: 8px;
    border: none;
    font-family: inherit;
  `,
  transition:
    'opacity 120ms ease, transform 120ms ease, box-shadow 160ms ease, background-color 120ms ease',
  // A FAB lifts on hover rather than dimming: it floats over the content, so a
  // deeper shadow is the affordance an opacity dip cannot express.
  hover: { declarations: 'box-shadow: var(--bloom-fab-shadow-hover);' },
  // One px more than a button's: the FAB is a circle on a page it floats above,
  // so a ring at 2 reads as touching the edge.
  outlineOffset: 3,
});

/**
 * Positioning for a placement on web.
 *
 * CRITICAL: the positioned placements use `position: sticky`, NOT `fixed`. A
 * sticky element is positioned relative to its nearest scrolling ancestor and
 * stays within its containing block — so the FAB tracks the bottom-right of the
 * CENTRAL CONTENT COLUMN as it scrolls and never escapes to the viewport edge /
 * over a side rail in a constrained multi-column app layout.
 *
 * Pinning a FAB to the BOTTOM of a column needs TWO mechanisms working together,
 * because sticky alone is not enough:
 *
 *   1. `margin-top: auto` — in a flex COLUMN this consumes all the free vertical
 *      space, pushing the FAB to the bottom of the container EVEN WHEN THE
 *      CONTENT IS SHORT (e.g. an empty feed / loading spinner). Without it, a
 *      short column leaves the FAB at its natural flow position (mid-column) —
 *      which is exactly the "floating in the middle / broken" bug.
 *   2. `position: sticky; bottom` — when the content is TALL and the column
 *      scrolls, sticky keeps the FAB pinned to the bottom of the viewport as the
 *      user scrolls, instead of scrolling away with the content.
 *
 * Horizontal placement uses `align-self` (sticky elements can't be pushed by
 * `left`/`right` the way absolute ones are) plus an inline-edge margin for the
 * `offset`. The consumer column MUST be a flex column that fills the available
 * height, and the FAB MUST be its last child — documented in the usage story.
 */
function placementStyle(placement: FabPlacement, offset: number): CSSProperties {
  if (placement === 'static') return {};
  const style: CSSProperties = { position: 'sticky' };
  const isBottom = placement === 'bottom-right' || placement === 'bottom-left';
  if (isBottom) {
    style.bottom = offset;
    // Push the FAB to the bottom of a (flex-column) container even when the
    // content is too short to scroll, so it never floats mid-column.
    style.marginTop = 'auto';
  } else {
    style.top = offset;
  }
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
      return { background: c.secondary, foreground: c.secondaryForeground, ring: c.secondary };
    case 'tertiary':
      return { background: c.tertiary, foreground: c.tertiaryForeground, ring: c.tertiary };
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
  variant = 'tertiary',
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
  useInteractiveWebCss(STYLE_ID, BLOOM_FAB_CSS);
  const theme = useTheme();
  const reactId = useId();
  const resolvedId = id ?? `bloom-fab-${reactId}`;

  const sizeConfig = useMemo(() => resolveSize(size), [size]);
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
      borderRadius: borderRadius.full,
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
      const pad = sizeConfig.diameter <= 44 ? 14 : 20;
      base.paddingLeft = pad;
      base.paddingRight = pad;
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

  // Normalize `style`/`labelStyle` (single object, StyleProp array — the native
  // fork passes `style={[placementStyle(...), {...}, style]}` — or falsy) into
  // ONE flat plain object each, so neither raw-DOM merge site below spreads a
  // StyleProp array (which would leak numeric keys onto the element's
  // CSSStyleDeclaration). See `flattenWebStyle` for the full rationale.
  const resolvedStyle = flattenWebStyle(style);
  const resolvedLabelStyle = flattenWebStyle(labelStyle);

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
      {isExtended && <span style={resolvedLabelStyle}>{label}</span>}
    </button>
  );
};

export const Fab = memo(FabWebComponent);
Fab.displayName = 'Fab';
