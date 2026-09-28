import type { BloomIconComponent } from '../icons/icon-component';
import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { RiShoppingBag3Line } from '../icons/remix/RiShoppingBag3Line';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { RiWalkLine } from '../icons/remix/RiWalkLine';
import { VENDOR_CARD_MESSAGES } from './messages';
import type { VendorAvailability, VendorCardDensity, VendorFactKey } from './types';

/**
 * The cover's shape in the comfortable density. 16:9 rather than the 20:19 a
 * home is drawn at: a shelf of vendors is scanned SIDEWAYS, and a near-square
 * cover at shelf width pushes the name off the first screen.
 */
export const VENDOR_PHOTO_ASPECT_RATIO = 16 / 9;

/** The readings, in the order the fact row draws them. */
export const VENDOR_FACT_ORDER: readonly VendorFactKey[] = [
  'deliveryTime',
  'deliveryFee',
  'distance',
  'minimumOrder',
];

/**
 * The glyph beside each reading. A bike for the fee because the fee is what the
 * ride costs; a walker for distance, which is the one reading that is about the
 * reader's own position rather than the order's.
 */
export const VENDOR_FACT_ICON: Record<VendorFactKey, BloomIconComponent> = {
  deliveryTime: RiTimeLine,
  deliveryFee: RiBikeLine,
  distance: RiWalkLine,
  minimumOrder: RiShoppingBag3Line,
};

/**
 * The word said before each reading in the card's accessible name, in English.
 * The card itself speaks `VENDOR_CARD_MESSAGES` in the resolved locale.
 */
export const VENDOR_FACT_LABELS: Record<VendorFactKey, string> = VENDOR_CARD_MESSAGES.en.facts;

/** The English status pill labels. `open` draws none. The card speaks the resolved locale's. */
export const VENDOR_AVAILABILITY_LABELS: Record<Exclude<VendorAvailability, 'open'>, string> =
  VENDOR_CARD_MESSAGES.en.availability;

/** The cuisine pills' rung: 24 tall, caption weight — the densest pill Bloom has. */
export const VENDOR_CUISINE_CHIP_HEIGHT = 24;

/** Space between the cover and the text, and between the text lines. */
export const VENDOR_TEXT_GAP = 12;

/** How many cuisines are drawn at all. Past this the row is a list, not a mark. */
export const VENDOR_CUISINE_LIMIT: Record<VendorCardDensity, number> = {
  comfortable: 4,
  compact: 3,
};
