import { PLACE_PICKER_COORDINATE_DIGITS } from './constants';
import type { PlacePickerCoordinate, PlacePickerStatus } from './types';

/** `40.41678, -3.70379` — the fixed-point form a person can check against a map. Pure. */
export function formatPlaceCoordinate(coordinate: PlacePickerCoordinate): string {
  return `${coordinate.latitude.toFixed(PLACE_PICKER_COORDINATE_DIGITS)}, ${coordinate.longitude.toFixed(PLACE_PICKER_COORDINATE_DIGITS)}`;
}

/**
 * What the picker draws under the field for this text and status. Pure, so the
 * decision is testable apart from the markup.
 *
 * - `hidden`  — too little typed: no list and no status, so a stale answer for
 *   a longer query never shows under a shorter one;
 * - `loading` — searching, with whatever results already arrived kept;
 * - `error`   — the search failed;
 * - `empty`   — the search finished and found nothing;
 * - `results` — a list to choose from.
 */
export type PlacePickerView = 'hidden' | 'loading' | 'error' | 'empty' | 'results';

export function placePickerView(
  query: string,
  status: PlacePickerStatus,
  resultCount: number,
  minQueryLength: number,
): PlacePickerView {
  if (query.trim().length < minQueryLength) return 'hidden';
  if (status === 'error') return 'error';
  if (status === 'loading' || status === 'idle') return resultCount > 0 ? 'results' : 'loading';
  return resultCount > 0 ? 'results' : 'empty';
}
