import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { COMPACT_TRIGGER, createSettingsSelect } from './create-settings-select';

export const SettingsSelect = createSettingsSelect(
  {
    Select,
    SelectTrigger,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectItem,
  },
  COMPACT_TRIGGER,
);
