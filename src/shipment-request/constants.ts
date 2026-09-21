import { RiArrowUpDownLine } from '../icons/remix/RiArrowUpDownLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiRestaurantLine } from '../icons/remix/RiRestaurantLine';
import { RiSofaLine } from '../icons/remix/RiSofaLine';
import { RiStackLine } from '../icons/remix/RiStackLine';
import { RiStairsLine } from '../icons/remix/RiStairsLine';
import { RiWalkLine } from '../icons/remix/RiWalkLine';
import type {
  ShipmentAccessOption,
  ShipmentLoadKindOption,
  ShipmentLoadPickerLabels,
  ShipmentLoadSizeOption,
  ShipmentOptionsLabels,
  ShipmentRequestFormLabels,
} from './types';

/**
 * The five kinds, in the order a marketplace draws them: the two a bike can
 * take first, then the two that need a van, then food — which is not a size at
 * all but a condition.
 */
export const SHIPMENT_LOAD_KINDS: readonly ShipmentLoadKindOption[] = [
  {
    value: 'envelope',
    label: 'Envelope',
    description: 'Documents, keys, anything flat.',
    icon: RiMailLine,
  },
  {
    value: 'parcel',
    label: 'Parcel',
    description: 'A box or a bag one person can carry.',
    icon: RiBox3Line,
  },
  {
    value: 'furniture',
    label: 'Furniture',
    description: 'A sofa, a table, a mattress — two people at both ends.',
    icon: RiSofaLine,
  },
  {
    value: 'pallet',
    label: 'Pallet',
    description: 'Wrapped and stacked, moved with a tail lift.',
    icon: RiStackLine,
  },
  {
    value: 'food',
    label: 'Food',
    description: 'A restaurant run, kept at temperature.',
    icon: RiRestaurantLine,
  },
];

/**
 * The four size rungs.
 *
 * The segments are single letters because they sit in one control at phone
 * width and four words never fit; the sentence each one means is drawn UNDER
 * the control, for the chosen rung only. A control whose options all carry
 * their own sentence is a list, not a segmented control.
 */
export const SHIPMENT_LOAD_SIZES: readonly ShipmentLoadSizeOption[] = [
  { value: 'small', label: 'S', detail: 'Up to a shoebox — 35 × 25 × 20 cm.' },
  { value: 'medium', label: 'M', detail: 'Up to a cabin bag — 55 × 40 × 25 cm.' },
  { value: 'large', label: 'L', detail: 'Up to a washing machine — 85 × 60 × 60 cm.' },
  { value: 'extraLarge', label: 'XL', detail: 'Bigger than that — tell us in the notes.' },
];

/** Ground floor, stairs, lift. One of them is true, so they are a single choice. */
export const SHIPMENT_ACCESS_OPTIONS: readonly ShipmentAccessOption[] = [
  { value: 'ground', label: 'Ground floor', icon: RiWalkLine },
  { value: 'stairs', label: 'Stairs', icon: RiStairsLine },
  { value: 'lift', label: 'Lift', icon: RiArrowUpDownLine },
];

/** The load picker's default copy. */
export const SHIPMENT_LOAD_LABELS: Required<ShipmentLoadPickerLabels> = {
  kind: 'What are we moving?',
  size: 'Size',
  weight: 'Weight',
  weightUnit: 'kg',
  quantity: 'How many',
  quantityValue: (quantity: number) => (quantity === 1 ? '1 item' : `${quantity} items`),
  notes: 'Anything else the carrier should know?',
  notesPlaceholder: 'Fragile, a lift code, where to leave it…',
};

/** The options list's default copy. */
export const SHIPMENT_OPTIONS_LABELS: Required<ShipmentOptionsLabels> = {
  extras: 'Extras',
  access: 'Access at both ends',
  window: 'When should it be collected?',
};

/** The form's default section headings. */
export const SHIPMENT_REQUEST_LABELS: Required<ShipmentRequestFormLabels> = {
  route: 'Where it goes',
  routeDescription: 'Pick-up first, drop-off last.',
  load: 'The load',
  loadDescription: '',
  photos: 'Photos',
  photosDescription: 'A photo of the load is the single biggest thing you can do for the quotes you get back.',
  options: 'Options',
  optionsDescription: 'Each of these changes the price.',
  price: 'Price',
  priceDescription: '',
};

/**
 * The picker geometry this family owns.
 *
 * The SECTION geometry is deliberately absent: `ShipmentRequestForm` draws its
 * sections with `FilterSection`, which already owns the inset, the heading gap
 * and the rule between two sections. A second set of numbers here would be a
 * copy that drifts from the one actually drawn.
 */
export const SHIPMENT_REQUEST_GEOMETRY = {
  controlGap: 20,
  chipGap: 8,
  /** The weight field's width beside the stepper on a wide form. */
  weightWidth: 180,
  /** The form's OWN width under which the paired controls stack. */
  narrowWidth: 480,
} as const;

export type ShipmentRequestGeometry = typeof SHIPMENT_REQUEST_GEOMETRY;
