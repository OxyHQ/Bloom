import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { createSettingsSelect } from './create-settings-select';

export const SettingsSelect = createSettingsSelect({
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
});
