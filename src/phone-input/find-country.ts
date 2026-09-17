import { COUNTRIES } from './countries';
import type { Country } from './types';

/** The country with this ISO code (case-insensitive), or `undefined`. */
export function findCountry(
  iso2: string,
  countries: readonly Country[] = COUNTRIES,
): Country | undefined {
  const code = iso2.toUpperCase();
  return countries.find((country) => country.iso2 === code);
}
