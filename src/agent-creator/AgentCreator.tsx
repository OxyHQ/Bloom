import { Screen, ScreenScrollView } from '../screen/index';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { SettingsSelect } from '../settings-modal/SettingsSelect';
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
