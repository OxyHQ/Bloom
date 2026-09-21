import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { PriceSummaryProps } from '../price-breakdown';
import type { RouteStopsProps } from '../route-stops';
import type { SortablePhotoGridProps } from '../sortable-media';

/**
 * What is being moved.
 *
 * Five kinds, because they are the five that change how a job is PRICED and
 * carried, not because they are a taxonomy of objects: an envelope goes on a
 * bike, furniture needs two people, a pallet needs a tail lift, food needs to
 * arrive warm. "Other" is deliberately absent — a marketplace that cannot name
 * what it is carrying cannot quote it, and the free-text `notes` is where an
 * unusual load is described.
 */
export type ShipmentLoadKind = 'parcel' | 'furniture' | 'pallet' | 'envelope' | 'food';

/** How big it is, as the four rungs a carrier prices in. */
export type ShipmentLoadSize = 'small' | 'medium' | 'large' | 'extraLarge';

/** Which end of the job an access answer is about. */
export type ShipmentAccess = 'ground' | 'stairs' | 'lift';

export interface ShipmentLoadKindOption {
  value: ShipmentLoadKind;
  /** "Parcel", "Furniture". */
  label: string;
  /** One line under it — "A box, a bag, anything that fits in one pair of hands." */
  description?: string;
  icon?: BloomIconComponent;
  disabled?: boolean;
}

export interface ShipmentLoadSizeOption {
  value: ShipmentLoadSize;
  /** The segment's word — "S", "M", "L", "XL". */
  label: string;
  /** A line under the control naming what the CHOSEN size means. */
  detail?: string;
  disabled?: boolean;
}

/** The job's load, as one value a form owns. */
export interface ShipmentLoad {
  /** What it is. `null` while nothing has been chosen. */
  kind: ShipmentLoadKind | null;
  /** How big. `null` while nothing has been chosen. */
  size: ShipmentLoadSize | null;
  /**
   * How heavy, as TYPED TEXT with its unit stripped: `"18"`. The picker keeps
   * digits and one separator and nothing else; the unit is drawn beside the
   * field and never stored in the value, so an app parses one number rather
   * than a sentence.
   */
  weight: string;
  /** How many of them. At least 1. */
  quantity: number;
  /** Anything the pickers cannot say. */
  notes?: string;
}

/** The picker's copy, all of it localisable. */
export interface ShipmentLoadPickerLabels {
  /** Over the kind cards. Default `"What are we moving?"`. */
  kind?: string;
  /** Over the size control. Default `"Size"`. */
  size?: string;
  /** The weight field. Default `"Weight"`. */
  weight?: string;
  /** Drawn inside the weight field, after the number. Default `"kg"`. */
  weightUnit?: string;
  /** The quantity stepper. Default `"How many"`. */
  quantity?: string;
  /** The stepper's value. Default `` (n) => n === 1 ? '1 item' : `${n} items` ``. */
  quantityValue?: (quantity: number) => string;
  /** The notes field. Default `"Anything else the carrier should know?"`. */
  notes?: string;
  /** The notes placeholder. Default `"Fragile, a lift code, where to leave it…"`. */
  notesPlaceholder?: string;
}

/** Validation, keyed by the field it belongs under. The app owns every message. */
export interface ShipmentLoadErrors {
  kind?: string;
  size?: string;
  weight?: string;
  quantity?: string;
}

export interface ShipmentLoadPickerProps {
  /** The load. Fully controlled — the picker keeps no value of its own. */
  value: ShipmentLoad;
  /** Called with the WHOLE next load, never a patch. */
  onValueChange: (value: ShipmentLoad) => void;
  /** The kinds, in the order they are drawn. Default {@link SHIPMENT_LOAD_KINDS}. */
  kinds?: readonly ShipmentLoadKindOption[];
  /** The sizes. Default {@link SHIPMENT_LOAD_SIZES}. */
  sizes?: readonly ShipmentLoadSizeOption[];
  /** Draws the notes field. Default `false`. */
  notes?: boolean;
  /** The most the stepper goes to. Default `20`. */
  maxQuantity?: number;
  errors?: ShipmentLoadErrors;
  labels?: ShipmentLoadPickerLabels;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One thing a requester can add to a job that changes what it costs.
 *
 * It is a SWITCH, not a chip: each extra is independent of the others, and a
 * price beside it is what makes the switch worth flipping.
 */
export interface ShipmentExtra {
  /** Identifies the extra to `onExtrasChange`, and keys the row. */
  key: string;
  /** "Help loading", "Insurance". */
  title: string;
  /** One line under it — "Two people at both ends." */
  description?: string;
  icon?: BloomIconComponent;
  /**
   * What it adds, PRE-FORMATTED: `"+€12.00"`, `"Included"`. Drawn at the end of
   * the row. Nothing here adds it to anything.
   */
  price?: string;
  disabled?: boolean;
}

export interface ShipmentAccessOption {
  value: ShipmentAccess;
  /** "Ground floor", "Stairs", "Lift". */
  label: string;
  icon?: BloomIconComponent;
  /** What it adds, PRE-FORMATTED. Drawn after the label. */
  price?: string;
  disabled?: boolean;
}

export interface ShipmentTimeWindow {
  /** Identifies the window to `onWindowChange`, and keys the chip. */
  id: string;
  /** "Today, 14:00–16:00", "Tomorrow morning". */
  label: string;
  /** What it adds, PRE-FORMATTED. Drawn after the label. */
  price?: string;
  disabled?: boolean;
}

/** The options list's copy. */
export interface ShipmentOptionsLabels {
  /** Over the switch rows. Default `"Extras"`. */
  extras?: string;
  /** Over the access chips. Default `"Access at both ends"`. */
  access?: string;
  /** Over the time windows. Default `"When should it be collected?"`. */
  window?: string;
}

export interface ShipmentOptionsListProps {
  /** The independent extras, as switch rows. */
  extras?: readonly ShipmentExtra[];
  /** The keys of the extras that are on. */
  selectedExtras?: readonly string[];
  onExtrasChange?: (keys: string[]) => void;
  /** The access answers — a single choice, because one of them is true. */
  accessOptions?: readonly ShipmentAccessOption[];
  access?: ShipmentAccess | null;
  onAccessChange?: (access: ShipmentAccess) => void;
  /** The collection windows — a single choice. */
  windows?: readonly ShipmentTimeWindow[];
  window?: string | null;
  onWindowChange?: (id: string) => void;
  labels?: ShipmentOptionsLabels;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The form's section headings. */
export interface ShipmentRequestFormLabels {
  route?: string;
  routeDescription?: string;
  load?: string;
  loadDescription?: string;
  photos?: string;
  photosDescription?: string;
  options?: string;
  optionsDescription?: string;
  price?: string;
  priceDescription?: string;
}

export interface ShipmentRequestFormProps {
  /**
   * The pickup and the drop-off, handed to `RouteStops` UNCHANGED.
   *
   * The form does not draw a second route: there is one component in Bloom that
   * knows what an origin, a destination and the stops between them look like,
   * and a form that redrew it would be a copy that drifts.
   */
  route: RouteStopsProps;
  /** The load section. */
  load: ShipmentLoad;
  onLoadChange: (load: ShipmentLoad) => void;
  /** Everything else `ShipmentLoadPicker` takes, minus the value pair. */
  loadProps?: Omit<ShipmentLoadPickerProps, 'value' | 'onValueChange' | 'style' | 'testID'>;
  /**
   * The photos, handed to `SortablePhotoGrid` unchanged. Without it the photos
   * section is not drawn — a job that needs no picture should not be asked for
   * one.
   */
  photos?: Omit<SortablePhotoGridProps, 'style' | 'testID'>;
  /** The options section. Without it the section is not drawn. */
  options?: Omit<ShipmentOptionsListProps, 'style' | 'testID'>;
  /**
   * The running price, handed to `PriceSummary` unchanged. It sits last, so the
   * options above it and the number they move are on the same screen.
   */
  price?: Omit<PriceSummaryProps, 'style' | 'testID'>;
  /** The submit row, drawn under the last section with no divider over it. */
  footer?: ReactNode;
  labels?: ShipmentRequestFormLabels;
  /** Dims and stops every control in the form. */
  disabled?: boolean;
  /** Names the form. Default `"Shipment request"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
