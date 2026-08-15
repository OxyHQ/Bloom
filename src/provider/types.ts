import type { ReactNode } from 'react';
import { type ImageResolver } from '../image-resolver';
import { type BloomThemeProviderProps } from '../theme';

export interface BloomProviderProps extends Omit<BloomThemeProviderProps, 'children'> {
  children: ReactNode;
  /**
   * Resolves bare media identifiers (Oxy file ids) to loadable URLs for every
   * Bloom surface that takes a `source` — `<Avatar>`, image galleries, cards.
   * Typically `(id, variant) => oxyServices.getFileDownloadUrl(id, variant)`.
   */
  imageResolver?: ImageResolver;
  /** `false` disables haptic feedback app-wide (honored by every `useHaptics()` call). */
  haptics?: boolean;
}
