import type { PropsWithChildren } from 'react';

/** Shared vocabulary. Families expose the meaningful subset of each axis. */
export type BloomSize = 'xs' | 'sm' | 'md' | 'lg';
export type BloomTone =
  | 'neutral'
  | 'accent'
  | 'support'
  | 'action'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
export type BloomAppearance = 'solid' | 'subtle' | 'outline' | 'plain';
/** Compact actions in navigation chrome; independent from the app's size scale. */
export type BloomControlDensity = 'default' | 'compact';
/**
 * How much room a domain's content rows take, independent from the app's size
 * scale and from `controlDensity`: `comfortable` (the touch list, the default)
 * or `compact` (a desktop form, as a Mac's System Settings lays its groups out).
 * Families that have both read it (`GroupedSection`); an explicit prop wins.
 */
export type BloomContentDensity = 'comfortable' | 'compact';
export interface BloomAppearanceProps {
  size?: BloomSize;
  tone?: BloomTone;
}
export type BloomScopeProps = PropsWithChildren<
  BloomAppearanceProps & {
    /** Contextual Button geometry. Navigation headers set compact; overlays reset it. */
    controlDensity?: BloomControlDensity;
    /** Content rows' density for the families that have one (`GroupedSection`). Default comfortable. */
    contentDensity?: BloomContentDensity;
    /** Shared corner radius for framed content panels and card sidebars. Defaults to 28. */
    panelRadius?: number;
  }
>;
