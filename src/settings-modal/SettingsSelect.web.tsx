import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select/index.web';
import type { SelectParts } from '../select/SelectField';
import { SettingsSelectFromParts } from './settings-select-parts';
import type { SettingsSelectProps } from './types';

const PARTS: SelectParts = {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
};

/**
 * The compact select a settings row puts on its right, with the web parts and
 * no compact field (on the web the compact trigger is the size's own).
 */
export function SettingsSelect<T extends string>(props: SettingsSelectProps<T>) {
  return <SettingsSelectFromParts parts={PARTS} {...props} />;
}
