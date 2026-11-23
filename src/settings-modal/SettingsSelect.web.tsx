import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select/index.web';
import { createSettingsSelect } from './create-settings-select';

export const SettingsSelect = createSettingsSelect({
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
});
// No compact field: on the web the compact trigger is the size's own (`COMPACT_TRIGGER`).
