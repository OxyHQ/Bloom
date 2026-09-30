import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { AgentCreatorBase } from './AgentCreatorBase';
import { AgentCreatorContext } from './context';
import type { AgentCreatorProps } from './types';
const bindings = {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
  SelectItemText,
  Popover,
  PopoverTrigger,
  PopoverContent,
};
export function AgentCreator(props: AgentCreatorProps) {
  return (
    <AgentCreatorContext.Provider value={bindings}>
      <AgentCreatorBase {...props} />
    </AgentCreatorContext.Provider>
  );
}
