import { RiBookmarkLine } from '../icons/remix/RiBookmarkLine';
import { RiHistoryLine } from '../icons/remix/RiHistoryLine';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AddressDensity, AddressKind } from './types';

/** The glyph each provenance draws when the caller names none. */
export const ADDRESS_KIND_ICON: Record<AddressKind, BloomIconComponent> = {
  place: RiMapPin2Line,
  saved: RiBookmarkLine,
  recent: RiHistoryLine,
  suggestion: RiSearchLine,
};

export interface AddressGeometry {
  /** The round tile the glyph sits in. */
  tile: number;
  /** The glyph inside it. */
  glyph: number;
}

/**
 * 40 is the tile that lines a row up with an `Avatar` at the `lg` rung, so a
 * list mixing saved places and people does not step sideways at the avatar.
 */
export const ADDRESS_GEOMETRY: Record<AddressDensity, AddressGeometry> = {
  comfortable: { tile: 40, glyph: 20 },
  compact: { tile: 32, glyph: 16 },
};

/** The section header above a group of rows. */
export const ADDRESS_SECTION_GAP = 8;
export const ADDRESS_SECTIONS_GAP = 16;
