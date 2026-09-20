import { createContext, useContext } from 'react';
import type { BloomAppearanceProps } from './types';

export const BloomAppearanceContext = createContext<BloomAppearanceProps>({});

/** Explicit props override the nearest scope, then the family's defaults. */
export function useBloomAppearance(
  props: BloomAppearanceProps,
  defaults: Required<BloomAppearanceProps>,
): Required<BloomAppearanceProps> {
  const scope = useContext(BloomAppearanceContext);
  return { size: props.size ?? scope.size ?? defaults.size, tone: props.tone ?? scope.tone ?? defaults.tone };
}
