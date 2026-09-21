/**
 * Everything the vendor card decides WITHOUT rendering: which readings the fact
 * row carries, what the status pill says, and the sentence a screen reader
 * hears. Pure, so `VendorCard.test.tsx` can assert each one directly instead of
 * inferring it from markup.
 *
 * The card's COLOURS are not here, because they are not this family's to pick:
 * a vendor card is the same object as a housing card — a photo with a wash, a
 * pill over it, a heart, a title and a fact row — and it paints itself with
 * `listing-card`'s own `resolveListingCardPaint`. A second table of the same
 * eleven colours is how two cards that are meant to be the same drift apart.
 */
import { PHOTO_RADIUS } from '../listing-card/shared';
import type { ListingFact } from '../listing-card/types';
import { formatRatingValue } from '../rating/Rating';
import {
  VENDOR_AVAILABILITY_LABELS,
  VENDOR_CUISINE_LIMIT,
  VENDOR_FACT_ICON,
  VENDOR_FACT_LABELS,
  VENDOR_FACT_ORDER,
} from './constants';
import type { VendorAvailability, VendorCardDensity, VendorCardProps, VendorFactKey } from './types';

/** The status pill's label, or `null` for a vendor that is taking orders. */
export function availabilityLabelFor(
  availability: VendorAvailability | undefined,
  override?: string,
): string | null {
  if (!availability || availability === 'open') return null;
  return override ?? VENDOR_AVAILABILITY_LABELS[availability];
}

/**
 * The readings the fact row draws, in {@link VENDOR_FACT_ORDER}, skipping the
 * ones the app did not give. Each carries the glyph it is drawn with and the
 * words it is ANNOUNCED with, which are not the same string: "€1.90" beside a
 * bike reads as a fee to an eye and as a price to a screen reader.
 */
export function vendorFacts(
  props: Pick<
    VendorCardProps,
    'deliveryTime' | 'deliveryFee' | 'distance' | 'minimumOrder' | 'factLabels'
  >,
): ListingFact[] {
  const values: Record<VendorFactKey, string | undefined> = {
    deliveryTime: props.deliveryTime,
    deliveryFee: props.deliveryFee,
    distance: props.distance,
    minimumOrder: props.minimumOrder,
  };
  const facts: ListingFact[] = [];
  for (const key of VENDOR_FACT_ORDER) {
    const value = values[key];
    if (!value) continue;
    const word = props.factLabels?.[key] ?? VENDOR_FACT_LABELS[key];
    facts.push({ icon: VENDOR_FACT_ICON[key], label: value, accessibilityLabel: `${word} ${value}` });
  }
  return facts;
}

/** The cuisines actually drawn: the first few, de-duplicated, in the order given. */
export function vendorCuisines(
  cuisines: ReadonlyArray<string> | undefined,
  density: VendorCardDensity,
): string[] {
  if (!cuisines) return [];
  return Array.from(new Set(cuisines.filter((c) => c !== ''))).slice(0, VENDOR_CUISINE_LIMIT[density]);
}

/**
 * The whole card as one sentence, in the order it is read on screen. EVERY
 * cuisine is in it, including the ones the clipped row dropped — the row drops
 * pills because it ran out of width, which is not a reason to withhold them
 * from someone who is listening rather than looking.
 */
export function composeVendorName(props: VendorCardProps): string {
  const parts: string[] = [props.name];
  const status = availabilityLabelFor(props.availability, props.availabilityLabel);
  if (status) parts.push(status);
  if (status && props.opensAt) parts.push(props.opensAt);
  if (props.promo) parts.push(props.promo);
  for (const cuisine of props.cuisines ?? []) if (cuisine !== '') parts.push(cuisine);
  if (props.rating !== undefined) {
    const rated = props.rating !== null && props.rating !== '';
    if (rated) {
      const count =
        props.reviewCount != null && props.reviewCount !== '' ? `, ${props.reviewCount} reviews` : '';
      parts.push(`Rated ${formatRatingValue(props.rating as number | string)} out of 5${count}`);
    } else {
      parts.push(props.newLabel ?? 'New');
    }
  }
  for (const fact of vendorFacts(props)) parts.push(fact.accessibilityLabel ?? fact.label);
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
//  Web CSS — the focus ring on the card's own link. `adoptStyleSheet` no-ops
//  without a document, so this is inert on native.
//
//  The heart is `listing-card`'s `FavoriteButton`, and ITS rules live in
//  `LISTING_CARD_CSS`. The card adopts that sheet too (same id, so two cards on
//  one page adopt it once) rather than restating the two rules here: a copy
//  would be a second place for the ring colour to be wrong.
// ---------------------------------------------------------------------------

export const VENDOR_CARD_STYLE_ID = 'bloom-vendor-card-web-css';

const LINK = '[data-bloom-vendor-card-link]';

export const VENDOR_CARD_CSS = `
${LINK} {
  outline: none;
  text-decoration: none;
  color: inherit;
}
${LINK}:focus-visible {
  outline: 2px solid var(--bloom-vendor-card-ring, currentColor);
  outline-offset: 4px;
  border-radius: ${PHOTO_RADIUS + 4}px;
}
`;
