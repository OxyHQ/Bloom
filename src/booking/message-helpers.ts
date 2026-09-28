/**
 * Helpers the booking catalog's strings share across languages.
 * Kept apart from `messages.ts` so a language module can use them without
 * linking the family's English strings (see `src/locale/translations`).
 */
import type { BookingMessages } from './messages';

/** Joins a price, its unit and its earlier price with one language's words. */
export function priceName(
  per: (price: string, unit: string) => string,
  originally: (spoken: string, originalPrice: string) => string,
): BookingMessages['priceName'] {
  return (price, unit, originalPrice) => {
    const spoken = unit ? per(price, unit) : price;
    return originalPrice ? originally(spoken, originalPrice) : spoken;
  };
}
