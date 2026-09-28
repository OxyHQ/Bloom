import { RiArchiveLine } from '../icons/remix/RiArchiveLine';
import { RiArrowUpDownLine } from '../icons/remix/RiArrowUpDownLine';
import { RiBearSmileLine } from '../icons/remix/RiBearSmileLine';
import { RiBuilding2Line } from '../icons/remix/RiBuilding2Line';
import { RiBuilding4Line } from '../icons/remix/RiBuilding4Line';
import { RiCommunityLine } from '../icons/remix/RiCommunityLine';
import { RiDoorOpenLine } from '../icons/remix/RiDoorOpenLine';
import { RiDropLine } from '../icons/remix/RiDropLine';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { RiHotelLine } from '../icons/remix/RiHotelLine';
import { RiLandscapeLine } from '../icons/remix/RiLandscapeLine';
import { RiParkingBoxLine } from '../icons/remix/RiParkingBoxLine';
import { RiPlantLine } from '../icons/remix/RiPlantLine';
import { RiSofaLine } from '../icons/remix/RiSofaLine';
import { RiSunLine } from '../icons/remix/RiSunLine';
import { RiTempColdLine } from '../icons/remix/RiTempColdLine';
import { RiWheelchairLine } from '../icons/remix/RiWheelchairLine';
import { STAY_FILTERS_MESSAGES } from './messages';
import type {
  EnergyRating,
  FloorOption,
  HousingFeature,
  PropertyType,
  PropertyTypeOption,
  ToggleChipOption,
} from './types';

/** Built-in labels are English here; the components relabel them from the locale's catalog. */
const EN = STAY_FILTERS_MESSAGES.en;

/** The eight built-in property types, in their default order. */
export const PROPERTY_TYPE_OPTIONS: readonly PropertyTypeOption<PropertyType>[] = [
  { value: 'apartment', label: EN.propertyTypes.apartment, icon: RiBuilding2Line },
  { value: 'house', label: EN.propertyTypes.house, icon: RiHome4Line },
  { value: 'room', label: EN.propertyTypes.room, icon: RiDoorOpenLine },
  { value: 'studio', label: EN.propertyTypes.studio, icon: RiSofaLine },
  { value: 'duplex', label: EN.propertyTypes.duplex, icon: RiBuilding4Line },
  { value: 'coliving', label: EN.propertyTypes.coliving, icon: RiCommunityLine },
  { value: 'hostel', label: EN.propertyTypes.hostel, icon: RiHotelLine },
  { value: 'other', label: EN.propertyTypes.other, icon: RiLandscapeLine },
];

/** The eleven built-in housing features, in their default order. */
export const HOUSING_FEATURE_OPTIONS: readonly ToggleChipOption<HousingFeature>[] = [
  { value: 'elevator', label: EN.features.elevator, icon: RiArrowUpDownLine },
  { value: 'parking', label: EN.features.parking, icon: RiParkingBoxLine },
  { value: 'terrace', label: EN.features.terrace, icon: RiSunLine },
  { value: 'garden', label: EN.features.garden, icon: RiPlantLine },
  { value: 'pool', label: EN.features.pool, icon: RiDropLine },
  { value: 'furnished', label: EN.features.furnished, icon: RiSofaLine },
  { value: 'pets', label: EN.features.pets, icon: RiBearSmileLine },
  { value: 'airConditioning', label: EN.features.airConditioning, icon: RiTempColdLine },
  { value: 'heating', label: EN.features.heating, icon: RiFireLine },
  { value: 'accessible', label: EN.features.accessible, icon: RiWheelchairLine },
  { value: 'storage', label: EN.features.storage, icon: RiArchiveLine },
];

/** Ground, Middle, Top, With elevator. */
export const FLOOR_OPTIONS: readonly ToggleChipOption<FloorOption>[] = [
  { value: 'ground', label: EN.floors.ground },
  { value: 'middle', label: EN.floors.middle },
  { value: 'top', label: EN.floors.top },
  { value: 'elevator', label: EN.floors.elevator },
];

/** Best first. */
export const ENERGY_RATINGS: readonly EnergyRating[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

/** Relabel built-in options by value; unknown keys are ignored. */
export function relabelOptions<T extends string, O extends { value: T; label: string }>(
  options: readonly O[],
  labels: Partial<Record<T, string>> | undefined,
): O[] {
  if (!labels) return options.slice();
  return options.map((o) => (labels[o.value] ? { ...o, label: labels[o.value] as string } : o));
}

/**
 * The built-in options in the locale (`catalog` keyed by value), then the
 * caller's `labels` on top. A caller's own `options` are used as given, with
 * only `labels` applied.
 */
export function localizedOptions<T extends string, O extends { value: T; label: string }>(
  options: readonly O[] | undefined,
  builtIn: readonly O[],
  catalog: Partial<Record<T, string>>,
  labels: Partial<Record<T, string>> | undefined,
): O[] {
  return relabelOptions(options ?? relabelOptions(builtIn, catalog), labels);
}
