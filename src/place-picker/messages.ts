import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * `PlacePicker`'s fixed words, in each Bloom language. Each entry of the
 * `labels` prop still wins over its counterpart here.
 */
export interface PlacePickerMessages {
  /** The result list's name. */
  results: string;
  /** While a search is in flight. */
  searching: string;
  /** A finished search that found nothing: "No places match “Gran Vía”". */
  noResults: (query: string) => string;
  /** A search that failed. */
  failed: string;
  /** The retry button after a failure. */
  retry: string;
  /** Announced when results arrive: "5 places". */
  resultCount: (count: number) => string;
  /** Puts a chosen place back to searching. */
  change: string;
}

export const PLACE_PICKER_MESSAGES: MessageCatalog<PlacePickerMessages> =
  defineMessages<PlacePickerMessages>('PLACE_PICKER_MESSAGES', {
    results: 'Places',
    searching: 'Searching…',
    noResults: (q) => `No places match “${q}”`,
    failed: 'Places could not be searched.',
    retry: 'Try again',
    resultCount: (n) => (n === 1 ? '1 place' : `${n} places`),
    change: 'Change',
  });
