import { DELIVERY_SLOT_MESSAGES } from './messages';
import type { DeliveryTier } from './types';

// The English words. The picker speaks `DELIVERY_SLOT_MESSAGES` in the
// resolved locale; these stay exported for apps that read them.
const EN = DELIVERY_SLOT_MESSAGES.en;

/** The words a tier is drawn and announced with. */
export const DELIVERY_TIER_LABELS: Record<DeliveryTier, string> = EN.tiers;

/** What a taken window says. */
export const DELIVERY_SOLD_OUT_LABEL = EN.soldOut;

/** The option that belongs to no day. */
export const DELIVERY_ASAP_LABEL = EN.asap;

/** The field's own name, which is also the radio group's. */
export const DELIVERY_FIELD_LABEL = EN.field;
export const DELIVERY_DAY_LABEL = EN.day;

/** What there is to say when a day has nothing left. */
export const DELIVERY_EMPTY_TITLE = EN.emptyTitle;
export const DELIVERY_EMPTY_DESCRIPTION = EN.emptyDescription;

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
