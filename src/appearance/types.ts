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
export interface BloomAppearanceProps {
  size?: BloomSize;
  tone?: BloomTone;
}
export type BloomScopeProps = PropsWithChildren<
  BloomAppearanceProps & {
    /** Contextual Button geometry. Navigation headers set compact; overlays reset it. */
    controlDensity?: BloomControlDensity;
    /** Shared corner radius for framed content panels and card sidebars. Defaults to 28. */
    panelRadius?: number;
  }
>;
