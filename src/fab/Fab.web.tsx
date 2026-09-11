import React, {
  memo,
  useCallback,
  useId,
  useMemo,
  type CSSProperties,
  type MouseEvent,
} from 'react';

import { useBottomEdgeInset } from '../layout/bottom-edge';
import { EXPANDED_HEIGHT, MINIMIZED_HEIGHT } from '../tab-bar/shared';
import { useTheme } from '../theme/use-theme';
import { animation, borderRadius } from '../styles/tokens';
import { pressedSurface } from '../theme/press-colors';
import type { Theme } from '../theme/types';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { flattenWebStyle } from '../styles/flatten-web-style';
import { applyIconColor } from '../frosted-icon-button/shared';
import { useFabMinimized } from './use-fab-minimized';
import type { FabMinimizeBehavior, FabPlacement, FabProps, FabSize, FabVariant } from './types';

export type { FabProps, FabVariant, FabSize, FabPlacement, FabMinimizeBehavior } from './types';

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
  selector: '.bloom-fab',
  varPrefix: 'bloom-fab',
  // `background-color` and `box-shadow` arrive as custom properties rather than
  // in the inline style, and that is NOT a stylistic choice. An inline
  // declaration outranks EVERY rule in an adopted stylesheet, so a fork that
  // writes either one inline makes its own `:hover` rule for that property
  // unreachable. Measured in a real browser: the hover lift below had never once
  // fired, with the rule present and the variable resolving correctly.
  // Gate: `interactive-web-css.test.tsx`.
  base: `
    flex-direction: row;
    border: none;
    background-color: var(--bloom-fab-bg);
    box-shadow: var(--bloom-fab-shadow);
    font-family: inherit;
  `,
  transition:
    'opacity 120ms ease, transform 120ms ease, box-shadow 160ms ease, background-color 120ms ease, bottom 200ms ease, padding 200ms ease, gap 200ms ease',
  // A FAB lifts on hover rather than dimming: it floats over the content, so a
  // deeper shadow is the affordance an opacity dip cannot express.
  hover: { declarations: 'box-shadow: var(--bloom-fab-shadow-hover);' },
  // The held state is the same state layer the native fork paints, from the same
  // resolver. It reads THROUGH the hover lift rather than replacing it (a
  // pressed FAB is always also hovered), so hover and press stay two distinct
  // states: deeper shadow, then a darker face.
  pressDeclarations: 'background-color: var(--bloom-fab-press-bg);',
  // One px more than a button's: the FAB is a circle on a page it floats above,
  // so a ring at 2 reads as touching the edge.
  outlineOffset: 3,
});

/**
 * Positioning for a placement on web.
 *
 * Positioned placements use `sticky`, never `fixed`, so the FAB follows the
 * document scroll while remaining inside its content column. Bottom placements
 * combine `margin-top: auto` (short flex-column content) with `bottom` (long,
 * scrolling content). The consumer column must fill the available height, use
 * flex-column layout, and render the FAB last.
 *
 * `bottomEdgeInset` applies to the BOTTOM axis only. It is not a gap preference
 * — `offset` is that — but the height of whatever floating surface has already
 * claimed the bottom edge, so the FAB lands above a floating tab bar instead of
 * behind it. A z-index cannot fix that pairing: the bar's host is the last
 * sibling of the app shell and paints over every descendant, so the FAB has to be
 * somewhere else, not merely on top.
 */
function placementStyle(
  placement: FabPlacement,
  offset: number,
  bottomEdgeInset: number,
): CSSProperties {
  if (placement === 'static') return {};
  const style: CSSProperties = { position: 'sticky' };
  const isBottom = placement === 'bottom-right' || placement === 'bottom-left';
  if (isBottom) {
    style.bottom = offset + bottomEdgeInset;
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
  minimizeBehavior = 'none',
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
  const minimized = useFabMinimized(true);
  const bottomEdgeInset = useBottomEdgeInset();
  const theme = useTheme();
  const reactId = useId();
  const resolvedId = id ?? `bloom-fab-${reactId}`;

  const sizeConfig = useMemo(() => resolveSize(size), [size]);
  const isExtended = label != null && label.length > 0;
  const showLabel = isExtended && !(minimized && minimizeBehavior === 'collapse');
  const variantColors = useMemo(() => resolveVariant(variant, theme.colors), [variant, theme.colors]);
  const content = applyIconColor(icon ?? children, variantColors.foreground);

  // Resolved-token shadows. The token is already a full color (per the Bloom
  // web CSS-var contract), so it is used directly — never wrapped in hsl().
  const restShadow = `0 4px 12px ${theme.colors.shadow}`;
  const hoverShadow = `0 8px 20px ${theme.colors.shadow}`;

  const containerStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      color: variantColors.foreground,
      borderRadius: borderRadius.full,
      height: sizeConfig.diameter,
      zIndex,
      fontSize: sizeConfig.fontSize,
      fontWeight: 600,
      ['--bloom-fab-ring' as string]: variantColors.ring,
      ['--bloom-fab-bg' as string]: variantColors.background,
      ['--bloom-fab-shadow' as string]: restShadow,
      ['--bloom-fab-shadow-hover' as string]: hoverShadow,
      // Resolved by the same function the native fork calls, off the same rest
      // fill, so the two forks land on the identical colour.
      ['--bloom-fab-press-bg' as string]: pressedSurface(
        theme.colors,
        variantColors.background,
        variantColors.foreground,
      ),
      ['--bloom-fab-press-scale' as string]: animation.pressScale,
      ...placementStyle(
        placement,
        offset,
        Math.max(0, bottomEdgeInset - (minimized ? EXPANDED_HEIGHT - MINIMIZED_HEIGHT : 0)),
      ),
    };
    if (isExtended) {
      const pad = sizeConfig.diameter <= 44 ? 14 : 20;
      base.minWidth = sizeConfig.diameter;
      base.paddingLeft = showLabel ? pad : 0;
      base.paddingRight = showLabel ? pad : 0;
      base.gap = showLabel ? 8 : 0;
    } else {
      base.width = sizeConfig.diameter;
    }
    return base;
  }, [
    variantColors,
    theme.colors,
    sizeConfig.diameter,
    sizeConfig.fontSize,
    zIndex,
    restShadow,
    hoverShadow,
    placement,
    offset,
    bottomEdgeInset,
    minimized,
    isExtended,
    showLabel,
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

  if (minimized && minimizeBehavior === 'hide') return null;

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
          aria-hidden={showLabel ? 'true' : undefined}
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
      {isExtended && (
        <span
          aria-hidden={!showLabel || undefined}
          style={{
            display: 'grid',
            gridTemplateColumns: showLabel ? 'minmax(0, 1fr)' : 'minmax(0, 0fr)',
            opacity: showLabel ? 1 : 0,
            transition: 'grid-template-columns 200ms ease, opacity 140ms ease',
          }}
        >
          <span
            style={{
              ...resolvedLabelStyle,
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </span>
      )}
    </button>
  );
};

export const Fab = memo(FabWebComponent);
Fab.displayName = 'Fab';
