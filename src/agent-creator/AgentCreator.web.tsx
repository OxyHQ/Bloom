import { Screen, ScreenScrollView } from '../screen/index.web';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select/index.web';
import { SettingsSelect } from '../settings-modal/SettingsSelect.web';
import { AgentCreatorBase } from './AgentCreatorBase';
import { AgentCreatorContext } from './context';
import type { AgentCreatorProps } from './types';
const bindings = {
  Screen,
  ScreenScrollView,
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemText,
  SettingsSelect,
};
export function AgentCreator(props: AgentCreatorProps) {
  return (
    <AgentCreatorContext.Provider value={bindings}>
      <AgentCreatorBase {...props} />
    </AgentCreatorContext.Provider>
  );
}
