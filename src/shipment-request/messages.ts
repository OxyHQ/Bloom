import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { ShipmentAccess, ShipmentLoadKind, ShipmentLoadSize } from './types';

/**
 * Every fixed string the shipment-request family draws or announces — its
 * headings and the built-in kinds, sizes and access words — in each Bloom
 * language. The weight unit is a symbol and stays `kg`. A caller's `labels`,
 * `kinds`, `sizes`, `accessOptions` and `accessibilityLabel` still win.
 */
export interface ShipmentRequestMessages {
  kinds: Record<ShipmentLoadKind, { label: string; description: string }>;
  /** The sentence under the size control for the chosen rung. */
  sizes: Record<ShipmentLoadSize, string>;
  access: Record<ShipmentAccess, string>;
  load: {
    kind: string;
    size: string;
    weight: string;
    quantity: string;
    quantityValue: (quantity: number) => string;
    notes: string;
    notesPlaceholder: string;
  };
  options: { extras: string; access: string; window: string };
  form: {
    route: string;
    routeDescription: string;
    load: string;
    photos: string;
    photosDescription: string;
    options: string;
    optionsDescription: string;
    price: string;
  };
  /** Names the form. */
  shipmentRequest: string;
}

export const SHIPMENT_REQUEST_MESSAGES: MessageCatalog<ShipmentRequestMessages> =
  defineMessages<ShipmentRequestMessages>('SHIPMENT_REQUEST_MESSAGES', {
    kinds: {
      envelope: { label: 'Envelope', description: 'Documents, keys, anything flat.' },
      parcel: { label: 'Parcel', description: 'A box or a bag one person can carry.' },
      furniture: {
        label: 'Furniture',
        description: 'A sofa, a table, a mattress — two people at both ends.',
      },
      pallet: { label: 'Pallet', description: 'Wrapped and stacked, moved with a tail lift.' },
      food: { label: 'Food', description: 'A restaurant run, kept at temperature.' },
    },
    sizes: {
      small: 'Up to a shoebox — 35 × 25 × 20 cm.',
      medium: 'Up to a cabin bag — 55 × 40 × 25 cm.',
      large: 'Up to a washing machine — 85 × 60 × 60 cm.',
      extraLarge: 'Bigger than that — tell us in the notes.',
    },
    access: { ground: 'Ground floor', stairs: 'Stairs', lift: 'Lift' },
    load: {
      kind: 'What are we moving?',
      size: 'Size',
      weight: 'Weight',
      quantity: 'How many',
      quantityValue: (n) => plural('en', n, { one: '{n} item', other: '{n} items' }),
      notes: 'Anything else the carrier should know?',
      notesPlaceholder: 'Fragile, a lift code, where to leave it…',
    },
    options: {
      extras: 'Extras',
      access: 'Access at both ends',
      window: 'When should it be collected?',
    },
    form: {
      route: 'Where it goes',
      routeDescription: 'Pick-up first, drop-off last.',
      load: 'The load',
      photos: 'Photos',
      photosDescription:
        'A photo of the load is the single biggest thing you can do for the quotes you get back.',
      options: 'Options',
      optionsDescription: 'Each of these changes the price.',
      price: 'Price',
    },
    shipmentRequest: 'Shipment request',
  });
