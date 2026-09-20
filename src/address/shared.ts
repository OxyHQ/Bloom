/**
 * What an address row paints, read RELATIVE to the surface it was dropped on
 * (`styles/surface-levels.ts`) — a picker list sits in a sheet, a checkout
 * summary sits in a card, and a search result list sits on the page.
 *
 * Pure, so `AddressRow.test.tsx` can walk presets and modes without rendering.
 */
import { surfaceFillOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';

export interface AddressPaint extends SurfaceTextPaint {
  /** The round tile a glyph sits in — one step off whatever is behind the row. */
  tile: string;
}

export function resolveAddressPaint(theme: Theme, surface: string): AddressPaint {
  return {
    ...surfaceTextOn(theme, surface),
    tile: surfaceFillOn(theme, surface),
  };
}

/** Joins the non-empty parts of an accessible name. */
export function joinAddressName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(separator);
}
