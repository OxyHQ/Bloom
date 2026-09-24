import type { ReactNode } from 'react';

/**
 * What a Bloom component tells an icon slot to draw: the box, and the colour of
 * the glyph in the CURRENT state (rest, hover, pressed, disabled, checked).
 *
 * `color` carries the same value the component would have passed as `fill`. It
 * is spelled `color` because this object is handed to CALLER code, and an app's
 * own icon set almost always names it that.
 */
export interface BloomIconPaint {
  size: number;
  color: string;
}

/**
 * A caller-owned glyph that still follows the control's state.
 *
 * Bloom's own icon slots take a {@link BloomIconComponent} and tint it by
 * passing `fill`. An app whose icons paint from a `color` prop — which most app
 * icon sets do — cannot be handed to one of those slots directly: the props
 * have nothing in common, so it does not typecheck, and were it cast it would
 * render at its default size in its default colour, silently.
 *
 * Passing `color` alongside `fill` is not the fix, and deliberately so:
 * `frosted-icon-button/shared.ts` records why — "the prop is not ours to
 * claim", because components use `color` for semantic variants (`color="danger"`).
 *
 * Nor can the function form share the existing prop. A component is a function
 * too, so a slot accepting both could not tell an app's ADAPTER component —
 * `({ width, fill }) => <Glyph size={width} color={fill} />`, which works today
 * and is the documented way to do this — from a paint callback. It would break
 * exactly the callers who already did the right thing. Hence its own prop.
 *
 * ```tsx
 * <ButtonGroupItem
 *   iconOnly
 *   renderLeadingIcon={({ size, color }) => <AppSearchIcon size={size} color={color} />}
 *   accessibilityLabel="Search"
 * />
 * ```
 *
 * This is `GlyphButton`'s `children?: ReactNode | ((foreground: string) => ReactNode)`
 * generalised to the slots that take an icon rather than a child — including
 * its precedence rule: where a family offers both, the renderer wins over the
 * icon component.
 */
export type BloomIconRenderer = (paint: BloomIconPaint) => ReactNode;

/**
 * Resolve an icon slot that offers both forms.
 *
 * `render` wins when present, matching `GlyphButton`, where the caller-painted
 * glyph wins over `icon`. Returns `null` when neither is set, so a call site
 * stays a single expression.
 */
export function resolveIconSlot(
  render: BloomIconRenderer | undefined,
  size: number,
  color: string,
  fallback: () => ReactNode,
): ReactNode {
  if (render) return render({ size, color });
  return fallback();
}
