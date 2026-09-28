import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { DeliveryTier } from './types';

/**
 * Every fixed string the delivery-slot family draws or announces, in each
 * Bloom language. A caller's `label`, `dayLabel`, `emptyTitle`,
 * `emptyDescription`, `tierLabels`, `soldOutLabel` and the ASAP option's
 * `label` still win.
 */
export interface DeliverySlotMessages {
  tiers: Record<DeliveryTier, string>;
  /** What a taken window says. */
  soldOut: string;
  /** The option that belongs to no day. */
  asap: string;
  /** The field's own name, which is also the radio group's. */
  field: string;
  /** Names the day strip. */
  day: string;
  emptyTitle: string;
  emptyDescription: string;
}

export const DELIVERY_SLOT_MESSAGES: MessageCatalog<DeliverySlotMessages> = defineMessages<DeliverySlotMessages>('DELIVERY_SLOT_MESSAGES', {
  tiers: { standard: 'Standard', express: 'Express' },
  soldOut: 'Sold out',
  asap: 'As soon as possible',
  field: 'Delivery time',
  day: 'Day',
  emptyTitle: 'No windows left',
  emptyDescription: 'Pick another day, or take the next courier.',
});
