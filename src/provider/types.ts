import type { ReactNode } from 'react';
import type { ScrollRouterAdapter } from '../scroll/types';
import { type ImageResolver } from '../image-resolver';
import { type BloomThemeProviderProps } from '../theme';

export interface BloomProviderProps extends Omit<BloomThemeProviderProps, 'children'> {
  children: ReactNode;
  /** Stable router adapter; omitted means automatic restoration is inactive. */
  scrollAdapter?: ScrollRouterAdapter;
  /**
   * Resolves bare media identifiers (Oxy file ids) to loadable URLs for every
   * Bloom surface that takes a `source` — `<Avatar>`, image galleries, cards.
   * Typically `(id, variant) => oxyServices.getFileDownloadUrl(id, variant)`.
   */
  imageResolver?: ImageResolver;
  /** `false` disables haptic feedback app-wide (honored by every `useHaptics()` call). */
  haptics?: boolean;
  /**
   * BCP 47 locale for every Bloom component below — dates, month names and
   * Bloom's own strings (Cancel, Apply, …). A component's own `locale` prop
   * wins. Unset, components follow the runtime's locale.
   */
  locale?: string;
  /**
   * Where bot characters load their 3D runtime from. Defaults to the SDK's hosted copy
   * (`BLOOM_CHARACTER_RUNTIME_URL`); pass the absolute URL of a self-hosted
   * `assets/character-runtime/runtime.mjs` to replace it. Nothing is fetched until a character
   * is drawn. Drawn stills persist in the same `storage` the theme uses, when one is given.
   */
  characterRuntimeUrl?: string;
}
