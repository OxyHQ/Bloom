import { createContext, useContext } from 'react';
import type {
  BloomAppearanceProps,
  BloomContentDensity,
  BloomControlDensity,
  BloomScopeProps,
} from './types';

export const BloomAppearanceContext = createContext<Omit<BloomScopeProps, 'children'>>({});

export function useBloomControlDensity(explicit?: BloomControlDensity): BloomControlDensity {
  const scope = useContext(BloomAppearanceContext);
  return explicit ?? scope.controlDensity ?? 'default';
}

/** The content density: an explicit prop, else the nearest scope's, else `comfortable`. */
export function useBloomContentDensity(explicit?: BloomContentDensity): BloomContentDensity;
export function useBloomContentDensity(
  explicit: BloomContentDensity | undefined,
  fallback: undefined,
): BloomContentDensity | undefined;
export function useBloomContentDensity(
  explicit?: BloomContentDensity,
  fallback: BloomContentDensity | undefined = 'comfortable',
): BloomContentDensity | undefined {
  const scope = useContext(BloomAppearanceContext);
  return explicit ?? scope.contentDensity ?? fallback;
}

/** Explicit props override the nearest scope, then the family's defaults. */
export function useBloomAppearance(
  props: BloomAppearanceProps,
  defaults: Required<BloomAppearanceProps>,
): Required<BloomAppearanceProps> {
  const scope = useContext(BloomAppearanceContext);
  return {
    size: props.size ?? scope.size ?? defaults.size,
    tone: props.tone ?? scope.tone ?? defaults.tone,
  };
}
