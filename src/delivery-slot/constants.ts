import type { DeliveryTier } from './types';

/** The words a tier is drawn and announced with. */
export const DELIVERY_TIER_LABELS: Record<DeliveryTier, string> = {
  standard: 'Standard',
  express: 'Express',
};

/** What a taken window says. */
export const DELIVERY_SOLD_OUT_LABEL = 'Sold out';

/** The option that belongs to no day. */
export const DELIVERY_ASAP_LABEL = 'As soon as possible';

/** The field's own name, which is also the radio group's. */
export const DELIVERY_FIELD_LABEL = 'Delivery time';
export const DELIVERY_DAY_LABEL = 'Day';

/** What there is to say when a day has nothing left. */
export const DELIVERY_EMPTY_TITLE = 'No windows left';
export const DELIVERY_EMPTY_DESCRIPTION = 'Pick another day, or take the next courier.';

/**
 * The radio dot at the head of an option row. 20 is `Radio`'s `lg` rung: the
 * row it marks is two lines tall, and the 16 `md` dot read as a bullet beside
 * it rather than as the control.
 */
export const DELIVERY_DOT = 20;
/** The glyph the ASAP row draws instead of a dot, when it is not chosen. */
export const DELIVERY_GLYPH = 20;

/** Between the day strip and the options, and between the options. */
export const DELIVERY_SECTION_GAP = 16;
export const DELIVERY_OPTION_GAP = 8;

/**
 * The option row's corner and border. Radius 12 is the field rung every picker
 * in the library draws its choosable boxes at; the row is bordered rather than
 * washed because an unbordered list of windows and a bordered day strip above
 * it read as two different controls.
 */
export const DELIVERY_OPTION_RADIUS = 12;

/** The separator between the parts of an option's detail line. */
export const DELIVERY_DETAIL_SEPARATOR = ' · ';
