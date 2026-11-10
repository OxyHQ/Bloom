import { useMemo } from 'react';

import { useTheme } from '../../theme/use-theme';

export interface GlassPrimary {
  /** The brand at full strength (`theme.colors.vivid`), the same in light and dark. */
  color: string;
  /** Black or white, whichever reads on `color`. */
  onColor: string;
}

/**
 * The colour a primary-toned glass control is tinted with. The theme's `primary` is a fill that
 * carries a white label, so glass shows it deep or washed; a glass tint wants the brand at full
 * strength, which the theme resolves for every preset and seed as `vivid`.
 */
export function useGlassPrimary(): GlassPrimary {
  const { vivid, vividForeground } = useTheme().colors;
  return useMemo(() => ({ color: vivid, onColor: vividForeground }), [vivid, vividForeground]);
}
