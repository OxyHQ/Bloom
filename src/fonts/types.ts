import type { FontFamilyName } from './tokens';

export interface BloomFontHeadProps {
  /** Families used by the first screen. Defaults to sans and display; mono is opt-in. */
  families?: readonly FontFamilyName[];
}
