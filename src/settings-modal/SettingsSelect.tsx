import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import type { SelectParts } from '../select/SelectField';
import { COMPACT_TRIGGER, SettingsSelectFromParts } from './settings-select-parts';
import type { SettingsSelectProps } from './types';

const PARTS: SelectParts = {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
};

/** The compact select a settings row puts on its right, with the native parts and compact field. */
export function SettingsSelect<T extends string>(props: SettingsSelectProps<T>) {
  return <SettingsSelectFromParts parts={PARTS} compactTrigger={COMPACT_TRIGGER} {...props} />;
}
