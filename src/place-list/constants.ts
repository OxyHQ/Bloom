import { RiEarthLine } from '../icons/remix/RiEarthLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiLockLine } from '../icons/remix/RiLockLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { PlaceListVisibility } from './types';

/** The English default visibility words. */
export const PLACE_LIST_VISIBILITY_LABELS: Readonly<Record<PlaceListVisibility, string>> = {
  private: 'Private',
  shared: 'Shared',
  public: 'Public',
};

/** The glyph each visibility draws on its badge. */
export const PLACE_LIST_VISIBILITY_ICON: Readonly<Record<PlaceListVisibility, BloomIconComponent>> = {
  private: RiLockLine,
  shared: RiGroupLine,
  public: RiEarthLine,
};

export interface PlaceListGeometry {
  /** The cover strip's height. */
  cover: number;
  /** The strip's corner. */
  coverRadius: number;
  /** Between the strip's tiles. */
  seam: number;
  /** How many photos the strip shows. */
  coverPhotos: number;
  /** Between the card's blocks, and between two places in a list. */
  gap: number;
  /** A move or remove control's box. */
  control: number;
  /** The glyph inside that box. */
  controlGlyph: number;
}

/**
 * The strip is 112 tall because that is `listing-card`'s compact thumbnail
 * (`COMPACT_PHOTO_SIZE`), which is the height of the place rows the list is
 * made of — so a list's cover and the first place under it agree.
 *
 * The controls are 44 because that is the smallest comfortable touch target,
 * and a saved list is edited with a thumb.
 */
export const PLACE_LIST_GEOMETRY: PlaceListGeometry = {
  cover: 112,
  coverRadius: 12,
  seam: 2,
  coverPhotos: 4,
  gap: 12,
  control: 44,
  controlGlyph: 20,
};
