import type { PropsWithChildren } from 'react';

/** Shared vocabulary. Families expose the meaningful subset of each axis. */
export type BloomSize = 'xs' | 'sm' | 'md' | 'lg';
export type BloomTone = 'neutral' | 'accent' | 'support' | 'action' | 'success' | 'warning' | 'danger' | 'info';
export type BloomAppearance = 'solid' | 'subtle' | 'outline' | 'plain';
export interface BloomAppearanceProps {
  size?: BloomSize;
  tone?: BloomTone;
}
export type BloomScopeProps = PropsWithChildren<BloomAppearanceProps>;
