/**
 * iOS only: a Bloom icon's SF Symbol, from the spec's `sfSymbols` table. The
 * table imports every icon it names, so only `*.ios.tsx` files import this.
 */
import { SF_SYMBOLS } from '../generated/sf-symbols.generated';
import type { IconComponent } from '../node';

export function sfSymbolOf(icon: IconComponent | undefined): string | undefined {
  return icon === undefined ? undefined : SF_SYMBOLS.get(icon);
}
