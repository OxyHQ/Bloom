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
import type {
  EnergyRating,
  FloorOption,
  HousingFeature,
  PropertyType,
  PropertyTypeOption,
  ToggleChipOption,
} from './types';

/** The eight built-in property types, in their default order. */
export const PROPERTY_TYPE_OPTIONS: readonly PropertyTypeOption<PropertyType>[] = [
  { value: 'apartment', label: 'Apartment', icon: RiBuilding2Line },
  { value: 'house', label: 'House', icon: RiHome4Line },
  { value: 'room', label: 'Room', icon: RiDoorOpenLine },
  { value: 'studio', label: 'Studio', icon: RiSofaLine },
  { value: 'duplex', label: 'Duplex / Penthouse', icon: RiBuilding4Line },
  { value: 'coliving', label: 'Coliving', icon: RiCommunityLine },
  { value: 'hostel', label: 'Hostel', icon: RiHotelLine },
  { value: 'other', label: 'Land / Other', icon: RiLandscapeLine },
];

/** The eleven built-in housing features, in their default order. */
export const HOUSING_FEATURE_OPTIONS: readonly ToggleChipOption<HousingFeature>[] = [
  { value: 'elevator', label: 'Elevator', icon: RiArrowUpDownLine },
  { value: 'parking', label: 'Parking', icon: RiParkingBoxLine },
  { value: 'terrace', label: 'Terrace', icon: RiSunLine },
  { value: 'garden', label: 'Garden', icon: RiPlantLine },
  { value: 'pool', label: 'Pool', icon: RiDropLine },
  { value: 'furnished', label: 'Furnished', icon: RiSofaLine },
  { value: 'pets', label: 'Pets allowed', icon: RiBearSmileLine },
  { value: 'airConditioning', label: 'Air conditioning', icon: RiTempColdLine },
  { value: 'heating', label: 'Heating', icon: RiFireLine },
  { value: 'accessible', label: 'Accessible', icon: RiWheelchairLine },
  { value: 'storage', label: 'Storage room', icon: RiArchiveLine },
];

/** Ground, Middle, Top, With elevator. */
export const FLOOR_OPTIONS: readonly ToggleChipOption<FloorOption>[] = [
  { value: 'ground', label: 'Ground' },
  { value: 'middle', label: 'Middle' },
  { value: 'top', label: 'Top' },
  { value: 'elevator', label: 'With elevator' },
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
