import { RiArrowUpDownLine } from '../icons/remix/RiArrowUpDownLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiRestaurantLine } from '../icons/remix/RiRestaurantLine';
import { RiSofaLine } from '../icons/remix/RiSofaLine';
import { RiStackLine } from '../icons/remix/RiStackLine';
import { RiStairsLine } from '../icons/remix/RiStairsLine';
import { RiWalkLine } from '../icons/remix/RiWalkLine';
import type { BloomIconComponent } from '../icons/icon-component';
import { SHIPMENT_REQUEST_MESSAGES, type ShipmentRequestMessages } from './messages';
import type {
  ShipmentAccess,
  ShipmentAccessOption,
  ShipmentLoadKind,
  ShipmentLoadKindOption,
  ShipmentLoadPickerLabels,
  ShipmentLoadSize,
  ShipmentLoadSizeOption,
  ShipmentOptionsLabels,
  ShipmentRequestFormLabels,
} from './types';

const KIND_ORDER: readonly ShipmentLoadKind[] = [
  'envelope',
  'parcel',
  'furniture',
  'pallet',
  'food',
];
const KIND_ICON: Record<ShipmentLoadKind, BloomIconComponent> = {
  envelope: RiMailLine,
  parcel: RiBox3Line,
  furniture: RiSofaLine,
  pallet: RiStackLine,
  food: RiRestaurantLine,
};

/** The rungs' one-or-two-letter codes: clothing sizes, read the same in every language. */
const SIZE_CODE: ReadonlyArray<readonly [ShipmentLoadSize, string]> = [
  ['small', 'S'],
  ['medium', 'M'],
  ['large', 'L'],
  ['extraLarge', 'XL'],
];

const ACCESS_ORDER: readonly ShipmentAccess[] = ['ground', 'stairs', 'lift'];
const ACCESS_ICON: Record<ShipmentAccess, BloomIconComponent> = {
  ground: RiWalkLine,
  stairs: RiStairsLine,
  lift: RiArrowUpDownLine,
};

/** The five built-in kinds in one language's words. */
export function builtInLoadKinds(
  messages: ShipmentRequestMessages,
): readonly ShipmentLoadKindOption[] {
  return KIND_ORDER.map((value) => ({ value, ...messages.kinds[value], icon: KIND_ICON[value] }));
}

/** The four built-in size rungs in one language's words. */
export function builtInLoadSizes(
  messages: ShipmentRequestMessages,
): readonly ShipmentLoadSizeOption[] {
  return SIZE_CODE.map(([value, label]) => ({ value, label, detail: messages.sizes[value] }));
}

/**
 * The five kinds, in the order a marketplace draws them: the two a bike can
 * take first, then the two that need a van, then food — which is not a size at
 * all but a condition.
 */
export const SHIPMENT_LOAD_KINDS: readonly ShipmentLoadKindOption[] = builtInLoadKinds(
  SHIPMENT_REQUEST_MESSAGES.en,
);

/**
 * The four size rungs.
 *
 * The segments are single letters because they sit in one control at phone
 * width and four words never fit; the sentence each one means is drawn UNDER
 * the control, for the chosen rung only. A control whose options all carry
 * their own sentence is a list, not a segmented control.
 *
 * In English, like the kinds and access words; a picker given no `kinds` or
 * `sizes` draws them in the resolved locale's words.
 */
export const SHIPMENT_LOAD_SIZES: readonly ShipmentLoadSizeOption[] = builtInLoadSizes(
  SHIPMENT_REQUEST_MESSAGES.en,
);

/** Ground floor, stairs, lift. One of them is true, so they are a single choice. */
export const SHIPMENT_ACCESS_OPTIONS: readonly ShipmentAccessOption[] = ACCESS_ORDER.map(
  (value) => ({
    value,
    label: SHIPMENT_REQUEST_MESSAGES.en.access[value],
    icon: ACCESS_ICON[value],
  }),
);

// The default copy below is English and stays exported; the components speak
// `SHIPMENT_REQUEST_MESSAGES` in the resolved locale.
const EN = SHIPMENT_REQUEST_MESSAGES.en;

/** The load picker's default copy. */
export const SHIPMENT_LOAD_LABELS: Required<ShipmentLoadPickerLabels> = {
  ...EN.load,
  // i18n-exempt: a unit symbol, the same in every language Bloom ships
  weightUnit: 'kg',
};

/** The options list's default copy. */
export const SHIPMENT_OPTIONS_LABELS: Required<ShipmentOptionsLabels> = EN.options;

/** The form's default section headings. */
export const SHIPMENT_REQUEST_LABELS: Required<ShipmentRequestFormLabels> = {
  ...EN.form,
  loadDescription: '',
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
