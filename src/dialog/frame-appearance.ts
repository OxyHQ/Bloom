import { createContext } from 'react';
import type { TypographyMode } from '../typography/TypographyScope';
import type { AppColorName } from '../theme/color-presets';

/** One active frame contributes a local panel palette; disposal restores inheritance. */
export const FrameAppearanceContext = createContext<
  ((preset: AppColorName | undefined, typography?: TypographyMode) => () => void) | null
>(null);
