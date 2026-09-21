import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * The default glyph for each of the four rows a buyer checks. A caller that
 * wants a different one passes `icon`; these exist so the common summary reads
 * correctly with four strings and four handlers.
 */
export const CHECKOUT_ROW_ICON: Record<'address' | 'delivery' | 'payment' | 'note', BloomIconComponent> = {
  address: RiMapPin2Line,
  delivery: RiTimeLine,
  payment: RiBankCardLine,
  note: RiChat3Line,
};

/** Drawn in place of the value while nothing is chosen. */
export const CHECKOUT_ROW_PLACEHOLDER = 'Not chosen yet';

/** The row's hint: what pressing it opens. */
export const CHECKOUT_ROW_HINT = 'Opens the picker';

/** The default words on the confirm control. */
export const CHECKOUT_CONFIRM_LABEL = 'Place order';
export const CHECKOUT_CONFIRM_BUSY_LABEL = 'Placing your order';

/**
 * The separator between the confirm label and the amount. A MIDDLE DOT rather
 * than a hyphen: "Place order - €24.80" reads as a subtraction at a glance in
 * a row that is otherwise full of money.
 */
export const CHECKOUT_AMOUNT_SEPARATOR = ' · ';

/**
 * The tile a row's glyph sits in. 40 is `address`'s own comfortable rung
 * (`ADDRESS_GEOMETRY`), which is what lines a summary row up with an `Avatar`
 * at `lg` — a summary that mixes a place and a courier must not step sideways
 * at the avatar.
 */
export const CHECKOUT_ROW_TILE = 40;
export const CHECKOUT_ROW_GLYPH = 20;
/** The trailing chevron. */
export const CHECKOUT_ROW_CHEVRON = 20;

/** Between the label and the value, and between the value and the detail. */
export const CHECKOUT_ROW_TEXT_GAP = 2;

/** The group's corner, matching every other card-sized surface in the library. */
export const CHECKOUT_GROUP_RADIUS = 16;

/** Between the group, the children, the totals and the confirm control. */
export const CHECKOUT_SECTION_GAP = 20;

/** Inside the group's own padding, around the totals. */
export const CHECKOUT_PRICE_PADDING = 16;
